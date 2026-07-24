import * as readline from 'readline';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Carrega variáveis de ambiente (o .env fica na raiz do projeto)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api`;

// Cores ANSI para deixar o CLI elegante
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underline: '\x1b[4m',
  fgGreen: '\x1b[32m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m',
  fgMagenta: '\x1b[35m',
  fgCyan: '\x1b[36m',
  fgRed: '\x1b[31m',
  fgWhite: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgBlue: '\x1b[44m',
  bgYellow: '\x1b[43m'
};

// Interface do readline para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper para ler entrada do terminal de forma assíncrona
function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Estado local da CLI (simulando a aplicação no celular/catraca)
let token: string | null = null;
let loggedUser: any = null;
let currentCards: any[] = [];

// Helper para requisições HTTP seguras
async function request(endpoint: string, method = 'GET', body: any = null, requiresAuth = true): Promise<any> {
  const headers: any = {
    'Content-Type': 'application/json'
  };

  if (requiresAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: any = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro na requisição.');
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Erro de conexão com o servidor.');
  }
}

// Desenha a logo ASCII do OnBus (Preenchida/Pintada)
function printLogo() {
  console.log(`${colors.bright}${colors.fgCyan} ██████╗ ███╗   ██╗${colors.fgMagenta}██████╗ ██╗   ██╗███████╗${colors.reset}`);
  console.log(`${colors.bright}${colors.fgCyan}██╔═══██╗████╗  ██║${colors.fgMagenta}██╔══██╗██║   ██║██╔════╝${colors.reset}`);
  console.log(`${colors.bright}${colors.fgCyan}██║   ██║██╔██╗ ██║${colors.fgMagenta}██████╔╝██║   ██║███████╗${colors.reset}`);
  console.log(`${colors.bright}${colors.fgCyan}██║   ██║██║╚██╗██║${colors.fgMagenta}██╔══██╗██║   ██║╚════██║${colors.reset}`);
  console.log(`${colors.bright}${colors.fgCyan}╚██████╔╝██║ ╚████║${colors.fgMagenta}██████╔╝╚██████╔╝███████║${colors.reset}`);
  console.log(`${colors.bright}${colors.fgCyan} ╚═════╝ ╚═╝  ╚═══╝${colors.fgMagenta}╚═════╝  ╚═════╝ ╚══════╝${colors.reset}`);
}

// Desenha cabeçalho elegante
function printHeader(title: string) {
  console.clear();
  printLogo();
  console.log(`${colors.bright}${colors.fgCyan}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.fgWhite}  SEÇÃO: ${title.toUpperCase()}${colors.reset}`);
  console.log(`${colors.bright}${colors.fgCyan}----------------------------------------------------------------${colors.reset}`);
}

// Desenha rodapé compacto com status de conexão
function printFooter() {
  console.log(`${colors.fgCyan}----------------------------------------------------------------${colors.reset}`);

  const userStr = loggedUser
    ? `👤 ${loggedUser.tipo === 'comum' ? 'Passageiro' : loggedUser.tipo === 'empresa' ? 'Empresa' : loggedUser.tipo === 'admin' ? 'Admin' : 'Motorista'}: ${loggedUser.nome.split(' ')[0]}`
    : '👤 Não autenticado';

  console.log(`${userStr}`);
  console.log(`${colors.bright}${colors.fgCyan}================================================================${colors.reset}\n`);
}

// Menu principal deslogado
async function menuDeslogado() {
  printHeader('Menu Inicial');
  console.log('  1. 📝 Registrar Novo Passageiro');
  console.log('  2. 🔑 Entrar');
  console.log('  3. � Recuperar Senha');
  console.log('  4. � Consultar Itinerários de Pelotas');
  console.log('  0. ❌ Sair');
  printFooter();

  const opt = await question('Escolha uma opção: ');
  switch (opt.trim()) {
    case '1':
      await registrarPassageiro();
      break;
    case '2':
      await loginPassageiro();
      break;
    case '3':
      await recuperarSenha();
      break;
    case '4':
      await verItinerarios();
      break;
    case '0':
      console.log('Até mais! Obrigado por usar o OnBus.');
      rl.close();
      process.exit(0);
    default:
      console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
      await question('');
  }
}

// ----------------------------------------------------
// SUB-MENUS DO FLUXO DO CLIENTE (LOGADO)
// ----------------------------------------------------

async function menuPerfil() {
  while (true) {
    printHeader('Meu Perfil');
    console.log('  1. 👤 Visualizar Perfil');
    console.log('  2. ✏️  Editar Perfil');
    
    // Clube OnBus apenas para passageiros
    if (loggedUser.tipo === 'comum') {
      console.log('  3. 🌟 Assinar Clube OnBus (Benefícios)');
      console.log('  4. ⚠️  Excluir Conta');
    } else {
      console.log('  3. ⚠️  Excluir Conta');
    }
    
    console.log('  0. ⬅️  Voltar ao Menu Principal');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await verPerfil();
        break;
      case '2':
        await editarPerfil();
        break;
      case '3':
        if (loggedUser.tipo === 'comum') {
          await assinarClubeOnBus();
        } else {
          await excluirContaLGPD();
          if (!loggedUser) return;
        }
        break;
      case '4':
        if (loggedUser.tipo === 'comum') {
          await excluirContaLGPD();
          if (!loggedUser) return;
        }
        break;
      case '0':
        return;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  }
}

async function menuCartoes() {
  while (true) {
    printHeader('Gerenciar Cartões');
    console.log('  1. 📋 Visualizar Meu Cartão');
    console.log('  2. ➕ Solicitar Novo Cartão');
    console.log('  3. 💵 Recarregar Cartão');
    console.log('  4. 🔒 Bloquear Cartão');
    console.log('  5. 🔄 Solicitar Segunda Via');
    console.log('  6. 📊 Ver Extrato');
    console.log('  0. ⬅️  Voltar ao Menu Principal');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await listarCartoes();
        console.log('\nPressione Enter para continuar...');
        await question('');
        break;
      case '2':
        await solicitarCartao();
        break;
      case '3':
        await recarregarCartao();
        break;
      case '4':
        await bloquearCartao();
        break;
      case '5':
        await solicitarSegundaVia();
        break;
      case '6':
        await verHistorico();
        break;
      case '0':
        return;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  }
}

async function menuCatraca() {
  while (true) {
    printHeader('Catraca');
    console.log('  1. 🚌 Simular Embarque');
    console.log('  2. 📋 Ver Histórico da Catraca');
    console.log('  0. ⬅️  Voltar ao Menu Principal');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await simularCatraca();
        break;
      case '2':
        await verHistoricoCatraca();
        break;
      case '0':
        return;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  }
}

// ----------------------------------------------------
// MENU PRINCIPAL (logado) — equivalente à tela Home
// Espelha: Home → seções principais do app web
// ----------------------------------------------------
async function menuLogado() {
  printHeader('Home');
  
  if (loggedUser.tipo === 'empresa') {
    // Menu da Empresa
    console.log('  1. 👤 Meu Perfil');
    console.log('  2. 🏢 Painel de Controle da Empresa');
    console.log('  3. 📅 Consultar Itinerários de Pelotas');
    console.log('  0. 🚪 Sair');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await menuPerfil();
        break;
      case '2':
        await menuEmpresa();
        break;
      case '3':
        await verItinerarios();
        break;
      case '0':
        await realizarLogout();
        break;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  } else if (loggedUser.tipo === 'admin') {
    // Menu do Administrador
    console.log('  1. 👤 Meu Perfil');
    console.log('  2. 🚌 Histórico de Catracas (Linhas)');
    console.log('  0. 🚪 Sair');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await menuPerfil();
        break;
      case '2':
        await menuCatraca();
        break;
      case '0':
        await realizarLogout();
        break;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  } else if (loggedUser.tipo === 'motorista') {
    // Menu do Motorista
    console.log('  1. 👤 Meu Perfil');
    console.log('  2. 📅 Ver Meus Horários');
    console.log('  3. 📋 Ver Minhas Tarefas');
    console.log('  0. 🚪 Sair');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await menuPerfil();
        break;
      case '2':
        await verHorariosMotorista();
        break;
      case '3':
        await verTarefasMotorista();
        break;
      case '0':
        await realizarLogout();
        break;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  } else {
    // Menu do Passageiro Comum
    console.log('  1. 👤 Meu Perfil');
    console.log('  2. 💳 Gerenciar Cartões');
    console.log('  3. 🚌 Simular Embarque (Catraca)');
    console.log('  4. 📅 Consultar Itinerários de Pelotas');
    console.log('  5. ✈️  Excursões e Viagens Disponíveis');
    console.log('  0. 🚪 Sair');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await menuPerfil();
        break;
      case '2':
        await menuCartoes();
        break;
      case '3':
        await simularCatraca();
        break;
      case '4':
        await verItinerarios();
        break;
      case '5':
        await verExcursoesDisponiveis();
        break;
      case '0':
        await realizarLogout();
        break;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  }
}

async function realizarLogout() {
  token = null;
  loggedUser = null;
  currentCards = [];
  console.log(`${colors.fgGreen}Logout realizado com sucesso!${colors.reset}`);
  await new Promise(r => setTimeout(r, 1000));
}

// ----------------------------------------------------
// AÇÕES DO CLUBE & EMPRESA & EXCURSÕES
// ----------------------------------------------------

async function assinarClubeOnBus() {
  printHeader('Clube de Benefícios OnBus');
  console.log('Ao assinar o Clube OnBus, você garante:');
  console.log(`  - ${colors.fgGreen}Remoção completa de anúncios${colors.reset} no app de trajetos`);
  console.log(`  - ${colors.fgGreen}Temas VIP exclusivos${colors.reset} para personalizar seu cartão digital`);
  console.log(`  - ${colors.fgGreen}Suporte prioritário 24h${colors.reset}`);
  console.log('');

  const opt = await question('Deseja confirmar a assinatura? (S/N): ');
  if (opt.toUpperCase() !== 'S') return;

  try {
    const res = await request('/profile/clube', 'POST');
    console.log(`\n${colors.fgGreen}✅ ${res.message}${colors.reset}`);
    console.log(`Válido até: ${new Date(res.clube_expira_em).toLocaleDateString()}`);
    loggedUser.clube_status = 'ativo';
    loggedUser.clube_expira_em = res.clube_expira_em;
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro ao assinar: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para continuar...');
  await question('');
}

async function menuEmpresa() {
  while (true) {
    printHeader('Painel de Controle - B2B');
    console.log(`Empresa parceira: ${colors.bright}${loggedUser.nome}${colors.reset}\n`);
    console.log('  1. 🚌 Cadastrar Veículo na Frota');
    console.log('  2. 📋 Listar Frota');
    console.log('  3. Cadastrar Motorista');
    console.log('  4. 📋 Listar Motoristas');
    console.log('  5. ✈️ Anunciar Nova Excursão');
    console.log('  0. ⬅️  Voltar ao Menu Principal');
    printFooter();

    const opt = await question('Escolha uma opção: ');
    switch (opt.trim()) {
      case '1':
        await cadastrarVeiculoCLI();
        break;
      case '2':
        await listarFrotaCLI();
        break;
      case '3':
        await cadastrarMotoristaCLI();
        break;
      case '4':
        await listarMotoristasCLI();
        break;
      case '5':
        await anunciarExcursaoCLI();
        break;
      case '0':
        return;
      default:
        console.log(`${colors.fgRed}Opção inválida! Pressione Enter para continuar...${colors.reset}`);
        await question('');
    }
  }
}

async function cadastrarVeiculoCLI() {
  printHeader('Cadastrar Veículo na Frota');
  const placa = await question('Placa do ônibus (ex: ABC-1234): ');
  const modelo = await question('Modelo / Carroceria: ');
  const ano = await question('Ano do veículo: ');

  try {
    const res = await request('/empresa/frotas', 'POST', { placa, modelo, ano });
    console.log(`\n${colors.fgGreen}✅ Veículo cadastrado com sucesso na frota!${colors.reset}`);
    console.log(`Placa: ${res.placa} | Modelo: ${res.modelo} | Ano: ${res.ano}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro no cadastro do veículo: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para continuar...');
  await question('');
}

