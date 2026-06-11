# 1.1 Escopo do Produto e Inspiração

O OnBus é um sistema integrado de bilhetagem eletrônica para o transporte coletivo urbano, inspirado no ecossistema de transporte de Pelotas/RS. O sistema foi projetado para atender de forma centralizada a três perfis de passageiros: usuários comuns (trabalhadores), estudantes e idosos.

O objetivo do projeto é solucionar as falhas de latência na compensação de créditos e a dependência de conectividade contínua em campo. Para isso, o OnBus adota uma arquitetura híbrida dividida em duas grandes fases de entrega: um Mínimo Produto Viável (MVP) focado em bilhetagem e operação offline, e uma Versão Completa (Pós-MVP) voltada para monitoramento avançado.

> [!IMPORTANT]
> **Premissa Arquitetural:** Toda a inteligência, validações de segurança, regras de negócio e processamento de dados são executados de forma centralizada no backend. O frontend não possui lógica de processos de negócio ativa, servindo unicamente para renderizar a interface visual e capturar as interações do usuário.

# 1.2 Objetivos Estratégicos do Sistema

## Transparência e Sincronização
Disponibilização do saldo e do histórico de utilização no painel digital do usuário imediatamente após o processamento pelo servidor ou assim que os dados offline dos validadores forem sincronizados com a nuvem.

## Eficiência Financeira
Liberação rápida de créditos adquiridos via canais digitais através do uso de webhooks integrados, reduzindo drasticamente os prazos tradicionais de compensação bancária de recargas.

## Segurança e Conformidade
Proteção contra a clonagem de cartões de transporte, uso de criptografia de dados em repouso e em trânsito, e total alinhamento arquitetural com os direitos de privacidade estabelecidos pela Lei Geral de Proteção de Dados (LGPD).

## Usabilidade Orientada ao Usuário
Interfaces limpas e intuitivas, projetadas para garantir facilidade de navegação e acessibilidade para múltiplos perfis de usuários, validando dores reais de campo por meio de pesquisa empírica.

## Customização e Identidade Visual
Arquitetura de interface adaptável que permite a personalização visual dos cartões de transporte (físicos ou virtuais) de acordo com o perfil do usuário ou campanhas institucionais específicas.

# 1.3 Plano de Validação de Mercado e Personas

Para fundamentar o desenvolvimento e garantir o encaixe de mercado (market fit) do OnBus no município de Pelotas/RS, estruturou-se um plano de pesquisa quantitativa e qualitativa voltado à validação de três perfis centrais de usuários.

## 1. Segmentação do Público-Alvo

### Trabalhador (Usuário Comum)
Cidadãos de 25 a 39 anos que se deslocam diariamente em horários de pico. Necessitam de previsibilidade, agilidade e consulta instantânea de saldos para mitigar o risco de atrasos profissionais decorrentes de falhas no sistema de bilhetagem atual.

### Estudante
Jovens com alta fluência digital matriculados em instituições de ensino técnico e superior da região (com forte relevância para a UFPel e o IFSul). Demandam conveniência 100% digital, integração de benefícios estudantes e desmaterialização do cartão físico em favor do smartphone.

### Idoso
Passageiros com idade igual ou superior a 60 anos que dependem do transporte para manutenção de sua autonomia. Exigem interfaces simplificadas com alto contraste, clareza visual extrema, proteção contra fraudes e canais acessíveis de suporte humano.

## 2. Fundamentação Estatística e Contexto Local

### Acesso a Smartphones (IBGE 2024)
Dados apontam que 88,9% dos brasileiros com 10 anos ou mais possuem celular. O índice chega a 96,5% na faixa de 25 a 39 anos e demonstra expansão entre a população idosa (60+), saltando de 66,6% em 2019 para 78,1% em 2024.

### Barreira Digital (FEBRABAN 2022)
Embora conectados, apenas 56% dos brasileiros acreditam que os idosos confiam plenamente no ambiente digital, o que justifica a investigação sobre fricção de usabilidade e segurança contra fraudes neste grupo.

