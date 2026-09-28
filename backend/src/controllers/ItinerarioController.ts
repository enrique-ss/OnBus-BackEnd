import { Response } from 'express';
import { HorarioService } from '../services/HorarioService';

export class ItinerarioController {
  static async listarHorarios(req: any, res: Response): Promise<any> {
    try {
      const horarios = await HorarioService.getHorarios();
      return res.status(200).json(horarios);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async getHorariosPorLinha(req: any, res: Response): Promise<any> {
    try {
      const linha = await HorarioService.getHorariosPorLinha(req.params.id as string);
      if (!linha) return res.status(404).json({ error: 'Linha não encontrada.' });
      return res.status(200).json(linha);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
