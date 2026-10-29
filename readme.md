# SmartNet Analyzer

Aplicação Web para cadastrar uma cidade como grafo, visualizar sua lista de adjacência e executar **DFS**, **BFS**, **Dijkstra** e **Kruskal**. Os resultados aparecem em texto e tabela, acompanhados de uma animação no mapa.

## Identificação do grupo

- **Curso:** Engenharia de Software
- **Disciplina:** Análise e Complexidade de Algoritmos (IBM3121)
- **Professor:** Cassius Figueiredo
- **Período da avaliação:** 2026.2

| Integrante                       | Matrícula             |
| -------------------------------- | --------------------- |
| Lucas Alves Castela Pereira      | 202402705989          |
| Rodrigo de Sousa Ferrett         | Matrícula — preencher |
| Pedro dos Santos Carlos da Silva | Matrícula — preencher |
| Sarah Ferrari Rodrigues          | Matrícula — preencher |
| João Pedro Borges Souza Santana  | Matrícula — preencher |

## Acessar a aplicação

### Pelo site publicado

O endereço do GitHub Pages será incluído aqui após a publicação. A aplicação funciona inteiramente no navegador; não exige conta nem instalação.

### Localmente

1. Baixe ou clone este repositório.
2. Abra o arquivo `index.html` em um navegador atualizado.

Não é necessário instalar dependências ou iniciar um servidor para usar a aplicação. Mantenha `index.html`, `styles.css`, `script.js`, `graph.js`, `graph-io.js` e `algorithms.js` na mesma pasta.

## Como usar

1. **Monte um grafo.** Na aba principal **Montar grafos**, escolha no topo um grafo vazio, um exemplo ou um grafo salvo como base para edição e clique em **Carregar**. Configure conexões direcionadas ou não direcionadas, com ou sem peso. Adicione os vértices na lateral. Para criar uma aresta, defina seu peso quando necessário e clique em dois vértices no mapa. Em grafos direcionados, clique primeiro na origem e depois no destino. Clique novamente no primeiro vértice ou em **Cancelar seleção** para desistir. Para mudar o peso de uma aresta existente, clique no número exibido sobre ela e salve o novo valor. O mapa e a lista de adjacência são atualizados imediatamente. Para mudar o tipo depois de iniciar o cadastro, use **Limpar grafo**.
2. **Salve o grafo.** Dê um nome em **Salvar para análise** e clique em **Salvar**. Um nome já utilizado substitui o grafo salvo anteriormente, após confirmação. Para voltar a editar um grafo salvo, selecione-o no topo da página e clique em **Carregar**. Enquanto você edita, o navegador preserva automaticamente um rascunho que é recuperado ao recarregar a página; esse rascunho só fica disponível na aba Algoritmos depois de usar **Salvar**.
3. **Escolha o grafo da execução.** Vá para a aba principal **Algoritmos** e selecione um grafo de teste ou um grafo salvo em **Grafo da análise**. A seleção carrega uma cópia independente do grafo que está aberto para edição na outra aba. Use **Carregar** para atualizar essa cópia após salvar novas alterações com o mesmo nome.
4. **Execute uma análise.** Escolha o vértice de origem para DFS, BFS ou Dijkstra e clique no algoritmo desejado. Kruskal não precisa de origem e está disponível apenas para grafos não direcionados.
5. **Leia o resultado.** A seção **Resultados**, abaixo do mapa e dos controles, mostra os dados em texto ou tabela. Use **Ver resultado** para chegar até ela. O mapa muda para a aba **Execução**, onde é possível pausar, avançar, voltar ou reiniciar a animação. A aba **Grafo** mostra o mapa sem destaques.
6. **Troque de grafo.** Na aba **Algoritmos**, selecione outro grafo; isso reinicia o resultado e a animação. Editar o grafo na aba **Montar grafos** não altera a análise já selecionada.
7. **Encerre.** Clique em **Finalizar aplicação** no cabeçalho. A tela de encerramento oferece **Iniciar nova sessão**.

Os grafos salvos e o rascunho ficam no armazenamento local do navegador quando esse recurso está disponível. Eles não são enviados ao GitHub nem compartilhados automaticamente entre computadores. **Finalizar aplicação** encerra o rascunho atual. Para compartilhar um grafo, use **Exportar TXT** na aba de montagem e envie o arquivo gerado.

## Formas de entrada

### Cadastro manual

