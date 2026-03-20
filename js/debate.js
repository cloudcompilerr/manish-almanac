/* ═══════════════════════════════════════════════════════
   DEBATE ARENA
═══════════════════════════════════════════════════════ */
const DB_PROVIDERS={
  anthropic:{label:'Claude',icon:'🟠',color:'#b06020',
    models:['claude-sonnet-4-20250514','claude-haiku-4-5-20251001'],
    mLabel:{'claude-sonnet-4-20250514':'Sonnet 4.5','claude-haiku-4-5-20251001':'Haiku 4.5'},
    rank:2},
  openai:{label:'GPT-4o',icon:'🟢',color:'#3d7a52',
    models:['gpt-4o','gpt-4o-mini'],
    mLabel:{'gpt-4o':'GPT-4o','gpt-4o-mini':'GPT-4o mini'},
    rank:2},
  gemini:{label:'Gemini',icon:'🔵',color:'#2d5fa0',
    models:['gemini-2.0-flash','gemini-1.5-pro'],
    mLabel:{'gemini-2.0-flash':'2.0 Flash','gemini-1.5-pro':'1.5 Pro'},
    rank:1},
  groq:{label:'Groq/Llama',icon:'🟣',color:'#6040a0',
    models:['llama-3.3-70b-versatile','mixtral-8x7b-32768'],
    mLabel:{'llama-3.3-70b-versatile':'Llama 3.3 70B','mixtral-8x7b-32768':'Mixtral 8x7B'},
    rank:1}
};

let dbSelected={};
let dbJudgeMode='best';
let dbRounds=1;

var _debateWired=false;
var _dbMicRec=null;
var _dbListening=false,_dbSilT=null,_dbTimerI=null,_dbElapsed=0,_dbAccTxt='';
function _dbStartTimer(){_dbElapsed=0;clearInterval(_dbTimerI);_dbTimerI=setInterval(function(){_dbElapsed++;document.getElementById('db-vtimer').textContent=pad(Math.floor(_dbElapsed/60))+':'+pad(_dbElapsed%60);},1000);}
function _dbStopTimer(){clearInterval(_dbTimerI);document.getElementById('db-vtimer').textContent='';}
function _dbMicOff(){
  _dbListening=false;clearTimeout(_dbSilT);_dbStopTimer();
  if(_dbMicRec){try{_dbMicRec.stop();}catch(e){}}_dbMicRec=null;
  var btn=document.getElementById('db-mic-btn');
  btn.classList.remove('on');btn.textContent='🎙️';
  document.getElementById('db-wf').classList.remove('on');
  document.getElementById('db-vs').classList.remove('on');
}
function toggleDbMic(){
  if(_dbListening){
    _dbMicOff();
    var txt=document.getElementById('db-question').value.trim();
    document.getElementById('db-vs').textContent=txt.length>5?'Ready — tap Start':'Tap the mic and speak clearly';
    return;
  }
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Voice not supported — type instead');return;}
  _dbAccTxt=document.getElementById('db-question').value.trim();
  _dbMicRec=new SR();_dbMicRec.continuous=true;_dbMicRec.interimResults=true;_dbMicRec.lang='en-US';
  _dbMicRec.onstart=function(){
    _dbListening=true;
    var btn=document.getElementById('db-mic-btn');
    btn.classList.add('on');btn.textContent='⏹️';
    document.getElementById('db-wf').classList.add('on');
    document.getElementById('db-vs').textContent='Listening… speak clearly';
    document.getElementById('db-vs').classList.add('on');
    _dbStartTimer();
  };
  _dbMicRec.onresult=function(e){
    clearTimeout(_dbSilT);_dbSilT=setTimeout(function(){_dbMicOff();_dbAutoSubmitDb();},2800);
    var fin=_dbAccTxt?_dbAccTxt+' ':'',interim='';
    for(var i=e.resultIndex;i<e.results.length;i++){
      var t=e.results[i][0].transcript;
      if(e.results[i].isFinal){fin+=t;_dbAccTxt=fin.trim();}else{interim=t;}
    }
    document.getElementById('db-question').value=(_dbAccTxt+(interim?' '+interim:'')).trim();
    autoDetectDomain();checkDbReady();
  };
  _dbMicRec.onerror=function(e){if(e.error==='not-allowed')toast('Mic blocked — allow in browser settings');_dbMicOff();};
  _dbMicRec.onend=function(){if(_dbListening){try{_dbMicRec.start();}catch(e){_dbMicOff();}}};
  try{_dbMicRec.start();}catch(e){toast('Cannot start mic');}
}
function _dbAutoSubmitDb(){
  var txt=document.getElementById('db-question').value.trim();
  if(txt.length>5){
    document.getElementById('db-vs').textContent='Got it — starting…';
    setTimeout(runDebate,500);
  } else {
    document.getElementById('db-vs').textContent='Tap the mic and speak clearly';
  }
}
function clearDbQuestion(){
  _dbAccTxt='';_dbMicOff();
  document.getElementById('db-question').value='';
  document.getElementById('db-vs').textContent='Tap the mic and speak clearly';
  checkDbReady();
}
function _wireDebate(){
  if(_debateWired)return;
  _debateWired=true;
  document.getElementById('judgeRow').addEventListener('click',function(e){
    var chip=e.target.closest('.judge-chip');if(!chip)return;
    document.querySelectorAll('#judgeRow .judge-chip').forEach(function(c){c.classList.remove('on');});
    chip.classList.add('on');
    dbJudgeMode=chip.dataset.j;
    document.getElementById('judgeDesc').textContent=judgeDescs[dbJudgeMode];
  });
  document.getElementById('roundsRow').addEventListener('click',function(e){
    var chip=e.target.closest('.judge-chip');if(!chip)return;
    document.querySelectorAll('#roundsRow .judge-chip').forEach(function(c){c.classList.remove('on');});
    chip.classList.add('on');
    dbRounds=parseInt(chip.dataset.r);
  });
  document.getElementById('db-question').addEventListener('input',function(){
    autoDetectDomain();
    checkDbReady();
  });
  document.getElementById('debateBack').addEventListener('click',closeDebate);
  buildDomainRow();
}
function openDebate(){
  _wireDebate();
  document.getElementById('list').style.display='none';
  document.getElementById('debate').classList.add('open');
  buildProviderGrid();
}
function closeDebate(){
  document.getElementById('debate').classList.remove('open');
  document.getElementById('list').style.display='block';
}

function saveDbKey(provKey,val){
  var k=val.trim();
  try{if(k)localStorage.setItem('nt_v6_key_'+provKey,k);else localStorage.removeItem('nt_v6_key_'+provKey);}
  catch(e){}
  if(k)APP.provider._memKeys[provKey]=k;else delete APP.provider._memKeys[provKey];
}

