import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deleta registros anteriores
  await knex('excursoes').del();
  await knex('motoristas').del();
  await knex('frotas').del();

  const empresaId = '550e8400-e29b-41d4-a716-446655440002'; // Expresso Pelotense

  // Inserir veículos de frota
  await knex('frotas').insert([
    {
      id: 'f10e8400-e29b-41d4-a716-446655440001',
      empresa_id: empresaId,
      placa: 'IJK-1234',
      modelo: 'Mercedes-Benz Marcopolo Torino',
      ano: 2022,
      status: 'ativo',
      created_at: new Date().toISOString()
    },
    {
      id: 'f10e8400-e29b-41d4-a716-446655440002',
      empresa_id: empresaId,
      placa: 'XYZ-9876',
      modelo: 'Volkswagen Comil Svelto',
      ano: 2020,
      status: 'manutencao',
      created_at: new Date().toISOString()
    }
  ]);

  // Inserir motoristas
  await knex('motoristas').insert([
    {
      id: 'm10e8400-e29b-41d4-a716-446655440001',
      empresa_id: empresaId,
      nome: 'Carlos Souza',
      cnh: '12345678901',
      status: 'ativo',
      created_at: new Date().toISOString()
    },
    {
      id: 'm10e8400-e29b-41d4-a716-446655440002',
      empresa_id: empresaId,
      nome: 'José Oliveira',
      cnh: '98765432109',
      status: 'ativo',
      created_at: new Date().toISOString()
    }
  ]);

  // Inserir excursões
  await knex('excursoes').insert([
    {
      id: 'e10e8400-e29b-41d4-a716-446655440001',
      empresa_id: empresaId,
      titulo: 'Excursão de Compras - Chuy/Uruguai',
      destino: 'Chuy (UY)',
      preco: 120.00,
      patrocinio_valor: 50.00, // Destacado no topo!
      status: 'ativo',
      created_at: new Date().toISOString()
    },
    {
      id: 'e10e8400-e29b-41d4-a716-446655440002',
      empresa_id: empresaId,
      titulo: 'Fim de Semana na Serra Gaúcha',
      destino: 'Gramado (RS)',
      preco: 250.00,
      patrocinio_valor: 0.00, // Sem destaque
      status: 'ativo',
      created_at: new Date().toISOString()
    },
    {
      id: 'e10e8400-e29b-41d4-a716-446655440003',
      empresa_id: empresaId,
      titulo: 'Bate e Volta Praia do Cassino',
      destino: 'Rio Grande (RS)',
      preco: 45.00,
      patrocinio_valor: 10.00, // Destaque médio
      status: 'ativo',
      created_at: new Date().toISOString()
    }
  ]);
}
