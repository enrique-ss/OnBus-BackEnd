# 2.1 Matriz de Responsabilidades da Equipe

A distribuição das atribuições técnicas foi estruturada conforme a especialidade de cada integrante, garantindo clareza e equilíbrio na carga de trabalho.

## Júlia (UX/UI Design)

Responsável pelo levantamento de requisitos visuais, criação de protótipos de alta fidelidade, wireframes, mapeamento dos fluxos de navegação e definição da identidade visual.

Estrutura o Design System e especifica componentes focados em acessibilidade (WCAG).

**Ferramenta:** Canva.

## Otávio (Frontend - Interface)

Traduz protótipos em código funcional.

Atua na codificação de telas responsivas, construção de formulários e manipulação dinâmica do DOM com JavaScript Vanilla, além de estruturar o CSS para temas dinâmicos dos cartões.

## Enrique (Backend - Arquitetura e Dados)

Engenharia de dados, segurança e regras de negócio.

Constrói APIs REST em TypeScript, modela classes (POO), integra webhooks de pagamento, gerencia criptografia e estrutura bancos online (Supabase) e local (MySQL via Knex.js).

## Lucas (Backend, Integração e QA)

Apoio ao desenvolvimento em TypeScript e liderança de QA.

Escreve testes unitários, simula cenários de estresse para a catraca local e auxilia na integração do Frontend com a API.

Administrador do repositório no GitHub.

# 2.2 Dinâmica de Integração e Versionamento

## Independência de Desenvolvimento

As frentes de engenharia de dados e interface operam de forma desacoplada via contrato de API REST, garantindo que o desenvolvimento visual não impacte a estabilidade dos serviços no servidor.

## Estratégia de Ramificação (Git Flow)

Fluxo controlado por feature branches isoladas.

Recursos novos passam por homologação do QA antes de serem integrados à branch principal (`main`), evitando quebras em produção.

## Deploy Contínuo (CI/CD)

Integração direta entre o GitHub e a plataforma Render.

O ambiente de produção realiza testes de build e atualizações automáticas de infraestrutura a cada novo incremento de código.

# 2.3 Planejamento de Ciclo de Vida do Produto

O OnBus adota uma abordagem incremental e evolutiva.

O ecossistema é estruturado em blocos de entrega para blindar o núcleo de missão crítica (bilhetagem, criptografia e validação offline na catraca) antes da introdução de camadas periféricas.

Esta segregação impede que falhas em serviços secundários (como geolocalização ou chatbot) interrompam a operação de embarque, garantindo resiliência.

# 2.4 Linha do Tempo e Matriz Unificada de Escopo

## Fase 1: Mínimo Produto Viável (MVP) – Núcleo de Operação e Bilhetagem

**Foco:** Velocidade menor que 1 segundo, segurança de dados e persistência distribuída.

### Autenticação e Cadastro (RF01, RF02, RF03)

- Infraestrutura em TypeScript/Express.js
- Criptografia Bcryptjs
- Tokens JWT

### Consulta de Saldo e Recarga Online (RF10, RF11)

- Persistência no Supabase
- Validações de concorrência
- Integração via webhooks

### Validação de Embarque e Débito (RF14)

- MySQL local no validador da catraca
- Operação offline utilizando Knex.js

### Bloqueio e Segunda Via (RF12)

- Consumo imediato de API
- Alteração de status via servidor Render

### Direito ao Esquecimento (RF04)

- Rotinas de hard delete em conformidade com a LGPD

### Itinerários Estáticos (RF07)

- Leitura de tabelas JSON de Pelotas/RS

### Identidade Visual Inicial (RF05.1)

- Arquitetura de temas dinâmicos via CSS e JavaScript

## Fase 2: Pós-MVP Avançado – Telemetria e Inteligência

**Foco:** Processamento orientado a eventos em tempo real.

### Rastreamento e GPS (RF08)

- WebSockets para transmissão de coordenadas via pacotes UDP

### Mapeamento Interativo (RF09)

- Renderização 3D com Three.js

### Gamificação e Cashback

- Motor de regras acionado via webhooks no Supabase

### Suporte Inteligente

- Chatbot assíncrono via API de linguagem natural

### Acessibilidade Universal

- Adaptação semântica do DOM para leitores de tela
- Controle por voz

### Despacho Analítico

- Painel para cruzamento de dados de operação e metas de satisfação

# 2.5 Funil e Governança do Banco de Ideias

Para suportar inovações sem instabilidade, novas funcionalidades seguem um fluxo estrito.

## Ideação

- Registro no quadro do Trello

## Análise de Acoplamento

- Backend avalia a necessidade de novos campos
- Criação de migrations isoladas no Knex.js

## Abstração de Componentes

- Frontend isola a nova feature em componentes independentes
- Aplicação dos conceitos de alta coesão e baixo acoplamento

# 2.6 Análise de Viabilidade Técnica e Estratégia de Transição

## GPS em Tempo Real

Abandono de requisições HTTP (*polling*) em favor de conexões bidirecionais via WebSockets (Socket.io) para evitar sobrecarga no servidor.

## Personalização de Cartões (Skins)

Armazenamento de arquivos pesados em CDN.

O banco guarda apenas a URL (*string*) no atributo `customThemeUrl`.

## Integração Operacional de Frotas

Criação de microsserviço isolado em TypeScript para calcular variações de tempo (real versus estático), evitando onerar a API de bilhetagem.

## Sistema de Cashback

Processamento das regras blindado dentro de transações ACID isoladas no PostgreSQL (Supabase), disparadas apenas após confirmação do webhook de pagamento.