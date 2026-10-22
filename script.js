const $ = (selector) => document.querySelector(selector);
const state = new SmartNetGraph();
const animation = { name: null, steps: [], index: 0, timer: null };
const example = {
  directed: false, weighted: true,
  vertices: ['O', 'A', 'B', 'C', 'D', 'E', 'F', 'T'],
  edges: [
    ['O','A',2],['O','B',5],['O','C',4],['A','B',2],['A','D',7],['A','F',12],
    ['B','C',1],['B','D',4],['B','E',3],['C','E',4],['D','E',4],['D','T',5],
    ['E','T',7],['F','T',3]
  ].map(([from,to,weight]) => ({from,to,weight}))
};
const presets = {
  proposal: example,
  ties: {
    directed: false, weighted: true,
    vertices: ['D','C','A','B','E'],
    edges: [['A','C',2],['B','D',2],['A','B',2],['C','D',2],['D','E',1],['B','E',3]].map(([from,to,weight])=>({from,to,weight}))
  },
  directed: {
    directed: true, weighted: true,
    vertices: ['Centro','Norte','Sul','Leste','Oeste'],
    edges: [['Centro','Norte',3],['Norte','Leste',2],['Centro','Sul',4],['Sul','Leste',1],['Leste','Centro',6]].map(([from,to,weight])=>({from,to,weight}))
  },
  disconnected: {
    directed: false, weighted: false,
    vertices: ['A','B','C','D','E','F'],
    edges: [['A','B'],['B','C'],['D','E']].map(([from,to])=>({from,to,weight:1}))
  }
};

function showModule(name){
  document.querySelectorAll('.module-panel').forEach(panel=>{panel.hidden=panel.id!==`module-${name}`;});
  document.querySelectorAll('.module-tab').forEach(tab=>{
    const active=tab.dataset.module===name;
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-selected',String(active));
  });
}
document.querySelectorAll('.module-tab').forEach(tab=>tab.addEventListener('click',()=>showModule(tab.dataset.module)));
function selectMapTab(name){
  const executing=name==='execution';
  if(executing&&!animation.steps.length)return;
  $('#graphView').hidden=executing; $('#executionView').hidden=!executing;
  $('#graphTab').classList.toggle('active',!executing); $('#executionTab').classList.toggle('active',executing);
  $('#graphTab').setAttribute('aria-selected',String(!executing)); $('#executionTab').setAttribute('aria-selected',String(executing));
  if(!executing)pauseAnimation();
}
$('#graphTab').addEventListener('click',()=>selectMapTab('graph'));
$('#executionTab').addEventListener('click',()=>selectMapTab('execution'));
function pauseAnimation(){if(animation.timer){clearInterval(animation.timer);animation.timer=null;}$('#playPauseAnimation').textContent='Reproduzir';}
function showFrame(){
  const step=animation.steps[animation.index];if(!step)return;
  drawGraph($('#executionSvg'),step);
  const directionHint=state.directed?'→ Grafo direcionado: cada seta indica o sentido permitido.':'— Grafo não direcionado: cada ligação pode ser percorrida nos dois sentidos.';
  $('#executionDirection').textContent=animation.name==='DFS'?`${directionHint} Laranja: pré-visita; roxo: pós-visita.`:directionHint;
  $('#executionStepLabel').textContent=`${animation.name.toUpperCase()} · PASSO ${animation.index+1}`;
  $('#executionTitle').textContent=step.title;
  $('#executionDescription').textContent=step.description;
  $('#executionCounter').textContent=`${animation.index+1} / ${animation.steps.length}`;
  $('#previousStep').disabled=animation.index===0;
  $('#nextStep').disabled=animation.index===animation.steps.length-1;
}
function playAnimation(){
  if(!animation.steps.length)return;
  if(animation.index===animation.steps.length-1)animation.index=0;
  showFrame();
  $('#playPauseAnimation').textContent='Pausar';
  animation.timer=setInterval(()=>{
    if(animation.index>=animation.steps.length-1){pauseAnimation();return;}
    animation.index++;showFrame();
  },950);
}
function startAnimation(name,steps){
  pauseAnimation();animation.name=name;animation.steps=steps.length?steps:[{title:'Nenhuma aresta percorrida',description:'O grafo não possui conexões para este algoritmo.',active:null,visited:[],edges:[]}];animation.index=0;
  $('#executionTab').disabled=false;$('#executionTabBadge').hidden=false;
  selectMapTab('execution');showFrame();playAnimation();
}
function clearAnimation(){
  pauseAnimation();animation.name=null;animation.steps=[];animation.index=0;
  $('#executionTab').disabled=true;$('#executionTabBadge').hidden=true;
  selectMapTab('graph');$('#executionSvg').innerHTML='';
}
$('#restartAnimation').addEventListener('click',()=>{pauseAnimation();animation.index=0;showFrame();playAnimation();});
$('#previousStep').addEventListener('click',()=>{pauseAnimation();animation.index=Math.max(0,animation.index-1);showFrame();});
$('#nextStep').addEventListener('click',()=>{pauseAnimation();animation.index=Math.min(animation.steps.length-1,animation.index+1);showFrame();});
$('#playPauseAnimation').addEventListener('click',()=>{if(animation.timer)pauseAnimation();else playAnimation();});

