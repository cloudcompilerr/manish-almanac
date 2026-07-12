/* initCollection() below
═══════════════════════════════════════════════════════ */
const COLLECTION_DATA = {
  cms: { title: "Count-Min Sketch", file: "collection/cms.html" },
  topk: { title: "Top-K End-to-End Design", file: "collection/topk.html" },
  ai_handbook: { title: "AI Leadership Handbook", file: "collection/ai_handbook.html" },
  databases: { title: "Databases Deep Dive", file: "collection/databases.html" },
  olap: { title: "OLAP & Analytics Engines", file: "collection/olap.html" },
  streaming: { title: "Streaming & Event Processing", file: "collection/streaming.html" },
  protocols: { title: "API Protocols Decoded", file: "collection/protocols.html" },
  caching: { title: "Caching & Redis", file: "collection/caching.html" },
  consistent_hashing: { title: "Consistent Hashing", file: "collection/consistent_hashing.html" },
  rate_limiting: { title: "Rate Limiting", file: "collection/rate_limiting.html" },
  distributed_systems: { title: "Distributed Systems", file: "collection/distributed_systems.html" },
  load_balancing: { title: "Load Balancing", file: "collection/load_balancing.html" },
  search: { title: "Search Systems", file: "collection/search.html" },
  object_storage: { title: "Object Storage & S3", file: "collection/object_storage.html" },
  message_queues: { title: "Message Queues", file: "collection/message_queues.html" },
  cdn_edge: { title: "CDN & Edge Computing", file: "collection/cdn_edge.html" },
  observability: { title: "Observability", file: "collection/observability.html" },
  security: { title: "Security & Authentication", file: "collection/security.html" },
  scalability: { title: "Scalability Patterns", file: "collection/scalability.html" },
  api_design: { title: "API Design", file: "collection/api_design.html" },
  data_structures: { title: "Data Structures for SysDesign", file: "collection/data_structures.html" },
  microservices: { title: "Microservices Patterns", file: "collection/microservices.html" },
  interview_framework: { title: "Interview Framework", file: "collection/interview_framework.html" },
  design_twitter: { title: "Design Twitter / X", file: "collection/design_twitter.html" },
  design_uber: { title: "Design Uber", file: "collection/design_uber.html" },
  design_whatsapp: { title: "Design WhatsApp", file: "collection/design_whatsapp.html" },
  design_youtube: { title: "Design YouTube", file: "collection/design_youtube.html" },
  design_dropbox: { title: "Design Dropbox", file: "collection/design_dropbox.html" },
  llm_context_window: { title: "The 128k Problem — How to Feed an LLM Without Hallucinating", file: "collection/llm-context-window-selection.html" },
  rag_pipeline_director_breakdown: { title: "RAG Pipeline — Director-Level Breakdown", file: "collection/rag_pipeline_director_breakdown.html" },
  module01_llm_foundations: { title: "Module 1: LLM Foundations & Your First Production AI Call", file: "collection/module01_llm_foundations.html" },
  module02_prompt_engineering: { title: "Module 2: Prompt Engineering for Production", file: "collection/module02_prompt_engineering.html" },
  enterprise_genai_architecture: { title: "Enterprise Generative AI Architecture", file: "collection/enterprise_genai_architecture.html" },
};

var _collScrollY = 0;
function openCollection(){
  document.getElementById('list').style.display='none';
  document.getElementById('coll-panel').classList.add('open');
  window.scrollTo(0,0);
}
function closeCollection(){
  document.getElementById('coll-item').classList.remove('open');
  var f=document.getElementById('ci-iframe');if(f){f.srcdoc='';f.style.height='';}
  document.getElementById('coll-panel').classList.remove('open');
  document.getElementById('coll-panel').style.display='';
  document.getElementById('list').style.display='block';
  window.scrollTo(0,0);
}
function injectSpeaker(html){
  var tag='<script src="js/speaker.js" defer><\/script>';
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, tag+'</body>') : html+tag;
}
function openCollItem(id){
  var item=COLLECTION_DATA[id];
  if(!item)return;
  _collScrollY = window.scrollY;
  document.getElementById('ci-title').textContent=item.title;
  var iframe=document.getElementById('ci-iframe');
  document.getElementById('coll-panel').style.display='none';
  document.getElementById('coll-item').classList.add('open');
  window.scrollTo(0,0);
  if(item.srcdoc){
    iframe.srcdoc=injectSpeaker(item.srcdoc);
  } else {
    iframe.srcdoc='<div style="font-family:-apple-system,sans-serif;padding:40px 24px;text-align:center;color:#aaa;font-size:14px">Loading…</div>';
    fetch(item.file, {cache: 'no-store'})
      .then(function(r){ if(!r.ok)throw new Error('HTTP '+r.status); return r.text(); })
      .then(function(html){ iframe.srcdoc=injectSpeaker(html); })
      .catch(function(e){
        iframe.srcdoc='<div style="font-family:-apple-system,sans-serif;padding:40px 24px;color:#c00;font-size:14px">Could not load '+item.file+'.<br><small>'+e.message+'</small><br><br><small>Run via server: <code>python3 -m http.server</code></small></div>';
      });
  }
}
function closeCollItem(){
  document.getElementById('coll-item').classList.remove('open');
  document.getElementById('coll-panel').style.display='';
  window.scrollTo(0, _collScrollY);
  setTimeout(function(){
    var f=document.getElementById('ci-iframe');
    if(f) f.srcdoc='';
  },50);
}

