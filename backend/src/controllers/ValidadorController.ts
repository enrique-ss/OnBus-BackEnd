import { Response } from 'express';
import { ValidadorService } from '../services/ValidadorService';

export class ValidadorController {
  static async processarEmbarqueOnline(req: any, res: Response): Promise<any> {
    try {
      const { cartaoId, validadorId } = req.body;
      if (!cartaoId || !validadorId) {
        return res.status(400).json({ error: 'Os campos cartaoId e validadorId são obrigatórios.' });
      }
      const resultado = await ValidadorService.processarEmbarqueOnline(cartaoId, validadorId);
      return res.status(200).json(resultado);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async sincronizarTransacoesOffline(req: any, res: Response): Promise<any> {
    try {
      const { transacoes } = req.body;
      if (!Array.isArray(transacoes)) {
        return res.status(400).json({ error: 'Formato inválido. O corpo deve conter um array de transacoes.' });
      }
      const resultado = await ValidadorService.sincronizarTransacoesOffline(transacoes);
      return res.status(200).json(resultado);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