function clearErrors(){ $('#vertexError').textContent=''; $('#edgeError').textContent=''; }
function compareNames(a,b){return a.localeCompare(b,'pt-BR',{sensitivity:'base'})||a.localeCompare(b,'pt-BR');}
function setGraph(graph){ state.replace(graph); clearErrors(); render(); }
function invalidateResult(){ clearAnimation();$('#resultsJump').hidden=true;$('#analysisError').textContent='';$('#resultPanel').className='result-panel'; $('#resultPanel').innerHTML='<span class="result-mark">▦</span><div><strong>Grafo atualizado</strong><p>Escolha uma análise para o grafo atual.</p></div>'; }
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function options(selected=''){return '<option value="">Selecione</option>'+state.vertices.map(v=>`<option value="${escapeHtml(v)}" ${v===selected?'selected':''}>${escapeHtml(v)}</option>`).join('');}
function render(){
  $('#direction').value=state.directed?'directed':'undirected'; $('#weightMode').value=state.weighted?'weighted':'unweighted';
  $('#direction').disabled=state.vertices.length>0; $('#weightMode').disabled=state.vertices.length>0;
  $('#weightField').hidden=!state.weighted; $('#edgeWeight').required=state.weighted;
  for(const id of ['#edgeFrom','#edgeTo','#startVertex']){const el=$(id),old=el.value;el.innerHTML=options(old);}
  $('#graphSummary').textContent=`${state.vertices.length} vértice${state.vertices.length===1?'':'s'} · ${state.edges.length} aresta${state.edges.length===1?'':'s'}`;
  $('#graphEmpty').hidden=state.vertices.length>0;
  renderElements(); renderAdjacency(); renderGraph();
}
function renderElements(){
  const vs=state.vertices.map(v=>`<div class="element-row"><span>● ${escapeHtml(v)}</span><button class="remove" data-remove-vertex="${escapeHtml(v)}" aria-label="Remover vértice ${escapeHtml(v)}">×</button></div>`).join('');
  const es=state.edges.map((e,i)=>`<div class="element-row"><span>${escapeHtml(e.from)} ${state.directed?'→':'—'} ${escapeHtml(e.to)}${state.weighted?' · '+e.weight:''}</span><button class="remove" data-remove-edge="${i}" aria-label="Remover aresta">×</button></div>`).join('');
  $('#elementsList').innerHTML=state.vertices.length?`<p class="element-group-title">Vértices</p>${vs}<p class="element-group-title">Arestas</p>${es||'<p class="muted">Nenhuma conexão ainda.</p>'}`:'<p class="muted">Nenhum elemento cadastrado.</p>';
}
function renderAdjacency(){
  $('#adjacencyList').innerHTML=state.vertices.length?[...state.vertices].sort(compareNames).map(v=>{
    const neighbors=state.neighbors(v).map(e=>[e.to,e.weight]);
    neighbors.sort((a,b)=>compareNames(a[0],b[0]));
    return `<div class="adjacency-line"><span class="node">${escapeHtml(v)}</span> <span class="arrow">→</span> ${neighbors.length?neighbors.map(([n,w])=>escapeHtml(n)+(state.weighted?` (${w})`:'' )).join(', '):'∅'}</div>`;
  }).join(''):'<span class="adjacency-placeholder">A lista aparecerá quando o primeiro vértice for adicionado.</span>';
}
function renderGraph(){drawGraph($('#graphSvg'));if(animation.steps.length)showFrame();}
function drawGraph(svg,frame=null){
  if(!state.vertices.length){svg.innerHTML='';return;}
  const n=state.vertices.length, cx=380,cy=155,rx=n===1?0:Math.min(290,65+n*23),ry=n===1?0:Math.min(110,45+n*11);
  const positions=new Map(state.vertices.map((v,i)=>[v,{x:cx+rx*Math.cos((i/n)*Math.PI*2-Math.PI/2),y:cy+ry*Math.sin((i/n)*Math.PI*2-Math.PI/2)}]));
  const markerId=color=>`arrow-${svg.id}-${color}`;
  const defs=`<defs>${[['normal','#8aafb2'],['muted','#c8d9da'],['selected','#15a98d'],['rejected','#d66b55']].map(([key,color])=>`<marker id="${markerId(key)}" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10 Z" fill="${color}"/></marker>`).join('')}</defs>`;
  const matches=(candidate,e)=>candidate&&(candidate.from===e.from&&candidate.to===e.to||!state.directed&&candidate.from===e.to&&candidate.to===e.from);
  const edges=state.edges.map(e=>{
    const a=positions.get(e.from),b=positions.get(e.to);if(!a||!b)return '';
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
    const hasReverse=state.directed&&state.edges.some(other=>other.from===e.to&&other.to===e.from);
    const offset=hasReverse?12:0,px=-uy*offset,py=ux*offset;
    const x1=a.x+px+(state.directed?ux*23:0),y1=a.y+py+(state.directed?uy*23:0);
    const x2=b.x+px-(state.directed?ux*25:0),y2=b.y+py-(state.directed?uy*25:0);
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    const selected=frame?.edges?.some(item=>matches(item,e)),candidate=matches(frame?.candidate,e);
    const style=candidate&&!frame.candidate.accepted?'rejected':selected?'selected':frame?'muted':'normal';
    const colors={rejected:'#d66b55',selected:'#15a98d',muted:'#c8d9da',normal:'#8aafb2'};
    return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors[style]}" stroke-width="${selected||candidate?4:2}" ${state.directed?`marker-end="url(#${markerId(style)})"`:''}/>${state.weighted?`<rect x="${mx-13}" y="${my-13}" width="26" height="20" rx="5" fill="#fff" stroke="#dce9e8"/><text x="${mx}" y="${my+1}" text-anchor="middle" font-size="11" font-weight="700" fill="#47717c">${e.weight}</text>`:''}</g>`;
  }).join('');
  const nodes=state.vertices.map(v=>{const p=positions.get(v);const fill=frame?(v===frame.active?(frame.phase==='post'?'#8063b2':'#e7a33e'):frame.finished?.includes(v)?'#8063b2':frame.visited?.includes(v)?'#137e72':'#9bb6b9'):'#137e72';return `<g><circle cx="${p.x}" cy="${p.y}" r="22" fill="${fill}" stroke="#fff" stroke-width="4"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${escapeHtml(v.length>5?v.slice(0,5)+'…':v)}</text></g>`}).join('');
  svg.innerHTML=defs+edges+nodes;
}

