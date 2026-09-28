import { randomUUID, createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { db } from '../database/connection';
import { CashbackService } from './CashbackService';

export class RecargaProgramadaService {
  private static encryptionKey(): Buffer {
    const secret = process.env.PAYMENT_TOKEN_ENCRYPTION_KEY;
    if (!secret || secret.length < 32) throw new Error('PAYMENT_TOKEN_ENCRYPTION_KEY deve ter pelo menos 32 caracteres.');
    return createHash('sha256').update(secret).digest();
  }
  private static encrypt(value: string): string {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ciphertext.toString('hex')}`;
  }
  private static decrypt(value: string): string {
    const [ivHex, tagHex, encrypted] = value.split(':');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8');
  }
  static async criar(usuarioId: string, data: any) {
    const cartao = await db.cartoes.findOne({ id: data.cartaoId, usuario_id: usuarioId });
    const valor = Number(data.valor), saldoMinimo = Number(data.saldoMinimo);
    if (!cartao || cartao.status !== 'ativo') throw new Error('Cartão ativo não encontrado para esta conta.');
    if (!Number.isFinite(valor) || valor <= 0 || !Number.isFinite(saldoMinimo) || saldoMinimo < 0) throw new Error('Informe valor e saldo mínimo válidos.');
    if (!data.paymentMethodId || typeof data.paymentMethodId !== 'string') throw new Error('Token de meio de pagamento salvo é obrigatório.');
    if (!process.env.PAYMENT_API_URL || !process.env.PAYMENT_API_KEY) throw new Error('Gateway de pagamento não configurado.');
    const schedule = { id: randomUUID(), cartao_id: cartao.id, valor, saldo_minimo: saldoMinimo, ativa: true, proxima_execucao: new Date().toISOString(), payment_method_id: this.encrypt(data.paymentMethodId), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await db.knex('recargas_programadas').insert(schedule);
    const { payment_method_id: _, ...safe } = schedule;
    return safe;
  }

  static async listar(usuarioId: string) {
    const cards = await db.cartoes.find({ usuario_id: usuarioId });
    const rows: any[] = [];
    for (const card of cards) rows.push(...await db.knex('recargas_programadas').where({ cartao_id: card.id }).select('id', 'cartao_id', 'valor', 'saldo_minimo', 'ativa', 'proxima_execucao', 'created_at'));
    return rows;
  }

  static async cancelar(usuarioId: string, id: string): Promise<boolean> {
    const row = await db.knex('recargas_programadas as rp').join('cartoes as c', 'c.id', 'rp.cartao_id').where({ 'rp.id': id, 'c.usuario_id': usuarioId }).first('rp.id');
    if (!row) return false;
    await db.knex('recargas_programadas').where({ id }).update({ ativa: false, updated_at: new Date().toISOString() });
    return true;
  }

  static async processarVencidas(): Promise<void> {
    if (!process.env.PAYMENT_API_URL || !process.env.PAYMENT_API_KEY) return;
    const due: any[] = await db.knex('recargas_programadas').where({ ativa: true }).where('proxima_execucao', '<=', new Date().toISOString()).limit(50);
    for (const row of due) {
      // Claim each due run before contacting the provider; idempotency protects retries across crashes.
      const next = new Date(Date.now() + 60 * 60_000).toISOString();
      const claimed = await db.knex('recargas_programadas').where({ id: row.id, ativa: true, proxima_execucao: row.proxima_execucao }).update({ proxima_execucao: next, updated_at: new Date().toISOString() });
      if (!claimed) continue;
      try {
        const card = await db.cartoes.findOne({ id: row.cartao_id });
        if (!card || card.status !== 'ativo' || Number(card.saldo) > Number(row.saldo_minimo)) continue;
        const response = await fetch(process.env.PAYMENT_API_URL, { method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYMENT_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `onbus-scheduled-${row.id}-${row.proxima_execucao}` }, body: JSON.stringify({ payment_method_id: this.decrypt(row.payment_method_id), amount: Number(row.valor), currency: 'BRL', reference: `onbus-${row.id}-${row.proxima_execucao}` }) });
        if (!response.ok) throw new Error(`Gateway retornou HTTP ${response.status}`);
        const result: any = await response.json();
        if (result.status !== 'approved') continue;
        await db.knex.transaction(async (trx) => {
          const transactionId = randomUUID();
          await trx('transacoes').insert({ id: transactionId, cartao_id: card.id, tipo: 'recarga', valor: row.valor, taxa_servico: 0, status: 'confirmado', created_at: new Date().toISOString() });
          await trx('cartoes').where({ id: card.id }).increment('saldo', Number(row.valor)).update({ updated_at: new Date().toISOString() });
          await CashbackService.credit(trx, card.usuario_id, transactionId, Number(row.valor));
        });
      } catch (error) {
        console.error(`Falha na recarga programada ${row.id}:`, error);
        // Retry on next scheduler interval.
        await db.knex('recargas_programadas').where({ id: row.id }).update({ proxima_execucao: new Date(Date.now() + 5 * 60_000).toISOString(), updated_at: new Date().toISOString() });
      }
    }
  }
}
