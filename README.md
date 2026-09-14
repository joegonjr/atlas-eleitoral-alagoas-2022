# Atlas Eleitoral Alagoas 2022

Painel interativo para explorar os resultados da eleição de **governador de Alagoas em 2022**, separando primeiro e segundo turno, com recortes por município, bairro e seção eleitoral.

**[Acessar o painel](https://joegonjr.github.io/atlas-eleitoral-alagoas-2022/)**

**Autoria:** José Gonçalves Jr. - Cientista de Dados.

Trabalho independente, desenvolvido com finalidade acadêmica e sem fins lucrativos. Não é um produto oficial do Tribunal Superior Eleitoral (TSE) ou do Instituto Brasileiro de Geografia e Estatística (IBGE).

## O que o painel apresenta

- Resultados dos 102 municípios, com 6.626 seções com boletim de urna em cada turno.
- Votos por candidato, votos válidos, brancos, nulos, comparecimento e abstenção.
- Mapa municipal e detalhamento por bairros onde existe malha disponível, com cores pelo candidato mais votado.
- Mosaico de seções agrupadas por bairro e ordenadas por zona e seção. Cada bloco mostra os resultados ao passar o mouse, focar pelo teclado ou tocar na tela.
- Comparação entre os turnos, perfil cadastral por sexo, idade e escolaridade e contexto municipal de cor ou raça.
- Filtros pesquisáveis, compartilhamento do recorte pela URL e exportação da tabela em CSV.

## Metodologia

### Resultados eleitorais e conferência

Os resultados são extraídos dos boletins de urna (BU) de Alagoas, filtrados para o cargo de governador. A identificação das seções considera **turno, município, zona e seção**. O número da seção, isoladamente, não é uma chave única dentro da cidade.

Os votos foram conferidos com a base de votação por seção do TSE: **nenhuma divergência foi encontrada no processamento desta versão**. Os totais e as verificações estão no [relatório de auditoria](dados/auditoria.json), que também registra hashes dos arquivos utilizados.

| Indicador | Cálculo / denominador |
| --- | --- |
| Votos válidos | Soma dos votos nominais para governador |
| Percentual de um candidato | Votos do candidato ÷ votos válidos do recorte |
| Total de votos da seção | Votos nominais + brancos + nulos para governador |
| Percentual de brancos ou nulos | Respectivos votos ÷ total de votos para governador |
| Comparecimento e abstenção | Quantidades do BU, com percentuais sobre seus eleitores aptos |

Os indicadores são recalculados a partir das seções de cada recorte. No mosaico, aparecem os dois primeiros colocados; no primeiro turno, seus percentuais podem não somar 100%, pois houve outros candidatos. Empates recebem identificação própria e cor neutra nos blocos e bairros.

### Municípios, bairros e locais de votação

A base municipal usa a **malha IBGE 2022**, preservando seus vértices. Municípios e bairros compartilham a mesma transformação geográfica. Os bairros não são ampliados artificialmente para preencher toda a área municipal.

As seções são associadas aos locais pelo turno, município, zona e código do local. O bairro cadastrado no local de votação é associado à malha oficial pelo município e pelo nome normalizado. Em Maceió, Benedito Bentes I/II e Clima Bom I/II são consolidados nos bairros oficiais correspondentes; as equivalências e os casos sem vínculo constam na [auditoria dos bairros](dados/auditoria-bairros.json).

**Os resultados representam os votos depositados nos locais de votação do bairro, não os votos de seus moradores.** Não se presume a residência de quem votou a partir do local de votação.

A camada disponível contém 125 bairros em seis municípios:

| Município | Bairros na malha |
| --- | ---: |
| Maceió | 50 |
| Arapiraca | 41 |
| Palmeira dos Índios | 16 |
| Barra de São Miguel | 9 |
| Penedo | 8 |
| Olho d’Água das Flores | 1 |

Nas demais cidades, os filtros e as tabelas usam os bairros cadastrados nos locais, sem desenhar limites estimados. Registros sem associação permanecem no total municipal e podem ser consultados na tabela e no mosaico.

No mapa e no mosaico, vermelho identifica Paulo Dantas e azul identifica Rodrigo Cunha. A intensidade representa a vantagem do primeiro sobre o segundo colocado, dividida pelos votos válidos, em escala comum de 0 a 100 pontos percentuais: disputas próximas ficam claras; vantagens maiores, escuras. No primeiro turno, a comparação usa os dois mais votados de cada recorte. O verde é reservado à identidade visual e aos indicadores gerais do painel. Os municípios ao redor ficam esmaecidos para preservar o foco na cidade selecionada. A cor municipal ao fundo não estima votos para áreas sem bairros. Cinza em um bairro significa ausência de votos vinculados na base, não ausência de população.

### Perfil do eleitorado

Sexo, faixa etária e escolaridade descrevem **eleitores aptos cadastrados**, não apenas quem compareceu. A base cadastral tem data de referência de 26/08/2022. Os perfis de seções agregadas são associados à seção receptora do boletim.

Os totais cadastrais podem diferir dos eleitores aptos informados no BU; seus denominadores são mantidos separados. Quatro seções receptoras por turno não possuem perfil próprio correspondente. Quando existem perfis de seções agregadas, somente estes entram no cálculo. Escolaridade pode estar desatualizada.

Não existe, neste trabalho, associação entre voto individual e sexo, idade, escolaridade ou raça. Comparações entre turnos não demonstram transferência individual de votos.

### Cor ou raça

O contexto de cor ou raça usa o **Censo Demográfico 2022, tabela SIDRA 9605**, para a população residente de todas as idades. É um indicador municipal ou estadual, mesmo quando um bairro ou seção estiver selecionado.

Esse dado não representa o perfil de quem votou. Os campos de raça/cor do perfil eleitoral utilizado estão preenchidos como não existentes (`#NE`). Cor ou raça não equivale a etnia.

## Fontes e referência temporal

| Fonte | Uso no projeto | Referência |
| --- | --- | --- |
| [TSE — Boletins de urna](https://dadosabertos.tse.jus.br/dataset/resultados-2022-boletim-de-urna) | Resultados para governador | 2022; arquivos gerados em 05/10/2022 e 31/10/2022 |
| [TSE — Resultados 2022](https://dadosabertos.tse.jus.br/dataset/resultados-2022) | Conferência da votação por seção | Eleição de 2022 |
| [TSE — Eleitorado 2022](https://dadosabertos.tse.jus.br/dataset/eleitorado-2022) | Perfil cadastral e locais de votação | Perfil: 26/08/2022; arquivo de locais referente a 2022, gerado em 30/09/2024 |
| [IBGE — Malha municipal de Alagoas 2022](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2022/UFs/AL/AL_Municipios_2022.zip) | Limites dos municípios | 2022 |
| [Alagoas em Dados — Bairros de Alagoas](https://dados.al.gov.br/catalogo/dataset/bairros-de-alagoas) | Malha de bairros do Censo IBGE | 2022 |
| [IBGE/SIDRA — Tabela 9605](https://sidra.ibge.gov.br/tabela/9605) | População por cor ou raça | Censo 2022 |

Os endereços específicos dos arquivos utilizados estão no [script de download](scripts/baixar.mjs). Os arquivos brutos não integram a publicação; podem ser obtidos novamente das fontes oficiais.

## Executar localmente

O painel usa HTML, CSS, JavaScript e Apache ECharts. Os dados tratados estão incluídos no repositório; não há servidor de aplicação ou banco de dados remoto.

Com Node.js 22 ou superior:

```sh
npm start
```

Abra `http://127.0.0.1:4173`. Não abra `index.html` diretamente como arquivo, pois o navegador precisa buscar os dados por HTTP.

## Reproduzir o tratamento dos dados

Com Node.js e Python 3.11 ou superior:

```sh
node scripts/baixar.mjs
python -m pip install pyshp
python scripts/processar_malha.py
python scripts/processar.py
python scripts/processar_locais.py
python scripts/processar_bairros.py
```

O download preserva arquivos já existentes. A reprodução depende da disponibilidade das fontes e do conteúdo que elas disponibilizam; revisões na origem podem alterar resultados ou metadados. Consulte os hashes registrados na auditoria para identificar a versão original.

## Publicação e validação

```sh
npm run build
```

O comando prepara `_site/` com uma lista explícita dos arquivos necessários e verifica as referências locais. O GitHub Actions publica essa pasta no GitHub Pages a cada atualização da branch `main`. Capturas de teste, arquivos brutos e dependências locais ficam fora do site.

Os scripts `verificar-bairros.cjs`, `verificar-contexto-mapa.cjs`, `verificar-grid-secoes.cjs` e `verificar-scroll-secoes.cjs` verificam navegação, recortes, percentuais, exportação, interação do mapa, mosaico e rolagem. Usam Playwright e Microsoft Edge; o módulo pode ser indicado por `PLAYWRIGHT_PATH`.

O Apache ECharts é distribuído com sua [licença original](vendor/ECHARTS-LICENSE.txt). As fontes de dados mantêm seus próprios termos de uso. Ao citar o trabalho, informe o autor, o título, o endereço do painel e a data de acesso.
