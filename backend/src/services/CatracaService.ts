import { db, Cartao, Transacao } from '../database/connection';
import { randomUUID } from 'crypto';

export class CatracaService {
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

  static async obterCatraca(catracaId: string): Promise<{ id: string; status: string }> {
    const catraca = await db.catracas.findOne({ id: catracaId });
    if (!catraca) {
      throw new Error(`Catraca '${catracaId}' não encontrada.`);
    }
    return catraca;
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
    catracaId: string
  ): Promise<{
    autorizado: boolean;
    saldoAnterior: number;
    saldoAtual: number;
    tarifa: number;
    mensagem: string;
    cartaoNumero: string;
  }> {
    const startTime = Date.now();

    // Validar se a catraca existe e está ativa
    const catraca = await db.catracas.findOne({ id: catracaId });
    if (!catraca) {
      throw new Error(`Catraca '${catracaId}' não está cadastrada no sistema.`);
    }
    if (catraca.status !== 'ativo') {
      throw new Error(`Catraca '${catracaId}' está bloqueada ou inativa.`);
    }

    const cartao = await db.cartoes.findOne({ id: cartaoId });
    if (!cartao) {
      throw new Error('Cartão não encontrado.');
    }

    if (cartao.status !== 'ativo') {
      const agora = new Date();
      const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const diaAtual = diasSemana[agora.getDay()];
      const horarioAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const mensagem = `Acesso negado: Cartão ${cartao.status}.`;

      await db.historicos.insert({
        id: randomUUID(),
        cartao_id: cartaoId,
        catraca_id: catracaId,
        cartao_numero: cartao.numero,
        catraca_nome: catraca.nome,
        tarifa: 0,
        autorizado: 'nao',
        mensagem,
        dia: diaAtual,
        horario: horarioAtual,
        created_at: agora.toISOString()
      });

      return {
        autorizado: false,
        saldoAnterior: Number(cartao.saldo),
        saldoAtual: Number(cartao.saldo),
        tarifa: 0,
        mensagem,
        cartaoNumero: cartao.numero
      };
    }

    const tarifa = this.getTarifa(cartao.tipo);
    const saldoAnterior = Number(cartao.saldo);

    if (saldoAnterior < tarifa) {
      const agora = new Date();
      const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const diaAtual = diasSemana[agora.getDay()];
      const horarioAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const mensagem = 'Acesso negado: Saldo insuficiente.';

      await db.historicos.insert({
        id: randomUUID(),
        cartao_id: cartaoId,
        catraca_id: catracaId,
        cartao_numero: cartao.numero,
        catraca_nome: catraca.nome,
        tarifa,
        autorizado: 'nao',
        mensagem,
        dia: diaAtual,
        horario: horarioAtual,
        created_at: agora.toISOString()
      });

      return {
        autorizado: false,
        saldoAnterior,
        saldoAtual: saldoAnterior,
        tarifa,
        mensagem,
        cartaoNumero: cartao.numero
      };
    }

    // Processar débito
    const saldoAtual = saldoAnterior - tarifa;
    await db.cartoes.update({ id: cartaoId }, { saldo: saldoAtual, updated_at: new Date().toISOString() });

    // Adicionar validação à tabela de históricos
    const agora = new Date();
    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaAtual = diasSemana[agora.getDay()];
    const horarioAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    await db.historicos.insert({
      id: randomUUID(),
      cartao_id: cartaoId,
      catraca_id: catracaId,
      cartao_numero: cartao.numero,
      catraca_nome: catraca.nome,
      tarifa,
      autorizado: 'sim',
      mensagem: 'Embarque Autorizado!',
      dia: diaAtual,
      horario: horarioAtual,
      created_at: agora.toISOString()
    });

    const duration = Date.now() - startTime;
    console.log(`[Catraca ${catracaId}] Embarque autorizado online para cartão ${cartao.numero} em ${duration}ms.`);

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

    // Validar se a catraca responsável pelo envio existe e está ativa
    const catracaId = transacoesOffline[0].local_validador_id;
    const catraca = await db.catracas.findOne({ id: catracaId });
    if (!catraca) {
      throw new Error(`Catraca '${catracaId}' que solicitou sincronização não está cadastrada.`);
    }
    if (catraca.status !== 'ativo') {
      throw new Error(`Catraca '${catracaId}' que solicitou sincronização está bloqueada ou inativa.`);
    }

    for (const tx of transacoesOffline) {
      try {
        // Garantir que a transação pertence a uma catraca ativa/válida
        if (tx.local_validador_id !== catracaId) {
          erros.push(`Transação ${tx.id} rejeitada: catraca_id divergente (${tx.local_validador_id} vs ${catracaId}).`);
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

        // Adiciona validação à tabela de históricos
        const dataValidacao = new Date(tx.created_at);
        const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaValidacao = diasSemana[dataValidacao.getDay()];
        const horarioValidacao = dataValidacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        await db.historicos.insert({
          id: tx.id,
          cartao_id: tx.cartao_id,
          catraca_id: catracaId,
          cartao_numero: cartao.numero,
          catraca_nome: catraca.nome,
          tarifa: tx.valor,
          autorizado: novoSaldo >= 0 ? 'sim' : 'nao',
          mensagem: novoSaldo >= 0 ? 'Embarque Autorizado (Sincronizado)' : 'Saldo insuficiente (Sincronizado)',
          dia: diaValidacao,
          horario: horarioValidacao,
          created_at: tx.created_at
        });

        processadas++;
      } catch (err: any) {
        erros.push(`Erro ao processar transação ${tx.id}: ${err.message}`);
      }
    }


    console.log(`Sincronização concluída. ${processadas} processadas com sucesso. ${erros.length} falhas.`);
    return { processadas, erros };
  }
}
