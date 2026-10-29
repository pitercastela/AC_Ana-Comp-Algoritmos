/* Leitura e escrita do formato TXT do SmartNet. */
(function (root) {
  function fields(line, number) {
    const result = [];
    let value = '', quoted = false, closed = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') { value += '"'; i++; }
        else if (char === '"') { quoted = false; closed = true; }
        else value += char;
      } else if (char === ',') {
        result.push(value.trim()); value = ''; closed = false;
      } else if (char === '"' && !value.trim() && !closed) {
        quoted = true;
      } else if (closed && !/\s/.test(char) || char === '"') {
        throw Error(`Linha ${number}: campo entre aspas inválido.`);
      } else {
        value += char;
      }
    }
    if (quoted) throw Error(`Linha ${number}: aspas não fechadas.`);
    result.push(value.trim());
    return result;
  }

  function parse(text) {
    const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/)
      .map((value, index) => ({ text: value.trim(), number: index + 1 }))
      .filter(line => line.text);
    if (!lines.length) throw Error('Cole o conteúdo de um grafo antes de importar.');
    const header = lines.shift();
    const match = header.text.match(/^#\s*smartnet:\s*(directed|undirected)\s+(weighted|unweighted)$/i);
    if (!match) throw Error(`Linha ${header.number}: use # smartnet: undirected weighted (ou outra combinação válida).`);
    const directed = match[1].toLowerCase() === 'directed', weighted = match[2].toLowerCase() === 'weighted';
    const vertexLine = lines.shift();
    if (!vertexLine || !/^vertices\s*:/i.test(vertexLine.text)) throw Error('A segunda linha deve começar com vertices:');
    const vertices = fields(vertexLine.text.replace(/^vertices\s*:/i, ''), vertexLine.number);
    if (vertices.some(vertex => !vertex || vertex.length > 24)) throw Error(`Linha ${vertexLine.number}: cada vértice precisa ter nome de 1 a 24 caracteres.`);
    if (new Set(vertices.map(vertex => vertex.toLocaleLowerCase('pt-BR'))).size !== vertices.length) throw Error(`Linha ${vertexLine.number}: há vértices repetidos.`);
    const edges = [];
    for (const line of lines) {
      if (line.text.startsWith('#')) continue;
      const parts = fields(line.text, line.number);
      if (parts.length !== (weighted ? 3 : 2)) throw Error(`Linha ${line.number}: quantidade incorreta de campos.`);
      const [from, to] = parts;
      if (!vertices.includes(from) || !vertices.includes(to)) throw Error(`Linha ${line.number}: origem ou destino não consta em vertices.`);
      if (from === to) throw Error(`Linha ${line.number}: laços não são aceitos neste protótipo.`);
      const weight = weighted ? Number(parts[2]) : 1;
      if (weighted && (!parts[2] || !Number.isFinite(weight) || weight < 0)) throw Error(`Linha ${line.number}: peso inválido.`);
      if (edges.some(edge => edge.from === from && edge.to === to || !directed && edge.from === to && edge.to === from)) throw Error(`Linha ${line.number}: conexão repetida.`);
      edges.push({ from, to, weight });
    }
    return { directed, weighted, vertices, edges };
  }

  function field(value) {
    const text = String(value);
    if (/[",\r\n]/.test(text) || text.startsWith('#')) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  function serialize(graph) {
    const vertices = graph.vertices, edges = graph.edges;
    if (!vertices.length) throw Error('Adicione pelo menos um vértice antes de exportar.');
    if (vertices.some(vertex => /[\r\n]/.test(vertex))) throw Error('Nomes de vértices não podem conter quebras de linha no TXT.');
    const lines = [
      `# smartnet: ${graph.directed ? 'directed' : 'undirected'} ${graph.weighted ? 'weighted' : 'unweighted'}`,
      `vertices: ${vertices.map(field).join(',')}`,
      ...edges.map(edge => [field(edge.from), field(edge.to), ...(graph.weighted ? [String(edge.weight)] : [])].join(','))
    ];
    return lines.join('\n') + '\n';
  }

  const api = { parse, serialize };
  root.SmartNetGraphIO = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
