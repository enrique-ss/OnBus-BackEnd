import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'onbus_super_secret_key_12345';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    cpf: string;
    email: string;
    tipo: 'comum' | 'admin' | 'empresa' | 'admin_frota';
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado: Token ausente.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Acesso negado: Token mal formatado.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; cpf: string; email: string; tipo: 'comum' | 'admin' | 'empresa' | 'admin_frota' };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Acesso negado: Token inválido ou expirado.' });
  }
}
