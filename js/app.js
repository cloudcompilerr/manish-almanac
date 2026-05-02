
/* ═══════════════════════════════════════════════════════
   FILE MAP  (Ctrl+F the emoji to jump)
   ─────────────────────────────────────────────────────
   🗂  APP          global state namespace (here)
   ⚙️  PROVIDERS    API provider config
   🎨  NAV / UI     openTool, goBack, toggleSetup…
   🎙  MIC / VOICE  toggleMic, startTimer…
   🌐  API          generate(), streamResponse()
   ✏️  PROMPTS      codingPrompt(), sdPrompt()
   📐  SD RENDER    renderSD(), ptabBar()…
   💻  CODE RENDER  renderCoding(), hl()…
   ⚔️  DEBATE       openDebate(), runDebate()…
   📢  SPEAK MODE   openSM(), closeSM()
   ─────────────────────────────────────────────────────
   APP — single namespace for all mutable state & config
   Edit defaults here; use APP.state.x to inspect in console
═══════════════════════════════════════════════════════ */
const APP = {
  /* Storage key prefix — bump to reset all saved keys */
  SK: 'nt_v6',

  /* UI / session state */
  state: {
    mode:      'coding',
    depth:     'interview',
    last:      null,
    accTxt:    '',
  },

  /* Voice / mic state */
  voice: {
    rec:       null,
    listening: false,
    silT:      null,
    timerI:    null,
    elapsed:   0,
  },

  /* Provider / model state */
  provider: {
    current:   'anthropic',
    model:     'claude-sonnet-4-20250514',
    _memKeys:  {},
  },

  /* Key helpers */
  storeKey:      (p)      => `nt_v6_key_${p}`,
  storeProvider: ()       => 'nt_v6_provider',
  storeModel:    ()       => 'nt_v6_model',
  getKey:        ()       => { try { return localStorage.getItem(APP.storeKey(APP.provider.current)) || APP.provider._memKeys[APP.provider.current] || ''; } catch(e) { return APP.provider._memKeys[APP.provider.current] || ''; } },
  setKey:        (v)      => { APP.provider._memKeys[APP.provider.current]=v; try { localStorage.setItem(APP.storeKey(APP.provider.current),v); } catch(e) {} },
  saveProvider:  ()       => { try { localStorage.setItem('nt_v6_provider', APP.provider.current); localStorage.setItem('nt_v6_model', APP.provider.model); } catch(e) {} },
};

/* ── Compatibility shims ─────────────────────────────────
   Existing code uses bare globals (provider, model, mode…).
   These window-level getters/setters proxy to APP so nothing
   else in the file needs to change.
──────────────────────────────────────────────────────── */
const SK = APP.SK;
Object.defineProperties(window, {
  mode:      { get(){ return APP.state.mode;      }, set(v){ APP.state.mode=v;      }, configurable:true },
  depth:     { get(){ return APP.state.depth;     }, set(v){ APP.state.depth=v;     }, configurable:true },
  last:      { get(){ return APP.state.last;      }, set(v){ APP.state.last=v;      }, configurable:true },
  accTxt:    { get(){ return APP.state.accTxt;    }, set(v){ APP.state.accTxt=v;    }, configurable:true },
  rec:       { get(){ return APP.voice.rec;       }, set(v){ APP.voice.rec=v;       }, configurable:true },
  listening: { get(){ return APP.voice.listening; }, set(v){ APP.voice.listening=v; }, configurable:true },
  silT:      { get(){ return APP.voice.silT;      }, set(v){ APP.voice.silT=v;      }, configurable:true },
  timerI:    { get(){ return APP.voice.timerI;    }, set(v){ APP.voice.timerI=v;    }, configurable:true },
  elapsed:   { get(){ return APP.voice.elapsed;   }, set(v){ APP.voice.elapsed=v;   }, configurable:true },
  provider:  { get(){ return APP.provider.current;}, set(v){ APP.provider.current=v;}, configurable:true },
  model:     { get(){ return APP.provider.model;  }, set(v){ APP.provider.model=v;  }, configurable:true },
});

/* Key helpers — keep old names working */
const getKey      = ()  => APP.getKey();
const setKey      = (v) => APP.setKey(v);
const saveProvider= ()  => APP.saveProvider();

/* Provider config: models, key hint, placeholder */
const PROVIDERS={
  anthropic:{
    name:'Anthropic',
    models:['claude-sonnet-4-20250514','claude-opus-4-5-20251101','claude-haiku-4-5-20251001'],
    modelLabels:{'claude-sonnet-4-20250514':'Claude Sonnet 4.5 (recommended)','claude-opus-4-5-20251101':'Claude Opus 4.5 (powerful)','claude-haiku-4-5-20251001':'Claude Haiku 4.5 (fast)'},
    hint:'Key from console.anthropic.com',
    placeholder:'sk-ant-…'
  },
  openai:{
    name:'OpenAI',
    models:['gpt-4o','gpt-4o-mini','o1-mini'],
    modelLabels:{'gpt-4o':'GPT-4o (recommended)','gpt-4o-mini':'GPT-4o mini (fast)','o1-mini':'o1-mini (reasoning)'},
    hint:'Key from platform.openai.com/api-keys',
    placeholder:'sk-…'
  },
  gemini:{
    name:'Google Gemini',
    models:['gemini-2.0-flash','gemini-1.5-pro','gemini-1.5-flash'],
    modelLabels:{'gemini-2.0-flash':'Gemini 2.0 Flash (recommended)','gemini-1.5-pro':'Gemini 1.5 Pro','gemini-1.5-flash':'Gemini 1.5 Flash (fast)'},
    hint:'Key from aistudio.google.com/app/apikey',
    placeholder:'AIza…'
  },
  groq:{
    name:'Groq',
    models:['llama-3.3-70b-versatile','mixtral-8x7b-32768','llama3-70b-8192'],
    modelLabels:{'llama-3.3-70b-versatile':'Llama 3.3 70B (recommended)','mixtral-8x7b-32768':'Mixtral 8x7B','llama3-70b-8192':'Llama 3 70B'},
    hint:'Key from console.groq.com/keys',
    placeholder:'gsk_…'
  }
};

