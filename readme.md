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

Não é necessário instalar dependências ou iniciar um servidor para usar a aplicação. Mantenha `index.html`, `styles.css`, `script.js`, `graph.js` e `algorithms.js` na mesma pasta.

## Como usar

1. **Escolha o tipo de grafo.** Na barra lateral, abra **Configuração** e selecione conexões direcionadas ou não direcionadas, com ou sem peso. Essa escolha deve ser feita antes de adicionar vértices. Para mudar o tipo depois, use **Limpar grafo**.
2. **Monte a rede.** Em **Editar grafo**, adicione cada vértice pelo nome. Depois escolha origem, destino e, se o grafo tiver pesos, o peso de cada aresta. O mapa e a lista de adjacência são atualizados imediatamente.
3. **Confira a estrutura.** A área principal mostra o desenho SVG e, abaixo, a lista de adjacência usada internamente pela aplicação. Em grafos direcionados, as setas indicam o sentido permitido.
4. **Execute uma análise.** Abra **Análises**, escolha o vértice de origem para DFS, BFS ou Dijkstra e clique no algoritmo desejado. Kruskal não precisa de origem e está disponível apenas para grafos não direcionados.
5. **Leia o resultado.** A barra lateral mostra os dados em texto ou tabela. O mapa muda para a aba **Execução**, onde é possível pausar, avançar, voltar ou reiniciar a animação. A aba **Grafo** mostra o mapa sem destaques.
6. **Troque de grafo.** Use **Limpar grafo**, carregue um dos grafos de teste ou importe outro. Ao alterar o grafo, o resultado e a animação anteriores são descartados.
7. **Encerre.** Clique em **Finalizar aplicação** no cabeçalho. A tela de encerramento oferece **Iniciar nova sessão**.

## Formas de entrada

### Cadastro manual

Use **Editar grafo** para cadastrar vértices e arestas. Nomes de vértices devem ser únicos. A interface não aceita laços (uma aresta de um vértice para ele mesmo) nem arestas duplicadas. Em grafos com peso, informe um número maior ou igual a zero. Em grafos sem peso, cada aresta tem custo 1 internamente.

### Grafos de teste

No topo da página, escolha um item em **Grafo de teste** e clique em **Carregar teste**:

| Teste              | Finalidade                                                |
| ------------------ | --------------------------------------------------------- |
| Grafo da proposta  | Conferir os quatro algoritmos com o exemplo da avaliação. |
| Empates de rota    | Conferir o desempate por ordem alfabética.                |
| Cidade direcionada | Conferir sentido das arestas e vértices inalcançáveis.    |
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
| DFS       | Ordem de visita, arestas da árvore de busca e vértices não alcançados.                                                  |
| BFS       | Ordem de visita, nível de cada vértice e caminho com o menor número de arestas. A BFS não considera pesos.              |
| Dijkstra  | Menor distância acumulada e caminho da origem até cada vértice. Vértices inalcançáveis aparecem com distância infinita. |
| Kruskal   | Arestas selecionadas e custo total. Se o grafo estiver desconectado, mostra uma floresta geradora e seus componentes.   |

Quando houver empate, a aplicação usa **ordem alfabética** para escolher vizinhos, vértices ou arestas de mesmo custo. O Dijkstra aceita apenas pesos não negativos.

## Estrutura do projeto

| Arquivo         | Função                                                            |
| --------------- | ----------------------------------------------------------------- |
| `index.html`    | Estrutura da interface.                                           |
| `styles.css`    | Layout e estilos responsivos.                                     |
| `script.js`     | Interação da interface, importação, desenho e animação.           |
| `graph.js`      | Lista de adjacência, representação principal do grafo em memória. |
| `algorithms.js` | Implementações de DFS, BFS, Dijkstra e Kruskal.                   |