Use **Editar grafo**, na aba **Montar grafos**, para cadastrar vértices e arestas. Nomes de vértices devem ser únicos. A interface não aceita laços (uma aresta de um vértice para ele mesmo) nem arestas duplicadas. Em grafos com peso, informe um número maior ou igual a zero. Em grafos sem peso, cada aresta tem custo 1 internamente.

### Grafos de teste

Na aba **Algoritmos**, escolha um exemplo diretamente em **Selecionar grafo**. Para usá-lo como ponto de partida de uma edição, escolha o exemplo em **Grafo de base para edição** no topo da aba **Montar grafos** e clique em **Carregar**:

| Teste              | Finalidade                                                |
| ------------------ | --------------------------------------------------------- |
| Grafo da proposta  | Conferir os quatro algoritmos com o exemplo da avaliação. |
| Empates de rota    | Conferir o desempate por ordem alfabética.                |
| Cidade direcionada | Conferir sentido das arestas e vértices inalcançáveis.    |
| DFS direcionado · todos os tipos | Partindo de A, mostra árvore, retorno, ida e cruzamento. |
| DFS direcionado · retorno | Partindo de A, mostra um ciclo e sua aresta de retorno. |
| DFS direcionado · ida e cruzamento | Partindo de A, mostra uma ligação a descendente e outra entre ramos. |
| Bairros isolados   | Conferir grafo sem peso e componentes desconectados.      |

Carregar um teste substitui o grafo atual após confirmação.

### Importação de texto

Clique em **Importar grafo** para colar texto ou selecionar um arquivo `.txt`. O formato é:

```text
# smartnet: undirected weighted
vertices: O,A,B,C
O,A,2
O,B,5
A,C,4
```

- Na primeira linha, use `directed` ou `undirected`, seguido de `weighted` ou `unweighted`.
- Na segunda linha, liste **todos** os vértices separados por vírgula, inclusive os isolados.
- Em um grafo com peso, cada linha seguinte tem `origem,destino,peso`.
- Em um grafo sem peso, cada linha seguinte tem apenas `origem,destino`.
- Linhas de comentário iniciadas por `#` são aceitas depois da linha de vértices.
- O arquivo é validado por completo antes de substituir o grafo atual; erros aparecem com o número da linha.
- Nomes que contenham vírgulas ou aspas devem ficar entre aspas duplas; uma aspa dentro do nome é escrita duas vezes. A exportação faz isso automaticamente.

### Exportação em TXT

Na aba **Montar grafos**, clique em **Exportar TXT** para baixar o grafo que está aberto para edição, incluindo alterações ainda não salvas. O botão fica disponível quando há pelo menos um vértice. O arquivo usa o formato acima e pode ser importado de volta pelo botão **Importar grafo**. O nome do arquivo deriva do campo **Nome deste grafo** ou, se estiver vazio, será `grafo-smartnet.txt`.

Exemplo direcionado sem peso:

```text
# smartnet: directed unweighted
vertices: Centro,Norte,Sul,Isolado
Centro,Norte
Norte,Sul
```

## O que cada algoritmo mostra

| Algoritmo | Resultado                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| DFS       | Ordem de visita, árvore visual, tempos de pré e pós-visita, classificação visual e em tabela das arestas e vértices não alcançados. Os botões de filtro permitem mostrar apenas os tipos desejados no mapa e na tabela. Grafos não direcionados mostram arestas de árvore e de retorno; grafos direcionados também mostram arestas de ida e de cruzamento. |
| BFS       | Ordem de visita, nível de cada vértice e caminho com o menor número de arestas. A BFS não considera pesos.              |
| Dijkstra  | Tabela por iteração com a melhor distância e rota conhecidas para cada vértice; tabela final de distâncias e caminhos. Vértices inalcançáveis aparecem com distância infinita. |
| Kruskal   | Arestas selecionadas e custo total. Se o grafo estiver desconectado, mostra uma floresta geradora e seus componentes.   |

Quando houver empate, a aplicação usa **ordem alfabética** para escolher vizinhos, vértices ou arestas de mesmo custo. O Dijkstra aceita apenas pesos não negativos.

## Estrutura do projeto

| Arquivo         | Função                                                            |
| --------------- | ----------------------------------------------------------------- |
| `index.html`    | Estrutura da interface.                                           |
| `styles.css`    | Layout e estilos responsivos.                                     |
| `script.js`     | Interação da interface, importação, desenho e animação.           |
| `graph.js`      | Lista de adjacência, representação principal do grafo em memória. |
| `graph-io.js`   | Leitura e escrita do formato TXT de importação e exportação.       |
| `algorithms.js` | Implementações de DFS, BFS, Dijkstra e Kruskal.                   |
