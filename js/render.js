/* ═══════════════════════════════════════════════════════
   JAVA RENDER
═══════════════════════════════════════════════════════ */
function hl(code){
  const kw=['public','private','protected','class','interface','extends','implements','new','return','if','else','for','while','do','switch','case','default','break','continue','null','true','false','void','static','final','abstract','import','package','throws','throw','try','catch','finally','int','long','double','float','boolean','char','String','List','Map','Set','ArrayList','HashMap','HashSet','LinkedList','Stack','Queue','TreeMap','TreeSet','PriorityQueue','Arrays','Collections','Math','Integer','Character','Optional','var'];
  let h=code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  h=h.replace(/(\/\/[^\n]*)/g,'<span style="color:#6a9955">$1</span>');
  h=h.replace(/(\/\*[\s\S]*?\*\/)/g,'<span style="color:#6a9955">$1</span>');
  h=h.replace(/("(?:[^"\\]|\\.)*")/g,'<span style="color:#ce9178">$1</span>');
  h=h.replace(/\b(\d+)\b/g,'<span style="color:#b5cea8">$1</span>');
  kw.forEach(k=>{h=h.replace(new RegExp('\\b('+k+')\\b','g'),'<span style="color:#569cd6">$1</span>');});
  return h;
}
const rx=t=>String(t||'').replace(/`([^`]+)`/g,'<code>$1</code>');
const eh=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function renderCoding(d){
  const a=document.getElementById('rarea');
  const stH=(d.steps||[]).map((s,i)=>`<div class="card fadein"><div class="card-head"><div class="cnum">${i+1}</div><div>${s.title}</div></div><div class="card-body">${rx(s.what)}<br><br>${rx(s.how)}</div><div class="card-sub">💡 Why: ${s.why}</div></div>`).join('');
  const trH=(d.tricky_parts||[]).map(t=>`<div class="iblock red fadein"><div class="blbl">⚠️ ${t.issue}</div>${rx(t.explanation)}</div>`).join('');
  const qaH=(d.followup_qa||[]).map(q=>`<div class="qa-item fadein"><div class="qa-q" onclick="toggleQA(this)"><span>${q.question}</span><span class="chev">›</span></div><div class="qa-a">${rx(q.answer)}</div></div>`).join('');
  const vl=v=>v==='better'?'✓ Better':v==='worse'?'✗ Worse':'⇄ Trade-off';
  const vc=v=>v==='better'?'bg':v==='worse'?'bo':'bb';
  const alH=(d.alternatives||[]).map(al=>`<div class="card fadein"><div class="card-head" style="justify-content:space-between"><span>${al.name} <small style="color:var(--ts);font-weight:400">${al.complexity}</small></span><span class="badge ${vc(al.verdict)}">${vl(al.verdict)}</span></div><div class="card-body">${al.when_to_use}</div></div>`).join('');
  a.innerHTML=
    ptabBar(['overview','Overview','code','Code','steps','Walkthrough','tricky','Gotchas','qa','Q&A','alts','Alternatives'])+
    `<div class="ppanel on" >
      <div class="iblock blue fadein"><div class="blbl">🧠 How I thought about this</div>${d.thought_process}</div>
      <div class="iblock green fadein"><div class="blbl">💡 Real-world analogy</div>${d.analogy}</div>
      <div class="sumbox fadein">${d.summary}</div>
      <div class="mrow"><span class="badge ba">${d.complexity}</span><span class="badge bb">${d.pattern}</span><span class="badge bg">${d.approach}</span></div>
      <div style="font-size:12.5px;line-height:1.7;color:var(--ts);padding:2px 0 14px">${d.complexity_explanation}</div>
      <button class="spk-btn fadein" onclick="openSM()">📢 Open Speak Mode</button>
    </div>
    <div class="ppanel" id="pp_code">
      <p style="font-size:11px;color:var(--ts);margin-bottom:9px">Lines wrap — scroll up/down only. No horizontal scroll.</p>
      <div class="code-outer fadein"><div class="code-hdr"><span class="code-lang">JAVA</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div><div class="code-body"><pre>${hl(d.code)}</pre></div></div>
    </div>
    <div class="ppanel" id="pp_steps"><div>${stH}</div></div>
    <div class="ppanel" id="pp_tricky"><p style="font-size:11.5px;color:var(--ts);margin-bottom:12px;line-height:1.5">Knowing these signals thoroughness.</p>${trH}</div>
    <div class="ppanel" ><p style="font-size:11.5px;color:var(--ts);margin-bottom:12px;line-height:1.5">Tap to reveal.</p>${qaH}</div>
    <div class="ppanel" id="pp_alts"><p style="font-size:11.5px;color:var(--ts);margin-bottom:12px;line-height:1.5">Mentioning trade-offs signals depth.</p>${alH}</div>`;
  a._rawCode=d.code;a.classList.add('on');
  setTimeout(()=>a.scrollIntoView({behavior:'smooth',block:'start'}),120);
}

/* ═══════════════════════════════════════════════════════
   SD RENDER — full final render replaces skeleton
═══════════════════════════════════════════════════════ */
function renderSD(d,_container){
  const a=_container||document.getElementById('rarea');
  var _pfx=_container?'sd'+(++_sdCardIdx)+'_':'';
  const r=d.step1_requirements||{},api=d.step3_api_design||{};
  const hld5=d.step5_high_level_design||{};
  /* KEY FIX: resolve all JSON paths from actual prompt output */
  const hlds=d.hld_fr_walkthroughs||d.hld_sections||[];
  const dives=d.step6_deep_dives||[];
  const sg=d.speak_guide||{};
  const cap=r.capacity||{};
  /* step5 sub-fields */
  const schema=hld5.schema||d.schema||[];
  const components=hld5.components||d.components||[];
  const diagScaled=hld5.diagram_scaled||d.diagram_scaled||'';
  const diagScaledComm=hld5.diagram_scaled_commentary||d.diagram_scaled_commentary||[];
  const diagSimple=hld5.diagram_simple||d.diagram_simple||'';
  const diagSimpleComm=hld5.diagram_simple_commentary||d.diagram_simple_commentary||[];
  const eh2=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  /* Requirements */
  const funcH=(r.functional||[]).map(f=>`<div class="hrow fadein"><strong>${f.priority==='core'?'🔵':'⚪'} ${f.req}</strong>${f.technical_implication?`<div style="font-size:11.5px;color:var(--ts);margin-top:2px">→ ${f.technical_implication}</div>`:''}</div>`).join('');
  const nfrH=(r.non_functional||[]).map(n=>`<div class="hrow fadein">◎ <strong>${n.req}</strong> <span class="badge ba">${n.value}</span>${n.tradeoff?`<div style="font-size:11.5px;color:var(--orange);margin-top:2px">Trade-off: ${n.tradeoff}</div>`:''}</div>`).join('');
  const oosH=(r.out_of_scope||[]).map(o=>`<span class="pill">✗ ${o}</span>`).join('');

  /* Capacity — plain English first */
  const capH=cap.write_qps?`<div style="background:var(--as);border:1px solid rgba(200,169,110,.3);border-radius:10px;padding:13px 14px;margin-bottom:12px">
    ${cap.plain_english?`<div style="font-size:13px;line-height:1.75;color:var(--tp);margin-bottom:10px">${cap.plain_english}</div>`:''}
    <div style="font-size:10px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">Assumptions</div>
    ${(cap.assumptions||[]).map(a=>`<div style="font-size:11.5px;color:var(--ts);margin-bottom:2px">• ${a}</div>`).join('')}
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">
      <div style="flex:1;min-width:100px;background:var(--os);border-radius:8px;padding:9px 11px"><div style="font-size:9px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">✍️ Write QPS</div><div style="font-size:13px;font-weight:700">${cap.write_qps}</div></div>
      <div style="flex:1;min-width:100px;background:var(--bs);border-radius:8px;padding:9px 11px"><div style="font-size:9px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">📖 Read QPS</div><div style="font-size:13px;font-weight:700">${cap.read_qps}</div></div>
      <div style="flex:1;min-width:100px;background:var(--gs);border-radius:8px;padding:9px 11px"><div style="font-size:9px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px">💾 Storage/yr</div><div style="font-size:13px;font-weight:700">${cap.storage_per_year}</div></div>
    </div>
    ${cap.design_impact?`<div style="font-size:12px;font-weight:600;color:var(--tp);background:var(--sf);border-radius:7px;padding:8px 11px;margin-top:8px">🎯 ${cap.design_impact}</div>`:''}
  </div>`:'<div class="iblock orange fadein"><div class="blbl">📌 Hello Interview</div>Skip capacity unless it changes a design decision — say this explicitly.</div>';

  /* Entities */
  const entH=(d.step2_core_entities||[]).map(e=>`<div class="card fadein" style="margin-bottom:9px"><div class="card-head" style="font-weight:700">${e.name}</div><div class="card-body">${e.description}</div>${e.note?`<div class="card-sub">💡 ${e.note}</div>`:''}</div>`).join('');

  /* API Protocol section — base protocol + real-time */
  const rt=api.realtime_protocol||{};
  /* Base protocol card */
  const protoCard=`<div class="tech-card fadein" style="border-color:rgba(61,122,82,.35);margin-bottom:14px">
    <div class="tech-top"><span class="tech-name">🌐 Base Protocol</span><span class="chosen-tag">✓ ${api.protocol_choice||'REST / HTTP'}</span></div>
    <div class="tech-role">${api.protocol_why||api.protocol_choice||'REST over HTTPS — stateless, cacheable, wide tooling support. Default for most web-facing systems.'}</div>
    <div class="alt-lbl">Protocol alternatives for this system</div>
    ${(api.protocol_alternatives||[]).map(a=>`<div class="alt-row"><span class="alt-name">${a.name}</span><span class="av ${a.verdict==='avoid'?'av-avoid':a.verdict==='tradeoff'?'av-trade':'av-ok'}">${a.verdict==='avoid'?'✗ Avoid':a.verdict==='tradeoff'?'⇄ Trade-off':'✓ OK'}</span><span class="alt-why">${a.reason}</span></div>`).join('')||'<div style="font-size:12px;color:var(--ts);padding:4px 0">• <strong>gRPC</strong> — faster binary, ideal for internal service-to-service; harder to debug, browser support needs proxy<br>• <strong>GraphQL</strong> — flexible queries from client; overhead not justified unless clients have very different data needs<br>• <strong>WebSocket</strong> — see real-time section below</div>'}
  </div>`;
  /* Real-time protocol card */
  const rtH=(rt.chosen&&rt.chosen!=='None'&&rt.chosen!=='')?`${protoCard}<div class="tech-card fadein" style="border-color:rgba(45,95,160,.35);margin-bottom:14px">
    <div class="tech-top"><span class="tech-name">🔄 Real-time: ${rt.chosen}</span><span class="chosen-tag">✓ chosen</span></div>
    <div class="tech-role">${rt.reason||''}</div>
    ${rt.where_in_arch?`<div class="tech-why"><strong>Where in arch:</strong> ${rt.where_in_arch}</div>`:''}
    ${(rt.alternatives||[]).length?`<div class="alt-lbl">Real-time alternatives</div>${rt.alternatives.map(a=>`<div class="alt-row"><span class="alt-name">${a.name}</span><span class="av ${a.verdict==='avoid'?'av-avoid':a.verdict==='tradeoff'?'av-trade':'av-ok'}">${a.verdict==='avoid'?'✗ Avoid':a.verdict==='tradeoff'?'⇄ Trade-off':'✓ OK'}</span><span class="alt-why">${a.reason}</span></div>`).join('')}`:''}
  </div>`:protoCard;

  /* API endpoints */
  const apiH=(api.endpoints||[]).map(ep=>`<div class="card fadein" style="margin-bottom:10px">
    <div class="card-head"><span class="badge bb" style="font-family:monospace;font-size:10px">${ep.method}</span> <code style="font-size:12.5px">${ep.path}</code></div>
    <div class="card-body">${ep.auth?`<div style="font-size:11.5px;color:var(--ts);margin-bottom:4px">🔐 ${ep.auth}</div>`:''}<strong>Request:</strong> <code>${ep.request||''}</code><br><strong>Response:</strong> <code>${ep.response||''}</code>${ep.note?`<div style="font-size:11.5px;color:var(--ts);margin-top:4px">${ep.note}</div>`:''}</div>
  </div>`).join('');

  /* Clarifying questions */
  const cqH=(d.clarifying_questions||[]).map((q,i)=>{
    const qq=typeof q==='string'?{q,why:''}:(q||{});
    return `<div class="hrow fadein"><strong>Q${i+1}:</strong> ${qq.q||q}${qq.why?`<div style="font-size:11.5px;color:var(--ts);margin-top:2px">Why ask: ${qq.why}</div>`:''}</div>`;
  }).join('');

  /* HLD — FR by FR, Evan King style */
  const colorizeDiag=raw=>{
    let s=eh2(raw);
    s=s.replace(/\[([^\]<]+)\]/g,'<span style="color:#e8c060;font-weight:600">[$1]</span>');
    s=s.replace(/([→↓←↑])/g,'<span style="color:#7aabcc;font-weight:700">$1</span>');
    s=s.replace(/(★[^\n│┌┐└┘├┤╭╮╰╯]+)/g,'<span style="color:#e87840;font-weight:700">$1</span>');
    return s;
  };

  /* HLD walkthroughs — handles both hld_fr_walkthroughs and hld_sections key formats */
  const hldH=hlds.map((sec,i)=>{
    /* normalize field names from prompt variants */
    const title=sec.fr||sec.fr_title||('Section '+(i+1));
    const narrative=sec.narrative||'';
    const steps=sec.flow||sec.flow_steps||[];
    const keyPt=sec.key_point||sec.key_insight||'';
    const whatToDraw=sec.what_to_draw||'';
    /* new_components from prompt variant — may be inline or named */
    const comps=sec.new_components||[];
    return `<div style="margin-bottom:22px">
    <div style="font-size:13px;font-weight:700;padding:9px 13px;background:var(--as);border-radius:9px;border-left:3px solid var(--ac);margin-bottom:10px">🔵 ${title}</div>
    ${whatToDraw?`<div style="background:var(--os);border-radius:8px;padding:9px 12px;margin-bottom:10px;font-size:12.5px"><strong style="color:var(--orange)">✏️ Draw:</strong> ${whatToDraw}</div>`:''}
    ${narrative?`<div style="font-size:13px;line-height:1.78;color:var(--tp);margin-bottom:11px">${narrative}</div>`:''}
    ${comps.length?`<div style="font-size:10px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">New components</div>
      ${comps.map(c=>`<div style="display:flex;gap:10px;align-items:flex-start;padding:9px 12px;background:var(--sf);border:1px solid var(--br);border-radius:8px;margin-bottom:5px">
        <div style="font-size:11.5px;font-weight:700;color:var(--tp);min-width:120px;flex-shrink:0">${c.name||''}</div>
        <div style="font-size:12px;color:var(--ts);line-height:1.6">${c.role||''}</div>
      </div>`).join('')}`:''}
    ${steps.length?`<div style="font-size:10px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.07em;margin:11px 0 6px">Step-by-step flow</div>
      ${steps.map(s=>`<div style="display:flex;gap:9px;padding:6px 0;border-bottom:1px solid var(--br);font-size:12.5px;line-height:1.65">
        <span style="color:var(--ac);font-weight:700;flex-shrink:0;min-width:16px">${String(s).match(/^\d+/)?.[0]||'→'}</span>
        <span style="color:var(--tp)">${String(s).replace(/^\d+\.\s*/,'')}</span>
      </div>`).join('')}`:''}
    ${keyPt?`<div style="background:var(--bs);border-left:3px solid var(--blue);border-radius:0 8px 8px 0;padding:9px 12px;margin-top:10px;font-size:12.5px;line-height:1.65"><strong style="color:var(--blue)">💡 Key insight (say this aloud):</strong> ${keyPt}</div>`:''}
  </div>`;
  }).join('<hr style="border:none;border-top:2px solid var(--br);margin:4px 0 22px">');

  /* Diagram 1 baseline with commentary */
  const diagSimpleH=diagSimple?`<div class="diag-wrap" style="margin-bottom:14px">
    <div class="diag-label">Diagram 1 — Baseline <span class="diag-pill">satisfies core FRs</span></div>
    <div style="font-size:11.5px;color:var(--ts);margin-bottom:8px;font-style:italic">Draw this first. Narrate each box as you add it using the speaking notes below.</div>
    <div class="diagram">${colorizeDiag(diagSimple)}</div>
    ${diagSimpleComm.length?`<div style="margin-top:12px">${diagSimpleComm.map(c=>`<div style="padding:11px 13px;background:var(--sf);border:1px solid var(--br);border-radius:9px;margin-bottom:8px">
      <div style="font-size:11px;font-weight:700;color:var(--green);margin-bottom:7px">🟩 ${c.component||''}</div>
      <div style="font-size:13px;line-height:1.72;color:var(--tp);font-style:italic;margin-bottom:${c.what_it_does||c.interviewer_tip?'9px':'0'}">"${c.say||''}"</div>
      ${c.what_it_does?`<div style="font-size:11.5px;color:var(--ts);line-height:1.6;margin-bottom:5px"><span style="font-weight:600;color:var(--tp)">⚙️ Mechanism:</span> ${c.what_it_does}</div>`:''}
      ${c.interviewer_tip?`<div style="font-size:11.5px;color:var(--blue);line-height:1.6;padding:6px 10px;background:var(--bs);border-radius:6px;border-left:2px solid var(--blue);margin-bottom:${c.bottleneck_at_scale?'5px':'0'}"><span style="font-weight:600">💡 Interviewer listens for:</span> ${c.interviewer_tip}</div>`:''}
      ${c.bottleneck_at_scale?`<div style="font-size:11.5px;color:var(--red,#e53);line-height:1.6;padding:6px 10px;background:rgba(229,51,51,.07);border-radius:6px;border-left:2px solid var(--red,#e53)"><span style="font-weight:600">⚠️ Bottleneck at scale:</span> ${c.bottleneck_at_scale}</div>`:''}
    </div>`).join('')}</div>`:''}
  </div>`:'';

  /* Diagram 2 scaled with commentary */
  const diagScaledH=diagScaled?`<div class="diag-wrap">
    <div class="diag-label">Diagram 2 — Production Design
      <span class="diag-pill">satisfies NFRs</span>
      <span class="diag-pill" style="background:var(--os);color:var(--orange)">★ = new vs Diagram 1</span>
      <span class="diag-pill" style="background:rgba(232,192,96,.15);color:#9a7820">[Alt:x] = alternatives</span>
    </div>
    <div style="font-size:11.5px;color:var(--ts);margin-bottom:8px;font-style:italic">For each ★ component you add, say WHY — which NFR it satisfies and what bottleneck it removes.</div>
    <div class="diagram">${colorizeDiag(diagScaled)}</div>
    ${diagScaledComm.length?`<div style="margin-top:12px"><div style="font-size:10px;font-weight:700;color:var(--ts);text-transform:uppercase;letter-spacing:.07em;margin-bottom:9px">🎙 Say this as you draw each ★ component</div>
    ${diagScaledComm.map(c=>`<div style="padding:11px 13px;background:var(--bs);border-radius:9px;margin-bottom:9px;border-left:3px solid var(--blue)">
      <div style="font-size:11px;font-weight:700;color:var(--orange);margin-bottom:7px">★ ${(c.component||'').replace(/^[★\s]+/,'')}</div>
      <div style="font-size:13px;line-height:1.72;color:var(--tp);font-style:italic;margin-bottom:${c.numbers||c.why_over_alternatives?'9px':'0'}">"${c.say||''}"</div>
      ${c.numbers?`<div style="font-size:11.5px;color:var(--green);font-weight:600;margin-bottom:6px">📊 ${c.numbers}</div>`:''}
      ${c.why_over_alternatives?`<div style="font-size:11.5px;color:var(--ts);line-height:1.6;padding:6px 10px;background:rgba(0,0,0,.08);border-radius:6px"><span style="font-weight:600;color:var(--tp)">🔀 Why not alternatives:</span> ${c.why_over_alternatives}</div>`:''}
    </div>`).join('')}</div>`:''}
  </div>`:'';

  /* Schema — from step5_high_level_design.schema */
  const schemaH=schema.map(t=>`<div class="card fadein" style="margin-bottom:11px">
    <div class="card-head" style="justify-content:space-between"><span style="font-weight:700">${t.table}</span><span class="badge bp">${t.storage}</span></div>
    <div class="card-body">
      ${t.access_pattern?`<div style="font-size:11.5px;color:var(--blue);margin-bottom:7px;font-weight:600">📊 ${t.access_pattern}</div>`:''}
      <div style="background:var(--cdbg);border-radius:7px;padding:9px 12px;font-family:'SF Mono',monospace;font-size:11px;line-height:1.85;color:var(--cdtx);word-break:break-word;margin-bottom:7px">${eh2(t.key_fields||'')}</div>
      ${t.key_indexes?`<div style="font-size:11.5px;color:var(--ts);margin-bottom:4px">🔑 ${t.key_indexes}</div>`:''}
      <div class="card-sub">Why ${t.storage}: ${t.why}</div>
    </div>
  </div>`).join('');

  /* Components — from step5_high_level_design.components */
  const compH=components.map(c=>`<div class="tech-card fadein">
    <div class="tech-top"><span class="tech-name">${c.name}</span><span class="chosen-tag">✓ ${c.chosen_tech}</span></div>
    <div class="tech-role">${c.role}</div>
    <div class="tech-why"><strong>Why ${c.chosen_tech}:</strong> ${c.why_chosen}</div>
    ${c.alternatives&&c.alternatives.length?`<div class="alt-lbl">Alternatives</div>${c.alternatives.map(alt=>`<div class="alt-row"><span class="alt-name">${alt.name}</span><span class="av ${alt.verdict==='avoid'?'av-avoid':alt.verdict==='tradeoff'?'av-trade':'av-ok'}">${alt.verdict==='avoid'?'✗ Avoid':alt.verdict==='tradeoff'?'⇄ Trade-off':'✓ OK'}</span><span class="alt-why">${alt.reason}</span></div>`).join('')}`:''}
  </div>`).join('');

  /* Deep dives — handles {bad,good,great} objects AND flat string fields */
  const deepH=dives.map(dd=>{
    /* normalize: bad/good/great can be objects {label,approach,why_fails,limitation,numbers,trade_offs} */
    const badObj=dd.bad||{};const goodObj=dd.good||{};const greatObj=dd.great||{};
    const badTxt=typeof dd.bad==='string'?dd.bad:(badObj.approach?`${badObj.approach}${badObj.why_fails?' — <em>'+badObj.why_fails+'</em>':''}`:'');
    const goodTxt=typeof dd.good==='string'?dd.good:(goodObj.approach?`${goodObj.approach}${goodObj.limitation?' — <em>Limitation: '+goodObj.limitation+'</em>':''}`:'');
    const greatTxt=typeof dd.great==='string'?dd.great:(greatObj.approach||'');
    const nums=greatObj.numbers||dd.numbers||'';
    const tradeoffs=greatObj.trade_offs||dd.trade_offs||'';
    const whyHard=dd.why_hard||badObj.why_fails||'';
    /* flat string fallbacks for old format */
    const badFinal=badTxt||dd.bad_solution||'';
    const goodFinal=goodTxt||dd.good_solution||'';
    const greatFinal=greatTxt||dd.great_solution||dd.real_solution||'';
    const badLabel=(typeof dd.bad==='object'&&dd.bad?.label)||'Bad Solution — why it fails';
    const goodLabel=(typeof dd.good==='object'&&dd.good?.label)||'Good Solution';
    const greatLabel=(typeof dd.great==='object'&&dd.great?.label)||'Great Solution';
    return `<div class="card fadein" style="margin-bottom:18px">
    <div class="card-head" style="flex-direction:column;align-items:flex-start;gap:5px">
      <div style="font-size:14px;font-weight:700">🔬 ${dd.topic||''}</div>
      ${dd.nfr_addressed?`<span class="badge bb" style="font-weight:500">Hardens: ${dd.nfr_addressed}</span>`:''}
    </div>
    ${whyHard?`<div class="card-body" style="margin-bottom:9px"><strong>Why hard:</strong> ${whyHard}</div>`:''}
    ${badFinal?`<div style="background:var(--rs);border-radius:9px;padding:10px 13px;margin-bottom:7px">
      <div style="font-size:9.5px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">❌ ${badLabel}</div>
      <div style="font-size:12.5px;line-height:1.68">${badFinal}</div></div>`:''}
    ${goodFinal?`<div style="background:var(--os);border-radius:9px;padding:10px 13px;margin-bottom:7px">
      <div style="font-size:9.5px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">🟡 ${goodLabel}</div>
      <div style="font-size:12.5px;line-height:1.68">${goodFinal}</div></div>`:''}
    ${greatFinal?`<div style="background:var(--gs);border-radius:9px;padding:10px 13px;margin-bottom:7px">
      <div style="font-size:9.5px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px">✅ ${greatLabel}</div>
      <div style="font-size:12.5px;line-height:1.68">${greatFinal}</div>
      ${nums?`<div style="font-size:11.5px;font-family:monospace;background:rgba(0,0,0,.06);border-radius:5px;padding:5px 8px;margin-top:6px">📊 ${nums}</div>`:''}</div>`:''}
    ${tradeoffs?`<div class="card-warn">⇄ Trade-off: ${tradeoffs}</div>`:''}
  </div>`;}).join('');

  /* Q&A */
  const qaH=(d.followup_qa||[]).map(q=>`<div class="qa-item fadein"><div class="qa-q" onclick="toggleQA(this)"><span>${q.question}</span><span class="chev">›</span></div><div class="qa-a">${q.answer}</div></div>`).join('');

  /* ══ FULL RENDER ══ */
  a.innerHTML='<div class="sd-card-root">'+
    ptabBar(['overview','Overview','walkthrough','Design Walkthrough','deepdives','Deep Dives','qa','Q&A'])+

    `<div class="ppanel on">
      <div class="sumbox fadein">${d.problem_statement}</div>
      <div class="sublbl">Clarifying Questions</div>${cqH}
      <div class="sublbl">🔵 Functional Requirements</div>${funcH}
      <div class="sublbl">◎ Non-Functional Requirements</div>${nfrH}
      <div class="sublbl">📊 Scale & Capacity</div>${capH}
      <div class="sublbl">✗ Out of Scope</div><div class="pill-row">${oosH}</div>
      <div class="iblock blue fadein" style="margin-top:10px"><div class="blbl">🧠 Interview framing</div>${d.thought_process||''}</div>
      <button class="spk-btn fadein" style="margin-top:10px" onclick="openSM()">📢 Open Speak Mode</button>
    </div>

    <div class="ppanel">
      <div class="stab-row">
        <div class="stab on"><span class="sn">1</span>Entities<span class="step-t">~2m</span></div>
        <div class="stab"><span class="sn">2</span>API & Protocol<span class="step-t">~5m</span></div>
        <div class="stab"><span class="sn">3</span>HLD — FR by FR<span class="step-t">~15m</span></div>
        <div class="stab"><span class="sn">4</span>Scaled Design<span class="step-t">~5m</span></div>
        <div class="stab"><span class="sn">5</span>Schema<span class="step-t">in HLD</span></div>
      </div>

      <div class="spanel on">
        <div class="iblock blue fadein"><div class="blbl">📌 Evan King — Entities first</div>List core domain nouns only — no fields yet. Talk through each briefly. Fields emerge when you trace each API request in HLD step 3.</div>
        ${entH}
      </div>

      <div class="spanel">
        <div class="iblock blue fadein"><div class="blbl">📌 Evan King — API design</div>State real-time protocol choice upfront — shapes the whole architecture. REST endpoints: plural nouns, user_id from JWT never body, note security on each.</div>
        ${rtH}
        <div class="sublbl">Endpoints — ${api.protocol_choice||'REST'}</div>${apiH}
      </div>

      <div class="spanel">
        <div class="iblock blue fadein"><div class="blbl">📌 Evan King — HLD: FR by FR</div>Satisfy each FR one at a time. Narrative → new components → numbered flow → cumulative diagram. Each diagram includes ALL previous components plus ★ new ones.</div>
        ${hldH}
      </div>

      <div class="spanel">
        <div class="iblock blue fadein"><div class="blbl">📌 Evan King — Scaled design</div>Start from Diagram 1 (baseline). Add ★ components one at a time — for each say the NFR it satisfies and the bottleneck it removes. This evolution story is what separates Staff from Mid.</div>
        ${diagSimpleH}
        ${diagScaledH}
        <div class="sublbl" style="margin-top:16px">Component Decisions <span style="font-size:9.5px;font-weight:400;color:var(--ts)">— match ★ components in diagram above</span></div>
        ${compH}
      </div>

      <div class="spanel">
        <div class="iblock blue fadein"><div class="blbl">📌 Evan King — Schema</div>Introduce fields only as you trace the write path to the DB in each FR section. Only show fields that affect query patterns or storage decisions.</div>
        ${schemaH}
      </div>
    </div>

    <div class="ppanel">
      <div class="iblock blue fadein"><div class="blbl">📌 Evan King — Deep dives</div>Each dive answers "How do we...?" for a specific NFR. Always Bad solution first — it shows you understand WHY it is hard. Then Good, then Great. Lead proactively at senior+ level.</div>
      ${deepH}
    </div>

    <div class="ppanel">
      <p style="font-size:11.5px;color:var(--ts);margin-bottom:12px">Tap to reveal a confident answer.</p>${qaH}
    </div></div>`;

  a.classList.add('on');
  var wt=a.querySelectorAll('.ppanel')[1]||a.querySelector('.ppanel');
  if(wt)wireSubTabs(wt);
  setTimeout(()=>a.scrollIntoView({behavior:'smooth',block:'start'}),120);
}

function copyCode(btn){const a=document.getElementById('rarea');navigator.clipboard.writeText(a._rawCode||'').then(()=>{btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy',1500);});}

