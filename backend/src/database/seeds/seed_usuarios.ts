import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Deleta registros existentes para evitar duplicidade
  await knex('usuarios').del();

  // Insere usuários de teste
  const senhaHash = await bcrypt.hash('123456', 10);
  await knex('usuarios').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nome: 'Usuário Teste',
      cpf: '12345678901',
      email: 'teste@onbus.com',
      senha: senhaHash,
      tipo: 'comum',
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      nome: 'Administrador',
      cpf: '98765432100',
      email: 'admin@onbus.com',
      senha: senhaHash,
      tipo: 'admin',
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      nome: 'Expresso Pelotense',
      cpf: '55555555500',
      email: 'empresa@onbus.com',
      senha: senhaHash,
      tipo: 'empresa',
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
}
