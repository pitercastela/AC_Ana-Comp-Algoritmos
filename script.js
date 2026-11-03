const $ = (selector) => document.querySelector(selector);
const state = new SmartNetGraph();
const analysisGraph = new SmartNetGraph();
const savedGraphs = new Map();
const draftStorageKey = 'smartnet-builder-draft-v1';
let draftDirty = false;
let loadedSource = 'new';
let editorActive = false;
let editorStarted = false;
let editorTool = 'vertex';
let editingVertex = null;
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
  directedClasses: {
    directed: true, weighted: false,
    vertices: ['A','B','C','D'],
    edges: [['A','B'],['B','C'],['C','A'],['A','C'],['A','D'],['D','C']].map(([from,to])=>({from,to,weight:1}))
  },
  directedCycle: {
    directed: true, weighted: false,
    vertices: ['A','B','C'],
    edges: [['A','B'],['B','C'],['C','A']].map(([from,to])=>({from,to,weight:1}))
  },
  directedBranches: {
    directed: true, weighted: false,
    vertices: ['A','B','C','D'],
    edges: [['A','B'],['B','D'],['A','C'],['A','D'],['C','D']].map(([from,to])=>({from,to,weight:1}))
  },
  disconnected: {
    directed: false, weighted: false,
    vertices: ['A','B','C','D','E','F'],
    edges: [['A','B'],['B','C'],['D','E']].map(([from,to])=>({from,to,weight:1}))
  }
};
const presetNames = { proposal:'Grafo da proposta', ties:'Empates de rota', directed:'Cidade direcionada', directedClasses:'DFS direcionado · todos os tipos', directedCycle:'DFS direcionado · retorno', directedBranches:'DFS direcionado · ida e cruzamento', disconnected:'Bairros isolados' };
const storageKey = 'smartnet-saved-graphs-v1';
function snapshotGraph(graph){return {directed:graph.directed,weighted:graph.weighted,vertices:graph.vertices,edges:graph.edges};}
function loadSavedGraphs(){
  try{
    const entries=JSON.parse(localStorage.getItem(storageKey)||'[]');
    if(!Array.isArray(entries))return;
    for(const entry of entries){
      if(typeof entry.name!=='string'||!entry.name.trim())continue;
      try{savedGraphs.set(entry.name, snapshotGraph(SmartNetGraph.fromData(entry.graph)));}catch{}
    }
  }catch{}
}
function persistSavedGraphs(){
  try{localStorage.setItem(storageKey,JSON.stringify([...savedGraphs].map(([name,graph])=>({name,graph}))));return true;}catch{return false;}
}
function persistDraft(){
  try{
    const setup={direction:$('#direction').value,weightMode:$('#weightMode').value,sourceMode:document.querySelector('input[name="builderSourceMode"]:checked')?.value||'',template:$('#builderGraphSelect').value};
    localStorage.setItem(draftStorageKey,JSON.stringify({graph:snapshotGraph(state),name:$('#graphName').value,source:loadedSource,dirty:draftDirty,editorActive,editorStarted,editorTool,setup}));
    $('#draftStatus').textContent='Rascunho preservado neste navegador.';
    $('#setupDraftStatus').textContent='Preferências preservadas neste navegador.';
    return true;
  }catch{
    $('#draftStatus').textContent='Este navegador não permitiu preservar o rascunho automaticamente.';
    $('#setupDraftStatus').textContent='Este navegador não permitiu preservar as preferências automaticamente.';
    return false;
  }
}
function restoreDraft(){
  try{
    const raw=localStorage.getItem(draftStorageKey);if(!raw)return;
    const draft=JSON.parse(raw);
    state.replace(draft.graph);
    $('#graphName').value=typeof draft.name==='string'?draft.name.slice(0,40):'';
    loadedSource=typeof draft.source==='string'?draft.source:'new';
    draftDirty=Boolean(draft.dirty);
    editorStarted=typeof draft.editorStarted==='boolean'?draft.editorStarted:state.vertices.length>0;
    editorActive=typeof draft.editorActive==='boolean'?draft.editorActive:editorStarted;
    editorTool=draft.editorTool==='edge'?'edge':'vertex';
    const setup=draft.setup||{};
    $('#direction').value=setup.direction|| (editorStarted?(state.directed?'directed':'undirected'):'');
    $('#weightMode').value=setup.weightMode|| (editorStarted?(state.weighted?'weighted':'unweighted'):'');
    const sourceMode=setup.sourceMode|| (loadedSource==='imported'?'':loadedSource==='new'?'new':'template');
    const radio=document.querySelector(`input[name="builderSourceMode"][value="${sourceMode}"]`);
    if(radio)radio.checked=true;
    renderBuilderSourceChoices();
    const template=setup.template||loadedSource;
    if([...$('#builderGraphSelect').options].some(option=>option.value===template))$('#builderGraphSelect').value=template;
    updateBuilderSetup();
    render();
    showBuilderEditor(editorActive);
    if(draftDirty&&state.vertices.length){
      $('#saveGraphMessage').classList.add('unsaved');
      $('#saveGraphMessage').textContent='Alterações não salvas. Clique em Salvar para usá-las na aba Algoritmos.';
    }
    $('#draftStatus').textContent='Rascunho recuperado deste navegador.';
    $('#setupDraftStatus').textContent='Preferências recuperadas deste navegador.';
  }catch{
    $('#draftStatus').textContent='O rascunho anterior não pôde ser recuperado.';
  }
}
function renderGraphChoices(){
  const select=$('#analysisGraphSelect'),previous=select.value;
  const placeholder=new Option('Selecione um grafo','');
  placeholder.disabled=true;
  placeholder.hidden=true;
  placeholder.selected=true;
  select.replaceChildren(placeholder);
  const tests=document.createElement('optgroup');tests.label='Grafos de teste';
  for(const [key,label] of Object.entries(presetNames))tests.append(new Option(label,`preset:${key}`));
  select.append(tests);
  if(savedGraphs.size){
    const saved=document.createElement('optgroup');saved.label='Grafos salvos';
    for(const name of [...savedGraphs.keys()].sort(compareNames))saved.append(new Option(name,`saved:${name}`));
    select.append(saved);
  }
  if([...select.options].some(option=>option.value===previous))select.value=previous;
  renderBuilderSourceChoices();
}
function renderBuilderSourceChoices(){
  const builder=$('#builderGraphSelect'),previous=builder.value;
  const directed=$('#direction').value==='directed',weighted=$('#weightMode').value==='weighted';
  const matches=graph=>graph.directed===directed&&graph.weighted===weighted;
  builder.replaceChildren(new Option('Selecione um modelo',''));
  if($('#direction').value&&$('#weightMode').value){
    const tests=document.createElement('optgroup');tests.label='Exemplos';
    for(const [key,label] of Object.entries(presetNames))if(matches(presets[key]))tests.append(new Option(label,`preset:${key}`));
    if(tests.children.length)builder.append(tests);
    const saved=document.createElement('optgroup');saved.label='Grafos salvos';
    for(const name of [...savedGraphs.keys()].sort(compareNames))if(matches(savedGraphs.get(name)))saved.append(new Option(name,`saved:${name}`));
    if(saved.children.length)builder.append(saved);
  }
  if([...builder.options].some(option=>option.value===previous))builder.value=previous;
  const count=builder.options.length-1;
  $('#templateHint').textContent=!$('#direction').value||!$('#weightMode').value?'Escolha o sentido e os pesos para ver modelos compatíveis.':count?`${count} modelo${count===1?'':'s'} compatíve${count===1?'l':'is'} com este tipo.`:'Nenhum modelo deste tipo. Você pode criar do zero ou importar um TXT pelo botão acima.';
  updateBuilderSetup();
}
function updateBuilderSetup(){
  const mode=document.querySelector('input[name="builderSourceMode"]:checked')?.value||'';
  $('#builderTemplateField').hidden=mode!=='template';
  $('#startBuilderButton').disabled=!$('#direction').value||!$('#weightMode').value||!mode||(mode==='template'&&!$('#builderGraphSelect').value);
}
function showBuilderEditor(active){
  editorActive=active;
  $('#builderSetup').hidden=active;
  $('#builderEditor').hidden=!active;
  $('#resumeBuilderButton').hidden=active||!editorStarted;
  if(active){
    $('#builderTypeSummary').textContent=`${state.directed?'Direcionado':'Não direcionado'} · ${state.weighted?'com peso':'sem peso'}`;
    updateBuilderToolUI();
    render();
  }
}
function updateBuilderToolUI(){
  for(const [tool,id] of [['vertex','#vertexToolButton'],['edge','#edgeToolButton']]){
    const button=$(id),active=editorTool===tool;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  }
  $('#edgeControls').hidden=editorTool!=='edge';
  $('#builderModeHint').hidden=editorTool!=='vertex';
  $('#builderGraphSurface').classList.toggle('vertex-mode',editorTool==='vertex');
  $('#builderGraphSurface').classList.toggle('edge-mode',editorTool==='edge');
  $('#builderGraphSurface').setAttribute('aria-label',editorTool==='vertex'?'Área de montagem. Pressione Enter para adicionar um vértice; selecione um vértice para renomeá-lo.':'Área de montagem. Selecione dois vértices para criar uma aresta.');
  $('#graphEmpty span').textContent=editorTool==='vertex'?'Clique nesta área para adicionar o primeiro vértice.':'Selecione Vértices para adicionar o primeiro.';
}
function activateBuilderTool(tool){
  if(editorTool===tool)return;
  editorTool=tool;selectedEdgeStart=null;closeWeightEditor();updateBuilderToolUI();render();persistDraft();
}
function openVertexDialog(vertex=null){
  if(!editorActive)return;
  editingVertex=vertex;
  $('#vertexDialogTitle').textContent=vertex?'Renomear vértice':'Adicionar vértice';
  $('#vertexDialogHelp').textContent=vertex?'Digite o novo nome do vértice. As conexões serão preservadas.':'Digite um nome único para o novo vértice.';
  $('#vertexSubmitButton').textContent=vertex?'Salvar nome':'Incluir vértice';
  $('#vertexError').textContent='';$('#vertexName').value=vertex||'';
  $('#vertexDialog').showModal();$('#vertexName').focus();
}
function selectAnalysisGraph(value){
  let source=null;
  if(value.startsWith('preset:'))source=presets[value.slice(7)];
  if(value.startsWith('saved:'))source=savedGraphs.get(value.slice(6));
  analysisGraph.replace(source||{directed:false,weighted:true,vertices:[],edges:[]});
  const count=analysisGraph.vertices.length;
  $('#analysisGraphSummary').textContent=count?`${count} vértice${count===1?'':'s'} · ${analysisGraph.edges.length} aresta${analysisGraph.edges.length===1?'':'s'}`:'Nenhum grafo';
  $('#analysisGraphInfo').textContent=count?`${analysisGraph.directed?'Direcionado':'Não direcionado'} · ${analysisGraph.weighted?'com peso':'sem peso'}`:'Escolha um grafo para começar.';
  $('#analysisGraphEmpty').hidden=count>0;
  drawGraph($('#analysisGraphSvg'),analysisGraph);
  renderAdjacencyFor(analysisGraph,$('#analysisAdjacencyList'));
  $('#startVertex').innerHTML=options(analysisGraph);
  invalidateResult();
}
$('#analysisGraphSelect').addEventListener('change',event=>selectAnalysisGraph(event.target.value));
$('#reloadAnalysisGraph').addEventListener('click',()=>selectAnalysisGraph($('#analysisGraphSelect').value));
for(const id of ['#direction','#weightMode'])$(id).addEventListener('change',()=>{$('#builderSetupError').textContent='';renderBuilderSourceChoices();persistDraft();});
document.querySelectorAll('input[name="builderSourceMode"]').forEach(radio=>radio.addEventListener('change',()=>{$('#builderSetupError').textContent='';updateBuilderSetup();persistDraft();}));
$('#builderGraphSelect').addEventListener('change',()=>{updateBuilderSetup();persistDraft();});
$('#startBuilderButton').addEventListener('click',()=>{
  updateBuilderSetup();if($('#startBuilderButton').disabled)return;
  const mode=document.querySelector('input[name="builderSourceMode"]:checked').value;
  const choice=mode==='template'?$('#builderGraphSelect').value:'new';
  if(editorStarted&&draftDirty&&state.vertices.length&&!confirm('Substituir o grafo em edição? As alterações não salvas serão perdidas.'))return;
  const directed=$('#direction').value==='directed',weighted=$('#weightMode').value==='weighted';
  const source=choice.startsWith('preset:')?presets[choice.slice(7)]:choice.startsWith('saved:')?savedGraphs.get(choice.slice(6)):{directed,weighted,vertices:[],edges:[]};
  if(!source){$('#builderSetupError').textContent='Selecione um modelo disponível.';return;}
  setGraph(source);loadedSource=choice;editorStarted=true;editorTool='vertex';$('#builderSetupError').textContent='';
  $('#graphName').value=choice.startsWith('saved:')?choice.slice(6):'';
  draftDirty=choice.startsWith('preset:');
  $('#saveGraphMessage').classList.toggle('unsaved',draftDirty);
  $('#saveGraphMessage').textContent=draftDirty?'Modelo carregado. Salve este grafo para usá-lo na aba Algoritmos.':choice.startsWith('saved:')?'Grafo salvo aberto para edição.':'';
  showBuilderEditor(true);persistDraft();$('#builderGraphSurface').focus();
});
$('#changeBuilderSetup').addEventListener('click',()=>{showBuilderEditor(false);persistDraft();$('#direction').focus();});
$('#resumeBuilderButton').addEventListener('click',()=>{showBuilderEditor(true);persistDraft();$('#builderGraphSurface').focus();});
$('#graphName').addEventListener('input',persistDraft);
function saveCurrentGraph(name){
  const message=$('#saveGraphMessage');
  $('#graphName').value=name;
  savedGraphs.set(name,snapshotGraph(state));
  const persisted=persistSavedGraphs();renderGraphChoices();
  document.querySelector('input[name="builderSourceMode"][value="template"]').checked=true;
  $('#builderGraphSelect').value=`saved:${name}`;
  updateBuilderSetup();
  loadedSource=`saved:${name}`;draftDirty=false;persistDraft();
  message.classList.remove('unsaved');
  message.textContent=persisted?'Grafo salvo. Selecione-o na aba Algoritmos.':'Grafo disponível nesta sessão. O navegador não permitiu armazenamento permanente.';
}
let pendingOverwriteName='';
$('#saveGraphForm').addEventListener('submit',event=>{
  event.preventDefault();
  const name=$('#graphName').value.trim(),message=$('#saveGraphMessage');
  if(!state.vertices.length){message.textContent='Adicione pelo menos um vértice antes de salvar.';return;}
  if(!name){message.textContent='Informe um nome para o grafo.';return;}
  if(savedGraphs.has(name)){
    pendingOverwriteName=name;
    $('#overwriteDescription').textContent=`Já existe um grafo chamado “${name}”. Se continuar, a versão salva será substituída pelo grafo que está na tela.`;
    $('#overwriteDialog').showModal();
    return;
  }
  saveCurrentGraph(name);
});
function closeOverwriteDialog(){pendingOverwriteName='';$('#overwriteDialog').close();}
$('#closeOverwrite').addEventListener('click',closeOverwriteDialog);
$('#cancelOverwrite').addEventListener('click',closeOverwriteDialog);
$('#confirmOverwrite').addEventListener('click',()=>{if(pendingOverwriteName)saveCurrentGraph(pendingOverwriteName);closeOverwriteDialog();});
$('#overwriteDialog').addEventListener('close',()=>{pendingOverwriteName='';});

