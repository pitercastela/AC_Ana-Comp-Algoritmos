/* Implementações provisórias e independentes da interface. */
(function (root) {
  const compareNames = (a,b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) || a.localeCompare(b, 'pt-BR');
  const comparePaths = (a,b) => {
    for (let i=0; i<Math.min(a.length,b.length); i++) {
      const comparison=compareNames(a[i],b[i]);
      if (comparison) return comparison;
    }
    return a.length-b.length;
  };
  function adjacency(graph) {
    const list = new Map(graph.vertices.map(vertex => [vertex,
      graph.neighbors(vertex).map(edge => ({ vertex: edge.to, weight: edge.weight }))
    ]));
    for (const neighbors of list.values()) neighbors.sort((a,b)=>compareNames(a.vertex,b.vertex));
    return list;
  }

  function pathTo(parent, target) {
    const path = [];
    for (let current = target; current !== null && current !== undefined; current = parent.get(current)) path.push(current);
    return path.reverse();
  }

  function dfs(graph, start) {
    const list = adjacency(graph), visited = new Set(), finished = new Set(), order = [], tree = [], edgeTypes = [];
    const parent = new Map([[start, null]]), depth = new Map([[start, 0]]), pre = new Map(), post = new Map(), steps = [];
    let clock = 0;
    function visit(vertex) {
      visited.add(vertex);
      order.push(vertex);
      pre.set(vertex, ++clock);
      steps.push({ title: `Pré-visita de ${vertex}`, description: `${vertex} é acessado pela primeira vez (tempo ${clock}).`, phase: 'pre', active: vertex, visited: [...visited], finished: [...finished], edges: [...tree], edgeTypes: [...edgeTypes] });
      for (const neighbor of list.get(vertex)) {
        const to = neighbor.vertex;
        if (!visited.has(to)) {
          parent.set(to, vertex);
          depth.set(to, depth.get(vertex) + 1);
          tree.push({ from: vertex, to });
          edgeTypes.push({ from: vertex, to, type: 'tree' });
          visit(to);
          continue;
        }
        if (!graph.directed && parent.get(vertex) === to) continue;
        if (!graph.directed && finished.has(to)) continue;
        const type = !graph.directed || !finished.has(to) ? 'back' : pre.get(vertex) < pre.get(to) ? 'forward' : 'cross';
        edgeTypes.push({ from: vertex, to, type });
        const label = { back: 'retorno', forward: 'ida', cross: 'cruzamento' }[type];
        steps.push({ title: `Aresta de ${label}: ${vertex} ${graph.directed?'→':'—'} ${to}`, description: `${vertex} ${graph.directed?'→':'—'} ${to} não pertence à árvore de busca.`, phase: 'edge', active: vertex, visited: [...visited], finished: [...finished], edges: [...tree], edgeTypes: [...edgeTypes] });
      }
      post.set(vertex, ++clock);
      finished.add(vertex);
      steps.push({ title: `Pós-visita de ${vertex}`, description: `Todos os vizinhos de ${vertex} foram examinados; a busca retorna ao vértice anterior (tempo ${clock}).`, phase: 'post', active: vertex, visited: [...visited], finished: [...finished], edges: [...tree], edgeTypes: [...edgeTypes] });
    }
    visit(start);
    return { start, order, tree, edgeTypes, rows: order.map(vertex=>({vertex,parent:parent.get(vertex),depth:depth.get(vertex),pre:pre.get(vertex),post:post.get(vertex)})), unreachable: graph.vertices.filter(vertex => !visited.has(vertex)).sort(compareNames), steps };
  }

  function bfs(graph, start) {
    const list = adjacency(graph), queue = [start], visited = new Set([start]);
    const parent = new Map([[start, null]]), level = new Map([[start, 0]]), order = [], tree = [], steps = [];
    for (let head = 0; head < queue.length; head++) {
      const vertex = queue[head];
      order.push(vertex);
      steps.push({ title: `Expandir ${vertex}`, description: `Nível ${level.get(vertex)}. Fila atual: ${queue.slice(head).join(', ')}.`, active: vertex, visited: [...visited], edges: [...tree] });
      for (const neighbor of list.get(vertex)) {
        if (visited.has(neighbor.vertex)) continue;
        visited.add(neighbor.vertex);
        parent.set(neighbor.vertex, vertex);
        level.set(neighbor.vertex, level.get(vertex) + 1);
        tree.push({ from: vertex, to: neighbor.vertex });
        queue.push(neighbor.vertex);
        steps.push({ title: `Descobrir ${neighbor.vertex}`, description: `${neighbor.vertex} entra na fila no nível ${level.get(neighbor.vertex)}.`, active: neighbor.vertex, visited: [...visited], edges: [...tree] });
      }
    }
    return { start, order, steps, rows: graph.vertices.map(vertex => ({
      vertex, level: level.has(vertex) ? level.get(vertex) : null,
      path: level.has(vertex) ? pathTo(parent, vertex) : []
    })) };
  }

  function dijkstra(graph, start) {
    const list = adjacency(graph), distance = new Map(graph.vertices.map(vertex => [vertex, Infinity]));
    const parent = new Map([[start, null]]), settled = new Set(), steps = [], iterations = [];
    distance.set(start, 0);
    const columns = [...graph.vertices].sort(compareNames);
    function snapshot(number, current) {
      iterations.push({ number, current, cells: columns.map(vertex => ({
        vertex, distance: distance.get(vertex), settled: settled.has(vertex),
        path: Number.isFinite(distance.get(vertex)) ? pathTo(parent, vertex) : []
      })) });
    }
    snapshot(0, null);
    while (settled.size < graph.vertices.length) {
      let best = null;
      for (const vertex of graph.vertices) {
        if (!settled.has(vertex) && (best === null || distance.get(vertex) < distance.get(best) || distance.get(vertex) === distance.get(best) && compareNames(vertex,best)<0)) best = vertex;
      }
      if (best === null || distance.get(best) === Infinity) break;
      settled.add(best);
      steps.push({ title: `Fixar ${best}`, description: `Menor distância definitiva: ${distance.get(best)}.`, active: best, visited: [...settled], edges: [...parent].filter(([,from])=>from!==null).map(([to,from])=>({from,to})) });
      for (const neighbor of list.get(best)) {
        if (settled.has(neighbor.vertex)) continue;
        const candidate = distance.get(best) + neighbor.weight;
        const currentPath=parent.has(neighbor.vertex)?pathTo(parent,neighbor.vertex):[];
        const proposedPath=[...pathTo(parent,best),neighbor.vertex];
        if (candidate < distance.get(neighbor.vertex) || candidate === distance.get(neighbor.vertex) && comparePaths(proposedPath,currentPath)<0) {
          distance.set(neighbor.vertex, candidate);
          parent.set(neighbor.vertex, best);
          steps.push({ title: `Atualizar ${neighbor.vertex}`, description: `Nova distância: ${candidate}, passando por ${best}.`, active: neighbor.vertex, visited: [...settled], edges: [...parent].filter(([,from])=>from!==null).map(([to,from])=>({from,to})) });
        }
      }
      snapshot(iterations.length, best);
    }
    return { start, steps, iterations, rows: graph.vertices.map(vertex => ({
      vertex, distance: distance.get(vertex),
      path: distance.get(vertex) < Infinity ? pathTo(parent, vertex) : []
    })) };
  }

  function kruskal(graph) {
    if (graph.directed) throw Error('Kruskal exige um grafo não direcionado.');
    const parent = new Map(graph.vertices.map(vertex => [vertex, vertex]));
    const rank = new Map(graph.vertices.map(vertex => [vertex, 0]));
    function find(vertex) {
      if (parent.get(vertex) !== vertex) parent.set(vertex, find(parent.get(vertex)));
      return parent.get(vertex);
    }
    function unite(a, b) {
      let rootA = find(a), rootB = find(b);
      if (rootA === rootB) return false;
      if (rank.get(rootA) < rank.get(rootB)) [rootA, rootB] = [rootB, rootA];
      parent.set(rootB, rootA);
      if (rank.get(rootA) === rank.get(rootB)) rank.set(rootA, rank.get(rootA) + 1);
      return true;
    }
    const sorted = graph.edges.map(edge => ({...edge})).sort((a,b) => {
      const cost=(graph.weighted ? a.weight - b.weight : 0);
      if(cost) return cost;
      const aEnds=[a.from,a.to].sort(compareNames),bEnds=[b.from,b.to].sort(compareNames);
      return compareNames(aEnds[0],bEnds[0]) || compareNames(aEnds[1],bEnds[1]);
    });
    const selected = [], steps = [];
    let cost = 0;
    for (const edge of sorted) {
      const weight = graph.weighted ? edge.weight : 1;
      const accepted = unite(edge.from, edge.to);
      if (accepted) {
        selected.push({ from: edge.from, to: edge.to, weight });
        cost += weight;
      }
      steps.push({ title: `${accepted?'Selecionar':'Ignorar'} ${edge.from} — ${edge.to}`, description: accepted?`Custo ${weight}; total acumulado: ${cost}.`:'Esta aresta fecharia um ciclo.', active: null, visited: [...new Set(selected.flatMap(item=>[item.from,item.to]))], edges: [...selected], candidate: { from: edge.from, to: edge.to, accepted } });
    }
    const components = new Map();
    for (const vertex of graph.vertices) {
      const leader = find(vertex);
      if (!components.has(leader)) components.set(leader, []);
      components.get(leader).push(vertex);
    }
    return { edges: selected, cost, components: [...components.values()], steps };
  }

  const api = { adjacency, dfs, bfs, dijkstra, kruskal };
  root.SmartNetAlgorithms = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
