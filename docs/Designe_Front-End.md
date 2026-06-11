# 3.1 Mapeamento Estruturado de Interfaces

O desenvolvimento do Frontend do ecossistema OnBus está dimensionado para cobrir todas as jornadas de usuário, fluxos administrativos, operações de campo e estados de contingência.

As interfaces seguem o conceito **Mobile-First** para o passageiro e layouts responsivos para os portais administrativos e operacionais.

# 3.2 Detalhamento do Escopo de Telas por Área

## 1. Área do Passageiro (Usuário Final)

**Previsão:** 20–28 telas.

### Autenticação

- Home
- Login
- Cadastro
- Recuperar Senha
- Verificação (Token)
- Termos e LGPD

### Dashboard / Perfil

- Home do usuário
- Perfil
- Edição de perfil
- Upload de documentos
- Configurações

### Gestão de Cartões (RF05, RF05.1, RF06, RF12)

- Meus Cartões
- Solicitar via
- Vincular cartão
- Bloquear cartão
- Histórico de cartões

### Módulo Financeiro (RF10)

- Recarga
- Escolha de pagamento
- Confirmação de pagamento
- Extrato financeiro
- Cashback
- Comprovante

### Transporte (RF07)

- Horários
- Rotas
- Mapa de paradas
- Ônibus próximos
- GPS em tempo real
- Favoritos

### Embarque (RF11, RF14)

- Consulta de saldo
- Histórico de viagens
- QR Code dinâmico
- Bilhete Único / Integração

### Suporte

- FAQ
- Abrir chamado
- Histórico de chamados
- Chat / WhatsApp

## 2. Área Administrativa Geral

**Previsão:** 12–18 telas.

### Dashboard

- Painel geral
- Estatísticas operacionais
- Relatórios financeiros
- Logs do sistema

### Usuários e Cartões

- Gestão de perfis
- Aprovação de documentos
- Gestão de lotes
- Bloqueios
- Reemissões

### Gestão Operacional

- Linhas
- Rotas
- Paradas
- Horários
- Tarifas
- Monitoramento GPS
- Despacho

### Pessoas e Ativos

- Cadastro de motoristas
- Gestão de frota
- Controle de placas
- Controle de manutenção

### Atendimento

- Gestão de chamados
- Central de suporte
- Protocolos de atendimento

## 3. Área Operacional (Motorista/Cobrador)

**Previsão:** 3–5 telas.

### Login e Painel

- Entrada por prefixo
- Visualização de horário
- Controle de atraso
- Consulta manual de cartão

### Ocorrências e Jornada

- Registro de acidentes
- Registro de desvios
- Controle de turno
- Encerramento de jornada

## 4. Segurança e Estados Extras

**Previsão:** 6–10 telas.

### Segurança

- Sessões ativas
- Autenticação em dois fatores (2FA)
- Permissões e cargos
- Auditoria de ações

### Feedback Visual

- Erro 404
- Modo offline
- Tela de manutenção
- Skeletons de carregamento
- Feedback de sucesso
- Feedback de erro

# 3.3 Diretrizes de Implementação para Design

Para garantir que o design no Canva suporte a flexibilidade descrita nas regras de produto, os protótipos devem obedecer às seguintes diretrizes.

## Arquitetura Modular

O Design System deve ser estritamente modular, com componentes de cartões isolados para permitir alterações globais sem impacto nos demais elementos da interface.

## Estética da Categoria (RF05.1)

### Comum

- Visual minimalista
- Foco em acessibilidade
- Interface limpa e objetiva

### Estudante

- Destaque para identificação visual
- Exibição de foto
- Ênfase na instituição vinculada

### Idoso

- Alto contraste (RNF06)
- Tipografia ampliada
- Botões maiores
- Elementos visuais simplificados

## Mapeamento de Estados

Cada componente deve prever os seguintes estados:

- Default
- Hover
- Focus
- Erro
- Loading

# 3.4 Arquitetura de Desenvolvimento Frontend

Para conectar as interfaces à camada de engenharia, a implementação deve seguir os seguintes princípios.

## Manipulação Assíncrona

Renderização de listas e dados utilizando:

- `async/await`
- API nativa `fetch()`

## Injeção Dinâmica de Temas

O Frontend não deve possuir temas estáticos.

A lógica da aplicação deve consumir o atributo `layoutBaseId` fornecido pela API e aplicar dinamicamente a classe CSS correspondente.

### Exemplos

- `.tema-comum`
- `.tema-estudante`
- `.tema-idoso`

Dessa forma, o controle visual permanece centralizado na camada de configuração.

## Responsividade Mobile-First

A interface deve utilizar:

- `rem`
- `em`
- `%`
- Flexbox
- CSS Grid

Os elementos clicáveis devem respeitar a área mínima de **40px**, conforme definido pelo RNF06, garantindo boa usabilidade em dispositivos móveis.