### Adoção Tecnológica Local
O aplicativo CittaMobi possui uma base ativa de aproximadamente 19.000 usuários mensais em Pelotas, comprovando a maturidade e a prontidão da população local para o consumo de soluções digitais de mobilidade.

## 3. Hipóteses Iniciais e Evidências do Cenário Vigente (PraTi / Prai Pelotas)

### Hipótese do Trabalhador
Exige visualização do saldo em tempo real e recargas instantâneas via Pix para evitar o risco de retenção na catraca.

**Evidência:** Reclamações frequentes nos reviews do app PraTi sobre créditos que demoram a cair e falta de consulta online.

### Hipótese do Estudante
Apresenta prontidão para abandonar por completo o cartão físico em favor de uma carteira virtual baseada em QR Code ou NFC.

**Evidência:** Padrão de conectividade jovem de 96,5% e uso massivo de carteiras digitais de pagamento.

### Hipótese do Idoso
Demonstra preferência por cartões físicos e processos tradicionais, exigindo suporte assistido por receio de instabilidades.

**Evidência:** Índice de 44% de desconfiança ou resistência digital ativa na terceira idade.

## 4. Metodologia de Coleta e Instrumentos de Pesquisa

### Abordagem Quantitativa (Escala Likert 1 a 5)
Aplicação de questionário com afirmativas focadas em mensurar a dificuldade de acesso ao saldo, a prontidão de adoção do Pix instantâneo, a aceitação do QR Code, o medo de fraudes e a intenção de migração imediata para a plataforma OnBus.

### Abordagem Qualitativa (Roteiro de Entrevistas Semiestruturadas)
Condução de entrevistas dinâmicas com 15 perguntas orientadas por perfil.

O foco reside em:

- Confiabilidade e Impacto Profissional (Trabalhador)
- Ecossistema Digital e Conveniência (Estudante)
- Acessibilidade, Confiança e Suporte (Idoso)

### Ranqueamento Hierárquico de Dores Críticas
Submissão dos participantes ao mapeamento e priorização das 10 principais dores do sistema atual, prevendo-se como dor máxima a opacidade de saldo e a lentidão na compensação do Pix.

## 5. Canais de Recrutamento e Amostragem Operacional

### Segmento Trabalhador
- Abordagem via sindicatos laborais
- Associações comerciais
- Departamentos de RH de empresas locais
- Grupos de bairros
- Coleta presencial em terminais urbanos nos horários de pico

**Meta:** 20 a 30 entrevistas  
**Custo:** Baixo (orgânico)

### Segmento Estudante
- Recrutamento nos campi da UFPel e IFSul
- Diretórios Acadêmicos (DAs)
- Centros estudantis
- Murais digitais
- Comunidades universitárias em canais de comunicação digital

**Meta:** 20 a 30 entrevistas  
**Custo:** Zero

### Segmento Idoso
- Associações de aposentados
- Grupos de terceira idade
- Centros de convivência comunitária
- Unidades Básicas de Saúde (UBS)
- Pátios de igrejas

**Meta:** 15 a 20 entrevistas  
**Custo:** Baixo (deslocamento)

## 6. Mapeamento Competitivo e Diferenciais do OnBus

### Aplicativos de Navegação (CittaMobi, Google Maps, Moovit)
O CittaMobi lidera localmente com atualizações de frota a cada 10 segundos. O OnBus não compete na roteirização pura, mas sim na integração direta da inteligência de horários à bilhetagem digital, preenchendo uma lacuna de mercado.

### Fintechs e Carteiras Digitais (PicPay, RecargaPay, Mercado Pago)
Oferecem recargas para o sistema PraTi de Pelotas, mas com prazos de compensação longos de até 24 horas para validação física na catraca. O OnBus resolve esta fricção com imediatismo absoluto via webhooks e banco local.

### Transporte Alternativo Informal
A pesquisa quantificará a frequência com que falhas na bilhetagem empurram o trabalhador para vans informais ou mototáxis clandestinos, evidenciando o valor social do OnBus em reter o passageiro no sistema oficial.

