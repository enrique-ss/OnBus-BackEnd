import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { TravelService } from '../services/TravelService';

export class TravelController {
  static async search(req: any, res: Response) { try { return res.json(await TravelService.search(req.query)); } catch (e: any) { return res.status(500).json({ error: e.message }); } }
  static async publish(req: any, res: Response) { try { return res.status(201).json(await TravelService.publicar(req.body)); } catch (e: any) { return res.status(400).json({ error: e.message }); } }
  static async reserve(req: AuthRequest, res: Response) { try { return res.status(201).json(await TravelService.reservar(req.user!.id, req.body)); } catch (e: any) { return res.status(400).json({ error: e.message }); } }
  static async mine(req: AuthRequest, res: Response) { try { return res.json(await TravelService.minhasPassagens(req.user!.id)); } catch (e: any) { return res.status(500).json({ error: e.message }); } }
}
