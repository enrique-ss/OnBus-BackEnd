import { db, Cartao, Transacao } from '../database/connection';
import { randomUUID } from 'crypto';

export class ValidadorService {
  static getTarifa(tipo: 'comum' | 'estudante' | 'idoso'): number {
    switch (tipo) {
      case 'estudante':
        return 2.50;
      case 'idoso':
        return 0.00;
      case 'comum':
      default:
        return 5.00;
    }
  }

  static async obterValidador(validadorId: string): Promise<{ id: string; status: string }> {
    const validador = await db.validadores.findOne({ id: validadorId });
    if (!validador) {
      throw new Error(`Validador '${validadorId}' não encontrado.`);
    }
    return validador;
  }

  static obterTarifas(): Record<string, number> {
    return {
      comum: 5.00,
      estudante: 2.50,
      idoso: 0.00
    };
  }

  static async processarEmbarqueOnline(
    cartaoId: string,
    validadorId: string
  ): Promise<{
    autorizado: boolean;
    saldoAnterior: number;
    saldoAtual: number;
    tarifa: number;
    mensagem: string;
    cartaoNumero: string;
  }> {
    const startTime = Date.now();

    // Validar se o validador existe e está ativo
    const validador = await db.validadores.findOne({ id: validadorId });
    if (!validador) {
      throw new Error(`Validador '${validadorId}' não está cadastrado no sistema.`);
    }
    if (validador.status !== 'ativo') {
      throw new Error(`Validador '${validadorId}' está bloqueado ou inativo.`);
    }

    const cartao = await db.cartoes.findOne({ id: cartaoId });
    if (!cartao) {
      throw new Error('Cartão não encontrado.');
    }

    if (cartao.status !== 'ativo') {
      return {
        autorizado: false,
        saldoAnterior: Number(cartao.saldo),
        saldoAtual: Number(cartao.saldo),
        tarifa: 0,
        mensagem: `Acesso negado: Cartão ${cartao.status}.`,
        cartaoNumero: cartao.numero
      };
    }

    const tarifa = this.getTarifa(cartao.tipo);
    const saldoAnterior = Number(cartao.saldo);

    if (saldoAnterior < tarifa) {
      return {
        autorizado: false,
        saldoAnterior,
        saldoAtual: saldoAnterior,
        tarifa,
        mensagem: 'Acesso negado: Saldo insuficiente.',
        cartaoNumero: cartao.numero
      };
    }

    // Processar débito
    const saldoAtual = saldoAnterior - tarifa;
    await db.cartoes.update({ id: cartaoId }, { saldo: saldoAtual, updated_at: new Date().toISOString() });

    // Registrar transação
    const transacaoId = randomUUID();
    const novaTransacao: Transacao = {
      id: transacaoId,
      cartao_id: cartaoId,
      tipo: 'debito',
      valor: tarifa,
      status: 'confirmado',
      local_validador_id: validadorId,
      created_at: new Date().toISOString()
    };
    await db.transacoes.insert(novaTransacao);

    const duration = Date.now() - startTime;
    console.log(`[Validador ${validadorId}] Embarque autorizado online para cartão ${cartao.numero} em ${duration}ms.`);

    return {
      autorizado: true,
      saldoAnterior,
      saldoAtual,
      tarifa,
      mensagem: 'Embarque Autorizado!',
      cartaoNumero: cartao.numero
    };
  }

  static async sincronizarTransacoesOffline(
    transacoesOffline: Array<{
      id: string;
      cartao_id: string;
      tipo: 'debito';
      valor: number;
      local_validador_id: string;
      created_at: string;
    }>
  ): Promise<{ processadas: number; erros: string[] }> {
    let processadas = 0;
    const erros: string[] = [];

    console.log(`Iniciando sincronização de ${transacoesOffline.length} transações offline...`);

    if (transacoesOffline.length === 0) {
      return { processadas: 0, erros: [] };
    }

    // Validar se o validador responsável pelo envio existe e está ativo
    const validadorId = transacoesOffline[0].local_validador_id;
    const validador = await db.validadores.findOne({ id: validadorId });
    if (!validador) {
      throw new Error(`Validador '${validadorId}' que solicitou sincronização não está cadastrado.`);
    }
    if (validador.status !== 'ativo') {
      throw new Error(`Validador '${validadorId}' que solicitou sincronização está bloqueado ou inativo.`);
    }

    for (const tx of transacoesOffline) {
      try {
        // Garantir que a transação pertence a um validador ativo/válido
        if (tx.local_validador_id !== validadorId) {
          erros.push(`Transação ${tx.id} rejeitada: validador_id divergente (${tx.local_validador_id} vs ${validadorId}).`);
          continue;
        }

        // Verificar se a transação já foi processada anteriormente
        const existente = await db.transacoes.findOne({ id: tx.id });
        if (existente) {
          console.log(`Transação offline ${tx.id} já existe no banco central. Ignorando.`);
          continue;
        }

        const cartao = await db.cartoes.findOne({ id: tx.cartao_id });
        if (!cartao) {
          erros.push(`Cartão ${tx.cartao_id} não encontrado para a transação ${tx.id}.`);
          continue;
        }

        // Debita do saldo central no banco
        const saldoCentral = Number(cartao.saldo);
        const novoSaldo = Math.max(0, saldoCentral - tx.valor); // Proteção básica contra saldo negativo extremo na nuvem
        
        await db.cartoes.update({ id: tx.cartao_id }, { saldo: novoSaldo, updated_at: new Date().toISOString() });

        // Insere a transação como confirmada
        const novaTransacao: Transacao = {
          id: tx.id,
          cartao_id: tx.cartao_id,
          tipo: 'debito',
          valor: tx.valor,
          status: 'confirmado',
          local_validador_id: tx.local_validador_id,
          created_at: tx.created_at
        };
        await db.transacoes.insert(novaTransacao);
        processadas++;
      } catch (err: any) {
        erros.push(`Erro ao processar transação ${tx.id}: ${err.message}`);
      }
    }


    console.log(`Sincronização concluída. ${processadas} processadas com sucesso. ${erros.length} falhas.`);
    return { processadas, erros };
  }
}
