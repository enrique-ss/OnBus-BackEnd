import { Response } from 'express';
import { CatracaService } from '../services/CatracaService';
import { db } from '../database/connection';

export class CatracaController {
  static async processarEmbarqueOnline(req: any, res: Response): Promise<any> {
    try {
      const { cartaoId, catracaId } = req.body;
      if (!cartaoId || !catracaId) {
        return res.status(400).json({ error: 'Os campos cartaoId e catracaId são obrigatórios.' });
      }
      const resultado = await CatracaService.processarEmbarqueOnline(cartaoId, catracaId);
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
      const resultado = await CatracaService.sincronizarTransacoesOffline(transacoes);
      return res.status(200).json(resultado);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async obterCatraca(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }
      const catraca = await CatracaService.obterCatraca(id);
      return res.status(200).json(catraca);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  static async obterTarifas(req: any, res: Response): Promise<any> {
    try {
      const tarifas = CatracaService.obterTarifas();
      return res.status(200).json(tarifas);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listarValidacoes(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }
      const catraca = await db.catracas.findOne({ id });
      if (!catraca) {
        return res.status(404).json({ error: 'Catraca não encontrada.' });
      }
      const historico = catraca.historico ? JSON.parse(catraca.historico) : [];
      return res.status(200).json(historico);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listar(req: any, res: Response): Promise<any> {
    try {
      const catracas = await db.catracas.find({});
      return res.status(200).json(catracas);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