async function listarFrotaCLI() {
  printHeader('Frota Cadastrada');
  try {
    const frota = await request('/empresa/frotas', 'GET');
    if (frota.length === 0) {
      console.log('Nenhum veículo cadastrado na sua frota.');
    } else {
      frota.forEach((v: any, index: number) => {
        let statusStr = colors.fgGreen + 'ATIVO';
        if (v.status === 'manutencao') statusStr = colors.fgYellow + 'MANUTENÇÃO';
        console.log(`  ${index + 1}. [${v.placa}] ${v.modelo} (Ano: ${v.ano}) - Status: ${statusStr}${colors.reset}`);
      });
    }
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao listar frota: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function cadastrarMotoristaCLI() {
  printHeader('Cadastrar Motorista');
  const nome = await question('Nome do motorista: ');
  const cnh = await question('CNH (apenas dígitos): ');

  try {
    const res = await request('/empresa/motoristas', 'POST', { nome, cnh });
    console.log(`\n${colors.fgGreen}✅ Motorista cadastrado com sucesso!${colors.reset}`);
    console.log(`Nome: ${res.nome} | CNH: ${res.cnh}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro no cadastro do motorista: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para continuar...');
  await question('');
}

async function listarMotoristasCLI() {
  printHeader('Motoristas Cadastrados');
  try {
    const motoristas = await request('/empresa/motoristas', 'GET');
    if (motoristas.length === 0) {
      console.log('Nenhum motorista cadastrado.');
    } else {
      motoristas.forEach((m: any, index: number) => {
        console.log(`  ${index + 1}. Nome: ${m.nome} | CNH: ${m.cnh} | Status: ${m.status === 'ativo' ? colors.fgGreen + 'ATIVO' : colors.fgRed + m.status}${colors.reset}`);
      });
    }
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao listar motoristas: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function anunciarExcursaoCLI() {
  printHeader('Anunciar Nova Excursão');
  const titulo = await question('Título da excursão: ');
  const destino = await question('Destino (Cidade/Estado/País): ');
  const preco = await question('Preço da passagem (R$): ');
  const patrocinio_valor = await question('Valor de patrocínio para destacar no topo (R$, opcional): ');

  try {
    const res = await request('/empresa/excursoes', 'POST', {
      titulo,
      destino,
      preco,
      patrocinio_valor: patrocinio_valor || 0
    });
    console.log(`\n${colors.fgGreen}✅ Excursão anunciada com sucesso!${colors.reset}`);
    console.log(`Título: ${res.titulo} | Destino: ${res.destino} | Preço: R$ ${Number(res.preco).toFixed(2)}`);
    console.log(`Patrocínio: R$ ${Number(res.patrocinio_valor).toFixed(2)} (Prioridade no topo do feed)`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro ao anunciar: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para continuar...');
  await question('');
}

async function verExcursoesDisponiveis() {
  printHeader('Excursões e Viagens Disponíveis');
  try {
    const excursoes = await request('/excursoes', 'GET', null, false);
    if (excursoes.length === 0) {
      console.log('Nenhuma excursão anunciada por empresas parceiras no momento.');
    } else {
      console.log(`${colors.fgCyan}As excursões com patrocínio pago aparecem no topo com destaque:${colors.reset}\n`);
      excursoes.forEach((e: any, index: number) => {
        const isPatrocinado = Number(e.patrocinio_valor) > 0;
        const tagPatrocinado = isPatrocinado ? `${colors.bgYellow}${colors.fgWhite} [DESTAQUE PREMIUM] ${colors.reset} ` : '';
        console.log(`  ${index + 1}.${tagPatrocinado} ${colors.bright}${e.titulo}${colors.reset}`);
        console.log(`     Destino:  ${e.destino}`);
        console.log(`     Preço:    R$ ${Number(e.preco).toFixed(2)}`);
        console.log(`     Patrocínio pago p/ OnBus: R$ ${Number(e.patrocinio_valor).toFixed(2)}\n`);
      });
    }
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao carregar excursões: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}


// ----------------------------------------------------
// AÇÕES DO CLI
// ----------------------------------------------------

async function registrarPassageiro() {
  printHeader('Cadastro de Passageiro');
  const nome = await question('Nome completo: ');
  const cpf = await question('CPF/CNPJ (11 dígitos): ');
  const email = await question('E-mail: ');
  const senha = await question('Senha: ');

  try {
    const user = await request('/auth/register', 'POST', { nome, cpf, email, senha }, false);
    console.log(`\n${colors.fgGreen}✅ Cadastro realizado com sucesso!${colors.reset}`);
    console.log(`ID: ${user.id}`);
    console.log(`Tipo: ${user.tipo}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro no cadastro: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function loginPassageiro() {
  printHeader('Entrar no Sistema');
  const email = await question('E-mail: ');
  const senha = await question('Senha: ');

  try {
    const data = await request('/auth/login', 'POST', { email, senha }, false);
    token = data.token;
    loggedUser = data.user;
    console.log(`\n${colors.fgGreen}✅ Login efetuado com sucesso! Bem-vindo(a), ${loggedUser.nome}!${colors.reset}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Falha no login: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para continuar...');
  await question('');
}

async function recuperarSenha() {
  printHeader('Recuperar Senha');
  console.log(`${colors.dim}Informe o e-mail ou CPF/CNPJ da conta para recuperar a senha.${colors.reset}\n`);
  const identificador = await question('E-mail ou CPF/CNPJ: ');

  if (!identificador.trim()) {
    console.log(`\n${colors.fgYellow}Operação cancelada.${colors.reset}`);
    console.log('\nPressione Enter para voltar...');
    await question('');
    return;
  }

  console.log(`\n${colors.fgCyan}📧 Enviando e-mail de recuperação para: ${identificador}${colors.reset}`);
  console.log(`${colors.dim}Aguarde...${colors.reset}`);

  await new Promise(r => setTimeout(r, 1500));

  console.log(`\n${colors.fgGreen}✅ E-mail de recuperação enviado com sucesso!${colors.reset}`);
  console.log(`${colors.dim}Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.${colors.reset}`);
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function verPerfil() {
  printHeader('Visualizar Perfil');
  try {
    const user = await request('/profile', 'GET');
    console.log(` Nome:     ${user.nome}`);
    console.log(` CPF:      ${user.cpf}`);
    console.log(` E-mail:   ${user.email}`);
    console.log(` Tipo:     ${user.tipo.toUpperCase()}`);
    if (user.clube_status === 'ativo') {
      console.log(` Clube:    ${colors.fgGreen}Premium (Ativo - Expira em ${new Date(user.clube_expira_em).toLocaleDateString()})${colors.reset}`);
    } else {
      console.log(` Clube:    ${colors.dim}Comum (Inativo)${colors.reset}`);
    }
    console.log(` Status:   ${user.status === 'ativo' ? colors.fgGreen + 'Ativo' : colors.fgRed + user.status}${colors.reset}`);
    console.log(` Cadastro: ${new Date(user.created_at).toLocaleString()}`);
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao carregar perfil: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function editarPerfil() {
  printHeader('Editar Perfil');
  try {
    const user = await request('/profile', 'GET');

    console.log(`${colors.fgCyan}Dados atuais:${colors.reset}`);
    console.log(` Nome:   ${user.nome}`);
    console.log(` E-mail: ${user.email}`);
    console.log(`\n${colors.dim}Deixe o campo em branco para manter o valor atual.${colors.reset}\n`);

    const novoNome  = await question(`Novo nome   [${user.nome}]: `);
    const novoEmail = await question(`Novo e-mail [${user.email}]: `);

    const payload: any = {};
    if (novoNome.trim())  payload.nome  = novoNome.trim();
    if (novoEmail.trim()) payload.email = novoEmail.trim();

    if (Object.keys(payload).length === 0) {
      console.log(`\n${colors.fgYellow}Nenhuma alteração informada.${colors.reset}`);
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    const atualizado = await request('/profile', 'PUT', payload);
    loggedUser = atualizado;
    console.log(`\n${colors.fgGreen}✅ Perfil atualizado com sucesso!${colors.reset}`);
    console.log(` Nome:   ${atualizado.nome}`);
    console.log(` E-mail: ${atualizado.email}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro ao atualizar perfil: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function listarCartoes() {
  printHeader('Meu Cartão de Transporte');
  try {
    const cartoes = await request('/cartoes', 'GET');
    currentCards = cartoes;

    if (cartoes.length === 0) {
      console.log('Você não possui nenhum cartão emitido.');
    } else {
      const ativo = cartoes.find((c: any) => c.status === 'ativo');
      const selecionado = ativo || cartoes[cartoes.length - 1];

      let statusStr = colors.fgGreen + selecionado.status.toUpperCase();
      if (selecionado.status === 'bloqueado') statusStr = colors.fgYellow + 'BLOQUEADO';
      if (selecionado.status === 'cancelado') statusStr = colors.fgRed + 'CANCELADO';
      
      console.log(`  Tipo:   [${selecionado.tipo.toUpperCase()}]`);
      console.log(`  Número: ${selecionado.numero}`);
      console.log(`  Saldo:  ${colors.bright}R$ ${Number(selecionado.saldo).toFixed(2)}${colors.reset}`);
      console.log(`  Status: ${statusStr}${colors.reset}`);
      console.log(`  Tema: ${selecionado.theme_url || 'Padrão do tipo ' + selecionado.tipo}`);
    }
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao carregar dados do cartão: ${err.message}${colors.reset}`);
  }
  return currentCards;
}

async function solicitarCartao() {
  printHeader('Solicitar Novo Cartão');
  
  try {
    const cartoes = await request('/cartoes', 'GET');
    const ativo = cartoes.find((c: any) => c.status === 'ativo');
    if (ativo) {
      console.log(`${colors.fgRed}❌ Erro na emissão: Você já possui um cartão ativo. Para solicitar um novo, é necessário bloquear o cartão atual.${colors.reset}`);
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao verificar cartões: ${err.message}${colors.reset}`);
    console.log('\nPressione Enter para voltar...');
    await question('');
    return;
  }

  console.log('Selecione o tipo de cartão desejado:');
  console.log('  1. Comum');
  console.log('  2. Estudante (Meia)');
  console.log('  3. Idoso (Gratuito)');
  console.log('  4. Cancelar');
  console.log('');
  
  const opt = await question('Opção: ');
  let tipo: 'comum' | 'estudante' | 'idoso';
  
  if (opt === '1') tipo = 'comum';
  else if (opt === '2') tipo = 'estudante';
  else if (opt === '3') tipo = 'idoso';
  else return;

  const themeUrl = await question('Personalizar cor/imagem (URL opcional): ');

  try {
    const cartao = await request('/cartoes', 'POST', { tipo, themeUrl });
    console.log(`\n${colors.fgGreen}✅ Cartão emitido com sucesso!${colors.reset}`);
    console.log(`Número do Cartão: ${cartao.numero}`);
    console.log(`Tema: ${cartao.theme_url || 'Padrão do tipo ' + tipo}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro na emissão: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para continuar...');
  await question('');
}

async function recarregarCartao() {
  printHeader('Recarregar Cartão');
  try {
    // Verificar recargas pendentes primeiro
    const pendentes = await request('/transacoes/pendentes', 'GET');
    if (pendentes && pendentes.length > 0) {
      console.log(`${colors.fgYellow}⚠️  Você tem ${pendentes.length} recarga(s) pendente(s):${colors.reset}`);
      pendentes.forEach((p: any, idx: number) => {
        console.log(`   ${idx + 1}. R$ ${Number(p.valor).toFixed(2)} - ${p.id.substring(0, 8)}... (${new Date(p.created_at).toLocaleString('pt-BR')})`);
      });
      
      const opcao = await question(`\nDigite o número da recarga para pagar (ou 0 para criar nova): `);
      const idx = parseInt(opcao);
      
      if (idx > 0 && idx <= pendentes.length) {
        const selecionada = pendentes[idx - 1];
        await pagarRecargaPendente(selecionada);
        console.log('\nPressione Enter para voltar...');
        await question('');
        return;
      } else if (idx === 0) {
        console.log(`${colors.fgCyan}Continuando com nova recarga...${colors.reset}\n`);
      } else {
        console.log(`${colors.fgRed}Opção inválida. Continuando com nova recarga...${colors.reset}\n`);
      }
    }

    const cartoes = await request('/cartoes', 'GET');
    const selecionado = cartoes.find((c: any) => c.status === 'ativo');
    if (!selecionado) {
      console.log(`${colors.fgRed}❌ Erro na recarga: Você não possui nenhum cartão ativo para recarregar.${colors.reset}`);
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    const valorStr = await question('Valor da recarga: ');
    const valor = parseFloat(valorStr);

    if (isNaN(valor) || valor <= 0) {
      console.log(`${colors.fgRed}Valor inválido!${colors.reset}`);
      await new Promise(r => setTimeout(r, 1000));
      return;
    }

    console.log(`\n${colors.fgYellow}Gerando recarga Pix...${colors.reset}`);
    const resData = await request(`/cartoes/${selecionado.id}/recarregar`, 'POST', { valor });
    
    console.log(`\n${colors.fgGreen}✅ Pedido de recarga Pix gerado com sucesso!${colors.reset}`);
    console.log(`Valor: R$ ${valor.toFixed(2)} | Transação ID: ${resData.transacao.id}`);
    
    const pagarAgora = await question(`\n${colors.bright}${colors.fgYellow}Simular pagamento imediato desse Pix agora? (S/N): ${colors.reset}`);
    if (pagarAgora.toUpperCase() === 'S') {
      const payload = {
        event: 'payment.approved',
        transaction_id: resData.transacao.id,
        cartao_id: selecionado.id,
        amount: valor
      };

      const webhookSecret = process.env.WEBHOOK_SECRET || 'webhook_secret_key';
      const signature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

      const res = await fetch(`${API_URL}/webhooks/pagamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': signature
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log(`\n${colors.fgGreen}✅ Pix confirmado com sucesso! O valor de R$ ${valor.toFixed(2)} foi atribuído e creditado à sua conta.${colors.reset}`);
      } else {
        console.log(`\n${colors.fgRed}❌ Não foi possível confirmar o Pix neste momento.${colors.reset}`);
      }
    } else {
      console.log(`\n${colors.bright}${colors.fgCyan}ℹ️  Pedido mantido como PENDENTE. O valor de R$ ${valor.toFixed(2)} será atribuído à sua conta assim que a confirmação do pagamento for recebida.${colors.reset}`);
    }
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Falha na recarga: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function pagarRecargaPendente(pendente: any) {
  printHeader('Pagar Recarga Pendente');
  
  try {
    console.log(`\nPagando R$ ${Number(pendente.valor).toFixed(2)} (${pendente.id.substring(0, 8)}...)...`);
    await request(`/transacoes/${pendente.id}/pagar`, 'POST');
    console.log(`${colors.fgGreen}✅ Pago com sucesso!${colors.reset}`);
  } catch (err: any) {
    console.log(`${colors.fgRed}❌ Erro ao pagar: ${err.message}${colors.reset}`);
  }
}

async function bloquearCartao() {
  printHeader('Bloquear Cartão');
  try {
    const cartoes = await request('/cartoes', 'GET');
    const selecionado = cartoes.find((c: any) => c.status === 'ativo');
    if (!selecionado) {
      console.log(`${colors.fgRed}❌ Erro no bloqueio: Você não possui nenhum cartão ativo para bloquear.${colors.reset}`);
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    const conf = await question(`Tem certeza que deseja bloquear o cartão ${selecionado.numero}? (S/N): `);
    if (conf.toUpperCase() !== 'S') return;

    await request(`/cartoes/${selecionado.id}/bloquear`, 'POST');
    console.log(`\n${colors.fgGreen}✅ Cartão bloqueado com sucesso! Saldo protegido.${colors.reset}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Falha ao bloquear: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function solicitarSegundaVia() {
  printHeader('Solicitar Segunda Via');
  try {
    const cartoes = await request('/cartoes', 'GET');
    const selecionado = cartoes.find((c: any) => c.status === 'bloqueado');
    
    if (!selecionado) {
      console.log('Você não tem nenhum cartão bloqueado para solicitar segunda via.');
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    const conf = await question(`Deseja solicitar a 2ª via do cartão bloqueado ${selecionado.numero}? (S/N): `);
    if (conf.toUpperCase() !== 'S') return;

    console.log(`\n${colors.fgYellow}Processando emissão e transferência de saldo...${colors.reset}`);
    const novoCartao = await request(`/cartoes/${selecionado.id}/segunda-via`, 'POST');
    console.log(`\n${colors.fgGreen}✅ Segunda via emitida com sucesso!${colors.reset}`);
    console.log(`Novo Cartão: ${novoCartao.numero}`);
    console.log(`Saldo recuperado e transferido: ${colors.bright}R$ ${Number(novoCartao.saldo).toFixed(2)}${colors.reset}`);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro na solicitação: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function simularCatraca() {
  printHeader('Simular Catraca');
  try {
    const cartoes = await request('/cartoes', 'GET');
    const selecionado = cartoes.find((c: any) => c.status === 'ativo');
    if (!selecionado) {
      console.log(`${colors.fgRed}❌ Erro: Você não possui nenhum cartão ativo para passar na catraca.${colors.reset}`);
      console.log('\nPressione Enter para continuar...');
      await question('');
      return;
    }

    // Selecionar destino (catraca)
    const catracas = await request('/catracas', 'GET');
    if (catracas.length === 0) {
      console.log(`${colors.fgRed}❌ Erro: Nenhuma catraca disponível.${colors.reset}`);
      console.log('\nPressione Enter para continuar...');
      await question('');
      return;
    }

    console.log('\nSelecione seu destino:\n');
    catracas.forEach((c: any, index: number) => {
      console.log(`  ${index + 1}. ${c.nome}`);
    });

    const opt = await question('\nDigite o número do destino: ');
    const index = parseInt(opt.trim()) - 1;
    
    if (index < 0 || index >= catracas.length) {
      console.log(`${colors.fgRed}❌ Opção inválida.${colors.reset}`);
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    const catracaSelecionada = catracas[index];
    console.log(`\n${colors.fgYellow}Aproximando cartão na catraca...${colors.reset}`);
    console.log(`${colors.fgCyan}Destino: ${catracaSelecionada.nome}${colors.reset}`);
    
    const resultado = await request('/catraca/embarque', 'POST', {
      cartaoId: selecionado.id,
      catracaId: catracaSelecionada.id
    }, false);

    desenharPainelValidador(resultado.autorizado, resultado.tarifa, resultado.saldoAtual, resultado.mensagem, selecionado.numero, catracaSelecionada.nome);
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Erro de validação: ${err.message}${colors.reset}`);
  }

  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function verHistoricoCatraca() {
  printHeader('Ver Histórico da Catraca');
  try {
    const catracas = await request('/catracas', 'GET');
    if (catracas.length === 0) {
      console.log('Nenhuma catraca disponível.');
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    console.log('\nSelecione a catraca para ver o histórico:\n');
    catracas.forEach((c: any, index: number) => {
      console.log(`  ${index + 1}. ${c.nome} (ID: ${c.id})`);
    });

    const opt = await question('\nDigite o número da catraca: ');
    const index = parseInt(opt.trim()) - 1;
    
    if (index < 0 || index >= catracas.length) {
      console.log(`${colors.fgRed}Opção inválida.${colors.reset}`);
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    const catracaSelecionada = catracas[index];
    
    // Buscar validações desta catraca (requer auth e admin)
    const validacoes = await request(`/catracas/${catracaSelecionada.id}/validacoes`, 'GET', null, true);
    
    printHeader(`Histórico - ${catracaSelecionada.nome}`);
    
    if (validacoes.length === 0) {
      console.log('Nenhum cartão foi validado nesta catraca ainda.');
    } else {
      console.log(`\nTotal de validações: ${validacoes.length}\n`);
      validacoes.forEach((v: any) => {
        const dataStr = new Date(v.created_at).toLocaleString();
        const statusStr = v.autorizado === 'sim' 
          ? `${colors.fgGreen}AUTORIZADO` 
          : `${colors.fgRed}NEGADO`;
        console.log(`  [${dataStr}] ${statusStr} Cartão: ${v.cartao_numero} Tarifa: R$ ${Number(v.tarifa).toFixed(2)}${colors.reset}`);
        if (v.catraca_nome || v.linha) {
          console.log(`         Linha: ${v.catraca_nome || v.linha}`);
        }
        if (v.dia && v.horario) {
          console.log(`         Dia: ${v.dia} Horário: ${v.horario}`);
        }
        if (v.mensagem) {
          console.log(`         ${v.mensagem}`);
        }
      });
    }
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao buscar histórico da catraca: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

function desenharPainelValidador(
  autorizado: boolean,
  tarifa: number,
  saldo: number,
  mensagem: string,
  numeroCartao: string,
  nomeCatraca: string
) {
  const border = autorizado ? colors.fgGreen : colors.fgRed;
  const msgStyle = autorizado 
    ? `${colors.bright}${colors.fgGreen}>>> ${mensagem} <<<${colors.reset}`
    : `${colors.bright}${colors.fgRed}>>> ${mensagem} <<<${colors.reset}`;

  console.log(`\n${border}┌──────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${border}│                     CATRACA ONBUS                          │${colors.reset}`);
  console.log(`${border}├──────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${border}│ Linha: ${nomeCatraca.padEnd(51)} │`);
  console.log(`${border}│ Cartão: ${numeroCartao.padEnd(52)} │`);
  console.log(`${border}├──────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`${border}│                                                              │${colors.reset}`);
  console.log(`${border}│      ${msgStyle.padEnd(60)}│`);
  console.log(`${border}│                                                              │${colors.reset}`);
  console.log(`${border}│      Tarifa Cobrada: R$ ${tarifa.toFixed(2).padEnd(38)} │`);
  console.log(`${border}│      Saldo Atual:    R$ ${saldo.toFixed(2).padEnd(38)} │`);
  console.log(`${border}│                                                              │${colors.reset}`);
  console.log(`${border}└──────────────────────────────────────────────────────────────┘${colors.reset}`);
}

async function verHistorico() {
  printHeader('Extrato & Histórico do Cartão');
  try {
    const cartoes = await request('/cartoes', 'GET');
    if (cartoes.length === 0) {
      console.log('Você não possui nenhum cartão para ver o histórico.');
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    const ativo = cartoes.find((c: any) => c.status === 'ativo');
    const selecionado = ativo || cartoes[cartoes.length - 1];

    const historico = await request(`/cartoes/${selecionado.id}/historico`, 'GET');
    const transacoes = await request(`/cartoes/${selecionado.id}/transacoes`, 'GET');

    printHeader(`Extrato - Cartão ${selecionado.numero}`);
    
    console.log(`${colors.fgCyan}--- RECARGAS REALIZADAS ---${colors.reset}`);
    if (transacoes.length === 0) {
      console.log('  Nenhuma transação financeira registrada.');
    } else {
      transacoes.forEach((t: any) => {
        const dataStr = new Date(t.created_at).toLocaleString();
        let statusStr = colors.fgGreen + t.status.toUpperCase();
        if (t.status === 'pendente') statusStr = colors.fgYellow + 'PENDENTE';
        if (t.status === 'falho') statusStr = colors.fgRed + 'FALHO';

        console.log(`  [${dataStr}] Recarga Pix: ${colors.bright}R$ ${Number(t.valor).toFixed(2)}${colors.reset} | Status: ${statusStr}${colors.reset}`);
        if (t.taxa_servico && Number(t.taxa_servico) > 0) {
          console.log(`         Taxa de Conveniência OnBus: R$ ${Number(t.taxa_servico).toFixed(2)}`);
        }
      });
    }

    console.log(`\n${colors.fgCyan}--- HISTÓRICO DE EMBARQUES ---${colors.reset}`);
    if (historico.length === 0) {
      console.log('  Este cartão ainda não passou em nenhuma catraca.');
    } else {
      historico.forEach((v: any) => {
        const dataStr = new Date(v.created_at).toLocaleString();
        const statusStr = v.autorizado === 'sim' 
          ? `${colors.fgGreen}AUTORIZADO` 
          : `${colors.fgRed}NEGADO`;
        console.log(`  [${dataStr}] ${statusStr} Tarifa: R$ ${Number(v.tarifa).toFixed(2)}${colors.reset}`);
        if (v.catraca_nome) {
          console.log(`         Linha: ${v.catraca_nome}`);
        }
        if (v.dia && v.horario) {
          console.log(`         Dia: ${v.dia} Horário: ${v.horario}`);
        }
        if (v.mensagem) {
          console.log(`         Status: ${v.mensagem}`);
        }
      });
    }
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao buscar extrato: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function verItinerarios() {
  while (true) {
    printHeader('Itinerários de Ônibus - Pelotas/RS');
    let linhas: any[] = [];
    try {
      linhas = await request('/itinerarios', 'GET', null, false);
    } catch (err: any) {
      console.log(`${colors.fgRed}Erro ao buscar itinerários: ${err.message}${colors.reset}`);
      console.log('\nPressione Enter para voltar...');
      await question('');
      return;
    }

    console.log('Linhas disponíveis:\n');
    linhas.forEach((l: any, index: number) => {
      console.log(`  ${index + 1}. [${l.id}] ${l.nome}`);
    });
    console.log('');
    console.log('  0. ⬅️  Voltar');
    printFooter();

    const idxStr = await question('Opção: ');
    if (idxStr.trim() === '0') return;

    const idx = parseInt(idxStr) - 1;
    if (isNaN(idx) || idx < 0 || idx >= linhas.length) {
      console.log(`${colors.fgRed}Opção inválida!${colors.reset}`);
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    // Mostrar grade horária da linha selecionada
    while (true) {
      const linha = linhas[idx];
      printHeader(`Horários - Linha ${linha.id}`);
      console.log(`${colors.bright}Linha:${colors.reset} ${linha.nome}\n`);

      console.log(`${colors.fgGreen}📅 DIAS ÚTEIS:${colors.reset}`);
      console.log(formatHorariosGrid(linha.dias_uteis));
      console.log('');

      console.log(`${colors.fgYellow}📅 SÁBADOS:${colors.reset}`);
      console.log(formatHorariosGrid(linha.sabados));
      console.log('');

      console.log(`${colors.fgRed}📅 DOMINGOS:${colors.reset}`);
      console.log(formatHorariosGrid(linha.domingos));
      console.log('');
      console.log('  0. ⬅️  Voltar');
      printFooter();

      const back = await question('Opção: ');
      if (back.trim() === '0') break;
    }
  }
}

function formatHorariosGrid(horarios: string[]): string {
  if (!horarios || horarios.length === 0) return '  Sem horários cadastrados.';
  
  // Agrupa os horários em colunas de 6 itens para ficar estético
  const chunked: string[][] = [];
  const chunkSize = 6;
  for (let i = 0; i < horarios.length; i += chunkSize) {
    chunked.push(horarios.slice(i, i + chunkSize));
  }

  return chunked.map(row => '  ' + row.join('   ')).join('\n');
}

async function verHorariosMotorista() {
  printHeader('Meus Horários de Trabalho');
  try {
    const horarios = await request('/motorista/horarios', 'GET');
    console.log('\nHorários das linhas da sua empresa:\n');
    horarios.forEach((h: any) => {
      console.log(`${colors.bright}🚌 Linha: ${h.linha}${colors.reset}`);
      console.log(`   ID: ${h.linha_id}`);
      console.log(`   Horários: ${h.horarios.join(', ')}`);
      console.log('');
    });
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao buscar horários: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function verTarefasMotorista() {
  printHeader('Minhas Tarefas');
  try {
    const tarefas = await request('/motorista/tarefas', 'GET');
    console.log('\nViagens programadas:\n');
    tarefas.forEach((t: any) => {
      console.log(`${colors.bright}🚗 Viagem: ${t.linha}${colors.reset}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   Saída: ${t.horario_saida} | Chegada: ${t.horario_chegada}`);
      console.log(`   Veículo: ${t.veiculo}`);
      console.log(`   Data: ${t.data}`);
      console.log(`   Status: ${t.status}`);
      console.log('');
    });
  } catch (err: any) {
    console.log(`${colors.fgRed}Erro ao buscar tarefas: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para voltar...');
  await question('');
}

async function excluirContaLGPD() {
  printHeader('Direito ao Esquecimento - LGPD');
  console.log(`${colors.bgRed}${colors.bright}  ⚠️ AVISO CRÍTICO LGPD ⚠️  ${colors.reset}\n`);
  console.log('Esta ação excluirá permanentemente:');
  console.log('  - Suas informações cadastrais (Nome, CPF, E-mail)');
  console.log('  - Todos os seus cartões de transporte vinculados');
  console.log('  - Todo o seu histórico financeiro e de viagens');
  console.log('');
  console.log('Essa exclusão é definitiva (hard delete) e irreversível.');
  console.log('');

  const conf1 = await question('Tem certeza absoluta de que deseja prosseguir? (S/N): ');
  if (conf1.toUpperCase() !== 'S') return;

  const cpfConfirm = await question('Digite seu CPF para confirmar a exclusão: ');
  if (cpfConfirm !== loggedUser.cpf) {
    console.log(`\n${colors.fgRed}CPF incorreto. Operação cancelada.${colors.reset}`);
    console.log('\nPressione Enter para continuar...');
    await question('');
    return;
  }

  try {
    await request('/profile/lgpd', 'DELETE');
    console.log(`\n${colors.fgGreen}✅ Conta e todos os seus dados foram removidos permanentemente em conformidade com a LGPD.${colors.reset}`);
    token = null;
    loggedUser = null;
    currentCards = [];
  } catch (err: any) {
    console.log(`\n${colors.fgRed}❌ Falha na exclusão: ${err.message}${colors.reset}`);
  }
  console.log('\nPressione Enter para continuar...');
  await question('');
}



// Loop principal do CLI
async function main() {
  console.log(`${colors.fgYellow}Aguardando inicialização...${colors.reset}`);
  
  // Loop de menu infinito
  while (true) {
    try {
      if (!token) {
        await menuDeslogado();
      } else {
        await menuLogado();
      }
    } catch (err: any) {
      console.log(`Erro no loop do menu: ${err.message}`);
      await question('Pressione Enter...');
    }
  }
}

// Inicia aplicação
main().catch((err) => {
  console.error('Erro fatal no CLI:', err);
  process.exit(1);
});
