import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export function empresaMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  if (req.user.tipo !== 'empresa') {
    res.status(403).json({ error: 'Acesso negado. Apenas empresas parceiras podem acessar este recurso.' });
    return;
  }

  next();
}
