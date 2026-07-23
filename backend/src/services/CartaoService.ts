import { db, Cartao, Transacao } from '../database/connection';
import { randomUUID } from 'crypto';

export class CartaoService {
  private static gerarNumeroCartao(tipo: 'comum' | 'estudante' | 'idoso'): string {
    const prefixo = '10';
    let codTipo = '01';
    if (tipo === 'estudante') codTipo = '02';
    if (tipo === 'idoso') codTipo = '03';
    
    // Gera 6 dígitos aleatórios
    const digitos = Math.floor(100000 + Math.random() * 900000).toString();
    return `${prefixo}.${codTipo}.${digitos}`;
  }

  static async emitir(usuarioId: string, tipo: 'comum' | 'estudante' | 'idoso', themeUrl?: string): Promise<Cartao> {
    const user = await db.usuarios.findOne({ id: usuarioId });
    if (!user) throw new Error('Usuário não encontrado.');

    // Verificar se já possui qualquer cartão ativo
    const existing = await db.cartoes.find({ usuario_id: usuarioId, status: 'ativo' });
    if (existing.length > 0) {
      throw new Error('Você já possui um cartão ativo. Para solicitar um novo, é necessário bloquear o cartão atual.');
    }

    const numero = this.gerarNumeroCartao(tipo);
    const cartaoId = randomUUID();

    const novoCartao: Cartao = {
      id: cartaoId,
      numero,
      usuario_id: usuarioId,
      tipo,
      saldo: 0.00,
      status: 'ativo',
      theme_url: themeUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.cartoes.insert(novoCartao);
    return novoCartao;
  }

  static async listar(usuarioId: string): Promise<Cartao[]> {
    return await db.cartoes.find({ usuario_id: usuarioId });
  }

  static async bloquear(cartaoId: string, usuarioId: string): Promise<Cartao> {
    const cartao = await db.cartoes.findOne({ id: cartaoId, usuario_id: usuarioId });
    if (!cartao) throw new Error('Cartão não encontrado.');

    if (cartao.status !== 'ativo') {
      throw new Error(`Cartão não pode ser bloqueado pois está com status: ${cartao.status}`);
    }

    const updatedData = {
      status: 'bloqueado' as const,
      updated_at: new Date().toISOString()
    };

    await db.cartoes.update({ id: cartaoId }, updatedData);
    return { ...cartao, ...updatedData };
  }

  static async solicitarSegundaVia(cartaoId: string, usuarioId: string): Promise<Cartao> {
    const cartaoAntigo = await db.cartoes.findOne({ id: cartaoId, usuario_id: usuarioId });
    if (!cartaoAntigo) throw new Error('Cartão antigo não encontrado.');

    if (cartaoAntigo.status !== 'bloqueado') {
      throw new Error('Apenas cartões BLOQUEADOS podem ter segunda via solicitada.');
    }

    const saldoTransferido = Number(cartaoAntigo.saldo);
    
    // Inutilizar o cartão antigo (cancelado)
    await db.cartoes.update({ id: cartaoId }, { status: 'cancelado', saldo: 0, updated_at: new Date().toISOString() });

    // Gerar novo cartão
    const novoCartao = await this.emitir(usuarioId, cartaoAntigo.tipo, cartaoAntigo.theme_url || undefined);
    
    // Creditar o saldo no novo cartão
    const novoSaldo = novoCartao.saldo + saldoTransferido;
    await db.cartoes.update({ id: novoCartao.id }, { saldo: novoSaldo, updated_at: new Date().toISOString() });
    
    // Registrar transação de transferência no histórico
    if (saldoTransferido > 0) {
      const transacaoId = randomUUID();
      const novaTransacao: Transacao = {
        id: transacaoId,
        cartao_id: novoCartao.id,
        tipo: 'recarga',
        valor: saldoTransferido,
        status: 'confirmado',
        local_validador_id: 'TRANSFERENCIA',
        created_at: new Date().toISOString()
      };
      await db.transacoes.insert(novaTransacao);
    }

    novoCartao.saldo = novoSaldo;
    return novoCartao;
  }

  static async recarregar(cartaoId: string, valor: number): Promise<{ transacao: Transacao; pixCopiaCola: string }> {
    if (valor <= 0) throw new Error('Valor da recarga deve ser maior que zero.');

    const cartao = await db.cartoes.findOne({ id: cartaoId });
    if (!cartao) throw new Error('Cartão não encontrado.');

    if (cartao.status !== 'ativo') {
      throw new Error('Não é possível recarregar um cartão inativo/bloqueado.');
    }

    const transacaoId = randomUUID();
    
    // Registra transação como PENDENTE (aguardando webhook do Pix)
    const novaTransacao: Transacao = {
      id: transacaoId,
      cartao_id: cartaoId,
      tipo: 'recarga',
      valor,
      status: 'pendente', // Mantém pendente
      local_validador_id: 'WEB_PIX',
      created_at: new Date().toISOString()
    };

    await db.transacoes.insert(novaTransacao);

    // Pix Copia e Cola Simulado (Formato BR Code Padrão do BACEN)
    const pixCopiaCola = `00020101021226870014br.gov.bcb.pix0136${transacaoId}@onbus.com.br5204000053039865405${valor.toFixed(2)}5802BR5909OnBus_MVP6009Pelotas_RS62290525onbus_${transacaoId.substring(0, 8)}6304`;

    return { transacao: novaTransacao, pixCopiaCola };
  }

  static async processarWebhookPagamento(transacaoId: string, valor: number): Promise<Transacao> {
    const transacao = await db.transacoes.findOne({ id: transacaoId });
    if (!transacao) {
      throw new Error('Transação não encontrada.');
    }

    if (transacao.status !== 'pendente') {
      throw new Error(`Esta transação já foi processada anteriormente com status: ${transacao.status}`);
    }

    if (Number(transacao.valor) !== valor) {
      throw new Error(`Inconsistência de valores: Webhook enviou R$ ${valor.toFixed(2)}, mas a transação pendente é de R$ ${Number(transacao.valor).toFixed(2)}.`);
    }

    const cartao = await db.cartoes.findOne({ id: transacao.cartao_id });
    if (!cartao) {
      throw new Error('Cartão associado à transação não encontrado.');
    }

    // Libera o saldo no cartão
    const novoSaldo = Number(cartao.saldo) + valor;
    await db.cartoes.update({ id: transacao.cartao_id }, { saldo: novoSaldo, updated_at: new Date().toISOString() });

    // Confirma a transação
    await db.transacoes.update({ id: transacaoId }, { status: 'confirmado' });

    return {
      ...transacao,
      status: 'confirmado'
    };
  }
}
