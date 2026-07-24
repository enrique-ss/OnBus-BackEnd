import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function motoristaMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  if (req.user.tipo !== 'motorista') {
    res.status(403).json({ error: 'Acesso negado. Apenas motoristas podem acessar este recurso.' });
    return;
  }

  next();
}