function initCollection(){
  var pairs=[
    ['btn_collection',   function(){openCollection();}],
    ['btn_coll_back',    function(){closeCollection();}],
    ['btn_ci_back',      function(){closeCollItem();}],
    ['btn_coll_cms',     function(){openCollItem('cms');}],
    ['btn_coll_topk',    function(){openCollItem('topk');}],
    ['btn_coll_ai',      function(){openCollItem('ai_handbook');}],
    ['btn_coll_databases',function(){openCollItem('databases');}],
    ['btn_coll_olap',    function(){openCollItem('olap');}],
    ['btn_coll_streaming',function(){openCollItem('streaming');}],
    ['btn_coll_protocols',function(){openCollItem('protocols');}],
    ['btn_coll_caching',function(){openCollItem('caching');}],
    ['btn_coll_consistent_hashing',function(){openCollItem('consistent_hashing');}],
    ['btn_coll_rate_limiting',function(){openCollItem('rate_limiting');}],
    ['btn_coll_distributed_systems',function(){openCollItem('distributed_systems');}],
    ['btn_coll_load_balancing',function(){openCollItem('load_balancing');}],
    ['btn_coll_search',function(){openCollItem('search');}],
    ['btn_coll_object_storage',function(){openCollItem('object_storage');}],
    ['btn_coll_message_queues',function(){openCollItem('message_queues');}],
    ['btn_coll_cdn_edge',function(){openCollItem('cdn_edge');}],
    ['btn_coll_observability',function(){openCollItem('observability');}],
    ['btn_coll_security',function(){openCollItem('security');}],
    ['btn_coll_scalability',function(){openCollItem('scalability');}],
    ['btn_coll_api_design',function(){openCollItem('api_design');}],
    ['btn_coll_data_structures',function(){openCollItem('data_structures');}],
    ['btn_coll_microservices',function(){openCollItem('microservices');}],
    ['btn_coll_interview_framework',function(){openCollItem('interview_framework');}],
    ['btn_coll_design_twitter',function(){openCollItem('design_twitter');}],
    ['btn_coll_design_uber',function(){openCollItem('design_uber');}],
    ['btn_coll_design_whatsapp',function(){openCollItem('design_whatsapp');}],
    ['btn_coll_design_youtube',function(){openCollItem('design_youtube');}],
    ['btn_coll_design_dropbox',function(){openCollItem('design_dropbox');}],
  ['btn_coll_llm_context_window',function(){openCollItem('llm_context_window');}],
  ['btn_coll_rag_pipeline',function(){openCollItem('rag_pipeline_director_breakdown');}],
  ['btn_coll_module01_llm_foundations',function(){openCollItem('module01_llm_foundations');}],
  ['btn_coll_module02_prompt_engineering',function(){openCollItem('module02_prompt_engineering');}],
  ['btn_coll_enterprise_genai_architecture',function(){openCollItem('enterprise_genai_architecture');}]
  ];
  pairs.forEach(function(p){
    var el=document.getElementById(p[0]);
    if(el) el.addEventListener('click',p[1]);
  });

  /* Keep collection item counts in sync with COLLECTION_DATA so they never drift again */
  var n=Object.keys(COLLECTION_DATA).length;
  var ccEl=document.querySelector('.coll-count');
  if(ccEl) ccEl.textContent=n+' items';
  var homeDateEl=document.querySelector('#btn_collection .note-date');
  if(homeDateEl) homeDateEl.textContent=n+' items';
}