function onProviderChange(){
  provider=document.getElementById('providerSel').value;
  const cfg=PROVIDERS[provider];
  /* rebuild model dropdown */
  const ms=document.getElementById('modelSel');
  ms.innerHTML=cfg.models.map(m=>`<option value="${m}">${cfg.modelLabels[m]||m}</option>`).join('');
  model=cfg.models[0];
  ms.onchange=()=>{model=ms.value;};
  /* update hint + placeholder */
  document.getElementById('keyHint').textContent=cfg.hint;
  document.getElementById('apikey').placeholder=cfg.placeholder;
  /* load saved key for this provider */
  const saved=getKey();
  document.getElementById('apikey').value=saved||'';
}

var PROV_ICONS={anthropic:'🟠',openai:'🟢',gemini:'🔵',groq:'🟣'};
function buildProvStrip(){
  var strip=document.getElementById('provStrip');
  if(!strip)return;
  var html='';
  Object.keys(PROVIDERS).forEach(function(pk){
    var cfg=PROVIDERS[pk];
    var isOn=(pk===provider);
    var savedModel=null;
    try{savedModel=localStorage.getItem(SK+'_provmodel_'+pk);}catch(e){}
    var activeModel=isOn?model:(savedModel||cfg.models[0]);
    var mLabel=cfg.modelLabels[activeModel]||activeModel;
    var shortLabel=mLabel.split(' ')[0];
    html+='<button class="prov-chip'+(isOn?' on':'')+'" data-pk="'+pk+'" id="pchip_'+pk+'">'
      +(PROV_ICONS[pk]||'🤖')+' '+cfg.name
      +'<span class="prov-model">'+shortLabel+'</span>'
      +'</button>';
  });
  strip.innerHTML=html;
  strip.querySelectorAll('.prov-chip').forEach(function(btn){
    btn.addEventListener('click',function(){selectProvChip(btn.dataset.pk);});
  });
}
function selectProvChip(pk){
  var cfg=PROVIDERS[pk];
  if(!cfg)return;
  /* save current model choice for old provider */
  try{localStorage.setItem(SK+'_provmodel_'+provider,model);}catch(e){}
  provider=pk;
  /* restore model for new provider */
  var saved=null;try{saved=localStorage.getItem(SK+'_provmodel_'+pk);}catch(e){}
  model=(saved&&cfg.models.includes(saved))?saved:cfg.models[0];
  saveProvider();
  /* sync gear panel selectors — set modelSel AFTER onProviderChange (which resets model) */
  try{
    var _wantModel=model;
    document.getElementById('providerSel').value=pk;
    onProviderChange();
    if(_wantModel&&cfg.models.includes(_wantModel)){
      document.getElementById('modelSel').value=_wantModel;
      model=_wantModel;
    }
  }catch(e){}
  buildProvStrip();
  /* if no key saved for this provider, open setup */
  if(!getKey()){toggleSetup();toast('Add your '+cfg.name+' key to continue');}
  else{toast((PROV_ICONS[pk]||'🤖')+' '+cfg.name+' selected');}
}
function saveKey(){
  const v=document.getElementById('apikey').value.trim();
  if(!v){toast('Enter a key');return;}
  setKey(v);
  model=document.getElementById('modelSel').value||model;
  saveProvider();
  document.getElementById('setup').style.display='none';
  buildProvStrip();
  toast('Saved ✓');
}
function toggleSetup(){
  const s=document.getElementById('setup');
  const show=s.style.display==='none';
  s.style.display=show?'block':'none';
  if(show){
    /* restore saved provider/model */
    try{
      const sp=localStorage.getItem(_storeProvider);
      const sm=localStorage.getItem(_storeModel);
      if(sp&&PROVIDERS[sp]){provider=sp;document.getElementById('providerSel').value=sp;}
      onProviderChange();
      if(sm){document.getElementById('modelSel').value=sm;model=sm;}
    }catch(e){onProviderChange();}
  }
}

/* ═══ NAV ═══ */
function openTool(m){document.getElementById('list').style.display='none';document.getElementById('tool').classList.add('open');buildProvStrip();setMode(m);if(!getKey())document.getElementById('setup').style.display='block';}
function goBack(){stopMic(false);document.getElementById('tool').classList.remove('open');document.getElementById('list').style.display='block';clearAll();last=null;}

/* ═══ MODE ═══ */
function setMode(m){
  mode=m;
  document.getElementById('mCoding').classList.toggle('on',m==='coding');
  document.getElementById('mSD').classList.toggle('on',m==='sd');
  document.getElementById('dtitle').textContent=m==='coding'?'Java Coding':'System Design';
  document.getElementById('vlbl').textContent=m==='coding'?'🎙 Speak your coding problem':'🎙 Describe the system to design';
  document.getElementById('tbox').setAttribute('data-ph',m==='coding'?'Tap mic to speak your problem…':'e.g. "Design Twitter" or "Design a URL shortener"');
  const ch=document.getElementById('chips');
  if(m==='sd'){ch.innerHTML=`<div class="chip on" data-d="senior" onclick="setDepth(this)">🎯 Senior/Staff</div><div class="chip" data-d="mid" onclick="setDepth(this)">👨‍💻 Mid-level</div><div class="chip" data-d="deep" onclick="setDepth(this)">📖 Deep Dive</div>`;depth='senior';}
  else{ch.innerHTML=`<div class="chip on" data-d="interview" onclick="setDepth(this)">🎯 Interview</div><div class="chip" data-d="explain" onclick="setDepth(this)">🗣️ Team</div><div class="chip" data-d="beginner" onclick="setDepth(this)">📖 Beginner</div>`;depth='interview';}
  clearAll();
}
function setDepth(el){el.closest('.chips').querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));el.classList.add('on');depth=el.dataset.d;}

/* ═══ TOAST / TIMER ═══ */
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2400);}
function startTimer(){elapsed=0;clearInterval(timerI);timerI=setInterval(()=>{elapsed++;document.getElementById('vtimer').textContent=pad(Math.floor(elapsed/60))+':'+pad(elapsed%60);},1000);}
function stopTimer(){clearInterval(timerI);document.getElementById('vtimer').textContent='';}
const pad=n=>String(n).padStart(2,'0');

