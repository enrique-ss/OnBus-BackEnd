import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { RecargaProgramadaService } from '../services/RecargaProgramadaService';

export class RecargaProgramadaController {
  static async criar(req: AuthRequest, res: Response) { try { return res.status(201).json(await RecargaProgramadaService.criar(req.user!.id, req.body)); } catch (e: any) { return res.status(400).json({ error: e.message }); } }
  static async listar(req: AuthRequest, res: Response) { try { return res.status(200).json(await RecargaProgramadaService.listar(req.user!.id)); } catch (e: any) { return res.status(500).json({ error: e.message }); } }
  static async cancelar(req: AuthRequest, res: Response) { try { const ok = await RecargaProgramadaService.cancelar(req.user!.id, req.params.id as string); return ok ? res.status(200).json({ message: 'Recarga programada cancelada.' }) : res.status(404).json({ error: 'Recarga programada não encontrada.' }); } catch (e: any) { return res.status(500).json({ error: e.message }); } }
}