$('#vertexForm').addEventListener('submit',e=>{e.preventDefault();$('#vertexError').textContent='';try{state.addVertex($('#vertexName').value);$('#vertexName').value='';render();invalidateResult();}catch(error){$('#vertexError').textContent=error.message;}});
$('#edgeForm').addEventListener('submit',e=>{e.preventDefault();$('#edgeError').textContent='';try{state.addEdge($('#edgeFrom').value,$('#edgeTo').value,$('#edgeWeight').value);render();invalidateResult();}catch(error){$('#edgeError').textContent=error.message;}});
$('#elementsList').addEventListener('click',e=>{const v=e.target.closest('[data-remove-vertex]'),edge=e.target.closest('[data-remove-edge]');if(v){state.removeVertex(v.dataset.removeVertex);}else if(edge){const item=state.edges[Number(edge.dataset.removeEdge)];if(item)state.removeEdge(item.from,item.to);}else return;render();invalidateResult();});
$('#clearButton').addEventListener('click',()=>{if(state.vertices.length&&!confirm('Remover todos os vértices e arestas?'))return;setGraph({directed:false,weighted:true,vertices:[],edges:[]});invalidateResult();});
$('#exampleButton').addEventListener('click',()=>{if(state.vertices.length&&!confirm('Substituir o grafo atual pelo teste selecionado?'))return;setGraph(presets[$('#presetSelect').value]);invalidateResult();});
for(const id of ['#direction','#weightMode'])$(id).addEventListener('change',()=>{state.configure({directed:$('#direction').value==='directed',weighted:$('#weightMode').value==='weighted'});render();invalidateResult();});
document.querySelectorAll('[data-algorithm]').forEach(button=>button.addEventListener('click',()=>{
  const name=button.dataset.algorithm, start=$('#startVertex').value;
  $('#analysisError').textContent='';
  if(!state.vertices.length){showNotice('Adicione um grafo primeiro','Cadastre vértices e arestas antes de executar análises.');return;}
  if(name!=='Kruskal'&&!start){showNotice('Escolha uma origem',`Selecione um vértice de origem para ${name}.`);return;}
  if(name==='Kruskal'&&state.directed){showNotice('Kruskal indisponível','O algoritmo exige um grafo não direcionado.');return;}
  const algorithm=SmartNetAlgorithms[name.toLowerCase()];
  const result=name==='Kruskal'?algorithm(state):algorithm(state,start);
  renderAnalysis(name,result);
  $('#resultsJump').hidden=false;
  startAnimation(name,result.steps);
}));
function showNotice(title,body){$('#analysisError').textContent=`${title}: ${body}`;}
function resultTable(headings,rows){
  return `<div class="result-table-wrap"><table class="result-table"><thead><tr>${headings.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function dijkstraIterationTable(iterations){
  const columns=iterations[0].cells.map(cell=>cell.vertex);
  return `<div class="result-block"><h4>Evolução das rotas</h4><p>Cada célula mostra a melhor distância e o caminho conhecidos após a iteração. ✓ indica distância definitiva.</p></div><div class="result-table-wrap iteration-table-wrap"><table class="result-table iteration-table"><thead><tr><th scope="col">Iteração</th>${columns.map(vertex=>`<th scope="col">${escapeHtml(vertex)}</th>`).join('')}</tr></thead><tbody>${iterations.map(row=>`<tr><th scope="row">${row.number}${row.current?` · ${escapeHtml(row.current)}`:' · início'}</th>${row.cells.map(cell=>`<td class="${cell.settled?'definitive':''} ${row.current===cell.vertex?'current':''}"><div class="iteration-cell"><strong>${Number.isFinite(cell.distance)?cell.distance:'∞'}${cell.settled?' ✓':''}</strong><small>${cell.path.length?escapeHtml(cell.path.join(' → ')):'—'}</small></div></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderAnalysis(name,result){
  let description='',content='';
  if(name==='DFS'){
    description=`Origem: ${escapeHtml(result.start)} · ${result.order.length} vértices visitados`;
    content=`<div class="result-block"><h4>Ordem de visita</h4><p class="route-line">${result.order.map(escapeHtml).join(' → ')}</p></div>`;
    content+=`<div class="result-block"><h4>Árvore de busca</h4><div class="dfs-tree">${result.rows.map((row,index)=>`<div class="dfs-tree-row" style="padding-left:${Math.min(row.depth*18,360)}px"><span class="dfs-tree-order">${index+1}.</span><strong>${escapeHtml(row.vertex)}</strong><span>${row.parent===null?'origem':`← ${escapeHtml(row.parent)}`}</span></div>`).join('')}</div></div>`;
    content+=`<div class="result-block"><h4>Tempos de visita</h4><p>Pré: primeiro acesso. Pós: retorno após examinar os vizinhos.</p></div>`;
    content+=resultTable(['Vértice','A partir de','Pré','Pós'],result.rows.map(row=>[row.vertex,row.parent??'Origem',row.pre,row.post]));
    if(result.unreachable.length)content+=`<p class="result-warning">Não alcançados: ${result.unreachable.map(escapeHtml).join(', ')}</p>`;
  }else if(name==='BFS'){
    description=`Origem: ${escapeHtml(result.start)} · menor número de arestas`;
    content=`<div class="result-block"><h4>Ordem de visita</h4><p class="route-line">${result.order.map(escapeHtml).join(' → ')}</p></div>`;
    content+=resultTable(['Vértice','Nível','Caminho'],result.rows.map(row=>[row.vertex,row.level===null?'—':row.level,row.path.length?row.path.join(' → '):'Inalcançável']));
    if(state.weighted)content+='<p class="result-note">BFS conta arestas; não considera seus pesos.</p>';
  }else if(name==='Dijkstra'){
    description=`Origem: ${escapeHtml(result.start)} · menor custo acumulado`;
    content=dijkstraIterationTable(result.iterations);
    content+='<div class="result-block"><h4>Resultado final</h4></div>';
    content+=resultTable(['Vértice','Distância','Caminho'],result.rows.map(row=>[row.vertex,Number.isFinite(row.distance)?row.distance:'∞',row.path.length?row.path.join(' → '):'Inalcançável']));
    if(!state.weighted)content+='<p class="result-note">Neste grafo sem peso, cada aresta vale 1.</p>';
  }else{
    description=`${result.components.length===1?'Árvore geradora mínima':'Floresta geradora mínima'} · ${result.edges.length} arestas`;
    content=resultTable(['Aresta','Custo'],result.edges.map(edge=>[`${edge.from} — ${edge.to}`,edge.weight]));
    if(!result.edges.length)content='<p class="result-note">Nenhuma aresta selecionada.</p>';
    content+=`<div class="result-total"><span>Custo total</span><strong>${result.cost}</strong></div>`;
    if(result.components.length>1)content+=`<p class="result-warning">Grafo desconectado: ${result.components.length} componentes (${result.components.map(group=>group.map(escapeHtml).join(', ')).join(' | ')}).</p>`;
    if(!state.weighted)content+='<p class="result-note">Neste grafo sem peso, cada aresta vale 1.</p>';
  }
  $('#resultPanel').className='result-panel analysis-result';
  $('#resultPanel').innerHTML=`<div class="result-heading"><span class="result-kicker">RESULTADO DA ANÁLISE</span><h3>${escapeHtml(name)}</h3><p>${description}</p></div>${content}`;
}

$('#importButton').addEventListener('click',()=>{$('#importError').textContent='';$('#importDialog').showModal();});
$('#fileInput').addEventListener('change',async e=>{const file=e.target.files[0];if(file)$('#importText').value=await file.text();});
$('#applyImport').addEventListener('click',()=>{try{const graph=parseGraph($('#importText').value);setGraph(graph);invalidateResult();$('#importDialog').close();$('#fileInput').value='';}catch(error){$('#importError').textContent=error.message;}});
function parseGraph(text){
  const lines=text.split(/\r?\n/).map((text,index)=>({text:text.trim(),number:index+1})).filter(x=>x.text);
  if(!lines.length)throw Error('Cole o conteúdo de um grafo antes de importar.');
  const header=lines.shift();const match=header.text.match(/^#\s*smartnet:\s*(directed|undirected)\s+(weighted|unweighted)$/i);
  if(!match)throw Error(`Linha ${header.number}: use # smartnet: undirected weighted (ou outra combinação válida).`);
  const directed=match[1].toLowerCase()==='directed',weighted=match[2].toLowerCase()==='weighted';
  const vertexLine=lines.shift();if(!vertexLine||!/^vertices\s*:/i.test(vertexLine.text))throw Error('A segunda linha deve começar com vertices:');
  const vertices=vertexLine.text.replace(/^vertices\s*:/i,'').split(',').map(v=>v.trim());
  if(vertices.some(v=>!v||v.length>24))throw Error(`Linha ${vertexLine.number}: cada vértice precisa ter nome de 1 a 24 caracteres.`);
  if(new Set(vertices.map(v=>v.toLocaleLowerCase('pt-BR'))).size!==vertices.length)throw Error(`Linha ${vertexLine.number}: há vértices repetidos.`);
  const edges=[];for(const line of lines){if(line.text.startsWith('#'))continue;const parts=line.text.split(',').map(s=>s.trim());if(parts.length!==(weighted?3:2))throw Error(`Linha ${line.number}: quantidade incorreta de campos.`);const [from,to]=parts;if(!vertices.includes(from)||!vertices.includes(to))throw Error(`Linha ${line.number}: origem ou destino não consta em vertices.`);if(from===to)throw Error(`Linha ${line.number}: laços não são aceitos neste protótipo.`);const weight=weighted?Number(parts[2]):1;if(weighted&&(!parts[2]||!Number.isFinite(weight)||weight<0))throw Error(`Linha ${line.number}: peso inválido.`);if(edges.some(e=>e.from===from&&e.to===to||!directed&&e.from===to&&e.to===from))throw Error(`Linha ${line.number}: conexão repetida.`);edges.push({from,to,weight});}
  return {directed,weighted,vertices,edges};
}
$('#finishButton').addEventListener('click',()=>$('#finishDialog').showModal());
$('#closeFinish').addEventListener('click',()=>$('#finishDialog').close());
$('#cancelFinish').addEventListener('click',()=>$('#finishDialog').close());
$('#confirmFinish').addEventListener('click',()=>{$('#finishDialog').close();$('#finishedScreen').hidden=false;});
$('#restartButton').addEventListener('click',()=>{setGraph({directed:false,weighted:true,vertices:[],edges:[]});invalidateResult();$('#finishedScreen').hidden=true;});
render();
