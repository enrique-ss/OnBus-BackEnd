import { Response } from 'express';
import { db } from '../database/connection';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class LogsController {
  static async listarLogs(req: any, res: Response): Promise<any> {
    try {
      const { nivel, origem, limit = 100 } = req.query;

      let query: any = {};
      if (nivel) query.nivel = nivel;
      if (origem) query.origem = origem;

      let logs = await db.logs.find(query);
      logs.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      // Limitar resultados
      if (limit && typeof limit === 'number') {
        logs = logs.slice(0, limit);
      }

      // Enriquecer com dados do usuário
      const enriched = await Promise.all(logs.map(async (log: any) => {
        const usuario = log.usuario_id ? await db.usuarios.findOne({ id: log.usuario_id }) : null;
        return {
          ...log,
          usuario_nome: usuario?.nome || 'Sistema',
          usuario_email: usuario?.email || null
        };
      }));

      return res.status(200).json(enriched);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async criarLog(nivel: 'info' | 'warning' | 'error' | 'critical', origem: string, mensagem: string, dados?: any, usuario_id?: string, req?: any): Promise<void> {
    try {
      const log = {
        id: generateUUID(),
        nivel,
        origem,
        mensagem,
        dados: dados || null,
        usuario_id: usuario_id || null,
        ip: req?.ip || null,
        metodo: req?.method || null,
        rota: req?.originalUrl || null,
        status_code: req?.statusCode || null,
        created_at: new Date().toISOString()
      };

      await db.logs.insert(log);
    } catch (err) {
      // Silencioso - não deve quebrar o sistema se log falhar
      console.error('Erro ao criar log:', err);
    }
  }

  static async obterEstatisticas(req: any, res: Response): Promise<any> {
    try {
      const todosLogs = await db.logs.find({});

      const estatisticas = {
        total: todosLogs.length,
        por_nivel: {
          info: todosLogs.filter((l: any) => l.nivel === 'info').length,
          warning: todosLogs.filter((l: any) => l.nivel === 'warning').length,
          error: todosLogs.filter((l: any) => l.nivel === 'error').length,
          critical: todosLogs.filter((l: any) => l.nivel === 'critical').length
        },
        por_origem: {} as Record<string, number>
      };

      todosLogs.forEach((log: any) => {
        estatisticas.por_origem[log.origem] = (estatisticas.por_origem[log.origem] || 0) + 1;
      });

      return res.status(200).json(estatisticas);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
