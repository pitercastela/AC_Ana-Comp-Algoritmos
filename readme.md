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
| Rodrigo de Sousa Ferrett         | 202402103253          |
| Pedro dos Santos Carlos da Silva | 202401000493          |
| Sarah Ferrari Rodrigues          | 202307576331          |
| João Pedro Borges Souza Santana  | 202402717707          |

## Acessar a aplicação

### Pelo site publicado

[Abrir SmartNet Analyzer](https://pitercastela.github.io/AC_Ana-Comp-Algoritmos/). A aplicação funciona inteiramente no navegador; não exige conta nem instalação.

### Localmente

1. Baixe ou clone este repositório.
2. Abra o arquivo `index.html` em um navegador atualizado.

Não é necessário instalar dependências ou iniciar um servidor para usar a aplicação. Mantenha `index.html`, `styles.css`, `script.js`, `graph.js`, `graph-io.js` e `algorithms.js` na mesma pasta.

## Como usar

1. **Prepare a montagem.** Na aba **Montar grafos**, escolha conexões direcionadas ou não direcionadas, com ou sem peso. Escolha **Criar do zero** ou **Usar um modelo**. A lista mostra apenas exemplos e grafos salvos compatíveis com o tipo escolhido. Clique em **Começar montagem** para abrir o editor. Para trocar de base depois, use **Escolher outro grafo**; **Voltar ao grafo em edição** preserva o trabalho atual.
2. **Edite e salve.** Os botões **Vértices** e **Arestas** alternam os modos do mapa. Em **Vértices**, clique em uma área vazia para incluir um vértice ou em um vértice existente para renomeá-lo. A janela permite salvar ou cancelar. Em **Arestas**, defina o peso quando necessário e clique em dois vértices para conectá-los; em grafos direcionados, clique primeiro na origem. Clique novamente no primeiro vértice ou em **Cancelar seleção** para desistir. Nesse modo, clique no número de uma aresta para mudar seu peso. As listas de vértices e arestas aparecem à direita, cada uma com sua própria rolagem. Informe um nome no mesmo cartão e clique em **Salvar grafo**. Se o nome já existir, aparecerá uma confirmação antes de substituir a versão salva. O navegador preserva automaticamente um rascunho recuperável ao recarregar a página; ele só fica disponível na aba Algoritmos depois de salvar.
3. **Escolha o grafo da execução.** Vá para a aba principal **Algoritmos** e selecione um grafo de teste ou um grafo salvo em **Grafo da análise**. A seleção carrega uma cópia independente do grafo que está aberto para edição na outra aba. Use **Carregar** para atualizar essa cópia após salvar novas alterações com o mesmo nome.
4. **Execute uma análise.** Escolha o vértice de origem para DFS, BFS ou Dijkstra e clique no algoritmo desejado. Kruskal não precisa de origem e está disponível apenas para grafos não direcionados.
5. **Leia o resultado.** A seção **Resultados**, abaixo do mapa e dos controles, mostra os dados em texto ou tabela. Use **Ver resultado** para chegar até ela. O mapa muda para a aba **Execução**, onde é possível pausar, avançar, voltar ou reiniciar a animação. A aba **Grafo** mostra o mapa sem destaques.
6. **Troque de grafo.** Na aba **Algoritmos**, selecione outro grafo; isso reinicia o resultado e a animação. Editar o grafo na aba **Montar grafos** não altera a análise já selecionada.
7. **Encerre.** Clique em **Finalizar aplicação** no cabeçalho. A tela de encerramento oferece **Iniciar nova sessão**.

Os grafos salvos e o rascunho ficam no armazenamento local do navegador quando esse recurso está disponível. Eles não são enviados ao GitHub nem compartilhados automaticamente entre computadores. **Finalizar aplicação** encerra o rascunho atual. Para compartilhar um grafo, use **Exportar TXT** na aba de montagem e envie o arquivo gerado.

## Formas de entrada

### Cadastro manual

Depois de **Começar montagem**, use **Vértices** para adicionar ou renomear pelo mapa e **Arestas** para conectar dois vértices. Renomear preserva as conexões. Nomes de vértices devem ser únicos. A interface não aceita laços (uma aresta de um vértice para ele mesmo) nem arestas duplicadas. Em grafos com peso, informe um número maior ou igual a zero. Em grafos sem peso, cada aresta tem custo 1 internamente.

### Grafos de teste

Na aba **Algoritmos**, escolha um exemplo diretamente em **Selecionar grafo**. Para usá-lo como ponto de partida de uma edição, escolha **Usar um modelo** na preparação da aba **Montar grafos** e clique em **Começar montagem**:

| Teste              | Finalidade                                                |
| ------------------ | --------------------------------------------------------- |
| Grafo da proposta  | Conferir os quatro algoritmos com o exemplo da avaliação. |
| Empates de rota    | Conferir o desempate por ordem alfabética.                |
| Cidade direcionada | Conferir sentido das arestas e vértices inalcançáveis.    |
| DFS direcionado · todos os tipos | Partindo de A, mostra árvore, retorno, ida e cruzamento. |
| DFS direcionado · retorno | Partindo de A, mostra um ciclo e sua aresta de retorno. |
| DFS direcionado · ida e cruzamento | Partindo de A, mostra uma ligação a descendente e outra entre ramos. |
| Bairros isolados   | Conferir grafo sem peso e componentes desconectados.      |

Na aba **Algoritmos**, escolher outro teste atualiza apenas a análise selecionada. Na montagem, iniciar uma nova base pede confirmação quando há alterações não salvas no grafo em edição.

### Importação de texto

Na preparação da montagem, clique em **Importar TXT** no canto superior direito para colar texto ou selecionar um arquivo `.txt`. Não é necessário escolher direção, pesos ou modelo antes: o site lê essas informações do próprio arquivo e abre o editor. O formato é:

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

Na aba **Montar grafos**, clique em **Exportar TXT** para visualizar o texto do grafo que está aberto para edição, incluindo alterações ainda não salvas. Na janela, use **Copiar texto** para enviá-lo à área de transferência ou **Baixar TXT** para salvar o arquivo. O botão de exportação fica disponível quando há pelo menos um vértice. O arquivo usa o formato acima e pode ser importado de volta pelo botão **Importar TXT**. O nome do arquivo deriva do campo **Nome do grafo** ou, se estiver vazio, será `grafo-smartnet.txt`.

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
| DFS       | Percorre primeiro a origem escolhida; quando uma árvore termina, continua pelo próximo vértice não visitado em ordem alfabética até cobrir todo o grafo. O resultado pode ser uma floresta, com cada árvore identificada no diagrama. Os vértices circulares mostram pré e pós-visita; as arestas da árvore são contínuas, enquanto retorno, ida e cruzamento aparecem como setas pontilhadas e coloridas. Os filtros mostram apenas os tipos desejados. |
| BFS       | Ordem de visita, nível de cada vértice e caminho com o menor número de arestas. A BFS não considera pesos.              |
| Dijkstra  | Tabela iniciada na iteração 0, mostrando em cada linha o vértice selecionado e as melhores distâncias e rotas conhecidas; tabela final de distâncias e caminhos. Vértices inalcançáveis aparecem com distância infinita. |
| Kruskal   | Arestas selecionadas, custo total e um mapa final apenas com as arestas mantidas. Se o grafo estiver desconectado, mostra uma floresta geradora e seus componentes, incluindo vértices isolados. |

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
