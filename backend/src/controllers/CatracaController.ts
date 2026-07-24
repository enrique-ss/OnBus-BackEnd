import { Response } from 'express';
import { CatracaService } from '../services/CatracaService';
import { db } from '../database/connection';

export class CatracaController {
  static async processarEmbarqueOnline(req: any, res: Response): Promise<any> {
    try {
      const { cartaoId, catracaId } = req.body;
      if (!cartaoId || !catracaId) {
        return res.status(400).json({ error: 'Os campos cartaoId e catracaId são obrigatórios.' });
      }
      const resultado = await CatracaService.processarEmbarqueOnline(cartaoId, catracaId);
      return res.status(200).json(resultado);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async sincronizarTransacoesOffline(req: any, res: Response): Promise<any> {
    try {
      const { transacoes } = req.body;
      if (!Array.isArray(transacoes)) {
        return res.status(400).json({ error: 'Formato inválido. O corpo deve conter um array de transacoes.' });
      }
      const resultado = await CatracaService.sincronizarTransacoesOffline(transacoes);
      return res.status(200).json(resultado);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async obterCatraca(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }
      const catraca = await CatracaService.obterCatraca(id);
      return res.status(200).json(catraca);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  static async obterTarifas(req: any, res: Response): Promise<any> {
    try {
      const tarifas = CatracaService.obterTarifas();
      return res.status(200).json(tarifas);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listarValidacoes(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }
      const catraca = await db.catracas.findOne({ id });
      if (!catraca) {
        return res.status(404).json({ error: 'Catraca não encontrada.' });
      }
      const historico = await db.historicos.find({ catraca_id: id });
      historico.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      return res.status(200).json(historico);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listar(req: any, res: Response): Promise<any> {
    try {
      const catracas = await db.catracas.find({});
      return res.status(200).json(catracas);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listarTodasTransacoes(req: any, res: Response): Promise<any> {
    try {
      const transacoes = await db.transacoes.find({});
      transacoes.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const enriched = await Promise.all(transacoes.map(async (t: any) => {
        const cartao = await db.cartoes.findOne({ id: t.cartao_id });
        const usuario = cartao ? await db.usuarios.findOne({ id: cartao.usuario_id }) : null;
        return {
          ...t,
          cartao_numero: cartao?.numero || 'N/A',
          usuario_nome: usuario?.nome || 'N/A',
          usuario_email: usuario?.email || 'N/A'
        };
      }));

      return res.status(200).json(enriched);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listarUsuarios(req: any, res: Response): Promise<any> {
    try {
      const { tipo, status } = req.query;

      let query: any = {};
      if (tipo) query.tipo = tipo;
      if (status) query.status = status;

      const usuarios = await db.usuarios.find(query);
      usuarios.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      return res.status(200).json(usuarios);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async alterarStatusUsuario(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }

      if (!status || !['ativo', 'inativo', 'bloqueado'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use: ativo, inativo ou bloqueado.' });
      }

      const usuario = await db.usuarios.findOne({ id });
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      await db.usuarios.update({ id }, { status });

      return res.status(200).json({ message: 'Status do usuário alterado com sucesso.', status });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async alterarTipoUsuario(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { tipo } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }

      if (!tipo || !['comum', 'admin', 'empresa', 'motorista', 'admin_frota'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo inválido. Use: comum, admin, empresa, motorista ou admin_frota.' });
      }

      const usuario = await db.usuarios.findOne({ id });
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      await db.usuarios.update({ id }, { tipo });

      return res.status(200).json({ message: 'Tipo do usuário alterado com sucesso.', tipo });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listarTarifas(req: any, res: Response): Promise<any> {
    try {
      const tarifas = await db.tarifas.find({});
      return res.status(200).json(tarifas);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async atualizarTarifa(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { valor, descricao, ativo } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }

      const tarifa = await db.tarifas.findOne({ id });
      if (!tarifa) {
        return res.status(404).json({ error: 'Tarifa não encontrada.' });
      }

      const updateData: any = { updated_at: new Date().toISOString() };
      if (valor !== undefined) updateData.valor = valor;
      if (descricao !== undefined) updateData.descricao = descricao;
      if (ativo !== undefined) updateData.ativo = ativo;

      await db.tarifas.update({ id }, updateData);

      return res.status(200).json({ message: 'Tarifa atualizada com sucesso.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async listarEmpresasPendentes(req: any, res: Response): Promise<any> {
    try {
      const empresas = await db.usuarios.find({ tipo: 'empresa', aprovacao_status: 'pendente' });
      return res.status(200).json(empresas);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async aprovarEmpresa(req: any, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const { aprovacao_status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'O parâmetro id é obrigatório.' });
      }

      if (!aprovacao_status || !['aprovado', 'rejeitado'].includes(aprovacao_status)) {
        return res.status(400).json({ error: 'Status de aprovação inválido. Use: aprovado ou rejeitado.' });
      }

      const empresa = await db.usuarios.findOne({ id, tipo: 'empresa' });
      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      await db.usuarios.update({ id }, { aprovacao_status });

      return res.status(200).json({ message: `Empresa ${aprovacao_status} com sucesso.`, aprovacao_status });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
