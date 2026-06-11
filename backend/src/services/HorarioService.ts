import * as fs from 'fs';
import * as path from 'path';

export interface LinhaHorarios {
  id: string;
  nome: string;
  dias_uteis: string[];
  sabados: string[];
  domingos: string[];
}

export class HorarioService {
  static getHorarios(): LinhaHorarios[] {
    const filePath = path.join(__dirname, '../database/horarios.json');
    if (!fs.existsSync(filePath)) {
      console.warn('Arquivo horarios.json não encontrado.');
      return [];
    }
    
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Erro ao ler horarios.json:', err);
      return [];
    }
  }

  static getHorariosPorLinha(linhaId: string): LinhaHorarios | null {
    const horarios = this.getHorarios();
    return horarios.find(h => h.id.toUpperCase() === linhaId.toUpperCase()) || null;
  }
}
