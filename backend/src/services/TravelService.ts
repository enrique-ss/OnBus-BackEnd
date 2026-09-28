import { randomUUID } from 'crypto';
import { db } from '../database/connection';
import { TERMS_VERSION } from './EngagementService';

export class TravelService {
  static async search(query: any) {
    const q = db.knex('viagens_intermunicipais').where({ ativa: true }).where('partida_em', '>', new Date().toISOString());
    if (query.origem) q.whereRaw('LOWER(??) LIKE LOWER(?)', ['origem', `%${String(query.origem).slice(0, 100)}%`]);
    if (query.destino) q.whereRaw('LOWER(??) LIKE LOWER(?)', ['destino', `%${String(query.destino).slice(0, 100)}%`]);
    const trips: any[] = await q.orderBy('partida_em').limit(100);
    const now = new Date().toISOString();
    for (const trip of trips) {
      const sold = await db.knex('passagens').where({ viagem_id: trip.id, status: 'paga' }).count({ total: '*' }).first();
      const held = await db.knex('passagens').where({ viagem_id: trip.id, status: 'pendente' }).where('expira_em', '>', now).count({ total: '*' }).first();
      trip.assentos_disponiveis = Math.max(0, trip.assentos - Number(sold?.total || 0) - Number(held?.total || 0));
      delete trip.assentos;
    }
    return trips;
  }

  static async publicar(data: any) {
    const partida = new Date(data.partidaEm), chegada = data.chegadaEm ? new Date(data.chegadaEm) : null;
    const assentos = Number(data.assentos), preco = Number(data.preco);
    if (!data.origem || !data.destino || !data.operadora || !Number.isFinite(partida.getTime()) || partida.getTime() <= Date.now() || (chegada && (!Number.isFinite(chegada.getTime()) || chegada.getTime() < partida.getTime())) || assentos < 1 || !Number.isInteger(assentos) || !Number.isFinite(preco) || preco <= 0) throw new Error('Informe origem, destino, operadora, horários futuros e quantidade de assentos/preço válidos.');
    const row = { id: randomUUID(), origem: String(data.origem).trim().slice(0, 100), destino: String(data.destino).trim().slice(0, 100), partida_em: partida.toISOString(), chegada_em: chegada?.toISOString() || null, operadora: String(data.operadora).trim().slice(0, 120), assentos, preco, ativa: true, created_at: new Date().toISOString() };
    await db.knex('viagens_intermunicipais').insert(row);
    return row;
  }

  static async reservar(usuarioId: string, data: any) {
    const termsAccepted = await db.knex('aceites_termos').where({ usuario_id: usuarioId, versao: TERMS_VERSION }).first('id');
    if (!termsAccepted) throw new Error('Leia e aceite os termos atuais antes de comprar uma passagem.');
    if (!process.env.PAYMENT_API_URL || !process.env.PAYMENT_API_KEY) throw new Error('Gateway de pagamento não configurado para venda de passagens.');
    const trip = await db.knex('viagens_intermunicipais').where({ id: data.viagemId, ativa: true }).first();
    if (!trip || new Date(trip.partida_em).getTime() <= Date.now()) throw new Error('Viagem não encontrada ou encerrada.');
    const seat = Number(data.assento);
    if (!Number.isInteger(seat) || seat < 1 || seat > trip.assentos) throw new Error('Número de assento inválido.');
    const now = new Date(), expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString(), ticketId = randomUUID();
    await db.knex.transaction(async (trx) => {
      await trx('viagens_intermunicipais').where({ id: trip.id }).forUpdate().first();
      await trx('passagens').where({ viagem_id: trip.id, assento: seat, status: 'pendente' }).where('expira_em', '<=', now.toISOString()).update({ status: 'expirada' });
      const occupied = await trx('passagens').where({ viagem_id: trip.id, assento: seat }).whereIn('status', ['paga', 'pendente']).first('id');
      if (occupied) throw new Error('Este assento já está reservado ou vendido.');
      await trx('passagens').insert({ id: ticketId, viagem_id: trip.id, usuario_id: usuarioId, assento: seat, status: 'pendente', valor: trip.preco, gateway_pagamento_id: null, expira_em: expiresAt, created_at: now.toISOString(), paga_em: null });
    });
    try {
      const response = await fetch(process.env.PAYMENT_API_URL, { method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYMENT_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `onbus-ticket-${ticketId}` }, body: JSON.stringify({ amount: Number(trip.preco), currency: 'BRL', reference: ticketId, payment_method: 'pix', expires_at: expiresAt }) });
      if (!response.ok) throw new Error(`Gateway retornou HTTP ${response.status}.`);
      const payment: any = await response.json();
      if (typeof payment.paymentId !== 'string' || !payment.paymentId || typeof payment.pixCopiaCola !== 'string' || !payment.pixCopiaCola) throw new Error('Gateway não retornou dados válidos para pagamento da passagem.');
      await db.knex('passagens').where({ id: ticketId, status: 'pendente' }).update({ gateway_pagamento_id: payment.paymentId });
      return { passagemId: ticketId, status: 'pendente', expiraEm: expiresAt, valor: Number(trip.preco), assento: seat, pixCopiaCola: payment.pixCopiaCola };
    } catch (error) {
      await db.knex('passagens').where({ id: ticketId, status: 'pendente' }).update({ status: 'falha' });
      throw error;
    }
  }

  static async minhasPassagens(userId: string) {
    return db.knex('passagens as p').join('viagens_intermunicipais as v', 'v.id', 'p.viagem_id').where('p.usuario_id', userId)
      .select('p.id', 'p.assento', 'p.status', 'p.valor', 'p.expira_em', 'p.paga_em', 'v.origem', 'v.destino', 'v.partida_em', 'v.chegada_em', 'v.operadora').orderBy('p.created_at', 'desc');
  }

  static async processarPagamento(reference: string, amount: number) {
    const ticket = await db.knex('passagens').where({ id: reference }).first();
    if (!ticket) return null;
    if (ticket.status === 'paga') return ticket;
    if (ticket.status !== 'pendente' || new Date(ticket.expira_em).getTime() <= Date.now()) throw new Error('Reserva expirada ou não está pendente. Verifique o estorno com a operadora do pagamento se houve cobrança.');
    if (Number(ticket.valor) !== amount) throw new Error('Valor do pagamento da passagem não corresponde à reserva.');
    await db.knex.transaction(async (trx) => {
      const updated = await trx('passagens').where({ id: ticket.id, status: 'pendente' }).where('expira_em', '>', new Date().toISOString()).update({ status: 'paga', paga_em: new Date().toISOString() });
      if (!updated) throw new Error('Reserva expirou ou já foi processada.');
    });
    return { id: ticket.id, status: 'paga' };
  }
}
