import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  if (req.user.tipo !== 'admin') {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
    return;
  }

  next();
}