/* ═══ MIC ═══ */
function toggleMic(){listening?stopMic(true):startMic();}
function startMic(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Voice not supported — type instead');return;}

  /* Capture any text already typed so voice APPENDS rather than overwrites */
  accTxt=document.getElementById('tbox').textContent.trim();
  rec=new SR();
  rec.continuous=true;       /* keep mic alive between phrases */
  rec.interimResults=true;   /* show words as spoken, not just after pause */
  rec.lang='en-US';
  rec.maxAlternatives=1;

  /* ── Inject domain-appropriate grammar hints ── */
  /* Biases the browser recogniser toward technical vocabulary for the active mode */
  /* SpeechGrammarList is optional — silently ignored if unsupported               */
  try{
    const SGL=window.SpeechGrammarList||window.webkitSpeechGrammarList;
    if(SGL){
      const csTerms='array string integer linkedlist binary tree graph hashmap '
        +'twopointers slidingwindow dynamicprogramming bfs dfs backtracking '
        +'greedy heap stack queue monotonic sorting mergesort quicksort '
        +'binarysearch divide conquer recursion memoization trie segment '
        +'n squared n log n linear constant space time complexity O of n';
      const sdTerms='design twitter facebook instagram youtube uber dropbox whatsapp netflix '
        +'api gateway load balancer cache redis kafka database postgresql cassandra '
        +'microservices sharding replication consistency availability partition '
        +'rate limiting cdn message queue pub sub websocket rest grpc graphql '
        +'horizontal vertical scaling read replica nosql object storage elasticsearch '
        +'distributed system fault tolerance idempotent throughput latency';
      const terms=mode==='sd' ? sdTerms : csTerms;
      const gl=new SGL();
      gl.addFromString('#JSGF V1.0; grammar tech; public <tech> = '+terms+';',1);
      rec.grammars=gl;
    }
  }catch(e){}

  rec.onstart=()=>{
    listening=true;
    document.getElementById('micBtn').classList.add('on');
    document.getElementById('micBtn').textContent='⏹️';
    document.getElementById('wf').classList.add('on');
    document.getElementById('vs').textContent='Listening… speak the full problem, then pause';
    document.getElementById('vs').classList.add('on');
    startTimer();
  };

  rec.onresult=e=>{
    /* ── Reset silence timer: 4500ms gives time for natural mid-sentence pauses ── */
    clearTimeout(silT);
    silT=setTimeout(()=>stopMic(true),4500);

    let fin=accTxt?accTxt+' ':'',int='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const t=e.results[i][0].transcript;
      e.results[i].isFinal?(fin+=t,accTxt=fin.trim()):int=t;
    }
    const display=(accTxt+(int?' '+int:'')).trim();
    document.getElementById('tbox').textContent=display;

    /* ── Live word count so user knows input is being captured ── */
    const wc=display.split(/\s+/).filter(Boolean).length;
    document.getElementById('vs').textContent=
      wc<5 ? 'Listening… keep going' :
      wc<15? `Captured ${wc} words — keep going` :
             `Captured ${wc} words — pause when done`;
    chkBtn();
  };

  rec.onerror=e=>{
    if(e.error==='not-allowed') toast('Mic blocked — allow microphone in browser settings');
    else if(e.error==='no-speech') toast('No speech detected — speak closer to the mic');
    else toast('Mic error: '+e.error);
    stopMic(false);
  };

  /* ── Auto-restart if browser cuts mic (common on mobile after ~60s) ── */
  rec.onend=()=>{if(listening){try{rec.start();}catch(e){stopMic(false);}}};

  try{rec.start();}catch(e){toast('Cannot start mic — check browser permissions');}
}
function stopMic(auto){
  const was=listening;listening=false;clearTimeout(silT);stopTimer();
  if(rec){try{rec.stop();}catch(e){}rec=null;}
  document.getElementById('micBtn').classList.remove('on');document.getElementById('micBtn').textContent='🎙️';
  document.getElementById('wf').classList.remove('on');document.getElementById('vs').classList.remove('on');
  const txt=document.getElementById('tbox').textContent.trim();
  if(was&&auto&&txt.length>5){document.getElementById('vs').textContent='Got it — generating…';setTimeout(generate,500);}
  else{document.getElementById('vs').textContent=txt.length>5?'Ready — tap Generate':'Tap the mic and speak clearly';}
}
function chkBtn(){document.getElementById('goBtn').disabled=document.getElementById('tbox').textContent.trim().length<5;}
function clearAll(){accTxt='';document.getElementById('tbox').textContent='';document.getElementById('goBtn').disabled=true;document.getElementById('vs').textContent='Tap the mic and speak clearly';document.getElementById('rarea').innerHTML='';document.getElementById('rarea').classList.remove('on');document.getElementById('thinking').classList.remove('on');document.getElementById('sprog').classList.remove('on');document.getElementById('sbar').style.width='0%';last=null;}

