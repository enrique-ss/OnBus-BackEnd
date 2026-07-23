import { Response } from 'express';
import { CartaoService } from '../services/CartaoService';
import { AuthRequest } from '../middleware/authMiddleware';
import { db } from '../database/connection';

export class CartaoController {
  static async emitir(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { tipo, customThemeUrl } = req.body;
      const cartao = await CartaoService.emitir(req.user!.id, tipo, customThemeUrl);
      return res.status(201).json(cartao);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listar(req: AuthRequest, res: Response): Promise<any> {
    try {
      const cartoes = await CartaoService.listar(req.user!.id);
      return res.status(200).json(cartoes);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async bloquear(req: AuthRequest, res: Response): Promise<any> {
    try {
      const cartao = await CartaoService.bloquear(req.params.id as string, req.user!.id);
      return res.status(200).json(cartao);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async solicitarSegundaVia(req: AuthRequest, res: Response): Promise<any> {
    try {
      const novoCartao = await CartaoService.solicitarSegundaVia(req.params.id as string, req.user!.id);
      return res.status(201).json(novoCartao);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async recarregar(req: AuthRequest, res: Response): Promise<any> {
    try {
      const { valor } = req.body;
      const data = await CartaoService.recarregar(req.params.id as string, Number(valor));
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listarTransacoes(req: AuthRequest, res: Response): Promise<any> {
    try {
      const cartao = await db.cartoes.findOne({ id: req.params.id as string, usuario_id: req.user!.id });
      if (!cartao) return res.status(404).json({ error: 'Cartão não encontrado.' });

      const transacoes = await db.transacoes.find({ cartao_id: req.params.id as string });
      transacoes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.status(200).json(transacoes);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listarHistorico(req: AuthRequest, res: Response): Promise<any> {
    try {
      const cartao = await db.cartoes.findOne({ id: req.params.id as string, usuario_id: req.user!.id });
      if (!cartao) return res.status(404).json({ error: 'Cartão não encontrado.' });

      const historico = cartao.historico ? JSON.parse(cartao.historico) : [];
      return res.status(200).json(historico);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listarPendentes(req: AuthRequest, res: Response): Promise<any> {
    try {
      const pendentes = await CartaoService.listarPendentes(req.user!.id);
      return res.status(200).json(pendentes);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async pagarPendente(req: AuthRequest, res: Response): Promise<any> {
    try {
      const transacaoConfirmada = await CartaoService.pagarPendente(req.params.id as string, req.user!.id);
      return res.status(200).json(transacaoConfirmada);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async processarWebhookPagamento(req: any, res: Response): Promise<any> {
    try {
      const { transaction_id, amount } = req.body;
      const transacaoConfirmada = await CartaoService.processarWebhookPagamento(transaction_id, Number(amount));
      return res.status(200).json({ status: 'success', message: 'Pagamento processado.', data: transacaoConfirmada });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
