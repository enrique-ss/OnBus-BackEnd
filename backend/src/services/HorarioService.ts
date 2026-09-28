import { db } from '../database/connection';

export interface LinhaHorarios {
  id: string;
  nome: string;
  dias_uteis: string[];
  sabados: string[];
  domingos: string[];
}

export class HorarioService {
  static async getHorarios(): Promise<LinhaHorarios[]> {
    return db.knex('itinerarios').select('id', 'nome', 'dias_uteis', 'sabados', 'domingos').orderBy('nome');
  }

  static async getHorariosPorLinha(linhaId: string): Promise<LinhaHorarios | null> {
    return (await db.knex('itinerarios').whereRaw('UPPER(??) = ?', ['id', linhaId.toUpperCase()]).first('id', 'nome', 'dias_uteis', 'sabados', 'domingos')) || null;
  }
}