## 7. Síntese Analítica e Impacto no MVP

Os resultados coletados serão estruturados em uma Matriz Esforço vs. Valor para calibrar o Backend (Enrique e Lucas) e o Frontend (Otávio e Júlia).

O MVP priorizará estritamente os recursos de exibição de saldo e compensação imediata via Pix.

Recursos avançados de gamificação e cashbacks serão direcionados para a Fase 2 (Pós-MVP).

O suporte ao usuário adotará um modelo de atendimento híbrido (FAQs claras combinadas com chat direto) para contornar a barreira de 56% de hesitação digital identificada no público idoso.

# 1.4 Matriz de Requisitos do Sistema

## Requisitos Funcionais (RF)

| Código | Requisito |
|----------|----------|
| RF01 | Criação de perfis distintos para usuários comuns, idosos e estudantes através de CPF, e-mail e senha. |
| RF02 | Login seguro via aplicativo ou portal web com gerenciamento de sessão por token. |
| RF03 | Atualização de dados pessoais (nome, endereço, telefone) no sistema pelo próprio usuário. |
| RF04 | Opção de solicitar a exclusão definitiva da conta e a eliminação dos dados pessoais do banco de dados (Direito ao Esquecimento). |
| RF05 | Solicitação de cartões físicos e digitais (Comum, Estudante, Idoso) com validação de regras de negócio específicas para cada categoria. |
| RF05.1 | O sistema deve carregar um layout visual diferente para cada tipo de cartão (estudante, idoso e comum), suportando futuros pacotes de personalização ou temas customizados do banco de ideias. |
| RF06 | Limitação de cartão único ativo. Um usuário só pode possuir no máximo um cartão ativo simultaneamente. Para solicitar um novo, deve obrigatoriamente bloquear o cartão atual. |
| RF07 | Exibição da grade horária das linhas de ônibus segmentadas por dias úteis, sábados e domingos. |
| RF08 | Cálculo do tempo estimado de chegada do ônibus na parada através de rastreamento por geolocalização. |
| RF09 | Plotagem de rotas, trajetos e pontos de parada em um mapa digital integrado. |
| RF10 | Compra de créditos via Pix e cartão de crédito/débito, suportando notificações de status e histórico financeiro. |
| RF11 | Apresentação do saldo disponível na tela inicial do usuário através do aplicativo ou portal web. |
| RF12 | Bloqueio instantâneo do cartão em caso de perda ou roubo, permitindo a posterior transferência do saldo para a nova via. |
| RF13 | Geração de relatórios detalhados de transações financeiras (recargas) e de utilização de transporte (linhas e integrações). |
| RF14 | Liberação física da catraca/validador por meio da aproximação do cartão físico ou leitura de QR Code na tela do smartphone. |

## Requisitos Não Funcionais (RNF)

| Código | Requisito |
|----------|----------|
| RNF01 | O ecossistema deve operar em alta disponibilidade (24/7), garantindo o funcionamento do validador da catraca mesmo em cenários de queda total de conectividade com a internet. |
| RNF02 | Comunicação integral sob protocolo HTTPS/TLS. Criptografia de dados sensíveis e tokenização de dados financeiros de cartão de crédito. |
| RNF03 | O tempo de resposta na comunicação entre o cartão/QR Code e o validador para autorização de embarque deve ser menor que 1 segundo (<1s). |
| RNF04 | Infraestrutura em nuvem elástica para suportar picos de acessos simultâneos nos horários de maior movimento do transporte urbano. |
| RNF05 | O saldo do usuário deve ser atualizado na base central após a confirmação do gateway de pagamento ou após a sincronização dos dados de bilhetagem coletados offline pelos validadores dos veículos. |
| RNF06 | A interface deve seguir padrões de design responsivo, garantindo contraste de cor adequado e elementos confortáveis para alvos de toque em dispositivos móveis (dimensão mínima de 40px). |