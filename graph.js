/* Estrutura de grafo implementada como lista de adjacência. */
(function (root) {
  class SmartNetGraph {
    constructor({ directed = false, weighted = true } = {}) {
      this.directed = directed;
      this.weighted = weighted;
      this.list = new Map();
    }

    get vertices() { return [...this.list.keys()]; }

    get edges() {
      const result = [];
      const seen = new Set();
      for (const [from, neighbors] of this.list) {
        for (const { to, weight } of neighbors) {
          if (!this.directed) {
            const pair = [from, to].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'})||a.localeCompare(b,'pt-BR'));
            const key = JSON.stringify(pair);
            if (seen.has(key)) continue;
            seen.add(key);
            result.push({ from: pair[0], to: pair[1], weight });
            continue;
          }
          result.push({ from, to, weight });
        }
      }
      return result;
    }

    neighbors(vertex) {
      if (!this.list.has(vertex)) throw Error(`Vértice inexistente: ${vertex}`);
      return this.list.get(vertex).map(edge => ({...edge}));
    }

    configure({ directed, weighted }) {
      if (this.list.size) throw Error('Limpe o grafo antes de alterar seu tipo.');
      this.directed = Boolean(directed);
      this.weighted = Boolean(weighted);
    }

    addVertex(name) {
      if (typeof name !== 'string' || !name.trim()) throw Error('Informe o nome do vértice.');
      const vertex = name.trim();
      if (this.vertices.some(item => item.toLocaleLowerCase('pt-BR') === vertex.toLocaleLowerCase('pt-BR'))) throw Error('Já existe um vértice com esse nome.');
      this.list.set(vertex, []);
    }

    removeVertex(vertex) {
      if (!this.list.delete(vertex)) return false;
      for (const neighbors of this.list.values()) {
        for (let i = neighbors.length - 1; i >= 0; i--) {
          if (neighbors[i].to === vertex) neighbors.splice(i, 1);
        }
      }
      return true;
    }

    addEdge(from, to, weight = 1) {
      if (!this.list.has(from) || !this.list.has(to)) throw Error('Escolha vértices cadastrados para a conexão.');
      if (from === to) throw Error('Escolha dois vértices diferentes.');
      const cost = this.weighted ? Number(weight) : 1;
      if (!Number.isFinite(cost) || cost < 0) throw Error('Use um peso numérico maior ou igual a zero.');
      if (this.list.get(from).some(edge => edge.to === to)) throw Error('Essa conexão já existe.');
      this.list.get(from).push({ to, weight: cost });
      if (!this.directed) this.list.get(to).push({ to: from, weight: cost });
    }

    removeEdge(from, to) {
      if (!this.list.has(from) || !this.list.has(to)) return false;
      const before = this.list.get(from).length;
      this.list.set(from, this.list.get(from).filter(edge => edge.to !== to));
      if (!this.directed) this.list.set(to, this.list.get(to).filter(edge => edge.to !== from));
      return this.list.get(from).length < before;
    }

    replace(data) {
      const next = new SmartNetGraph({ directed: data.directed, weighted: data.weighted });
      for (const vertex of data.vertices) next.addVertex(vertex);
      for (const edge of data.edges) next.addEdge(edge.from, edge.to, edge.weight);
      this.directed = next.directed;
      this.weighted = next.weighted;
      this.list = next.list;
    }

    static fromData(data) {
      const graph = new SmartNetGraph();
      graph.replace(data);
      return graph;
    }
  }

  root.SmartNetGraph = SmartNetGraph;
  if (typeof module !== 'undefined' && module.exports) module.exports = SmartNetGraph;
})(typeof window !== 'undefined' ? window : globalThis);