/* ═══════════════════════════════════════════════════════
   GENERATE — STREAMING
═══════════════════════════════════════════════════════ */
async function generate(){
  const prob=document.getElementById('tbox').textContent.trim();
  if(prob.length<4){toast('Say or type a problem first');return;}
  const key=getKey();if(!key){toggleSetup();toast('Add API key first');return;}
  document.getElementById('goBtn').disabled=true;
  document.getElementById('rarea').innerHTML='';
  document.getElementById('rarea').classList.remove('on');
  document.getElementById('thinking').classList.add('on');
  document.getElementById('ttext').textContent=mode==='coding'?'Solving your problem…':'Architecting your system…';
  document.getElementById('sprog').classList.add('on');
  const bar=document.getElementById('sbar');bar.style.width='5%';

  /* ── INSTANT PRE-ANSWER: show within 0ms of tap, before any API call ── */
  /* Pattern-detect from problem text so user has something to say immediately */
  if(mode==='coding'){
    const prob_lower=prob.toLowerCase();
    /* Map keywords → {pattern, opening_move, timing_hint} */
    const patternHints=[
      {keys:['two sum','pair','sum equals','target sum','complement'],
       pattern:'Two Pointers / HashMap',
       opening:'Sort + two pointers for O(n log n), or HashMap for O(n). I\'ll clarify if duplicates are allowed and if we need all pairs or just one.',
       timing:'Clarify 3min → Brute O(n²) aloud → Optimal O(n) → Code 12min'},
      {keys:['substring','window','subarray','contiguous','sliding'],
       pattern:'Sliding Window',
       opening:'Classic sliding window. I\'ll expand right until invalid, then shrink left. Need to clarify: fixed or variable window? Distinct chars or sum constraint?',
       timing:'Clarify 3min → Fixed vs variable window → Code with two pointers 12min'},
      {keys:['binary search','sorted array','search','find minimum','rotated'],
       pattern:'Binary Search',
       opening:'Binary search variant. I\'ll identify the invariant: what does left always satisfy? What does right always satisfy? Mid goes to the side that violates.',
       timing:'Clarify 3min → Draw the search space → Code the termination condition 12min'},
      {keys:['tree','root','node','leaf','height','depth','bst','binary tree'],
       pattern:'Tree DFS / BFS',
       opening:'Tree traversal. I\'ll pick DFS for path/depth problems, BFS for level-order. Need to confirm: is it a BST? Are values unique?',
       timing:'Clarify 3min → Draw traversal order → Recursive + iterative 12min'},
      {keys:['graph','island','connected','path','cycle','grid','matrix','neighbors'],
       pattern:'Graph BFS/DFS',
       opening:'Graph traversal on a grid or adjacency list. I\'ll use BFS for shortest path, DFS for connected components. Need to confirm if the graph is directed.',
       timing:'Clarify 3min → Draw visited[][] → BFS/DFS with queue/stack 12min'},
      {keys:['max','min','dynamic','optimal','ways','count','dp','memo','choices'],
       pattern:'Dynamic Programming',
       opening:'DP problem. I\'ll define the state: dp[i] = ?. Then find the recurrence. Start with recursion + memoization, then convert to tabulation if asked.',
       timing:'Clarify 3min → Define state aloud → Recurrence → Code bottom-up 12min'},
      {keys:['stack','parenthesis','bracket','valid','next greater','monotonic'],
       pattern:'Monotonic Stack',
       opening:'Stack-based problem. I\'ll maintain a monotonic stack to track pending decisions. Think of it as keeping only elements that might matter for future answers.',
       timing:'Clarify 3min → Draw stack state → Code push/pop logic 12min'},
      {keys:['heap','k largest','k smallest','kth','priority','top k','stream'],
       pattern:'Heap / Priority Queue',
       opening:'Heap problem. Min-heap of size K for top-K largest. I\'ll clarify: do we need exact rank or just the set? Is input a stream or static array?',
       timing:'Clarify 3min → Heap invariant → Code with PriorityQueue 12min'},
      {keys:['interval','meeting','overlap','merge','schedule','start','end'],
       pattern:'Interval / Sweep Line',
       opening:'Interval problem. Sort by start time, then sweep. I\'ll clarify: merge overlapping, or find minimum rooms needed?',
       timing:'Clarify 3min → Sort intervals → Sweep with min-heap 12min'},
      {keys:['linked list','reverse','cycle','middle','fast','slow','pointer'],
       pattern:'Linked List / Two Pointers',
       opening:'Linked list problem. Fast/slow pointers for cycle detection or finding middle. I\'ll clarify: does modifying the list matter? Can I use extra space?',
       timing:'Clarify 3min → Draw pointer movement → Code with dummy head 12min'},
    ];
    const match=patternHints.find(h=>h.keys.some(k=>prob_lower.includes(k)));
    const hint=match||{
      pattern:'Identify the pattern first',
      opening:'I\'ll read the constraints carefully: what\'s N? Is the array sorted? Can values be negative? These answers determine the pattern.',
      timing:'Clarify 3min → Brute force aloud → Optimal → Code 12min'
    };
    const _h={p:hint.pattern, o:hint.opening, t:hint.timing};

    /* Show instant pre-card — replaced when skeleton fires */
    document.getElementById('thinking').classList.remove('on');
    document.getElementById('rarea').classList.add('on');
    document.getElementById('rarea').innerHTML=
      '<div id="instant-card" style="background:linear-gradient(135deg,var(--as),var(--sf));border:1px solid rgba(200,169,110,.4);border-radius:12px;padding:16px 18px;margin-bottom:14px">'+
      '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--ac);text-transform:uppercase;margin-bottom:8px">⚡ Instant Read — say this now, while the full solution loads</div>'+
      '<div style="font-size:13px;font-weight:700;color:var(--tp);margin-bottom:6px">Pattern: '+_h.p+'</div>'+
      '<div style="font-size:13px;color:var(--tp);line-height:1.8;margin-bottom:10px">'+_h.o+'</div>'+
      '<div style="font-size:11.5px;color:var(--ts);border-top:1px solid var(--br);padding-top:8px">⏱️ '+_h.t+'</div>'+
      '</div>'+
      '<div style="text-align:center;font-size:11.5px;color:var(--ts);font-style:italic">Full solution generating…</div>';
  }
  const sys=mode==='coding'?codingPrompt():sdPrompt();
  try{
    /* ── Build provider-specific request ── */
    const maxTok=mode==='coding'?6000:16000;
    let url,headers,body,extractDelta;

    if(provider==='anthropic'){
      url='https://api.anthropic.com/v1/messages';
      headers={'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
      body={model,max_tokens:maxTok,stream:true,system:sys,messages:[{role:'user',content:prob}]};
      extractDelta=ev=>ev.type==='content_block_delta'&&ev.delta?.text?ev.delta.text:null;
    } else if(provider==='openai'||provider==='groq'){
      url=provider==='openai'?'https://api.openai.com/v1/chat/completions':'https://api.groq.com/openai/v1/chat/completions';
      headers={'Content-Type':'application/json','Authorization':'Bearer '+key};
      body={model,max_tokens:maxTok,stream:true,messages:[{role:'system',content:sys},{role:'user',content:prob}]};
      extractDelta=ev=>ev.choices?.[0]?.delta?.content||null;
    } else if(provider==='gemini'){
      url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
      headers={'Content-Type':'application/json'};
      body={system_instruction:{parts:[{text:sys}]},contents:[{role:'user',parts:[{text:prob}]}],generationConfig:{maxOutputTokens:maxTok}};
      extractDelta=ev=>{
        const parts=ev.candidates?.[0]?.content?.parts;
        return parts?.[0]?.text||null;
      };
    }

    const res=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});
    if(!res.ok){
      let msg='API error '+res.status;
      try{const e=await res.json();msg=e.error?.message||e.message||msg;}catch(e){}
      throw new Error(msg);
    }
    const reader=res.body.getReader(),dec=new TextDecoder();
    let full='',pct=5,dk=new Set(),lineBuf='';
    /* Show skeleton immediately */
    document.getElementById('thinking').classList.remove('on');
    showSkeleton();
    document.getElementById('rarea').classList.add('on');

    while(true){
      const{done,value}=await reader.read();
      const chunk=value?dec.decode(value,{stream:true}):(done?dec.decode():'');
      lineBuf+=chunk;
      const lines=lineBuf.split('\n');
      lineBuf=lines.pop()||'';
      for(const ln of lines){
        if(!ln.startsWith('data: '))continue;
        const d=ln.slice(6).trim();
        if(d==='[DONE]')continue;
        try{
          const ev=JSON.parse(d);
          const text=extractDelta(ev);
          if(text){
            full+=text;
            pct=Math.min(90,pct+0.15);
            bar.style.width=pct+'%';
            patch(full,dk);
          }
        }catch(e){}
      }
      if(done)break;
    }
    /* Drain remaining buffer */
    if(lineBuf.startsWith('data: ')){
      const d=lineBuf.slice(6).trim();
      if(d&&d!=='[DONE]'){try{const ev=JSON.parse(d);const text=extractDelta(ev);if(text)full+=text;}catch(e){}}
    }

    bar.style.width='100%';
    setTimeout(()=>{document.getElementById('sprog').classList.remove('on');bar.style.width='0%';},500);

    /* Multi-strategy JSON parse */
    let parsed=null;
    const tryP=s=>{try{return JSON.parse(s);}catch(e){return null;}};
    let c=full.trim()
      .replace(/^[`]{3}json\s*/i,'').replace(/^[`]{3}\s*/,'').replace(/\s*[`]{3}$/,'')
      .replace(/^[`]+/,'').replace(/[`]+$/,'').trim();
    /* Strategy 1: direct parse */
    parsed=tryP(c);
    /* Strategy 2: extract outermost {} */
    if(!parsed){const fi=c.indexOf('{'),la=c.lastIndexOf('}');if(fi>=0&&la>fi)parsed=tryP(c.slice(fi,la+1));}
    /* Strategy 3: fix trailing commas */
    if(!parsed){const fi=c.indexOf('{'),la=c.lastIndexOf('}');if(fi>=0&&la>fi){const s=c.slice(fi,la+1).replace(/,\s*([}\]])/g,'$1');parsed=tryP(s);}}
    /* Strategy 4: remove JS comments + trailing commas */
    if(!parsed){const fi=c.indexOf('{'),la=c.lastIndexOf('}');if(fi>=0&&la>fi){const s=c.slice(fi,la+1).replace(/\/\/[^\n]*/g,'').replace(/,\s*([}\]])/g,'$1');parsed=tryP(s);}}
    /* Strategy 5: for SD mode, also try extracting first complete {...} block */
    if(!parsed&&mode==='sd'){
      const m=c.match(/\{[\s\S]*\}/);
      if(m){parsed=tryP(m[0])||tryP(m[0].replace(/,\s*([}\]])/g,'$1'));}
    }

    if(parsed){
      last={mode,data:parsed};
      mode==='coding'?renderCoding(parsed):renderSD(parsed);
    }else{
      document.getElementById('rarea').innerHTML=
        '<div class="err-box">&#9888; Could not parse response.'+(full.length<50?' Response empty — check API key.':' Model returned unexpected format. Tap Generate to retry.')
        +'<br><small style="color:var(--ts)">Provider: '+provider+' · Model: '+model+'</small><br><br>'
        +'<details><summary style="cursor:pointer;font-weight:600">Show raw response ('+full.length+' chars)</summary>'+
        '<pre style="white-space:pre-wrap;word-break:break-word;font-size:10px;margin-top:6px;max-height:300px;overflow-y:auto">'+
        full.slice(0,2000).replace(/&/g,'&amp;').replace(/</g,'&lt;')+
        '</pre></details></div>';
    }
  }catch(err){
    document.getElementById('thinking').classList.remove('on');
    document.getElementById('rarea').innerHTML='<div class="err-box">⚠️ '+err.message+'</div>';
    document.getElementById('rarea').classList.add('on');
    document.getElementById('sprog').classList.remove('on');
  }finally{
    document.getElementById('goBtn').disabled=false;
    document.getElementById('thinking').classList.remove('on');
    document.getElementById('vs').textContent='Tap mic to record again';
  }
}

/* ═══════════════════════════════════════════════════════
   STREAM PATCH — renders content progressively as tokens arrive.
   Uses TWO extraction strategies:
   A) strComplete — only fires when JSON string is fully closed (safe for short fields)
   B) strPartial  — fires as soon as MIN_CHARS arrived (for long fields like thought_process)
   Priority: problem_statement (partial, ~40 chars) → FR items → NFR items → thought_process
═══════════════════════════════════════════════════════ */
function patch(txt,dk){
  /* A: fully-closed string — safe value */
  const strComplete=key=>{
    const m=txt.match(new RegExp('"'+key+'"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*?)"\\s*[,}\\n]','s'));
    return m?unescape(m[1]):null;
  };
  /* B: partial string — grab whatever has arrived so far (no closing quote required) */
  const strPartial=(key,minLen=40)=>{
    const m=txt.match(new RegExp('"'+key+'"\\s*:\\s*"((?:[^"\\\\]|\\\\.){'+minLen+',})','s'));
    return m?unescape(m[1]):null;
  };
  const unescape=s=>s.replace(/\\n/g,'\n').replace(/\\"/g,'"').replace(/\\\\/g,'\\');

  /* Write to a named slot, removing skeleton shimmer lines */
  const slot=(id,html)=>{
    const el=document.getElementById(id);
    if(!el||el.dataset.filled)return;
    el.dataset.filled='1';
    el.innerHTML=html;
    el.classList.add('fadein');
  };

  if(mode==='coding'){
    /* ── Stream these fields as tokens arrive, in priority order ── */
    /* Fields early in the JSON (pattern, summary, complexity) fire in the first 2-3 seconds */
    /* Fields later (thought_process, analogy, optimization_path) fire at 4-8 seconds        */

    /* SLOT 1 — pattern: very early in JSON, fires ~1s */
    if(!dk.has('pattern')){
      const v=strComplete('pattern')||strPartial('pattern',5);
      if(v&&v.length>3){dk.add('pattern');slot('sk_pattern','🏷️ Pattern: <strong>'+v+'</strong>');}
    }
    /* SLOT 2 — summary: fires ~2-3s */
    if(!dk.has('summary')){
      const v=strComplete('summary')||strPartial('summary',20);
      if(v&&v.length>10){dk.add('summary');slot('sk_summary',v.replace(/\n/g,'<br>'));}
    }
    /* SLOT 3 — complexity: fires ~3s */
    if(!dk.has('complexity')){
      const v=strComplete('complexity')||strPartial('complexity',10);
      if(v&&v.length>5){dk.add('complexity');slot('sk_complexity',v.replace(/\n/g,'<br>'));}
    }
    /* SLOT 4 — optimization_path (brute→optimal): fires ~4-6s — KEY for talking aloud */
    if(!dk.has('optimization_path')){
      const v=strComplete('optimization_path')||strPartial('optimization_path',40);
      if(v&&v.length>20){dk.add('optimization_path');slot('sk_optimization_path',v.replace(/\n/g,'<br>'));}
    }
    /* SLOT 5 — interviewer_timing: fires ~5-6s — user can narrate this to the interviewer */
    if(!dk.has('interviewer_timing')){
      const v=strComplete('interviewer_timing')||strPartial('interviewer_timing',30);
      if(v&&v.length>10){dk.add('interviewer_timing');slot('sk_interviewer_timing',v.replace(/\n/g,'<br>').replace(/\|/g,'&nbsp;·&nbsp;'));}
    }
    /* SLOT 6 — thought_process: fires ~5-8s — the full first-person approach */
    if(!dk.has('thought_process')){
      const v=strComplete('thought_process')||strPartial('thought_process',30);
      if(v&&v.length>15){dk.add('thought_process');slot('sk_thought_process',v.replace(/\n/g,'<br>'));}
    }
    /* SLOT 7 — analogy: fires ~8-10s */
    if(!dk.has('analogy')){
      const v=strComplete('analogy')||strPartial('analogy',20);
      if(v&&v.length>10){dk.add('analogy');slot('sk_analogy',v.replace(/\n/g,'<br>'));}
    }
    return;
  }

  /* ── SD mode ── */

  /* PRIORITY 1: problem_statement — partial, fires as soon as ~50 chars arrive (~1s) */
  if(!dk.has('ps')){
    const v=strComplete('problem_statement')||strPartial('problem_statement',50);
    if(v&&v.length>15){dk.add('ps');slot('sk_ps',v);}
  }

  /* PRIORITY 2: functional requirements — parse objects as each closes */
  if(!dk.has('fr')){
    const m=txt.match(/"functional"\s*:\s*\[([\s\S]*?)(?:\]|(?="non_functional"))/);
    if(m&&m[1]){
      const reqs=[];let rx2=/"req"\s*:\s*"([^"\\\\]+)"/g,hit;
      while((hit=rx2.exec(m[1]))!==null)reqs.push(hit[1]);
      if(reqs.length>=1){
        dk.add('fr');
        /* Don't lock — keep updating until NFR starts */
        const el=document.getElementById('sk_fr');
        if(el){el.innerHTML=reqs.map(r=>'<div class="hrow fadein">🔵 '+r+'</div>').join('');el.classList.add('fadein');}
      }
    }
  }

  /* PRIORITY 3: NFRs — same rolling parse */
  if(!dk.has('nfr')){
    const m=txt.match(/"non_functional"\s*:\s*\[([\s\S]*?)(?:\]|(?="out_of_scope"))/);
    if(m&&m[1]){
      const items=[];let pos=0;
      while(true){
        const s=m[1].indexOf('"req"',pos);if(s<0)break;
        const rM=m[1].slice(s).match(/"req"\s*:\s*"([^"\\\\]+)"/);
        const vM=m[1].slice(s).match(/"value"\s*:\s*"([^"\\\\]+)"/);
        if(rM)items.push({r:rM[1],v:vM?vM[1]:''});
        pos=s+5;
      }
      if(items.length>=1){
        dk.add('nfr');
        const el=document.getElementById('sk_nfr');
        if(el){el.innerHTML=items.map(i=>'<div class="hrow fadein">◎ <strong>'+i.r+'</strong>'+(i.v?' <span class="badge ba">'+i.v+'</span>':'')+'</div>').join('');el.classList.add('fadein');}
      }
    }
  }

  /* PRIORITY 4: capacity — plain_english text first, then number tiles */
  if(!dk.has('cap_text')){
    const pe=strComplete('plain_english')||strPartial('plain_english',60);
    if(pe&&pe.length>30){
      dk.add('cap_text');
      const el=document.getElementById('sk_cap');
      if(el){el.innerHTML='<div style="font-size:12.5px;line-height:1.75;color:var(--tp)">'+pe+'</div>';el.classList.add('fadein');}
    }
  }
  /* PRIORITY 5: capacity number tiles */
  if(!dk.has('cap')){
    const wq=strComplete('write_qps'), rq=strComplete('read_qps'), st=strComplete('storage_per_year');
    const assM=txt.match(/"assumptions"\s*:\s*\[([\s\S]*?)(?:\])/);
    const assumptions=[];
    if(assM){let rx3=/"([^"]+)"/g,h2;while((h2=rx3.exec(assM[1]))!==null)assumptions.push(h2[1]);}
    if(wq&&rq){
      dk.add('cap');
      const el=document.getElementById('sk_cap');
      if(el){
        el.innerHTML=
          (assumptions.length?assumptions.map(a=>'<div style="font-size:11.5px;color:var(--ts);margin-bottom:3px">• '+a+'</div>').join(''):'') +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'+
          '<div style="flex:1;min-width:110px;background:var(--os);border-radius:7px;padding:8px 10px"><div style="font-size:9px;font-weight:700;color:var(--orange);letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px">✍️ Write QPS</div><div style="font-size:12px;font-weight:700">'+wq+'</div></div>'+
          '<div style="flex:1;min-width:110px;background:var(--bs);border-radius:7px;padding:8px 10px"><div style="font-size:9px;font-weight:700;color:var(--blue);letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px">📖 Read QPS</div><div style="font-size:12px;font-weight:700">'+rq+'</div></div>'+
          (st?'<div style="flex:1;min-width:110px;background:var(--gs);border-radius:7px;padding:8px 10px"><div style="font-size:9px;font-weight:700;color:var(--green);letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px">💾 Storage/yr</div><div style="font-size:12px;font-weight:700">'+st+'</div></div>':'')+
          '</div>';
        el.classList.add('fadein');
      }
    }
  }

  /* PRIORITY 5: thought_process — partial after 80 chars (~5-6s) */
  if(!dk.has('tp')){
    const v=strComplete('thought_process')||strPartial('thought_process',80);
    if(v&&v.length>40){dk.add('tp');slot('sk_tp',v.replace(/\n/g,'<br>'));}
  }

  /* PRIORITY 6: clarifying questions — stream as each object closes */
  if(!dk.has('cq')){
    const m=txt.match(/"clarifying_questions"\s*:\s*\[([\s\S]*?)(?:\]|(?="step1_requirements"))/);
    if(m&&m[1]){
      const items=[];let rx=/"q"\s*:\s*"([^"\\]+)"/g,hit;
      while((hit=rx.exec(m[1]))!==null)items.push(hit[1]);
      if(items.length>=1){
        dk.add('cq');
        const el=document.getElementById('sk_cq');
        if(el){el.innerHTML=items.map((q,i)=>'<div class="hrow fadein"><strong>Q'+(i+1)+':</strong> '+q+'</div>').join('');el.classList.add('fadein');}
      }
    }
  }

  /* PRIORITY 7: out_of_scope — stream as array closes */
  if(!dk.has('oos')){
    const m=txt.match(/"out_of_scope"\s*:\s*\[([\s\S]*?)\]/);
    if(m&&m[1]){
      const items=[];let rx=/"([^"\\]+)"/g,hit;
      while((hit=rx.exec(m[1]))!==null)items.push(hit[1]);
      if(items.length>=1){
        dk.add('oos');
        const el=document.getElementById('sk_oos');
        if(el){el.innerHTML=items.map(o=>'<span class="pill">✗ '+o+'</span>').join('');el.classList.add('fadein');}
      }
    }
  }

  /* PRIORITY 8: capacity plain_english — fires as soon as ~60 chars arrive */
  if(!dk.has('cap_txt')){
    const v=strComplete('plain_english')||strPartial('plain_english',60);
    if(v&&v.length>40){
      dk.add('cap_txt');
      const el=document.getElementById('sk_cap_txt');
      if(el){el.innerHTML=v;el.classList.add('fadein');}
    }
  }
}

/* ═══════════════════════════════════════════════════════
   SKELETON — shown instantly before any stream arrives
═══════════════════════════════════════════════════════ */
function showSkeleton(){
  const a=document.getElementById('rarea');
  if(mode==='coding'){
    /* Preserve the instant-card if it exists so it stays visible during skeleton loading */
    const _existingCard=document.getElementById('instant-card');
    const _cardHtml=_existingCard?_existingCard.outerHTML:'';
    a.innerHTML=_cardHtml+`<div style="padding-top:8px">
      <div class="iblock blue"><div class="blbl">🧠 Approach</div><div id="sk_thought_process"><div class="skel" style="width:100%"></div><div class="skel" style="width:84%"></div><div class="skel" style="width:66%"></div></div></div>
      <div class="iblock green"><div class="blbl">💡 Analogy</div><div id="sk_analogy"><div class="skel" style="width:100%"></div><div class="skel" style="width:72%"></div></div></div>
      <div class="sumbox" id="sk_summary"><div class="skel" style="width:100%"></div><div class="skel" style="width:55%"></div></div>
      <div id="sk_pattern" style="font-size:12px;color:var(--ac);font-weight:600;padding:2px 0 4px"><div class="skel" style="width:40%"></div></div>
      <div id="sk_complexity" style="font-size:12.5px;color:var(--ts);padding:2px 0 4px"><div class="skel" style="width:76%"></div><div class="skel" style="width:52%"></div></div>
      <div class="iblock" style="background:var(--os);border-left:3px solid var(--orange)"><div class="blbl">🗺️ Brute → Optimal Path</div><div id="sk_optimization_path"><div class="skel" style="width:100%"></div><div class="skel" style="width:88%"></div><div class="skel" style="width:70%"></div></div></div>
      <div style="background:var(--sf);border:1px solid var(--br);border-radius:8px;padding:10px 13px;margin-bottom:10px"><div class="blbl" style="margin-bottom:6px">⏱️ Interview Timing</div><div id="sk_interviewer_timing" style="font-size:12px;color:var(--ts);line-height:1.8"><div class="skel" style="width:90%"></div><div class="skel" style="width:70%"></div></div></div>
      <div style="text-align:center;font-size:11px;color:var(--ts);font-style:italic;padding:6px 0">⏳ Full solution loading…</div></div>`;
  } else {
    a.innerHTML=`<div style="padding-top:12px">

      <!-- CLARIFYING QUESTIONS (~1s) -->
      <div class="sublbl">❓ Clarifying Questions to Ask First <span style="font-size:9px;font-weight:400;color:var(--ts)">(ask these before drawing anything)</span></div>
      <div id="sk_cq"><div class="skel" style="width:88%"></div><div class="skel" style="width:72%"></div><div class="skel" style="width:80%"></div></div>

      <!-- Problem statement (~1-2s) -->
      <div class="sumbox" id="sk_ps" style="min-height:52px;margin-top:10px"><div class="skel" style="width:100%"></div><div class="skel" style="width:68%"></div></div>

      <!-- FRs (~2-3s) -->
      <div class="sublbl">🔵 Functional Requirements</div>
      <div id="sk_fr"><div class="skel" style="width:90%"></div><div class="skel" style="width:76%"></div><div class="skel" style="width:83%"></div></div>

      <!-- NFRs (~3-4s) -->
      <div class="sublbl">◎ Non-Functional Requirements</div>
      <div id="sk_nfr"><div class="skel" style="width:86%"></div><div class="skel" style="width:72%"></div><div class="skel" style="width:79%"></div></div>

      <!-- Out of scope (~3-4s) -->
      <div class="sublbl">✗ Out of Scope</div>
      <div id="sk_oos" class="pill-row"><div class="skel" style="width:60%;height:22px;border-radius:11px;display:inline-block;margin-right:6px"></div><div class="skel" style="width:40%;height:22px;border-radius:11px;display:inline-block"></div></div>

      <!-- Capacity (~4-5s) -->
      <div class="sublbl">📊 Scale & Capacity</div>
      <div style="background:var(--sf);border:1px solid var(--br);border-radius:10px;padding:11px 13px;margin-bottom:10px">
        <div id="sk_cap_txt" style="font-size:13px;line-height:1.7;color:var(--tp);margin-bottom:10px"><div class="skel" style="width:100%"></div><div class="skel" style="width:80%"></div><div class="skel" style="width:65%"></div></div>
        <div id="sk_cap" style="display:flex;gap:8px;flex-wrap:wrap">
          <div style="flex:1;min-width:110px"><div class="skel" style="width:100%;height:36px;border-radius:7px"></div></div>
          <div style="flex:1;min-width:110px"><div class="skel" style="width:100%;height:36px;border-radius:7px"></div></div>
          <div style="flex:1;min-width:110px"><div class="skel" style="width:100%;height:36px;border-radius:7px"></div></div>
        </div>
      </div>

      <!-- Interview framing (~5-6s) -->
      <div class="sublbl">🧠 Interview Framing</div>
      <div class="iblock blue" id="sk_tp"><div class="skel" style="width:100%"></div><div class="skel" style="width:88%"></div><div class="skel" style="width:70%"></div><div class="skel" style="width:80%"></div></div>

      <div style="text-align:center;font-size:11px;color:var(--ts);font-style:italic;padding:10px 0">⏳ Full design with diagrams loading…</div></div>`;
  }
}

/* ═══════════════════════════════════════════════════════
   TAB HELPERS
═══════════════════════════════════════════════════════ */
function ptabBar(pairs){let h='<div class="ptabs">';for(let i=0;i<pairs.length;i+=2)h+=`<div class="ptab${i===0?' on':''}" data-t="${pairs[i]}" data-idx="${i/2}" onclick="switchP(this)">${pairs[i+1]}</div>`;return h+'</div>';}
function switchP(el){var root=el.closest('.sd-card-root')||el.closest('#rarea')||document;var idx=parseInt(el.dataset.idx||'0');root.querySelectorAll('.ptab').forEach((t,i)=>t.classList.toggle('on',i===idx));root.querySelectorAll('.ppanel').forEach((p,i)=>p.classList.toggle('on',i===idx));}
function toggleQA(el){el.classList.toggle('open');el.querySelector('.chev').classList.toggle('open');el.nextElementSibling.classList.toggle('open');}
function wireSubTabs(container){
  const tabs=[...container.querySelectorAll(':scope > .stab-row > .stab')];
  const panels=[...container.querySelectorAll(':scope > .spanel')];
  tabs.forEach((t,i)=>{t.onclick=()=>{tabs.forEach(x=>x.classList.remove('on'));panels.forEach(x=>x.classList.remove('on'));t.classList.add('on');panels[i]?.classList.add('on');};});
}

/* ═══════════════════════════════════════════════════════
   SPEAK MODE
═══════════════════════════════════════════════════════ */
function openSM(){
  if(!last)return;
  const{mode:m,data:d}=last;let h='';
  if(m==='coding'){
    h+=sc('🧠 How I Approached It',d.thought_process);h+=sc('🎯 One-Liner',d.summary);h+=sc('💡 Analogy',d.analogy);
    h+=sc('🔑 Key Steps',(d.steps||[]).map((s,i)=>(i+1)+'. '+s.title+' — '+s.why).join('\n'));
    h+=sc('⚡ Complexity',d.complexity_explanation);
    h+=sc('⚠️ Gotchas',(d.tricky_parts||[]).map(t=>'• '+t.issue+': '+String(t.explanation).slice(0,140)).join('\n'));
  }else{
    const sg=d.speak_guide||{},r=d.step1_requirements||{};
    h+=sc('🎬 Opening (say this verbatim)',sg.opening_script||'');
    h+=sc('💡 The Key Insight',sg.key_insight||'');
    h+=sc('📋 Requirements to State',[...(r.functional||[]).map(f=>'🔵 '+f.req),'─',...(r.non_functional||[]).map(n=>'◎ '+n.req+' ('+n.value+')')].join('\n'));
    const allFlow=[];(d.hld_sections||[]).forEach(s=>(s.flow_steps||[]).forEach(f=>allFlow.push(f)));h+=sc('🏗️ FR-by-FR Flow',allFlow.join('\n'));
    h+=sc('🔬 Deep Dives to Hit',(d.step6_deep_dives||[]).map(dd=>'• '+dd.topic+': '+String(dd.real_solution).slice(0,130)).join('\n'));
    h+=sc('⚠️ Mistakes to Avoid',(sg.common_mistakes||[]).map(m=>'• '+m).join('\n'));
    h+=sc('🏁 Closing (say this)',sg.closing_script||'');
    if(sg.interview_timing)h+=sc('⏱ Section Timing',sg.interview_timing||'');
  }
  document.getElementById('smc').innerHTML=h;document.getElementById('sovl').classList.add('on');
}
function closeSM(){document.getElementById('sovl').classList.remove('on');}
function sc(lbl,txt){return '<div class="sc"><div class="sc-lbl">'+lbl+'</div><div class="sc-txt">'+String(txt||'').replace(/\n/g,'<br>')+'</div></div>';}