function showWorkspace(name){
  $('#buildWorkspace').hidden=name!=='build';$('#analysisWorkspace').hidden=name!=='analysis';
  document.querySelectorAll('.workspace-tab').forEach(tab=>{
    const active=tab.id===(name==='build'?'workspaceBuildTab':'workspaceAnalysisTab');
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-selected',String(active));
    tab.tabIndex=active?0:-1;
  });
  if(name==='build')pauseAnimation();
}
$('#workspaceBuildTab').addEventListener('click',()=>showWorkspace('build'));
$('#workspaceAnalysisTab').addEventListener('click',()=>showWorkspace('analysis'));
$('.workspace-tabs').addEventListener('keydown',event=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();
  const tabs=[...document.querySelectorAll('.workspace-tab')];
  const current=tabs.indexOf(document.activeElement);
  const next=tabs[(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
  showWorkspace(next.id==='workspaceBuildTab'?'build':'analysis');next.focus();
});
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
  drawGraph($('#executionSvg'),analysisGraph,step);
  const directionHint=analysisGraph.directed?'→ Grafo direcionado: cada seta indica o sentido permitido.':'— Grafo não direcionado: cada ligação pode ser percorrida nos dois sentidos.';
  $('#executionDirection').textContent=animation.name==='DFS'?`${directionHint} Verde: árvore; vermelho: retorno; azul: ida; roxo: cruzamento. Vértice laranja: pré-visita; roxo: pós-visita.`:directionHint;
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
function markBuilderChanged(){draftDirty=true;const message=$('#saveGraphMessage');message.classList.toggle('unsaved',state.vertices.length>0);message.textContent=state.vertices.length?'Alterações não salvas. Clique em Salvar para usá-las na aba Algoritmos.':'';persistDraft();}
function compareNames(a,b){return a.localeCompare(b,'pt-BR',{sensitivity:'base'})||a.localeCompare(b,'pt-BR');}
let selectedEdgeStart=null;
let editingEdge=null;
function closeWeightEditor(){editingEdge=null;$('#weightEditor').hidden=true;$('#weightEditError').textContent='';}
function updateEdgeSelection(){
  const status=$('#edgeSelectionStatus');
  if(selectedEdgeStart){status.textContent=`${state.directed?'Origem':'Primeiro vértice'}: ${selectedEdgeStart}. Clique no ${state.directed?'destino':'segundo vértice'} no mapa.`;}
  else if(state.vertices.length<2){status.textContent='Adicione pelo menos dois vértices para criar uma conexão.';}
  else{status.textContent=`Clique no ${state.directed?'vértice de origem':'primeiro vértice'} no mapa.`;}
  $('#cancelEdgeSelection').hidden=!selectedEdgeStart;
}
function setGraph(graph){ state.replace(graph); selectedEdgeStart=null; clearErrors(); render(); }
function invalidateResult(){ clearAnimation();$('#resultsJump').hidden=true;$('#analysisError').textContent='';$('#resultPanel').className='result-panel'; $('#resultPanel').innerHTML='<span class="result-mark">▦</span><div><strong>Nenhuma análise executada</strong><p>Selecione um grafo e escolha um algoritmo.</p></div>'; }
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function options(graph,selected=''){return '<option value="">Selecione</option>'+graph.vertices.map(v=>`<option value="${escapeHtml(v)}" ${v===selected?'selected':''}>${escapeHtml(v)}</option>`).join('');}
function render(){
  closeWeightEditor();
  $('#exportButton').disabled=state.vertices.length===0;
  $('#weightField').hidden=!state.weighted; $('#edgeWeight').required=state.weighted;
  if(selectedEdgeStart&&!state.vertices.includes(selectedEdgeStart))selectedEdgeStart=null;
  updateEdgeSelection();
  $('#graphSummary').textContent=`${state.vertices.length} vértice${state.vertices.length===1?'':'s'} · ${state.edges.length} aresta${state.edges.length===1?'':'s'}`;
  $('#graphEmpty').hidden=state.vertices.length>0;
  renderElements(); renderAdjacencyFor(state,$('#adjacencyList')); drawGraph($('#graphSvg'),state);
}
function renderElements(){
  const vs=state.vertices.map(v=>`<div class="element-row"><span>● ${escapeHtml(v)}</span><button class="remove" data-remove-vertex="${escapeHtml(v)}" aria-label="Remover vértice ${escapeHtml(v)}">×</button></div>`).join('');
  const es=state.edges.map((e,i)=>`<div class="element-row"><span>${escapeHtml(e.from)} ${state.directed?'→':'—'} ${escapeHtml(e.to)}${state.weighted?' · '+e.weight:''}</span><button class="remove" data-remove-edge="${i}" aria-label="Remover aresta">×</button></div>`).join('');
  $('#verticesList').innerHTML=vs||'<p class="muted">Nenhum vértice cadastrado.</p>';
  $('#edgesList').innerHTML=es||'<p class="muted">Nenhuma aresta cadastrada.</p>';
}
function renderAdjacencyFor(graph,target){
  target.innerHTML=graph.vertices.length?[...graph.vertices].sort(compareNames).map(v=>{
    const neighbors=graph.neighbors(v).map(e=>[e.to,e.weight]);
    neighbors.sort((a,b)=>compareNames(a[0],b[0]));
    return `<div class="adjacency-line"><span class="node">${escapeHtml(v)}</span> <span class="arrow">→</span> ${neighbors.length?neighbors.map(([n,w])=>escapeHtml(n)+(graph.weighted?` (${w})`:'' )).join(', '):'∅'}</div>`;
  }).join(''):'<span class="adjacency-placeholder">A lista aparecerá quando o primeiro vértice for adicionado.</span>';
}
function drawGraph(svg,graph,frame=null){
  if(!graph.vertices.length){svg.innerHTML='';return;}
  const n=graph.vertices.length, cx=380,cy=155,rx=n===1?0:Math.min(290,65+n*23),ry=n===1?0:Math.min(110,45+n*11);
  const positions=new Map(graph.vertices.map((v,i)=>[v,{x:cx+rx*Math.cos((i/n)*Math.PI*2-Math.PI/2),y:cy+ry*Math.sin((i/n)*Math.PI*2-Math.PI/2)}]));
  const markerId=color=>`arrow-${svg.id}-${color}`;
  const defs=`<defs>${[['normal','#8aafb2'],['muted','#c8d9da'],['selected','#15a98d'],['rejected','#d66b55'],['tree','#15a98d'],['back','#d66b55'],['forward','#467dce'],['cross','#8063b2']].map(([key,color])=>`<marker id="${markerId(key)}" markerWidth="11" markerHeight="10" refX="0" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10 Z" fill="${color}"/></marker>`).join('')}</defs>`;
  const matches=(candidate,e)=>candidate&&(candidate.from===e.from&&candidate.to===e.to||!graph.directed&&candidate.from===e.to&&candidate.to===e.from);
  const builderMap=svg.id==='graphSvg';
  const interactive=builderMap&&editorTool==='edge';
  const edges=graph.edges.map((e,index)=>{
    const a=positions.get(e.from),b=positions.get(e.to);if(!a||!b)return '';
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
    const hasReverse=graph.directed&&graph.edges.some(other=>other.from===e.to&&other.to===e.from);
    const offset=hasReverse?12:0,px=-uy*offset,py=ux*offset;
    const x1=a.x+px+(graph.directed?ux*23:0),y1=a.y+py+(graph.directed?uy*23:0);
    const x2=b.x+px-(graph.directed?ux*35:0),y2=b.y+py-(graph.directed?uy*35:0);
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    const selected=frame?.edges?.some(item=>matches(item,e)),candidate=matches(frame?.candidate,e);
    const edgeType=frame?.edgeTypes?.find(item=>matches(item,e))?.type;
    if(frame?.visibleTypes && (!edgeType||!frame.visibleTypes.has(edgeType)))return '';
    const style=candidate&&!frame.candidate.accepted?'rejected':edgeType||(selected?'selected':frame?'muted':'normal');
    const colors={rejected:'#d66b55',selected:'#15a98d',tree:'#15a98d',back:'#d66b55',forward:'#467dce',cross:'#8063b2',muted:'#c8d9da',normal:'#8aafb2'};
    const labelWidth=Math.max(28,String(e.weight).length*8+12);
    return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors[style]}" stroke-width="${edgeType||selected||candidate?4:2}" ${graph.directed?`marker-end="url(#${markerId(style)})"`:''}/>${graph.weighted?`<g ${interactive?`class="builder-weight" data-edit-edge="${index}" role="button" tabindex="0" aria-label="Editar peso ${e.weight} da aresta ${escapeHtml(e.from)} ${graph.directed?'para':'e'} ${escapeHtml(e.to)}"`:''}><rect x="${mx-labelWidth/2}" y="${my-13}" width="${labelWidth}" height="22" rx="5" fill="#fff" stroke="#dce9e8"/><text x="${mx}" y="${my+2}" text-anchor="middle" font-size="11" font-weight="700" fill="#47717c">${e.weight}</text></g>`:''}</g>`;
  }).join('');
  const nodes=graph.vertices.map(v=>{const p=positions.get(v);const chosen=interactive&&v===selectedEdgeStart;const fill=chosen?'#e7a33e':frame?.mode==='classification'?'#137e72':frame?(v===frame.active?(frame.phase==='post'?'#8063b2':'#e7a33e'):frame.finished?.includes(v)?'#8063b2':frame.visited?.includes(v)?'#137e72':'#9bb6b9'):'#137e72';return `<g ${builderMap?`class="builder-node${chosen?' selected':''}" data-builder-vertex="${escapeHtml(v)}" role="button" tabindex="0" aria-label="${editorTool==='vertex'?'Renomear vértice ':chosen?(graph.directed?'Origem':'Primeiro vértice')+' selecionado: ':'Selecionar vértice '}${escapeHtml(v)}"`:''}><circle cx="${p.x}" cy="${p.y}" r="22" fill="${fill}" stroke="#fff" stroke-width="4"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${escapeHtml(v.length>5?v.slice(0,5)+'…':v)}</text></g>`}).join('');
  svg.innerHTML=defs+edges+nodes;
}

$('#vertexToolButton').addEventListener('click',()=>activateBuilderTool('vertex'));
$('#edgeToolButton').addEventListener('click',()=>activateBuilderTool('edge'));
$('#closeVertexDialog').addEventListener('click',()=>$('#vertexDialog').close());
$('#cancelVertexDialog').addEventListener('click',()=>$('#vertexDialog').close());
$('#vertexForm').addEventListener('submit',e=>{e.preventDefault();$('#vertexError').textContent='';try{if(editingVertex)state.renameVertex(editingVertex,$('#vertexName').value);else state.addVertex($('#vertexName').value);editingVertex=null;$('#vertexDialog').close();render();markBuilderChanged();$('#builderGraphSurface').focus();}catch(error){$('#vertexError').textContent=error.message;}});
function chooseBuilderVertex(vertex){
  if(editorTool==='vertex'){openVertexDialog(vertex);return;}
  $('#edgeError').textContent='';
  if(!selectedEdgeStart){selectedEdgeStart=vertex;render();return;}
  if(selectedEdgeStart===vertex){selectedEdgeStart=null;render();return;}
  try{if(state.weighted&&$('#edgeWeight').value.trim()==='')throw Error('Informe o peso da conexão.');state.addEdge(selectedEdgeStart,vertex,$('#edgeWeight').value);selectedEdgeStart=null;render();markBuilderChanged();}
  catch(error){$('#edgeError').textContent=error.message;}
}
$('#graphSvg').addEventListener('click',e=>{const node=e.target.closest('[data-builder-vertex]');if(node)chooseBuilderVertex(node.dataset.builderVertex);});
$('#graphSvg').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const node=e.target.closest('[data-builder-vertex]');if(!node)return;e.preventDefault();chooseBuilderVertex(node.dataset.builderVertex);});
$('#builderGraphSurface').addEventListener('click',e=>{if(editorTool!=='vertex'||e.target.closest('[data-builder-vertex],[data-edit-edge],#weightEditor')||e.target.matches('rect,text'))return;openVertexDialog();});
$('#builderGraphSurface').addEventListener('keydown',e=>{if(editorTool!=='vertex'||e.target!==e.currentTarget||(e.key!=='Enter'&&e.key!==' '))return;e.preventDefault();openVertexDialog();});
function openWeightEditor(index){
  if(editorTool!=='edge')return;
  const edge=state.edges[index];if(!edge||!state.weighted)return;
  selectedEdgeStart=null;render();editingEdge={from:edge.from,to:edge.to};
  const label=$('#graphSvg').querySelector(`[data-edit-edge="${index}"]`);
  const surface=$('#builderGraphSurface'),box=surface.getBoundingClientRect(),target=label.getBoundingClientRect(),editor=$('#weightEditor');
  $('#weightEditorLabel').textContent=`Peso: ${edge.from} ${state.directed?'→':'—'} ${edge.to}`;
  $('#editedWeight').value=edge.weight;editor.hidden=false;
  editor.style.left=`${Math.max(8,Math.min(target.left-box.left+target.width/2-110,box.width-228))}px`;
  editor.style.top=`${Math.max(8,Math.min(target.bottom-box.top+8,box.height-editor.offsetHeight-8))}px`;
  $('#editedWeight').focus();$('#editedWeight').select();
}
$('#graphSvg').addEventListener('click',e=>{const weight=e.target.closest('[data-edit-edge]');if(weight)openWeightEditor(Number(weight.dataset.editEdge));});
$('#graphSvg').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const weight=e.target.closest('[data-edit-edge]');if(!weight)return;e.preventDefault();openWeightEditor(Number(weight.dataset.editEdge));});
$('#weightEditor').addEventListener('submit',e=>{e.preventDefault();if(!editingEdge)return;try{state.updateEdgeWeight(editingEdge.from,editingEdge.to,$('#editedWeight').value);render();markBuilderChanged();}catch(error){$('#weightEditError').textContent=error.message;}});
$('#cancelWeightEdit').addEventListener('click',closeWeightEditor);
$('#weightEditor').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeWeightEditor();}});
$('#cancelEdgeSelection').addEventListener('click',()=>{selectedEdgeStart=null;$('#edgeError').textContent='';render();});
$('#elementsList').addEventListener('click',e=>{const v=e.target.closest('[data-remove-vertex]'),edge=e.target.closest('[data-remove-edge]');if(v){state.removeVertex(v.dataset.removeVertex);}else if(edge){const item=state.edges[Number(edge.dataset.removeEdge)];if(item)state.removeEdge(item.from,item.to);}else return;render();markBuilderChanged();});
$('#clearButton').addEventListener('click',()=>{if(state.vertices.length&&!confirm('Remover todos os vértices e arestas?'))return;setGraph({directed:state.directed,weighted:state.weighted,vertices:[],edges:[]});markBuilderChanged();});
document.querySelectorAll('[data-algorithm]').forEach(button=>button.addEventListener('click',()=>{
  const name=button.dataset.algorithm, start=$('#startVertex').value;
  $('#analysisError').textContent='';
  if(!analysisGraph.vertices.length){showNotice('Selecione um grafo','Escolha um grafo de teste ou um grafo salvo antes de executar análises.');return;}
  if(name!=='Kruskal'&&!start){showNotice('Escolha uma origem',`Selecione um vértice de origem para ${name}.`);return;}
  if(name==='Kruskal'&&analysisGraph.directed){showNotice('Kruskal indisponível','O algoritmo exige um grafo não direcionado.');return;}
  const algorithm=SmartNetAlgorithms[name.toLowerCase()];
  const result=name==='Kruskal'?algorithm(analysisGraph):algorithm(analysisGraph,start);
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
function dfsTreeDiagram(rows,edgeTypes,visibleTypes){
  if(!rows.length)return '<p class="result-note">Nenhum vértice alcançado.</p>';
  const children=new Map(rows.map(row=>[row.vertex,[]]));
  for(const row of rows)if(row.parent!==null)children.get(row.parent).push(row.vertex);
  const leaves=rows.filter(row=>children.get(row.vertex).length===0).length;
  const width=Math.max(640,leaves*190+140),height=Math.max(190,(Math.max(...rows.map(row=>row.depth))+1)*112+24);
  const positions=new Map();let leafIndex=0;
  function place(vertex){
    const next=children.get(vertex);
    const x=next.length?next.reduce((sum,child)=>sum+place(child),0)/next.length:width/2+(leafIndex++-(leaves-1)/2)*190;
    const row=rows.find(item=>item.vertex===vertex);
    positions.set(vertex,{x,y:58+row.depth*112});
    return x;
  }
  place(rows[0].vertex);
  const edges=visibleTypes.has('tree')?rows.filter(row=>row.parent!==null).map(row=>{
    const parent=positions.get(row.parent),child=positions.get(row.vertex);
    return `<path d="M ${parent.x} ${parent.y+24} C ${parent.x} ${parent.y+60}, ${child.x} ${child.y-60}, ${child.x} ${child.y-27}" fill="none" stroke="#6eaaa2" stroke-width="2.5" marker-end="url(#dfs-tree-arrow)"/>`;
  }).join(''):'';
  const edgeColors={back:'#d66b55',forward:'#467dce',cross:'#8063b2'};
  let backRoute=0;
  const otherEdges=edgeTypes.map((edge,index)=>{
    const side=edge.type==='back'?(backRoute++%2===0?1:-1):-1;
    if(edge.type==='tree'||!visibleTypes.has(edge.type))return '';
    const from=positions.get(edge.from),to=positions.get(edge.to);
    if(!from||!to)return '';
    const lane=edge.type==='back'?Math.floor((backRoute-1)/2)%4:index%4;
    const controlX=side<0?Math.max(22,Math.min(from.x,to.x)-75-lane*18):Math.min(width-22,Math.max(from.x,to.x)+75+lane*18);
    const label={back:'Retorno',forward:'Ida',cross:'Cruzamento'}[edge.type];
    return `<path d="M ${from.x+side*25} ${from.y} C ${controlX} ${from.y}, ${controlX} ${to.y}, ${to.x+side*28} ${to.y}" fill="none" stroke="${edgeColors[edge.type]}" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#dfs-tree-${edge.type}-arrow)"><title>${label}: ${escapeHtml(edge.from)} → ${escapeHtml(edge.to)}</title></path>`;
  }).join('');
  const nodes=rows.map(row=>{
    const {x,y}=positions.get(row.vertex),name=row.vertex.length>5?`${row.vertex.slice(0,5)}…`:row.vertex;
    return `<g><title>${escapeHtml(row.vertex)} — pré ${row.pre}, pós ${row.post}${row.parent===null?' — origem':` — descoberto a partir de ${escapeHtml(row.parent)}`}</title><circle cx="${x}" cy="${y}" r="23" fill="#137e72" stroke="#fff" stroke-width="4"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${escapeHtml(name)}</text><text x="${x+34}" y="${y-5}" font-size="11" font-weight="700" fill="#176f66">pré ${row.pre}</text><text x="${x+34}" y="${y+11}" font-size="11" font-weight="700" fill="#8063b2">pós ${row.post}</text></g>`;
  }).join('');
  const markers=`<marker id="dfs-tree-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L9 4.5 L0 9 Z" fill="#6eaaa2"/></marker>${Object.entries(edgeColors).map(([type,color])=>`<marker id="dfs-tree-${type}-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L9 4.5 L0 9 Z" fill="${color}"/></marker>`).join('')}`;
  return `<div class="dfs-tree-viewport"><svg class="dfs-tree-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Árvore de busca em profundidade com arestas classificadas"><defs>${markers}</defs>${otherEdges}${edges}${nodes}</svg></div>`;
}
function renderAnalysis(name,result){
  let description='',content='';
  if(name==='DFS'){
    description=`Origem: ${escapeHtml(result.start)} · ${result.order.length} vértices visitados`;
    content=`<div class="result-block"><h4>Ordem de visita</h4><p class="route-line">${result.order.map(escapeHtml).join(' → ')}</p></div>`;
    content+=`<div class="result-block"><h4>Árvore de busca e classificação das arestas</h4><p>Linhas contínuas mostram a árvore. Setas pontilhadas mostram retorno, ida e cruzamento. Pré indica o primeiro acesso; pós indica o retorno após examinar os vizinhos.</p>`;
    const typeNames={tree:'Árvore',back:'Retorno',forward:'Ida',cross:'Cruzamento'};
    const legend=analysisGraph.directed?['tree','back','forward','cross']:['tree','back'];
    content+=`<div id="dfsEdgeFilters" class="dfs-edge-filters" role="group" aria-label="Filtrar tipos de aresta"><button class="dfs-filter active" type="button" data-edge-filter="all" aria-pressed="true">Todas</button>${legend.map(type=>`<button class="dfs-filter ${type}" type="button" data-edge-filter="${type}" aria-pressed="false"><span class="dfs-filter-line"></span>${typeNames[type]}</button>`).join('')}</div><div id="dfsTreeView"></div></div>`;
    if(result.unreachable.length)content+=`<p class="result-warning">Não alcançados: ${result.unreachable.map(escapeHtml).join(', ')}</p>`;
  }else if(name==='BFS'){
    description=`Origem: ${escapeHtml(result.start)} · menor número de arestas`;
    content=`<div class="result-block"><h4>Ordem de visita</h4><p class="route-line">${result.order.map(escapeHtml).join(' → ')}</p></div>`;
    content+=resultTable(['Vértice','Nível','Caminho'],result.rows.map(row=>[row.vertex,row.level===null?'—':row.level,row.path.length?row.path.join(' → '):'Inalcançável']));
    if(analysisGraph.weighted)content+='<p class="result-note">BFS conta arestas; não considera seus pesos.</p>';
  }else if(name==='Dijkstra'){
    description=`Origem: ${escapeHtml(result.start)} · menor custo acumulado`;
    content=dijkstraIterationTable(result.iterations);
    content+='<div class="result-block"><h4>Resultado final</h4></div>';
    content+=resultTable(['Vértice','Distância','Caminho'],result.rows.map(row=>[row.vertex,Number.isFinite(row.distance)?row.distance:'∞',row.path.length?row.path.join(' → '):'Inalcançável']));
    if(!analysisGraph.weighted)content+='<p class="result-note">Neste grafo sem peso, cada aresta vale 1.</p>';
  }else{
    description=`${result.components.length===1?'Árvore geradora mínima':'Floresta geradora mínima'} · ${result.edges.length} arestas`;
    content=resultTable(['Aresta','Custo'],result.edges.map(edge=>[`${edge.from} — ${edge.to}`,edge.weight]));
    if(!result.edges.length)content='<p class="result-note">Nenhuma aresta selecionada.</p>';
    content+=`<div class="result-total"><span>Custo total</span><strong>${result.cost}</strong></div>`;
    if(result.components.length>1)content+=`<p class="result-warning">Grafo desconectado: ${result.components.length} componentes (${result.components.map(group=>group.map(escapeHtml).join(', ')).join(' | ')}).</p>`;
    if(!analysisGraph.weighted)content+='<p class="result-note">Neste grafo sem peso, cada aresta vale 1.</p>';
    content+='<div class="result-block"><h4>Grafo resultante</h4><p>Apenas as arestas selecionadas pelo Kruskal permanecem. Vértices isolados também são mostrados.</p><div class="kruskal-result-map"><svg id="kruskalResultSvg" viewBox="0 0 760 310" role="img" aria-label="Grafo resultante do Kruskal"></svg></div></div>';
  }
  $('#resultPanel').className='result-panel analysis-result';
  $('#resultPanel').innerHTML=`<div class="result-heading"><span class="result-kicker">RESULTADO DA ANÁLISE</span><h3>${escapeHtml(name)}</h3><p>${description}</p></div>${content}`;
  if(name==='Kruskal')drawGraph($('#kruskalResultSvg'),SmartNetGraph.fromData({directed:false,weighted:analysisGraph.weighted,vertices:analysisGraph.vertices,edges:result.edges}));
  if(name==='DFS'){
    const types=analysisGraph.directed?['tree','back','forward','cross']:['tree','back'];
    let activeTypes=new Set(types);
    function updateFilter(){
      const all=activeTypes.size===types.length;
      $('#dfsEdgeFilters').querySelectorAll('[data-edge-filter]').forEach(button=>{
        const active=button.dataset.edgeFilter==='all'?all:!all&&activeTypes.has(button.dataset.edgeFilter);
        button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
      });
      $('#dfsTreeView').innerHTML=dfsTreeDiagram(result.rows,result.edgeTypes,activeTypes);
    }
    $('#dfsEdgeFilters').addEventListener('click',event=>{
      const button=event.target.closest('[data-edge-filter]');if(!button)return;
      const type=button.dataset.edgeFilter;
      if(type==='all')activeTypes=new Set(types);
      else if(activeTypes.size===types.length)activeTypes=new Set([type]);
      else if(activeTypes.has(type)){activeTypes.delete(type);if(!activeTypes.size)activeTypes=new Set(types);}
      else activeTypes.add(type);
      updateFilter();
    });
    updateFilter();
  }
}

$('#importButton').addEventListener('click',()=>{$('#importError').textContent='';$('#importDialog').showModal();});
$('#fileInput').addEventListener('change',async e=>{const file=e.target.files[0];if(file)$('#importText').value=await file.text();});
$('#applyImport').addEventListener('click',()=>{try{const graph=SmartNetGraphIO.parse($('#importText').value);if(editorStarted&&draftDirty&&state.vertices.length&&!confirm('Substituir o grafo em edição pelo arquivo importado?'))return;setGraph(graph);$('#graphName').value='';loadedSource='imported';editorStarted=true;editorTool='vertex';$('#direction').value=graph.directed?'directed':'undirected';$('#weightMode').value=graph.weighted?'weighted':'unweighted';document.querySelectorAll('input[name="builderSourceMode"]').forEach(radio=>radio.checked=false);renderBuilderSourceChoices();showBuilderEditor(true);markBuilderChanged();$('#importDialog').close();$('#fileInput').value='';$('#builderGraphSurface').focus();}catch(error){$('#importError').textContent=error.message;}});
$('#exportButton').addEventListener('click',()=>{
  $('#exportStatus').textContent='';
  try{
    $('#exportText').value=SmartNetGraphIO.serialize(state);
    $('#exportDialog').showModal();
  }catch(error){$('#exportMessage').textContent=error.message;}
});
$('#closeExportDialog').addEventListener('click',()=>$('#exportDialog').close());
$('#cancelExportDialog').addEventListener('click',()=>$('#exportDialog').close());
$('#copyExportButton').addEventListener('click',async()=>{
  const value=$('#exportText').value;
  try{
    if(!navigator.clipboard?.writeText)throw Error('Clipboard API indisponível');
    await navigator.clipboard.writeText(value);
    $('#exportStatus').textContent='Texto copiado para a área de transferência.';
  }catch{
    const field=$('#exportText');field.focus();field.select();
    let copied=false;
    try{copied=document.execCommand('copy');}catch{}
    $('#exportStatus').textContent=copied?'Texto copiado para a área de transferência.':'O navegador bloqueou a cópia automática. O texto está selecionado; pressione Ctrl+C.';
  }
});
$('#downloadExportButton').addEventListener('click',()=>{
  const rawName=$('#graphName').value.trim()||'grafo-smartnet';
  const safeName=rawName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'grafo-smartnet';
  const url=URL.createObjectURL(new Blob(['\uFEFF',$('#exportText').value],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`${safeName}.txt`;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  $('#exportStatus').textContent=`Download de ${safeName}.txt iniciado.`;
});
$('#finishButton').addEventListener('click',()=>$('#finishDialog').showModal());
$('#closeFinish').addEventListener('click',()=>$('#finishDialog').close());
$('#cancelFinish').addEventListener('click',()=>$('#finishDialog').close());
$('#confirmFinish').addEventListener('click',()=>{$('#finishDialog').close();$('#finishedScreen').hidden=false;try{localStorage.removeItem(draftStorageKey);}catch{}});
$('#restartButton').addEventListener('click',()=>{setGraph({directed:false,weighted:true,vertices:[],edges:[]});$('#graphName').value='';$('#direction').value='';$('#weightMode').value='';document.querySelectorAll('input[name="builderSourceMode"]').forEach(radio=>radio.checked=false);loadedSource='new';draftDirty=false;editorStarted=false;$('#saveGraphMessage').textContent='';$('#saveGraphMessage').classList.remove('unsaved');renderBuilderSourceChoices();showBuilderEditor(false);persistDraft();$('#analysisGraphSelect').value='';selectAnalysisGraph('');showWorkspace('build');$('#finishedScreen').hidden=true;});
loadSavedGraphs();renderGraphChoices();render();selectAnalysisGraph('');restoreDraft();showBuilderEditor(editorActive);
