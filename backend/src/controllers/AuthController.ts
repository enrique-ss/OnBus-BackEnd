import { Response } from 'express';
import { UsuarioService } from '../services/UsuarioService';

export class AuthController {
  static async register(req: any, res: Response): Promise<any> {
    try {
      const user = await UsuarioService.register(req.body);
      return res.status(201).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async login(req: any, res: Response): Promise<any> {
    try {
      const data = await UsuarioService.login(req.body);
      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
