import { Response } from 'express';
import { UsuarioService } from '../services/UsuarioService';
import { AuthRequest } from '../middleware/authMiddleware';

export class ProfileController {
  static async getProfile(req: AuthRequest, res: Response): Promise<any> {
    try {
      const user = await UsuarioService.getProfile(req.user!.id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
      return res.status(200).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<any> {
    try {
      const user = await UsuarioService.updateProfile(req.user!.id, req.body);
      return res.status(200).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async deleteAccountLGPD(req: AuthRequest, res: Response): Promise<any> {
    try {
      await UsuarioService.deleteAccountLGPD(req.user!.id);
      return res.status(200).json({ message: 'Conta e todos os dados associados excluídos permanentemente.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
