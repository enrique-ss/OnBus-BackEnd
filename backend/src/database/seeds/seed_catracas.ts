import { Knex } from 'knex';
import horarios from '../horarios.json';

export async function seed(knex: Knex): Promise<void> {
  // Deleta registros existentes para evitar duplicidade
  await knex('catracas').del();

  // Insere catracas baseadas nas linhas de horários
  const catracas = horarios.map((linha: any) => ({
    id: linha.id,
    nome: linha.nome,
    status: 'ativo'
  }));

  await knex('catracas').insert(catracas);
}
