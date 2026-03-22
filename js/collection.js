/* ═══════════════════════════════════════════════════════
   MY COLLECTION  📚
   To add a new item:
   1. Add the HTML file to collection/
   2. Add an entry here in COLLECTION_DATA
   3. Add a <button> row in index.html (#coll-panel)
   4. Wire the button in initCollection() below
═══════════════════════════════════════════════════════ */
const COLLECTION_DATA = {
  cms: { title: 'Count-Min Sketch', file: 'collection/cms.html', tag: 'Algorithm' },
  topk: { title: 'Top-K End-to-End Design', file: 'collection/topk.html', tag: 'System Design' },
  ai_handbook: { title: 'AI Leadership Handbook', file: 'collection/ai_handbook.html', tag: 'AI / Leadership' },
  databases: { title: 'Databases Deep Dive', file: 'collection/databases.html', tag: 'Databases' },
  olap: { title: 'OLAP & Analytics Engines', file: 'collection/olap.html', tag: 'Analytics DB' },
  streaming: { title: 'Streaming & Event Processing', file: 'collection/streaming.html', tag: 'Streaming' },
  protocols: { title: 'API Protocols Decoded', file: 'collection/protocols.html', tag: 'Protocols' },
  caching: { title: 'Caching & Redis', file: 'collection/caching.html', tag: 'Caching' },
  consistent_hashing: { title: 'Consistent Hashing', file: 'collection/consistent_hashing.html', tag: 'Partitioning' },
  rate_limiting: { title: 'Rate Limiting', file: 'collection/rate_limiting.html', tag: 'Rate Limiting' },
  distributed_systems: { title: 'Distributed Systems', file: 'collection/distributed_systems.html', tag: 'Distributed Sys' },
  load_balancing: { title: 'Load Balancing', file: 'collection/load_balancing.html', tag: 'Infra' },
  search: { title: 'Search Systems', file: 'collection/search.html', tag: 'Search' },
  object_storage: { title: 'Object Storage & S3', file: 'collection/object_storage.html', tag: 'Storage' },
  message_queues: { title: 'Message Queues', file: 'collection/message_queues.html', tag: 'Queues' },
  cdn_edge: { title: 'CDN & Edge Computing', file: 'collection/cdn_edge.html', tag: 'CDN' },
  observability: { title: 'Observability', file: 'collection/observability.html', tag: 'Observability' },
  security: { title: 'Security & Authentication', file: 'collection/security.html', tag: 'Security' },
  scalability: { title: 'Scalability Patterns', file: 'collection/scalability.html', tag: 'Patterns' },
  api_design: { title: 'API Design', file: 'collection/api_design.html', tag: 'API' },
  data_structures: { title: 'Data Structures for SysDesign', file: 'collection/data_structures.html', tag: 'CS Fundamentals' },
  microservices: { title: 'Microservices Patterns', file: 'collection/microservices.html', tag: 'Architecture' },
  interview_framework: { title: 'Interview Framework', file: 'collection/interview_framework.html', tag: 'Process' },
  design_twitter: { title: 'Design Twitter / X', file: 'collection/design_twitter.html', tag: 'Walkthrough' },
  design_uber: { title: 'Design Uber', file: 'collection/design_uber.html', tag: 'Walkthrough' },
  design_whatsapp: { title: 'Design WhatsApp', file: 'collection/design_whatsapp.html', tag: 'Walkthrough' },
  design_youtube: { title: 'Design YouTube', file: 'collection/design_youtube.html', tag: 'Walkthrough' },
  design_dropbox: { title: 'Design Dropbox', file: 'collection/design_dropbox.html', tag: 'Walkthrough' }
};

function openCollection(){
  document.getElementById('list').style.display='none';
  document.getElementById('coll-panel').classList.add('open');
}
function closeCollection(){
  document.getElementById('coll-item').classList.remove('open');
  var f=document.getElementById('ci-iframe');if(f)f.srcdoc='';
  document.getElementById('coll-panel').classList.remove('open');
  document.getElementById('list').style.display='block';
}
function openCollItem(id){
  var item=COLLECTION_DATA[id];
  if(!item)return;
  document.getElementById('ci-title').textContent=item.title;
  var iframe=document.getElementById('ci-iframe');
  document.getElementById('coll-item').classList.add('open');
  if(item.srcdoc){
    /* embedded — works on file://, GitHub Pages, everywhere */
    iframe.srcdoc=item.srcdoc;
  } else {
    /* fetch-based — for cms/topk/ai_handbook standalone files */
    iframe.srcdoc='<div style="font-family:-apple-system,sans-serif;padding:40px 24px;text-align:center;color:#aaa;font-size:14px">Loading…</div>';
    fetch(item.file)
      .then(function(r){ if(!r.ok)throw new Error('HTTP '+r.status); return r.text(); })
      .then(function(html){ iframe.srcdoc=html; })
      .catch(function(e){
        iframe.srcdoc='<div style="font-family:-apple-system,sans-serif;padding:40px 24px;color:#c00;font-size:14px">Could not load '+item.file+'.<br><small>'+e.message+'</small><br><br><small>Run via server: <code>python3 -m http.server</code></small></div>';
      });
  }
}
function closeCollItem(){
  document.getElementById('coll-item').classList.remove('open');
  /* Clear iframe to stop any running scripts */
  setTimeout(function(){
    var f=document.getElementById('ci-iframe');
    if(f)f.srcdoc='';
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
    ['btn_coll_design_dropbox',function(){openCollItem('design_dropbox');}]
  ];
  pairs.forEach(function(p){
    var el=document.getElementById(p[0]);
    if(el) el.addEventListener('click',p[1]);
  });
}
