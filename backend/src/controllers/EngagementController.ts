import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { db } from '../database/connection';
import { EngagementService, TERMS_TEXT, TERMS_VERSION } from '../services/EngagementService';

export class EngagementController {
  static async faq(req: any, res: Response) { try { return res.json(EngagementService.responderDuvida(req.body?.pergunta)); } catch (e: any) { return res.status(400).json({ error: e.message }); } }
  static terms(_req: any, res: Response) { return res.json({ versao: TERMS_VERSION, texto: TERMS_TEXT }); }
  static async acceptTerms(req: AuthRequest, res: Response) { try { return res.status(200).json(await EngagementService.aceitarTermos(req.user!.id, req.ip)); } catch (e: any) { return res.status(400).json({ error: e.message }); } }
  static async termsStatus(req: AuthRequest, res: Response) { try { return res.json(await EngagementService.statusTermos(req.user!.id)); } catch (e: any) { return res.status(500).json({ error: e.message }); } }
  static async reviewLastRide(req: AuthRequest, res: Response) { try { return res.status(201).json(await EngagementService.avaliarUltimoEmbarque(req.user!.id, req.body)); } catch (e: any) { return res.status(400).json({ error: e.message }); } }
  static async cashback(req: AuthRequest, res: Response) {
    try {
      const user = await db.usuarios.findOne({ id: req.user!.id });
      const ledger = await db.knex('cashback_ledger as l').join('transacoes as t', 't.id', 'l.transacao_id').join('cartoes as c', 'c.id', 't.cartao_id').where('l.usuario_id', req.user!.id).select('l.pontos', 'l.created_at', 't.valor as recarga_valor', 't.id as transacao_id').orderBy('l.created_at', 'desc');
      return res.json({ pontos: user?.cashback_pontos || 0, regra: '1 ponto por real inteiro em recargas confirmadas', historico: ledger });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }
  static async setDriver(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string, motoristaId = req.body.motoristaId || null, onibusId = req.body.onibusId || null;
      const catraca = await db.catracas.findOne({ id });
      if (!catraca) return res.status(404).json({ error: 'Ônibus/catraca não encontrado.' });
      if (motoristaId) {
        const driver = await db.usuarios.findOne({ id: motoristaId, tipo: 'motorista', status: 'ativo' } as any);
        if (!driver) return res.status(400).json({ error: 'Motorista ativo não encontrado.' });
      }
      if (onibusId) {
        const bus = await db.frotas.findOne({ id: onibusId, status: 'ativo' } as any);
        if (!bus) return res.status(400).json({ error: 'Ônibus ativo não encontrado na frota.' });
      }
      await db.catracas.update({ id }, { motorista_id: motoristaId, onibus_id: onibusId } as any);
      return res.json({ catracaId: id, motoristaId, onibusId });
    } catch (e: any) { return res.status(400).json({ error: e.message }); }
  }
}
