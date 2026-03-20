/* ═══════════════════════════════════════════════════════
   MY COLLECTION  📚
   To add a new item:
   1. Add the HTML file to collection/
   2. Add an entry here in COLLECTION_DATA
   3. Add a <button> row in index.html (#coll-panel)
   4. Wire the button in initCollection() below
═══════════════════════════════════════════════════════ */
const COLLECTION_DATA = {
  cms:         { title: 'Count-Min Sketch',              file: 'collection/cms.html',         tag: 'Algorithm' },
  topk:        { title: 'Top-K End-to-End Design',       file: 'collection/topk.html',        tag: 'System Design' },
  ai_handbook: { title: 'AI Leadership Handbook',        file: 'collection/ai_handbook.html', tag: 'AI / Leadership' },
  databases:   { title: 'PostgreSQL vs MongoDB vs Dynamo vs Cassandra', file: 'collection/databases.html', tag: 'Databases' },
  olap:        { title: 'OLAP: ClickHouse vs Druid vs BigQuery', file: 'collection/olap.html', tag: 'Analytics DB' }
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
  iframe.srcdoc='<div style="font-family:-apple-system,sans-serif;padding:40px 24px;text-align:center;color:#aaa;font-size:14px">Loading…</div>';
  document.getElementById('coll-item').classList.add('open');
  fetch(item.file)
    .then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.text();
    })
    .then(function(html){ iframe.srcdoc=html; })
    .catch(function(e){
      iframe.srcdoc='<div style="font-family:-apple-system,sans-serif;padding:40px 24px;color:#c00;font-size:14px">Could not load '+item.file+'<br><small>'+e.message+'</small><br><br><small>If running locally, use a server: <code>npx serve .</code> or <code>python3 -m http.server</code></small></div>';
    });
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
  var bc=document.getElementById('btn_collection');
  var bback=document.getElementById('btn_coll_back');
  var bcms=document.getElementById('btn_coll_cms');
  var btopk=document.getElementById('btn_coll_topk');
  var biback=document.getElementById('btn_ci_back');
  if(bc) bc.addEventListener('click',openCollection);
  if(bback) bback.addEventListener('click',closeCollection);
  if(bcms) bcms.addEventListener('click',function(){openCollItem('cms');});
  if(btopk) btopk.addEventListener('click',function(){openCollItem('topk');});
  var bai=document.getElementById('btn_coll_ai');
  if(bai) bai.addEventListener('click',function(){openCollItem('ai_handbook');});
  var bdb=document.getElementById('btn_coll_databases');
  if(bdb) bdb.addEventListener('click',function(){openCollItem('databases');});
  var bolap=document.getElementById('btn_coll_olap');
  if(bolap) bolap.addEventListener('click',function(){openCollItem('olap');});
  var bstream=document.getElementById('btn_coll_streaming');
  if(bstream) bstream.addEventListener('click',function(){openCollItem('streaming');});
  if(biback) biback.addEventListener('click',closeCollItem);
  var bdbs=document.getElementById('btn_coll_databases');
  if(bdbs) bdbs.addEventListener('click',function(){openCollItem('databases');});
  var bolap=document.getElementById('btn_coll_olap');
  if(bolap) bolap.addEventListener('click',function(){openCollItem('olap');});
}
