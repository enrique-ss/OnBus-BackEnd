import { Response } from 'express';
import { WebhookService } from '../services/WebhookService';
import { CartaoController } from './CartaoController';

export class WebhookController {
  static async pagamentos(req: any, res: Response): Promise<any> {
    try {
      const signature = req.headers['x-webhook-signature'] as string;
      const webhookSecret = process.env.WEBHOOK_SECRET || 'webhook_secret_key';

      const isValid = WebhookService.verifySignature(req.body, signature, webhookSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
      }

      const { event, data } = req.body;

      if (event === 'payment.approved') {
        return await CartaoController.processarWebhookPagamento(req, res);
      }

      return res.status(200).json({ status: 'ignored', message: 'Evento não suportado.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
