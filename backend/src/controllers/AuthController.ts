import { Response } from 'express';
import { UsuarioService } from '../services/UsuarioService';

export class AuthController {
  static async forgotPassword(req: any, res: Response): Promise<any> {
    try { await UsuarioService.solicitarRecuperacao(req.body.email); return res.status(202).json({ message: 'Se o endereço estiver cadastrado, enviaremos as instruções.' }); }
    catch (err: any) { return res.status(503).json({ error: err.message }); }
  }
  static async resetPassword(req: any, res: Response): Promise<any> {
    try { await UsuarioService.redefinirSenha(req.body.token, req.body.senha); return res.status(200).json({ message: 'Senha redefinida com sucesso.' }); }
    catch (err: any) { return res.status(400).json({ error: err.message }); }
  }
  static async verifyLoginCode(req: any, res: Response): Promise<any> {
    try { return res.status(200).json(await UsuarioService.verificarCodigoLogin(req.body.email, req.body.codigo)); }
    catch (err: any) { return res.status(401).json({ error: err.message }); }
  }
  static async setTwoFactor(req: any, res: Response): Promise<any> {
    try { await UsuarioService.configurarDoisFatores(req.user!.id, req.body.ativo === true); return res.status(200).json({ two_factor_enabled: req.body.ativo === true }); }
    catch (err: any) { return res.status(400).json({ error: err.message }); }
  }
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
      return res.status(data.requiresTwoFactor ? 202 : 200).json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
