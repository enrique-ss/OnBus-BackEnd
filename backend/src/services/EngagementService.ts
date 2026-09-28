import { randomUUID } from 'crypto';
import { db } from '../database/connection';

export const TERMS_VERSION = '2026-09-25';
export const TERMS_TEXT = `TERMOS DE USO ONBUS — versão ${TERMS_VERSION}\n\n1. Serviço. O OnBus oferece recursos de gestão de cartões de transporte, consulta de viagens e passagens, pagamentos e suporte. A disponibilidade depende das operadoras, dos meios de pagamento e de conexão.\n\n2. Conta e segurança. Informe dados verdadeiros, mantenha suas credenciais em sigilo e comunique acessos suspeitos. Você responde pelas ações realizadas na sua conta. O cadastro público é pessoal e não concede privilégios administrativos.\n\n3. Cartões, recargas e cashback. Recargas só são concluídas após confirmação do provedor de pagamento. Pontos de cashback são calculados conforme a regra vigente exibida no app, não equivalem a dinheiro nem podem ser transferidos; estornos podem reverter pontos indevidos.\n\n4. Passagens. Horários, assentos, preços, alterações e cancelamentos dependem da operadora indicada na viagem e das regras exibidas antes do pagamento. Uma reserva pendente não é passagem confirmada. A passagem é emitida após confirmação do pagamento.\n\n5. Uso aceitável. Não tente fraudar pagamentos, acessar contas alheias, automatizar avaliações, perturbar serviços ou explorar vulnerabilidades. Avaliações devem refletir sua experiência no embarque identificado. Conteúdo abusivo pode ser removido.\n\n6. Suporte automatizado. As respostas do chatbot são informativas e não substituem as regras da operadora ou o atendimento humano.\n\n7. Dados e privacidade. O OnBus usa os dados necessários para operar a conta, processar pagamentos, prevenir fraude e atender solicitações. Aplicam-se os direitos previstos na legislação de proteção de dados e a política de privacidade publicada pelo operador do serviço.\n\n8. Disponibilidade e mudanças. Recursos podem ser atualizados ou ficar temporariamente indisponíveis. Mudanças materiais nos termos serão comunicadas e poderão exigir novo aceite.\n\n9. Contato. Dúvidas podem ser encaminhadas a ${process.env.SUPPORT_EMAIL || 'suporte@onbus.app'}.`;

export class EngagementService {
  static async avaliarUltimoEmbarque(userId: string, data: any) {
    const cards = await db.cartoes.find({ usuario_id: userId });
    if (!cards.length) throw new Error('Nenhum embarque disponível para avaliar.');
    const ids = cards.map((c) => c.id);
    const latest = await db.knex('historicos').whereIn('cartao_id', ids).where({ autorizado: 'sim' }).orderBy([{ column: 'created_at', order: 'desc' }, { column: 'id', order: 'desc' }]).first();
    if (!latest) throw new Error('Nenhum embarque autorizado disponível para avaliar.');
    if (!latest.onibus_id) throw new Error('O ônibus deste embarque ainda não foi associado no cadastro operacional.');
    const score = (v: unknown) => Number.isInteger(v) && Number(v) >= 1 && Number(v) <= 5;
    if (!score(data.notaOnibus)) throw new Error('A nota do ônibus deve ser um número inteiro de 1 a 5.');
    const hasDriver = Boolean(latest.motorista_id);
    if (hasDriver && !score(data.notaMotorista)) throw new Error('A nota do motorista deve ser um número inteiro de 1 a 5.');
    if (!hasDriver && data.notaMotorista != null) throw new Error('Este embarque não tinha motorista vinculado para avaliar.');
    const now = new Date().toISOString();
    try {
      await db.knex.transaction(async (trx) => {
        const latestNow = await trx('historicos').whereIn('cartao_id', ids).where({ autorizado: 'sim' }).orderBy([{ column: 'created_at', order: 'desc' }, { column: 'id', order: 'desc' }]).first('id');
        if (!latestNow || latestNow.id !== latest.id) throw new Error('Houve um embarque mais recente; atualize antes de avaliar.');
        await trx('avaliacoes_embarque').insert({ id: randomUUID(), historico_id: latest.id, usuario_id: userId, catraca_id: latest.catraca_id, onibus_id: latest.onibus_id, motorista_id: latest.motorista_id || null, nota_onibus: Number(data.notaOnibus), nota_motorista: hasDriver ? Number(data.notaMotorista) : null, comentario: typeof data.comentario === 'string' ? data.comentario.trim().slice(0, 1000) || null : null, created_at: now });
      });
    } catch (error: any) {
      if (error.message?.includes('UNIQUE')) throw new Error('Este último embarque já foi avaliado.');
      throw error;
    }
    return { message: 'Avaliação registrada para seu último embarque.', embarqueId: latest.id };
  }

  static async aceitarTermos(userId: string, ip?: string) {
    const exists = await db.knex('aceites_termos').where({ usuario_id: userId, versao: TERMS_VERSION }).first();
    if (exists) return { versao: TERMS_VERSION, aceitoEm: exists.aceito_em, jaAceito: true };
    const aceitoEm = new Date().toISOString();
    await db.knex('aceites_termos').insert({ id: randomUUID(), usuario_id: userId, versao: TERMS_VERSION, ip: ip?.slice(0, 50) || null, aceito_em: aceitoEm });
    return { versao: TERMS_VERSION, aceitoEm, jaAceito: false };
  }

  static async statusTermos(userId: string) {
    const acceptance = await db.knex('aceites_termos').where({ usuario_id: userId, versao: TERMS_VERSION }).first('versao', 'aceito_em');
    return { versaoAtual: TERMS_VERSION, aceito: Boolean(acceptance), aceite: acceptance || null };
  }

  static responderDuvida(question: string) {
    const q = String(question || '').trim().toLowerCase();
    if (!q || q.length > 500) throw new Error('Envie uma dúvida de até 500 caracteres.');
    const answers: Array<[RegExp, string]> = [
      [/senha|recuper/, 'Use “Esqueci minha senha” na tela de acesso e confira sua caixa de entrada e spam. O link expira em 30 minutos.'],
      [/dois fatores|2fa|codigo|código|login/, 'Ative a autenticação de dois fatores em sua conta. No próximo login, informe o código enviado ao email cadastrado.'],
      [/recarga|pix|saldo/, 'A recarga aparece como pendente até o gateway confirmar o pagamento. Se o valor foi debitado e o saldo não atualizou, fale com o suporte e informe o identificador da transação.'],
      [/cashback|ponto/, 'Você recebe 1 ponto por real inteiro em recargas confirmadas. Pontos e extrato aparecem no seu perfil; pontos não são dinheiro nem transferíveis.'],
      [/passagem|viagem|ônibus|onibus/, 'Consulte origem, destino, data, operadora e assentos disponíveis na busca de viagens. A reserva só vira passagem após confirmação do pagamento.'],
      [/cartão|cartao|bloque|segunda via/, 'Você pode bloquear o cartão na área de cartões. Depois do bloqueio, solicite a segunda via para emitir outro cartão e transferir o saldo remanescente.'],
      [/avalia/, 'Você pode avaliar apenas o embarque autorizado mais recente, uma vez. A avaliação de motorista só aparece quando havia um motorista associado à catraca.'],
    ];
    const found = answers.find(([pattern]) => pattern.test(q));
    return { resposta: found?.[1] || `Não encontrei uma resposta segura para essa dúvida. Entre em contato: ${process.env.SUPPORT_EMAIL || 'suporte@onbus.app'}.`, encaminharSuporte: !found };
  }
}
