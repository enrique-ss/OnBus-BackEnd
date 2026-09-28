import { randomUUID } from 'crypto';
import { Knex } from 'knex';

export class CashbackService {
  // Earn one point per full real paid in a confirmed card recharge.
  static async credit(trx: Knex.Transaction, userId: string, transactionId: string, amount: number): Promise<number> {
    const points = Math.floor(amount);
    if (points <= 0) return 0;
    await trx('cashback_ledger').insert({ id: randomUUID(), usuario_id: userId, transacao_id: transactionId, pontos: points, created_at: new Date().toISOString() });
    await trx('usuarios').where({ id: userId }).increment('cashback_pontos', points);
    return points;
  }
}
