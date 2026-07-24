import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { db, Frota, Excursao } from '../database/connection';
import { randomUUID } from 'crypto';

export class ServicosController {
  // ── Clube de Benefícios (Passageiro) ───────────────────────────────────────
  static async subscribeClube(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado.' });

    try {
      const user = await db.usuarios.findOne({ id: userId });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const umAnoDepois = new Date();
      umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1);

      await db.usuarios.update(
        { id: userId },
        {
          clube_status: 'ativo',
          clube_expira_em: umAnoDepois.toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      return res.status(200).json({
        message: 'Assinatura do Clube OnBus realizada com sucesso!',
        clube_status: 'ativo',
        clube_expira_em: umAnoDepois.toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Gestão de Frotas B2B (Empresa) ─────────────────────────────────────────
  static async cadastrarFrota(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId || tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso restrito: Apenas empresas podem gerenciar frota.' });
    }

    const { placa, modelo, ano } = req.body;
    if (!placa || !modelo || !ano) {
      return res.status(400).json({ error: 'Placa, modelo e ano do veículo são obrigatórios.' });
    }

    try {
      const existing = await db.frotas.findOne({ placa: placa.toUpperCase() });
      if (existing) {
        return res.status(400).json({ error: 'Já existe um veículo com esta placa cadastrado.' });
      }

      const novoVeiculo: Frota = {
        id: randomUUID(),
        empresa_id: userId,
        placa: placa.toUpperCase(),
        modelo,
        ano: Number(ano),
        status: 'ativo',
        created_at: new Date().toISOString()
      };

      await db.frotas.insert(novoVeiculo);
      return res.status(201).json(novoVeiculo);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listarFrota(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId || tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso restrito: Apenas empresas podem visualizar frota.' });
    }

    try {
      const frota = await db.frotas.find({ empresa_id: userId });
      return res.status(200).json(frota);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Gestão de Motoristas B2B (Empresa) ─────────────────────────────────────
  static async cadastrarMotorista(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId || tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso restrito: Apenas empresas podem gerenciar motoristas.' });
    }

    const { nome, cnh, senha } = req.body;
    if (!nome || !cnh || !senha) {
      return res.status(400).json({ error: 'Nome, CNH e senha do motorista são obrigatórios.' });
    }

    try {
      const existing = await db.usuarios.findOne({ cnh });
      if (existing) {
        return res.status(400).json({ error: 'Já existe um motorista com esta CNH cadastrada.' });
      }

      const bcrypt = require('bcryptjs');
      const senhaHash = await bcrypt.hash(senha, 10);

      const novoMotorista = {
        id: randomUUID(),
        nome,
        cpf: cnh, // Usando CNH como CPF temporariamente (pode ser ajustado)
        email: `${nome.toLowerCase().replace(/\s/g, '.')}@motorista.onbus.com`,
        senha: senhaHash,
        tipo: 'motorista' as const,
        status: 'ativo',
        cnh,
        empresa_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.usuarios.insert(novoMotorista as any);
      return res.status(201).json(novoMotorista);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listarMotoristas(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId || tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso restrito: Apenas empresas podem visualizar motoristas.' });
    }

    try {
      const motoristas = await db.usuarios.find({ empresa_id: userId, tipo: 'motorista' });
      return res.status(200).json(motoristas);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Anúncios de Excursões / Viagens (B2B & B2C) ────────────────────────────
  static async cadastrarExcursao(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    const tipo = req.user?.tipo;

    if (!userId || tipo !== 'empresa') {
      return res.status(403).json({ error: 'Acesso restrito: Apenas empresas parceiras podem anunciar excursões.' });
    }

    const { titulo, destino, preco, patrocinio_valor } = req.body;
    if (!titulo || !destino || !preco) {
      return res.status(400).json({ error: 'Título, destino e preço são obrigatórios.' });
    }

    try {
      const novaExcursao: Excursao = {
        id: randomUUID(),
        empresa_id: userId,
        titulo,
        destino,
        preco: Number(preco),
        patrocinio_valor: patrocinio_valor ? Number(patrocinio_valor) : 0.00,
        status: 'ativo',
        created_at: new Date().toISOString()
      };

      await db.excursoes.insert(novaExcursao);
      return res.status(201).json(novaExcursao);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listarExcursoes(req: AuthRequest, res: Response): Promise<any> {
    try {
      // Ordenação: Excursões com maior patrocinio_valor ficam no topo (prioridade de anúncio)
      const excursoes = await db.knex('excursoes')
        .where({ status: 'ativo' })
        .orderBy('patrocinio_valor', 'desc')
        .orderBy('created_at', 'desc');

      return res.status(200).json(excursoes);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Funcionalidades do Motorista ─────────────────────────────────────────────
  static async listarHorariosMotorista(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado.' });

    try {
      const motorista = await db.usuarios.findOne({ id: userId });
      if (!motorista || motorista.tipo !== 'motorista') {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      // Busca horários associados à empresa do motorista
      const frotas = await db.frotas.find({ empresa_id: motorista.empresa_id || undefined });
      const catracas = await db.catracas.find({ empresa_id: motorista.empresa_id || undefined });

      // Simulação de horários baseados nas linhas da empresa
      const horarios = catracas.map(catraca => ({
        linha: catraca.nome,
        linha_id: catraca.id,
        horarios: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
      }));

      return res.status(200).json(horarios);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listarTarefasMotorista(req: AuthRequest, res: Response): Promise<any> {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autenticado.' });

    try {
      const motorista = await db.usuarios.findOne({ id: userId });
      if (!motorista || motorista.tipo !== 'motorista') {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      // Busca tarefas associadas ao motorista
      const frotas = await db.frotas.find({ empresa_id: motorista.empresa_id || undefined });
      const catracas = await db.catracas.find({ empresa_id: motorista.empresa_id || undefined });

      // Simulação de tarefas (viagens programadas)
      const tarefas = catracas.map(catraca => ({
        id: randomUUID(),
        linha: catraca.nome,
        linha_id: catraca.id,
        horario_saida: '07:00',
        horario_chegada: '08:30',
        veiculo: frotas[0]?.placa || 'A definir',
        status: 'pendente',
        data: new Date().toISOString().split('T')[0]
      }));

      return res.status(200).json(tarefas);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
