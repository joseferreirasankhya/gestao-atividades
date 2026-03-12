Olá! Ótima pergunta sobre qualidade e automação. É um sinal de maturidade no processo de desenvolvimento querer garantir a robustez das entregas.

Atualmente, a plataforma Analytics Studio não possui uma funcionalidade nativa e integrada para a criação e execução de testes automatizados (como testes de unidade, integração ou ponta-a-ponta) diretamente em seu ambiente. A validação de telas construídas com componentes nativos geralmente ocorre de forma manual e visual.

No entanto, entendendo que você já utiliza um fluxo de desenvolvimento com GitHub para suas telas HTML, existem excelentes práticas que você pode adotar para automatizar os testes do seu código antes de enviá-lo para a plataforma. A estratégia se divide em duas frentes:

1. Para Telas e Componentes HTML (Seu cenário atual)
Este é o cenário ideal para automação. Como o código-fonte (HTML, CSS, JavaScript) está no seu controle e versionado no GitHub, você pode e deve implementar um fluxo de testes usando ferramentas padrão do mercado de desenvolvimento web.

Como fazer:

Ambiente de Teste Local: No seu repositório, crie um ambiente de teste simples. Você pode usar ferramentas como o Jest (para testes de unidade da lógica JavaScript) e o Cypress ou Playwright (para testes de ponta-a-ponta que simulam a interação do usuário).
Simulação (Mocking) do Ambiente Mitra: O ponto-chave é simular o ambiente do Analytics Studio. No seu setup de teste, você precisará criar “mocks” (versões falsas) das funções e variáveis globais que a plataforma injeta, como:
componentData: Crie um objeto JavaScript que simula a estrutura do componentData que seu componente espera receber, com queries e variáveis de exemplo.
queryMitra(), setVariableMitra(), dbactionMitra(): Crie implementações falsas dessas funções que retornam dados de exemplo ou simplesmente registram que foram chamadas, permitindo que você verifique se o seu código as está acionando corretamente.
Execução na Pipeline de CI/CD: Integre a execução desses testes à sua pipeline no GitHub Actions. Dessa forma, a cada push ou pull request, os testes rodam automaticamente, garantindo que nenhuma nova alteração quebre o comportamento esperado do seu componente.
Vantagem: Com essa abordagem, você testa a lógica, a renderização e as interações do seu componente HTML de forma isolada e automatizada, garantindo uma qualidade muito maior antes mesmo de o código chegar ao Analytics Studio.

2. Para Telas com Componentes Nativos
Para telas que usam componentes nativos da plataforma (como GENERAL_LIST, BARCHART_NEW, etc.), a lógica principal reside nas queries SQL e nas configurações JSON.

Teste das Queries: A melhor prática é testar suas queries SQL separadamente. Conecte-se a um banco de dados de desenvolvimento/homologação com um cliente SQL de sua preferência e valide se as consultas retornam os dados esperados, tratam casos extremos (como valores nulos ou vazios) e possuem boa performance.
Validação da Configuração: A configuração dos componentes (o JSON dentro da propriedade variables) é validada de forma funcional e visual diretamente na plataforma, garantindo que o layout, as interações e a exibição dos dados estejam corretos.
Resumo da Estratégia
Em resumo, embora a plataforma não tenha um framework de testes integrado, a melhor prática é:

Testar o CÓDIGO (HTML/JS): De forma automatizada e rigorosa no seu repositório (GitHub), usando ferramentas como Jest e Cypress/Playwright e simulando o ambiente Mitra.
Validar as CONFIGURAÇÕES (SQL/JSON): Testando as queries em um ambiente de banco de dados e validando o comportamento dos componentes nativos diretamente na interface do Analytics Studio.
Adotar esse fluxo híbrido vai elevar muito a qualidade e a confiabilidade das suas entregas