function buildProviderGrid(){
  const grid=document.getElementById('db-prov-grid');
  grid.innerHTML='';
  Object.entries(DB_PROVIDERS).forEach(function(entry){
    const pkey=entry[0],cfg=entry[1];
    const hasKey=!!getDbKey(pkey);
    const sel=!!dbSelected[pkey];
    const curModel=dbSelected[pkey]||cfg.models[0];
    const div=document.createElement('div');
    div.className='db-pcard'+(sel?' sel':'');
    div.id='dbcard_'+pkey;

    var opts=cfg.models.map(function(m){
      return '<option value="'+m+'"'+(m===curModel?' selected':'')+'>'+(cfg.mLabel[m]||m)+'</option>';
    }).join('');

    var statusCls=hasKey?'has-key':'no-key';
    var statusTxt=hasKey?'✓ Key saved':'Tap key icon to add key';

    div.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between">'
        +'<div>'
          +'<div class="db-pcard-name">'+cfg.icon+' '+cfg.label+'</div>'
          +'<div class="db-pcard-status '+statusCls+'">'+statusTxt+'</div>'
        +'</div>'
        +'<button class="db-key-toggle" id="dkbtn_'+pkey+'" title="Add / edit API key" '
          +'style="background:none;border:1.5px solid var(--br);border-radius:7px;padding:4px 8px;font-size:14px;cursor:pointer;color:'+(hasKey?'var(--green)':'var(--ts)')+'">🔑</button>'
      +'</div>'
      +'<select class="db-model-sel" id="dbm_'+pkey+'">'+opts+'</select>'
      +'<div class="db-key-row" id="dkrow_'+pkey+'">'
        +'<div class="db-key-hint" id="dkhint_'+pkey+'">'+cfg.hint+'</div>'
        +'<input class="db-key-inp" id="dkinp_'+pkey+'" type="password" placeholder="'+cfg.placeholder+'" value="'+(getDbKey(pkey)||'')+'">'
        +'<div class="db-key-btns">'
          +'<button class="db-key-save" id="dksave_'+pkey+'">Save key</button>'
          +'<button class="db-key-clear" id="dkclear_'+pkey+'">Clear</button>'
        +'</div>'
      +'</div>';

    /* Toggle key panel */
    div.querySelector('#dkbtn_'+pkey).addEventListener('click',function(e){
      e.stopPropagation();
      var row=document.getElementById('dkrow_'+pkey);
      var isOpen=row.classList.toggle('open');
      div.classList.toggle('key-open',isOpen);
      if(isOpen){
        var inp=document.getElementById('dkinp_'+pkey);
        if(inp){inp.focus();inp.select();}
      }
    });

    /* Save */
    div.querySelector('#dksave_'+pkey).addEventListener('click',function(e){
      e.stopPropagation();
      var inp=document.getElementById('dkinp_'+pkey);
      if(!inp)return;
      saveDbKey(pkey,inp.value);
      document.getElementById('dkrow_'+pkey).classList.remove('open');
      div.classList.remove('key-open');
      buildProviderGrid(); /* refresh card */
    });

    /* Clear */
    div.querySelector('#dkclear_'+pkey).addEventListener('click',function(e){
      e.stopPropagation();
      var inp=document.getElementById('dkinp_'+pkey);
      if(inp)inp.value='';
      saveDbKey(pkey,'');
      delete dbSelected[pkey];
      document.getElementById('dkrow_'+pkey).classList.remove('open');
      div.classList.remove('key-open');
      buildProviderGrid();
    });

    /* Card tap = toggle selection (only if has key) */
    div.addEventListener('click',function(){toggleDbProvider(pkey);});

    /* Stop model select bubbling */
    div.querySelector('select').addEventListener('click',function(e){e.stopPropagation();});
    div.querySelector('select').addEventListener('change',function(e){
      e.stopPropagation();
      if(dbSelected[pkey])dbSelected[pkey]=e.target.value;
    });

    grid.appendChild(div);
  });
  checkDbReady();
}

function toggleDbProvider(pkey){
  if(!getDbKey(pkey)){
    /* Open key panel instead of showing toast */
    var row=document.getElementById('dkrow_'+pkey);
    var card=document.getElementById('dbcard_'+pkey);
    if(row){
      row.classList.add('open');
      if(card)card.classList.add('key-open');
      var inp=document.getElementById('dkinp_'+pkey);
      if(inp){inp.focus();inp.select();}
    }
    return;
  }
  if(dbSelected[pkey]){delete dbSelected[pkey];}
  else{
    var sel=document.getElementById('dbm_'+pkey);
    dbSelected[pkey]=sel?sel.value:DB_PROVIDERS[pkey].models[0];
  }
  buildProviderGrid();
}

function getDbKey(p){
  try{return localStorage.getItem('nt_v6_key_'+p)||APP.provider._memKeys[p]||'';}
  catch(e){return APP.provider._memKeys[p]||'';}
}

var judgeDescs={
  best:'The most capable selected model acts as final judge and synthesizer.',
  majority:'The position most models agreed on is declared the winner.',
  meta:'A dedicated orchestrator call reads all answers and critiques and builds a synthesis from scratch.'
};




function checkDbReady(){
  var n=Object.keys(dbSelected).length;
  var ok=n>=1&&document.getElementById('db-question').value.trim().length>5;
  document.getElementById('db-run-btn').disabled=!ok;
  var btn=document.getElementById('db-run-btn');
  btn.textContent=n===1?'🤖 Ask Expert':'⚔️ Start Debate';
}

