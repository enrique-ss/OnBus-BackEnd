import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deleta registros existentes para evitar duplicidade
  await knex('validadores').del();

  // Insere validadores iniciais de teste
  await knex('validadores').insert([
    { id: '1203', status: 'ativo' },
    { id: '4401', status: 'ativo' }
  ]);
}