async function dbCall(providerKey,modelName,systemPrompt,userMsg){
  var key=getDbKey(providerKey);
  if(!key)throw new Error('No key for '+providerKey);
  var maxTok=5000;
  var url,headers,body,extractText;

  if(providerKey==='anthropic'){
    url='https://api.anthropic.com/v1/messages';
    headers={'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    body={model:modelName,max_tokens:maxTok,system:systemPrompt,messages:[{role:'user',content:userMsg}]};
    extractText=function(r){return r.content&&r.content[0]?r.content[0].text||'':'';};
  } else if(providerKey==='openai'||providerKey==='groq'){
    url=providerKey==='openai'?'https://api.openai.com/v1/chat/completions':'https://api.groq.com/openai/v1/chat/completions';
    headers={'Content-Type':'application/json','Authorization':'Bearer '+key};
    body={model:modelName,max_tokens:maxTok,messages:[{role:'system',content:systemPrompt},{role:'user',content:userMsg}]};
    extractText=function(r){return r.choices&&r.choices[0]&&r.choices[0].message?r.choices[0].message.content||'':'';};
  } else if(providerKey==='gemini'){
    url='https://generativelanguage.googleapis.com/v1beta/models/'+modelName+':generateContent?key='+key;
    headers={'Content-Type':'application/json'};
    body={system_instruction:{parts:[{text:systemPrompt}]},contents:[{role:'user',parts:[{text:userMsg}]}],generationConfig:{maxOutputTokens:maxTok}};
    extractText=function(r){
      return r.candidates&&r.candidates[0]&&r.candidates[0].content&&r.candidates[0].content.parts?
        r.candidates[0].content.parts[0].text||'':'';
    };
  }

  var res=await fetch(url,{method:'POST',headers:headers,body:JSON.stringify(body)});
  if(!res.ok){
    var msg='API error '+res.status;
    try{var e=await res.json();msg=e.error&&e.error.message?e.error.message:msg;}catch(ex){}
    throw new Error(DB_PROVIDERS[providerKey].label+': '+msg);
  }
  var data=await res.json();
  return extractText(data);
}

function dbEl(id){return document.getElementById(id);}

function addPhaseBanner(container,cls,text){
  var d=document.createElement('div');
  d.className='phase-banner '+cls;
  d.innerHTML='<span class="spin"></span> '+text;
  container.appendChild(d);
  return d;
}
function finishBanner(el,text){
  el.innerHTML=text;
  el.classList.remove('p1','p2','p3');
  el.classList.add('done');
}

function addModelCard(container,provKey,modelName){
  var cfg=DB_PROVIDERS[provKey];
  var id='mac_'+provKey;
  var card=document.createElement('div');
  card.className='model-answer';card.id=id;
  card.innerHTML='<div class="ma-head" onclick="toggleMac(\''+id+'\')">'
    +'<div class="ma-badge" style="background:'+cfg.color+'22">'+cfg.icon+'</div>'
    +'<div class="ma-name">'+cfg.label+' <span style="font-weight:400;font-size:11px;color:var(--ts)">('+( cfg.mLabel[modelName]||modelName)+')</span></div>'
    +'<div class="ma-status" id="'+id+'_status">thinking…</div>'
    +'<div class="ma-toggle" id="'+id+'_tog">›</div>'
    +'</div>'
    +'<div class="ma-body" id="'+id+'_body"><div id="'+id+'_txt" style="font-size:13px;line-height:1.75;color:var(--ts);font-style:italic">Waiting for response…</div></div>';
  container.appendChild(card);
}

function setMacDone(provKey,text){
  var id='mac_'+provKey;
  var txtEl=dbEl(id+'_txt');
  var statusEl=dbEl(id+'_status');
  if(txtEl)txtEl.innerHTML=text.replace(/\n/g,'<br>');
  if(statusEl)statusEl.textContent='done';
}
function setMacError(provKey,msg){
  var id='mac_'+provKey;
  var txtEl=dbEl(id+'_txt');
  var statusEl=dbEl(id+'_status');
  if(txtEl)txtEl.innerHTML='<span style="color:var(--red)">Error: '+msg+'</span>';
  if(statusEl)statusEl.textContent='failed';
}

function toggleMac(id){
  var body=dbEl(id+'_body'),tog=dbEl(id+'_tog');
  if(body)body.classList.toggle('open');
  if(tog)tog.classList.toggle('open');
}

function pickJudge(selectedMap){
  var order=['anthropic','openai','gemini','groq'];
  var best=null,bestRank=-1;
  for(var i=0;i<order.length;i++){
    var p=order[i];
    if(selectedMap[p]&&DB_PROVIDERS[p].rank>bestRank){best=p;bestRank=DB_PROVIDERS[p].rank;}
  }
  return best;
}




/* ════════════════════════════════════════════════════
   DOMAIN EXPERT ENGINE
════════════════════════════════════════════════════ */
var DB_DOMAINS = [
  { id:"auto", label:"✨ Auto", icon:"✨", keywords:[],
    role:"", desc:"Domain auto-detected from your question." },

  { id:"finance", label:"💰 Finance", icon:"💰",
    keywords:["sip","mutual fund","invest","stock","equity","nifty","sensex","portfolio","return","dividend","ipo","bond","etf","index fund","wealth","compound","interest","fd","fixed deposit","ppf","elss","nps","retirement","lump sum","xirr","cagr","nav","smallcap","midcap","largecap","flexi cap","crypto","bitcoin","gold","real estate","reit","rebalance","asset allocation","hedge","derivatives","options","futures","f&o","swing trade","intraday"],
    role:"You are a CFA charterholder and SEBI-registered investment advisor with 20+ years in wealth management across Indian and global markets. You provide specific, numbers-backed guidance: expected CAGR, XIRR, expense ratios, real fund names, tax implications under old vs new regime, and inflation-adjusted returns. You tailor advice to risk profile and investment horizon. You explain both the strategy AND the execution steps.",
    desc:"CFA + SEBI advisor — SIP, mutual funds, stocks, tax-efficient investing, wealth creation." },

  { id:"loan", label:"🏦 Loans", icon:"🏦",
    keywords:["loan","emi","mortgage","home loan","car loan","personal loan","credit","debt","interest rate","cibil","refinance","prepay","tenure","collateral","secured","unsecured","nbfc","repo rate","rbi","foreclosure","balance transfer","overdraft","line of credit","credit card","credit score","debt trap","part payment"],
    role:"You are a senior banking professional and certified credit counsellor with 15 years in retail and corporate lending at top Indian banks. You compute actual lifetime interest costs, optimal prepayment strategies, break-even on balance transfers, and CIBIL repair steps. You always compare at least 3 lender options with exact numbers and flag hidden charges.",
    desc:"Senior credit counsellor — EMI, CIBIL, loan comparison, prepayment strategy, true cost of debt." },

  { id:"medical", label:"🩺 Medicine", icon:"🩺",
    keywords:["symptom","diagnosis","medicine","doctor","hospital","disease","pain","fever","blood","pressure","sugar","diabetes","heart","cancer","surgery","drug","dose","prescription","treatment","therapy","vaccine","infection","test","scan","mri","xray","cholesterol","thyroid","vitamin","deficiency","rash","cough","cold","flu","covid","headache","migraine","bp","hypertension","kidney","liver","lung","chest","stomach","gut","ibs","pcod","pcos","arthritis","allergy"],
    role:"You are a consultant physician with MD qualifications and 20 years of clinical experience across internal medicine and general practice. You explain symptoms, differential diagnoses, red-flag signs requiring urgent care, and evidence-based treatment options. You cite clinical guidelines, known drug interactions, and always remind users that a real physician must examine and diagnose in person. You never minimise serious symptoms.",
    desc:"Consultant physician — symptoms, differential diagnosis, treatment options. Always consult a real doctor." },

  { id:"legal", label:"⚖️ Legal", icon:"⚖️",
    keywords:["law","legal","court","contract","clause","rights","sue","lawyer","advocate","fir","police","property","will","inheritance","consumer","labour","tenant","landlord","notice","ipc","crpc","constitution","patent","trademark","copyright","gdpr","dispute","divorce","alimony","custody","bail","arrest","cheque bounce","defamation","arbitration","pil","rto","challan","income tax","gst","notice","itr","tax return","penalty","assessment"],
    role:"You are a senior advocate with 20 years of practice across civil, criminal, corporate, and tax law in India. You explain legal concepts, relevant statutes (IPC, CrPC, Consumer Protection Act, IT Act), landmark judgements, practical steps, and realistic outcomes. You always note when the situation needs immediate specialist legal counsel and what that counsel will likely tell them.",
    desc:"Senior advocate — rights, contracts, procedures, statutes. Informational; consult a lawyer for your case." },

  { id:"career", label:"🚀 Career", icon:"🚀",
    keywords:["job","career","resume","cv","interview","salary","promotion","switch","offer","negotiate","linkedin","skill","hire","fired","performance","manager","startup","corporate","fresher","experience","appraisal","hike","notice period","layoff","onsite","visa","abroad","mba","pgdm","upskill","certification","gap","burnout","toxic","hr","offer letter","background check","reference"],
    role:"You are an executive career coach and ex-FAANG recruiter with 15 years of talent acquisition and leadership coaching at top tech companies. You give frank, strategic advice backed by market data: realistic salary ranges, negotiation scripts, what hiring managers actually look for vs what candidates think, and how to position yourself. You know the difference between what works and what looks good on a blog post.",
    desc:"Executive career coach + ex-FAANG recruiter — salary negotiation, career strategy, interview mastery." },

  { id:"fitness", label:"🥗 Fitness", icon:"🥗",
    keywords:["diet","nutrition","weight","calories","protein","fat","carb","bmi","fitness","gym","exercise","workout","sleep","stress","yoga","supplement","vitamin","keto","intermittent fast","muscle","fat loss","obesity","metabolism","hydration","macro","micro","meal plan","running","marathon","cycling","steps","sedentary","lean","bulk","cut","whey","creatine","testosterone","hormones","menstrual","pcos","thyroid weight"],
    role:"You are a registered dietitian (RD) and certified strength & conditioning specialist (CSCS) with a masters in nutritional science. You design evidence-based, personalised nutrition and exercise plans. You give specific measurable targets: exact calorie ranges, macro splits, workout structure with sets/reps/progressive overload. You distinguish evidence-based supplements from marketing hype and tailor everything to real-world constraints.",
    desc:"Registered dietitian + CSCS — evidence-based nutrition, fat loss, muscle gain, personalised plans." },

  { id:"mental", label:"🧠 Mental Health", icon:"🧠",
    keywords:["anxiety","depression","stress","burnout","therapy","therapist","psychiatrist","panic","ocd","adhd","ptsd","trauma","relationship","breakup","grief","loneliness","motivation","procrastination","self-esteem","confidence","anger","emotion","mental","mindset","meditation","journaling","rumination","overthinking","toxic relationship","narcissist","gaslighting","boundaries"],
    role:"You are a licensed clinical psychologist with 15 years of practice in CBT, ACT, and trauma-informed therapy. You validate experiences, explain psychological concepts in plain language, offer evidence-based coping strategies, and distinguish normal distress from signs that need professional evaluation. You always encourage professional help where appropriate and never minimise or catastrophise. You speak with warmth, clarity, and zero judgement.",
    desc:"Licensed clinical psychologist — CBT strategies, coping tools, relationship dynamics. Professional help always recommended for clinical concerns." },

  { id:"business", label:"📊 Business", icon:"📊",
    keywords:["startup","business","product","market","strategy","revenue","profit","loss","valuation","funding","vc","pitch","competitor","customer","growth","gtm","pricing","saas","b2b","b2c","unit economics","cac","ltv","churn","pmf","mvp","roadmap","okr","kpi","marketing","brand","sales","partnership","franchise","ecommerce","amazon","flipkart","d2c","inventory","supply chain"],
    role:"You are a serial entrepreneur (3 exits), ex-McKinsey consultant, and VC advisor with 10+ years helping startups from 0 to scale. You think in frameworks: unit economics, CAC/LTV, competitive moats, TAM/SAM/SOM. You give brutally honest, data-driven strategic advice, ask the questions a board member would ask, and tell founders what they need to hear — not what they want to hear.",
    desc:"Serial entrepreneur + ex-McKinsey — strategy, unit economics, GTM, fundraising, scaling." },

  { id:"tax", label:"🧾 Tax", icon:"🧾",
    keywords:["tax","income tax","itr","gst","tds","deduction","80c","80d","hra","nps","salary","capital gain","ltcg","stcg","old regime","new regime","form 16","pan","aadhar","audit","assessment","notice","refund","filing","due date","advance tax","self assessment","surcharge","cess","exemption","loss harvesting"],
    role:"You are a Chartered Accountant (CA) with 15 years of tax practice for individuals, HUFs, and small businesses. You provide specific, actionable guidance on ITR filing, tax optimisation under old vs new regime, LTCG/STCG planning, TDS compliance, GST returns, and responding to tax notices. You always cite the relevant section of the Income Tax Act and flag deadlines.",
    desc:"Chartered Accountant — ITR, GST, tax optimisation, regime comparison, notices, capital gains." },

  { id:"parenting", label:"👶 Parenting", icon:"👶",
    keywords:["baby","child","toddler","infant","parenting","school","education","study","learning","exam","board","cbse","icse","tuition","homework","screen time","discipline","behaviour","tantrum","teenager","adolescent","puberty","peer pressure","bully","boarding school","college admission","jee","neet","clat","coaching"],
    role:"You are a developmental psychologist and education specialist with 20 years working with children aged 0-18 and their families. You combine evidence-based child development science with practical parenting strategies. You explain age-appropriate expectations, learning styles, emotional development, and academic strategies with nuance — avoiding both helicopter parenting guilt and dismissive advice.",
    desc:"Developmental psychologist + education specialist — child development, parenting strategies, academic guidance." },

  { id:"sd", label:"🏗️ System Design", icon:"🏗️",
    keywords:["system design","design a","design an","scalable","distributed","architecture","microservice","database","cache","queue","kafka","redis","load balancer","cdn","api gateway","rate limit","sharding","replication","consistency","availability","latency","throughput","qps","rps","tps","hld","lld","low level design","high level design","url shortener","twitter","youtube","uber","whatsapp","instagram","tiktok","netflix","dropbox","google drive","pastebin","web crawler","notification","payment","ride sharing","chat","messaging","news feed","search engine","typeahead","recommendation","ad click","metrics","monitoring","alerting","event driven","stream processing","kafka","flink","spark","hadoop"],
    role:"SYSTEM_DESIGN_USE_SD_PROMPT",
    desc:"Evan King Hello Interview framework — full tabbed SD output with diagrams, schema, deep dives." },

  { id:"tech", label:"💻 Software & Tech", icon:"💻",
    keywords:["code","programming","algorithm","bug","debug","function","class","object","api","rest","graphql","grpc","sql","nosql","mongodb","postgres","python","java","javascript","typescript","react","node","docker","kubernetes","git","linux","bash","regex","recursion","sorting","binary search","dynamic programming","graph","tree","linked list","array","hash map","concurrency","thread","async","promise","callback","closure","design pattern","solid","dry","refactor","test","unit test","ci cd","devops","cloud","aws","gcp","azure","serverless","lambda","s3","ec2"],
    role:"You are a principal software engineer and architect with 15+ years building production systems at FAANG-level companies. You write working, idiomatic code with proper error handling. You explain trade-offs honestly: time vs space, consistency vs availability, simplicity vs scalability. You use concrete examples and production war stories. You flag common mistakes and anti-patterns.",
    desc:"Principal engineer — working code, algorithms, architecture trade-offs, production concerns." },

  { id:"travel", label:"✈️ Travel", icon:"✈️",
    keywords:["travel","trip","holiday","vacation","tour","flight","hotel","visa","passport","itinerary","backpack","budget travel","luxury","honeymoon","solo","group","domestic","international","europe","usa","dubai","bali","thailand","maldives","goa","himalayas","northeast","pilgrimage","booking","cancellation","insurance","baggage"],
    role:"You are a seasoned travel expert who has visited 80+ countries, worked as a tour planner, and written for major travel publications. You give hyper-practical, opinionated itineraries with real cost estimates, visa realities, best-value booking strategies, safety considerations, and the hidden gems most tourists miss. You tailor recommendations to budget, travel style, and group composition.",
    desc:"Seasoned travel expert — itineraries, real costs, visa realities, booking strategy, hidden gems." },

  { id:"relationships", label:"💑 Relationships", icon:"💑",
    keywords:["relationship","love","marriage","divorce","separation","dating","partner","spouse","girlfriend","boyfriend","husband","wife","family","inlaws","parents","sibling","friendship","conflict","communication","cheating","affair","trust","jealousy","commitment","break up","long distance","arrange marriage","love marriage","dowry","compatibility","couple"],
    role:"You are a licensed couples therapist and relationship coach with 15 years of practice. You apply attachment theory, Gottman Method principles, and nonviolent communication (NVC) to help people understand relationship dynamics clearly. You validate emotions without taking sides, identify unhealthy patterns, and give concrete communication tools and scripts — not platitudes.",
    desc:"Licensed couples therapist — attachment theory, Gottman Method, communication tools, relationship dynamics." },

  { id:"sd", label:"🏗️ System Design", icon:"🏗️",
    keywords:["design","system","architect","scale","distributed","service","microservice","cache","queue","stream","load balancer","sharding","replication","consistency","availability","throughput","latency","kafka","redis","postgres","dynamo","cdn","rate limit","webhook","event driven"],
    role:"SYSTEM_DESIGN_USE_SD_PROMPT",
    desc:"Evan King Hello Interview framework — FAANG system design with diagrams and deep dives." },

  { id:"general", label:"🌐 General", icon:"🌐",
    keywords:[],
    role:"You are a world-class polymath with deep expertise across science, history, philosophy, economics, technology, and current affairs. You give accurate, nuanced, well-structured answers with relevant context, concrete examples, and specific numbers. You acknowledge genuine uncertainty, distinguish fact from opinion clearly, and always add the insight or angle the person probably hadn't considered.",
    desc:"World-class polymath — precise, nuanced answers on any topic with the angle you hadn't considered." }
];

var dbDomain = "auto";

function buildDomainRow() {
  var row = document.getElementById("domainRow");
  if (!row) return;
  row.innerHTML = "";
  DB_DOMAINS.forEach(function(d) {
    var chip = document.createElement("div");
    chip.className = "domain-chip" + (d.id === dbDomain ? " on" : "");
    chip.dataset.did = d.id;
    chip.textContent = d.label;
    chip.addEventListener("click", function() {
      dbDomain = d.id;
      document.querySelectorAll(".domain-chip").forEach(function(c) { c.classList.remove("on"); });
      chip.classList.add("on");
      showDomainCard(d.id, false);
    });
    row.appendChild(chip);
  });
  showDomainCard(dbDomain, false);
}

function showDomainCard(did, isAuto) {
  var d = DB_DOMAINS.find(function(x) { return x.id === did; });
  var card = document.getElementById("domainRoleCard");
  var icon = document.getElementById("domainRoleIcon");
  var name = document.getElementById("domainRoleName");
  var desc = document.getElementById("domainRoleDesc");
  if (!card) return;
  if (!d || did === "auto") {
    if (isAuto) {
      card.style.display = "none";
    } else {
      card.style.display = "none";
    }
    return;
  }
  card.style.display = "block";
  if (icon) icon.textContent = d.icon || "";
  if (name) name.textContent = (isAuto ? "Auto-detected: " : "") + d.label + (isAuto ? " expert" : "");
  if (desc) desc.textContent = d.desc || "";
}

function showDomainDesc(did, autoMsg) {
  showDomainCard(did, autoMsg);
}

function autoDetectDomain() {
  var q = (document.getElementById("db-question").value || "").toLowerCase();
  var best = null, bestScore = 0;
  DB_DOMAINS.forEach(function(d) {
    if (!d.keywords.length) return;
    var score = d.keywords.filter(function(k) { return q.indexOf(k) !== -1; }).length;
    if (score > bestScore) { bestScore = score; best = d; }
  });
  if (dbDomain === "auto") {
    var detected = best ? best.id : "general";
    showDomainCard(detected, bestScore > 0);
  }
}

function resolvedDomain() {
  if (dbDomain !== "auto") {
    return DB_DOMAINS.find(function(d) { return d.id === dbDomain; }) || DB_DOMAINS[DB_DOMAINS.length - 1];
  }
  var q = (document.getElementById("db-question").value || "").toLowerCase();
  var best = null, bestScore = 0;
  DB_DOMAINS.forEach(function(d) {
    if (!d.keywords.length) return;
    var score = d.keywords.filter(function(k) { return q.indexOf(k) !== -1; }).length;
    if (score > bestScore) { bestScore = score; best = d; }
  });
  return best || DB_DOMAINS[DB_DOMAINS.length - 1];
}

function buildExpertPrompt(domain, question) {
  if (domain.role === "SYSTEM_DESIGN_USE_SD_PROMPT") return sdPrompt();
  var role = domain.role || DB_DOMAINS[DB_DOMAINS.length - 1].role;
  return role + "\n\n"
    + "You are answering this question: " + (question||"") + "\n\n"
    + "Return ONLY valid JSON (no markdown, no preamble) with this exact structure:\n"
    + "{\n"
    + '  "key_insight": "The single most important insight most people miss — be specific and surprising",\n'
    + '  "headline": "One crisp sentence answer to the question",\n'
    + '  "explanation": [\n'
    + '    {"point": "Main point 1", "detail": "Specific detail with numbers/examples"},\n'
    + '    {"point": "Main point 2", "detail": "Specific detail with numbers/examples"},\n'
    + '    {"point": "Main point 3", "detail": "Specific detail with numbers/examples"}\n'
    + '  ],\n'
    + '  "warnings": ["Critical risk 1", "Critical risk 2"],\n'
    + '  "next_steps": [\n'
    + '    {"action": "Concrete step 1", "why": "Why this specifically"},\n'
    + '    {"action": "Concrete step 2", "why": "Why this specifically"},\n'
    + '    {"action": "Concrete step 3", "why": "Why this specifically"}\n'
    + '  ],\n'
    + '  "expert_opinion": "Your frank expert opinion — what you would personally do/recommend and why",\n'
    + '  "followup_qa": [\n'
    + '    {"q": "Follow-up question 1", "a": "Precise answer"},\n'
    + '    {"q": "Follow-up question 2", "a": "Precise answer"},\n'
    + '    {"q": "Follow-up question 3", "a": "Precise answer"}\n'
    + '  ]\n'
    + "}\n\n"
    + "Rules: Use specific numbers, percentages, names. Never vague generalities. "
    + "Acknowledge genuine uncertainty. 3-5 explanation points, 2-3 warnings if applicable, 3 next steps, 3 Q&As.";
}

function buildCritiquePrompt(domain) {
  var role = (domain.role === "SYSTEM_DESIGN_USE_SD_PROMPT")
    ? "You are a senior system design expert and FAANG engineering manager."
    : (domain.role || DB_DOMAINS[DB_DOMAINS.length - 1].role);
  return role + "\n\n"
    + "You are reviewing other experts answers to the same question. Be rigorous:\n"
    + "1. Acknowledge 1-2 things the other answers got RIGHT — be specific\n"
    + "2. Challenge 1-2 specific claims you disagree with — cite exactly why and what is correct\n"
    + "3. Identify 1-2 important gaps — things they missed that really matter\n"
    + "4. State 1 thing you would refine in your own answer after reading theirs\n"
    + "No vague praise. Reference actual content from their answers.";
}

function buildJudgePrompt(domain, isMeta, question) {
  if (domain.role === "SYSTEM_DESIGN_USE_SD_PROMPT") return sdPrompt();
  var role = domain.role || DB_DOMAINS[DB_DOMAINS.length - 1].role;
  var jsonSchema = "Return ONLY valid JSON with this structure:\n"
    + '{"key_insight":"...","headline":"...","explanation":[{"point":"...","detail":"..."}],'
    + '"warnings":["..."],"next_steps":[{"action":"...","why":"..."}],'
    + '"expert_opinion":"...","followup_qa":[{"q":"...","a":"..."}]}';

  if (isMeta) {
    return role + "\n\n"
      + "You are the final orchestrator in a multi-expert AI debate on: " + (question||"") + "\n\n"
      + "You have answers and critiques from multiple AI experts. Your job:\n"
      + "1. Identify the single best insight across ALL models — be specific\n"
      + "2. For each model: note the one unique valuable contribution it made\n"
      + "3. Where models disagreed: state which position is better supported and why\n"
      + "4. Synthesize a final answer incorporating the strongest insights from ALL models\n"
      + "5. Add your own expert insight that none of them mentioned\n\n"
      + jsonSchema;
  }
  return role + "\n\n"
    + "You are the final judge in a multi-AI debate on: " + (question||"") + "\n\n"
    + "You have all answers and critiques. Produce the definitive best answer:\n"
    + "1. Take the strongest answer as foundation\n"
    + "2. Augment with the best specific points from other models\n"
    + "3. Correct any factual errors\n"
    + "4. Add your own expert insight none of them mentioned\n\n"
    + jsonSchema;
}



function renderExpertAnswer(container, domainObj, parsed, attrHtml) {
  if (!parsed || !container) return false;
  var d = domainObj || {};

  function safe(v) { return (v||'').toString().replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function block(colorClass, label, content) {
    return '<div class="iblock '+colorClass+'"><div class="blbl">'+label+'</div>'+safe(content)+'</div>';
  }

  var html = '<div class="expert-answer">';

  /* Headline */
  if (parsed.headline) {
    html += '<div class="ea-insight">'+safe(parsed.headline)+'</div>';
  }

  /* Key insight */
  if (parsed.key_insight) {
    html += '<div class="ea-section">'
      + '<div class="ea-section-lbl">💡 Key Insight Most People Miss</div>'
      + block('orange','Expert Insight', parsed.key_insight)
      + '</div>';
  }

  /* Explanation points */
  if (parsed.explanation && parsed.explanation.length) {
    html += '<div class="ea-section"><div class="ea-section-lbl">📖 Full Explanation</div>';
    parsed.explanation.forEach(function(pt, i) {
      html += '<div class="ea-point">'
        + '<div class="ea-point-num">'+(i+1)+'</div>'
        + '<div><strong>'+safe(pt.point||pt.title||'')+'</strong>'
        + (pt.detail ? '<div style="font-size:12px;color:var(--ts);margin-top:3px;line-height:1.6">'+safe(pt.detail)+'</div>' : '')
        + '</div></div>';
    });
    html += '</div>';
  }

  /* Warnings */
  if (parsed.warnings && parsed.warnings.length) {
    html += '<div class="ea-section"><div class="ea-section-lbl">⚠️ Key Risks & Caveats</div>';
    parsed.warnings.forEach(function(w) {
      html += '<div class="ea-warn">'+safe(w)+'</div>';
    });
    html += '</div>';
  }

  /* Expert opinion */
  if (parsed.expert_opinion) {
    html += '<div class="ea-section">'
      + '<div class="ea-section-lbl">🎯 Expert Recommendation</div>'
      + block('blue', d.label||'Expert', parsed.expert_opinion)
      + '</div>';
  }

  /* Next steps */
  if (parsed.next_steps && parsed.next_steps.length) {
    html += '<div class="ea-section"><div class="ea-section-lbl">✅ Concrete Next Steps</div>';
    parsed.next_steps.forEach(function(ns, i) {
      html += '<div class="ea-next">'
        + '<div class="ea-next-icon">'+(i===0?'1️⃣':i===1?'2️⃣':'3️⃣')+'</div>'
        + '<div><strong>'+safe(ns.action||ns.step||'')+'</strong>'
        + (ns.why ? '<div style="font-size:12px;color:var(--ts);margin-top:3px;line-height:1.6">'+safe(ns.why)+'</div>' : '')
        + '</div></div>';
    });
    html += '</div>';
  }

  /* Q&A */
  if (parsed.followup_qa && parsed.followup_qa.length) {
    html += '<div class="ea-section"><div class="ea-section-lbl">❓ Follow-up Q&A</div>';
    parsed.followup_qa.forEach(function(qa, i) {
      var qid = 'eaqa_'+i+'_'+Date.now();
      html += '<div class="qa-item">'
        + '<div class="qa-q" onclick="var a=document.getElementById(\''+qid+'\'),c=a.previousElementSibling.querySelector(\'.chev\');a.classList.toggle(\'open\');c.classList.toggle(\'open\')">'
        + safe(qa.q||qa.question||'')
        + '<span class="chev">›</span></div>'
        + '<div class="qa-a" id="'+qid+'">'+safe(qa.a||qa.answer||'')+'</div>'
        + '</div>';
    });
    html += '</div>';
  }

  /* Attribution */
  if (attrHtml) {
    html += '<div class="ea-attr">'+attrHtml+'</div>';
  }

  html += '</div>';
  container.innerHTML = html;
  return true;
}


function parseVerdict(raw){
  if(!raw)return null;
  /* Strategy 1: strip markdown fences */
  var stripped=raw.trim()
    .replace(/^[`]{3}json[\s\S]*?\n/,'')
    .replace(/^[`]{3}[\s\S]*?\n/,'')
    .replace(/\n[`]{3}\s*$/,'')
    .trim();
  try{return JSON.parse(stripped);}catch(e0){}
  /* Strategy 2: outermost { } */
  var fi=raw.indexOf('{'),la=raw.lastIndexOf('}');
  if(fi>=0&&la>fi){
    var chunk=raw.slice(fi,la+1);
    try{return JSON.parse(chunk);}catch(e1){}
    /* Strategy 3: trailing commas */
    try{return JSON.parse(chunk.replace(/,\s*([}\]])/g,'$1'));}catch(e2){}
    /* Strategy 4: JS comments + trailing commas */
    try{return JSON.parse(chunk.replace(/\/\/[^\n]*/g,'').replace(/,\s*([}\]])/g,'$1'));}catch(e3){}
    /* Strategy 5: truncated JSON — close unclosed brackets */
    try{
      var o2=[],s2=false,x2=false,cm={'{':'}','[':']'};
      for(var ci=0;ci<chunk.length;ci++){
        var cc=chunk[ci];
        if(x2){x2=false;continue;}
        if(cc==='\\'){x2=true;continue;}
        if(cc==='"'){s2=!s2;continue;}
        if(s2)continue;
        if(cc==='{'||cc==='[')o2.push(cm[cc]);
        else if(cc==='}'||cc===']')o2.pop();
      }
      var rep=chunk;while(o2.length)rep+=o2.pop();
      return JSON.parse(rep.replace(/,\s*([}\]])/g,'$1'));
    }catch(e4){}
  }
  return null;
}

async function runDebate(){
  var question=dbEl('db-question').value.trim();
  if(!question||Object.keys(dbSelected).length<1)return;
  var winnerEntry=null; /* hoisted — set in majority block, read in phase 3 */

  dbEl('db-config').style.display='none';
  dbEl('db-results').style.display='block';
  var out=dbEl('db-results-inner');
  out.innerHTML='';

  var participants=Object.entries(dbSelected);
  var answers={};
  var critiques={};

  /* ── PHASE 1: Parallel answers ── */
  var p1=addPhaseBanner(out,'p1','Phase 1 of 3 — All AIs answering simultaneously…');
  var activeDomain=resolvedDomain();
  var isSDMode=(activeDomain.id==='sd');
  var p1sys=isSDMode?sdPrompt():buildExpertPrompt(activeDomain,question);

  participants.forEach(function(entry){addModelCard(out,entry[0],entry[1]);});

  var p1tasks=participants.map(async function(entry){
    var prov=entry[0],mdl=entry[1];
    try{
      var ans=await dbCall(prov,mdl,p1sys,question);
      answers[prov]=ans;
      setMacDone(prov,ans);
    }catch(err){
      setMacError(prov,err.message);
    }
  });
  await Promise.allSettled(p1tasks);

  var succeeded=participants.filter(function(e){return !!answers[e[0]];});
  var failedCount=participants.length-succeeded.length;
  finishBanner(p1,'Phase 1 complete — '+succeeded.length+' answers received'+(failedCount?' ('+failedCount+' failed)':''));

  if(succeeded.length<1){
    var errDiv=document.createElement('div');
    errDiv.className='phase-banner p1';
    errDiv.style.cssText='border:1px solid var(--red);background:var(--rs);color:var(--red)';
    errDiv.textContent='No successful responses. Check your API key and try again.';
    out.appendChild(errDiv);
    return;
  }

  var isSolo=(succeeded.length===1);

  /* ── PHASE 2: Cross-critique (skipped in solo mode) ── */
  function parseVote(rawVote,myProvKey){
    if(!rawVote)return null;
    var txt=rawVote.toLowerCase();
    var order=['anthropic','openai','gemini','groq'];
    for(var vi=0;vi<order.length;vi++){
      var vp=order[vi];
      if(vp===myProvKey)continue;
      if(!succeeded.find(function(e){return e[0]===vp;}))continue;
      var vcfg=DB_PROVIDERS[vp];
      var terms=[vcfg.label.toLowerCase()];
      vcfg.models.forEach(function(m){terms.push(m.toLowerCase());});
      if(vp==='anthropic')terms.push('claude');
      if(vp==='openai')terms.push('gpt','chatgpt','openai');
      if(vp==='gemini')terms.push('gemini','google','bard');
      if(vp==='groq')terms.push('llama','mixtral','groq');
      for(var vj=0;vj<terms.length;vj++){
        if(txt.indexOf(terms[vj])!==-1)return vcfg.label;
      }
    }
    return null;
  }

  if(!isSolo){
    for(var round=0;round<dbRounds;round++){
      var roundSuffix=dbRounds>1?' (round '+(round+1)+' of '+dbRounds+')':'';
      var p2=addPhaseBanner(out,'p2','Phase 2 of 3 — Each AI critiques the others'+roundSuffix+'…');
      var p2sys=buildCritiquePrompt(activeDomain);
      var p2tasks=succeeded.map(async function(entry){
        var prov=entry[0],mdl=entry[1];
        var _p2cap=isSDMode?3000:1200;
        var othersText=succeeded
          .filter(function(e){return e[0]!==prov;})
          .map(function(e){
            var ans=answers[e[0]]||'';
            return '=== '+DB_PROVIDERS[e[0]].label+' ===\n'+ans.slice(0,_p2cap)+(ans.length>_p2cap?'\n[truncated]':'');
          })
          .join('\n\n');
        var myAns=answers[prov]||'';
        var userMsg='YOUR ANSWER:\n'+myAns.slice(0,_p2cap)+(myAns.length>_p2cap?'\n[truncated]':'')+'\n\nOTHER MODELS:\n'+othersText+'\n\nCritique specifically. Reference actual content.';
        try{
          var crit=await dbCall(prov,mdl,p2sys,userMsg);
          critiques[prov]=(critiques[prov]||'')+crit;
        }catch(err){
          critiques[prov]='(critique failed: '+err.message+')';
        }
      });
      await Promise.allSettled(p2tasks);

      var critiqueWrap=document.createElement('div');
      critiqueWrap.style.marginBottom='14px';
      var critiqueHdr=document.createElement('div');
      critiqueHdr.className='db-lbl';
      critiqueHdr.style.margin='0 0 8px';
      critiqueHdr.textContent='Critiques'+roundSuffix;
      critiqueWrap.appendChild(critiqueHdr);
      succeeded.forEach(function(entry){
        var prov=entry[0];
        if(!critiques[prov])return;
        var cfg=DB_PROVIDERS[prov];
        var card=document.createElement('div');
        card.className='critique-card';
        card.innerHTML='<div class="critique-head">'+cfg.icon+' '+cfg.label+' critiques the others</div>'
          +'<div class="critique-body">'+critiques[prov].replace(/\n/g,'<br>')+'</div>';
        critiqueWrap.appendChild(card);
      });
      out.appendChild(critiqueWrap);
      finishBanner(p2,'Phase 2 complete'+roundSuffix);
    } /* end for rounds */

    /* Majority vote tallying (only in multi-model mode) */
    if(dbJudgeMode==='majority'){
      var allAnswersMaj=succeeded.map(function(e){
        var _majCap=isSDMode?1000:500;
        return '['+DB_PROVIDERS[e[0]].label+']:\n'+answers[e[0]].slice(0,_majCap);
      }).join('\n\n---\n\n');
      var voteTasks=succeeded.map(async function(entry){
        var vp2=entry[0],vm=entry[1];
        var labelsStr=succeeded.filter(function(x){return x[0]!==vp2;}).map(function(x){return DB_PROVIDERS[x[0]].label;}).join('/');
        var vsys='Vote for the best answer (not your own). Reply with ONE label only: '+labelsStr+'. No explanation.';
        try{
          var vote=await dbCall(vp2,vm,vsys,allAnswersMaj);
          return {prov:vp2,vote:vote.trim()};
        }catch(e){return null;}
      });
      var voteResults=await Promise.allSettled(voteTasks);
      var votes={};
      voteResults.forEach(function(r){
        if(r.status==='fulfilled'&&r.value&&r.value.vote){
          var parsed=parseVote(r.value.vote,r.value.prov);
          if(parsed)votes[parsed]=(votes[parsed]||0)+1;
        }
      });
      var vsorted=Object.entries(votes).sort(function(a,b){return b[1]-a[1];});
      var vwinnerLabel=vsorted[0]?vsorted[0][0]:null;
      winnerEntry=vwinnerLabel?succeeded.find(function(e){return DB_PROVIDERS[e[0]].label===vwinnerLabel;}):null;
    }
  } /* end if(!isSolo) */

  /* ── PHASE 3: Judge & synthesis ── */
  var p3=addPhaseBanner(out,'p3','Phase 3 of 3 — Orchestrator synthesizing final verdict…');
  var judgeProvider=dbJudgeMode==='majority'?null:pickJudge(Object.fromEntries(succeeded));
  var judgeModel=judgeProvider?dbSelected[judgeProvider]:null;
  var attribution=[];

  /* activeDomain and isSDMode already set at Phase 1 */
  var judgeUserPrefix=isSDMode
    ?'QUESTION: '+question+'\n\nStudy ALL answers below. Output ONLY valid JSON (no markdown, no text before/after) synthesizing the best system design. Use the JSON schema from your system prompt exactly. Start your response with { and end with }.\n\n'
    :'QUESTION: '+question+'\n\n';
  var nonSdSys=buildJudgePrompt(activeDomain,dbJudgeMode==='meta',question);

  var _p3cap=isSDMode?4000:1500;
  var allContext=succeeded.map(function(e){
    var ans=(answers[e[0]]||'').slice(0,_p3cap);
    var crit=(critiques[e[0]]||'(none)').slice(0,600);
    return '=== '+DB_PROVIDERS[e[0]].label+' ANSWER ===\n'+ans
      +'\n\n=== '+DB_PROVIDERS[e[0]].label+' CRITIQUE ===\n'+crit;
  }).join('\n\n---\n\n');

  var verdictRaw='';
  var verdictParsed=null;


  if(isSolo){
    finishBanner(p3,'Expert answer ready');
    verdictRaw=answers[succeeded[0][0]];
    attribution=[DB_PROVIDERS[succeeded[0][0]].label+' (solo expert answer)'];
    verdictParsed=parseVerdict(verdictRaw);
  } else if(dbJudgeMode==='majority'){
    var richest=succeeded.reduce(function(best,e){
      return (answers[e[0]]||'').split(' ').length>(answers[best[0]]||'').split(' ').length?e:best;
    },succeeded[0]);
    var majorityWinner=winnerEntry||richest;
    verdictRaw=answers[majorityWinner[0]];
    attribution=['Majority vote winner: '+DB_PROVIDERS[majorityWinner[0]].label];
    verdictParsed=parseVerdict(verdictRaw);
  } else if(isSDMode){
    /* SD mode: judge picks the best complete JSON, with full fallback chain */
    /* Judge scores each answer by index — avoids asking it to re-output huge JSON */
    var sdScoreSys='You are a system design interview judge. You will receive multiple answers numbered 1,2,3… '
      +'Score each on: diagram quality, NFR coverage, BAD/GOOD/GREAT depth, capacity numbers, specific tech choices. '
      +'Respond with ONLY a JSON object like: {"winner":1,"scores":[{"n":1,"score":9,"reason":"one sentence"},{"n":2,"score":7,"reason":"one sentence"}],"summary":"2 sentence overall verdict"}. '
      +'No markdown. No extra text. Start with { end with }.';
    var sdScoreUser='Score these system design answers and pick the best one.\n\n'
      +succeeded.map(function(e,i){
        /* Send first 3000 chars of each — enough for judge to score quality */
        return '=== ANSWER '+(i+1)+' from '+DB_PROVIDERS[e[0]].label+' ===\n'+(answers[e[0]]||'').slice(0,3000);
      }).join('\n\n');
    try{
      var scoreRaw=await dbCall(judgeProvider,judgeModel,sdScoreSys,sdScoreUser);
      var scoreData=parseVerdict(scoreRaw);
      var jLbl=DB_PROVIDERS[judgeProvider].modelLabels&&DB_PROVIDERS[judgeProvider].modelLabels[judgeModel]||judgeModel;
      if(scoreData&&typeof scoreData.winner==='number'){
        var winIdx=scoreData.winner-1;
        var winEntry=succeeded[winIdx]||succeeded[0];
        verdictRaw=answers[winEntry[0]];
        verdictParsed=parseVerdict(verdictRaw);
        var scoreLines=(scoreData.scores||[]).map(function(s){return '#'+s.n+' ('+DB_PROVIDERS[(succeeded[s.n-1]||succeeded[0])[0]].label+'): '+s.score+'/10 — '+s.reason;}).join(' · ');
        attribution=['SD winner: '+DB_PROVIDERS[winEntry[0]].label+' (judged by '+DB_PROVIDERS[judgeProvider].label+' '+jLbl+')',scoreData.summary||'',scoreLines].filter(Boolean);
      } else {
        attribution=['SD judge scoring failed — using longest answer'];
      }
    }catch(err){
      attribution=['SD judge failed ('+err.message+') — using best direct answer'];
    }
    /* Fallback: pick richest parseable individual answer */
    if(!verdictParsed){
      var sorted=succeeded.slice().sort(function(a,b){return (answers[b[0]]||'').length-(answers[a[0]]||'').length;});
      for(var si2=0;si2<sorted.length;si2++){
        var attempt=parseVerdict(answers[sorted[si2][0]]);
        if(attempt){
          verdictParsed=attempt;
          verdictRaw=answers[sorted[si2][0]];
          attribution=['Best SD answer from: '+DB_PROVIDERS[sorted[si2][0]].label+' (judge fallback)'];
          break;
        }
      }
    }
  } else {
    var finalSys=nonSdSys;
    try{
      verdictRaw=await dbCall(judgeProvider,judgeModel,finalSys,judgeUserPrefix+allContext);
      var jLabel=DB_PROVIDERS[judgeProvider].modelLabels&&DB_PROVIDERS[judgeProvider].modelLabels[judgeModel]||judgeModel;
      attribution=['Judged by: '+DB_PROVIDERS[judgeProvider].label+' ('+jLabel+')'];
      verdictParsed=parseVerdict(verdictRaw);
    }catch(err){
      verdictRaw=answers[succeeded[0][0]];
      attribution=['Judge call failed ('+err.message+') — showing best individual answer'];
      verdictParsed=parseVerdict(verdictRaw);
    }
  }

  finishBanner(p3,'Phase 3 complete — final verdict ready');

  /* ── Render verdict ── */
  var attrHtml=attribution.length
    ?'<div class="attribution-row">'+attribution.map(function(a){return '<div class="attr-item">• '+a+'</div>';}).join('')+'</div>'
    :'';

  /* Header always shown */
  var hdrDiv=document.createElement('div');
  hdrDiv.className='verdict-box';
  hdrDiv.style.marginBottom='14px';
  var domainBadge='<span style="font-size:11px;font-weight:500;background:var(--as);color:var(--ac);border:1px solid rgba(200,169,110,.3);border-radius:12px;padding:2px 9px;margin-left:8px;vertical-align:middle">'+activeDomain.icon+' '+activeDomain.label+'</span>';
  hdrDiv.innerHTML='<div class="verdict-head">🏆 Final Verdict '+domainBadge+'</div>'+attrHtml;
  out.appendChild(hdrDiv);

  /* Render container for the full SD output */
  var verdictContainer=document.createElement('div');
  verdictContainer.id='db-verdict-render';
  out.appendChild(verdictContainer);

  var attrText=attribution.length?attribution.join(' · '):'';

  /* Debug: if SD parse failed, show raw + retry button */
  if(isSDMode&&!verdictParsed){
    verdictContainer.innerHTML='<div style="background:var(--os);border:1px solid var(--oc,#e6a817);border-radius:10px;padding:14px 16px;font-size:12.5px;line-height:1.7">'
      +'<strong>⚠️ Could not parse SD JSON from this model.</strong><br>'
      +'This usually means the model returned partial JSON or wrapped it in extra text.<br><br>'
      +'<details><summary style="cursor:pointer;font-weight:600;color:var(--ac)">Show raw response (click to expand)</summary>'
      +'<pre style="white-space:pre-wrap;word-break:break-all;font-size:10px;margin-top:8px;max-height:300px;overflow:auto">'+
        (verdictRaw||'(empty)').replace(/&/g,'&amp;').replace(/</g,'&lt;').slice(0,3000)
      +'</pre></details></div>';
  } else if(verdictParsed&&isSDMode){
    /* Full SD template render */
    last={mode:'sd',data:verdictParsed};
    renderSD(verdictParsed,verdictContainer);
  } else if(verdictParsed&&activeDomain&&activeDomain.id!=='general'&&!isSDMode){
    /* Rich expert answer renderer */
    var rendered=renderExpertAnswer(verdictContainer,activeDomain,verdictParsed,attrText);
    if(!rendered){
      verdictContainer.innerHTML='<div style="font-size:13px;line-height:1.8;padding:14px 0">'+verdictRaw.replace(/\n/g,'<br>')+'</div>';
    }
  } else if(verdictParsed&&!isSDMode){
    /* Try rich render first, fallback to plain */
    var rendered2=renderExpertAnswer(verdictContainer,activeDomain||{label:'Expert'},verdictParsed,attrText);
    if(!rendered2){
      verdictContainer.innerHTML='<div style="font-size:13px;line-height:1.8;padding:14px 0">'+verdictRaw.replace(/\n/g,'<br>')+'</div>';
    }
  } else {
    /* Fallback: plain text */
    verdictContainer.innerHTML='<div style="font-size:13px;line-height:1.8;padding:14px 0">'+verdictRaw.replace(/\n/g,'<br>')+'</div>';
  }

  succeeded.forEach(function(e){toggleMac('mac_'+e[0]);});
}

function resetDebate(){
  dbEl('db-config').style.display='block';
  dbEl('db-results').style.display='none';
  dbEl('db-results-inner').innerHTML='';
}





