(function(){
  if (!('speechSynthesis' in window)) return;

  var INLINE_TAGS = {SPAN:1,STRONG:1,EM:1,B:1,I:1,CODE:1,BR:1,A:1,SUP:1,SUB:1,SMALL:1,U:1};
  var EXCLUDE_ROOTS = 'nav, .nav, footer, .footer, script, style, .codeblock, pre';

  function isExcluded(el){
    return !!el.closest(EXCLUDE_ROOTS) || el.closest('#am-speaker-root');
  }

  function isInlineOnly(el){
    for (var i=0;i<el.children.length;i++){
      if (!INLINE_TAGS[el.children[i].tagName]) return false;
    }
    return true;
  }

  function rowText(tr){
    var cells = tr.querySelectorAll('td,th');
    var parts = [];
    for (var i=0;i<cells.length;i++){
      var t = cells[i].textContent.replace(/\s+/g,' ').trim();
      if (t) parts.push(t);
    }
    return parts.join('. ');
  }

  function collectChunks(){
    var all = document.body.querySelectorAll('*');
    var chunks = [];
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.id === 'am-speaker-root' || isExcluded(el)) continue;
      var tag = el.tagName;
      if (tag === 'TD' || tag === 'TH') continue;
      var text = '';
      if (tag === 'TR'){
        text = rowText(el);
      } else if (isInlineOnly(el)){
        text = el.textContent.replace(/\s+/g,' ').trim();
      } else {
        continue;
      }
      if (text.length < 3) continue;
      chunks.push({el: el, text: text, section: el.closest('section')});
    }
    return chunks;
  }

  var chunks = collectChunks();
  if (chunks.length === 0) return;

  var PRONOUNCE = [
    [/\bO\(log n\)/gi, 'order log n'],
    [/\bO\(n log n\)/gi, 'order n log n'],
    [/\bO\(1\)/gi, 'order 1'],
    [/\bO\(n\)/gi, 'order n'],
    [/\bO\(n\^2\)|\bO\(n2\)/gi, 'order n squared'],
    [/\bgRPC\b/g, 'G R P C'],
    [/\bmTLS\b/g, 'M T L S'],
    [/\bOAuth\b/g, 'O Auth'],
    [/\bGraphQL\b/g, 'Graph Q L'],
    [/\bNoSQL\b/g, 'No S Q L'],
    [/\bPostgreSQL\b/g, 'Postgres'],
    [/\bMySQL\b/g, 'My S Q L'],
    [/\bDynamoDB\b/g, 'Dynamo D B'],
    [/\bMongoDB\b/g, 'Mongo D B'],
    [/\betcd\b/g, 'et C D'],
    [/\bK8s\b/gi, 'Kubernetes'],
    [/\bCI\/CD\b/g, 'C I C D'],
    [/\bDDoS\b/gi, 'D DOS'],
    [/\b2PC\b/g, 'two P C'],
    [/\b3PC\b/g, 'three P C'],
    [/\bP999\b/g, 'P ninety nine point nine'],
    [/\bP99\b/g, 'P ninety nine'],
    [/\bP95\b/g, 'P ninety five'],
    [/\bP50\b/g, 'P fifty'],
    [/\bIOPS\b/g, 'eye ops'],
    [/\bS3\b/g, 'S three'],
    [/\bL4\b/g, 'layer four'],
    [/\bL7\b/g, 'layer seven'],
    [/\bIPv4\b/g, 'I P version four'],
    [/\bIPv6\b/g, 'I P version six'],
    [/\s*→\s*/g, ', then '],
    [/\s*←\s*/g, ', from '],
    [/\s*±\s*/g, ' plus or minus '],
    [/\s*≈\s*/g, ' approximately '],
    [/\s*·\s*/g, ', ']
  ];

  function toSpeechText(text){
    for (var i=0;i<PRONOUNCE.length;i++){
      text = text.replace(PRONOUNCE[i][0], PRONOUNCE[i][1]);
    }
    return text;
  }

  var VOICE_RANK = ['premium','enhanced','natural','neural','studio','wavenet','google'];
  var VOICE_PENALTY = ['compact'];
  var VOICE_GOOD_DEFAULTS = ['samantha','alex','ava','daniel','karen','moira','tessa','victoria','joanna','matthew'];
  var VOICE_NOVELTY = ['albert','bad news','bahh','bells','boing','bubbles','cellos','deranged','good news',
    'hysterical','jester','organ','trinoids','whisper','wobble','zarvox','bear','bunny','superstar','junior',
    'ralph','princess','kathy','fred','grandma','grandpa','rocko','shelley','sandy','reed','flo','eddy'];

  function scoreVoice(v){
    var name = v.name.toLowerCase();
    var score = 0;
    if (v.lang && v.lang.indexOf('en') === 0) score += 10;
    for (var i=0;i<VOICE_RANK.length;i++){ if (name.indexOf(VOICE_RANK[i]) !== -1) score += 5; }
    for (var j=0;j<VOICE_PENALTY.length;j++){ if (name.indexOf(VOICE_PENALTY[j]) !== -1) score -= 8; }
    for (var k=0;k<VOICE_GOOD_DEFAULTS.length;k++){ if (name.indexOf(VOICE_GOOD_DEFAULTS[k]) !== -1) score += 2; }
    for (var m=0;m<VOICE_NOVELTY.length;m++){ if (name.indexOf(VOICE_NOVELTY[m]) !== -1) score -= 50; }
    return score;
  }

  var voice = null;
  var voiceSelect = null;

  function savedVoiceKey(v){ return v.name + '|' + v.lang; }

  function populateVoiceList(){
    var voices = speechSynthesis.getVoices().filter(function(v){ return v.lang && v.lang.indexOf('en') === 0; });
    if (voices.length === 0) voices = speechSynthesis.getVoices();
    voices.sort(function(a,b){ return scoreVoice(b) - scoreVoice(a) || a.name.localeCompare(b.name); });

    var saved = localStorage.getItem('am-speaker-voice');
    var picked = (saved && voices.find(function(v){ return savedVoiceKey(v) === saved; })) || voices[0] || null;
    voice = picked;

    if (voiceSelect){
      voiceSelect.innerHTML = voices.map(function(v){
        var key = savedVoiceKey(v);
        var sel = picked && savedVoiceKey(picked) === key ? ' selected' : '';
        return '<option value="' + key.replace(/"/g,'&quot;') + '"' + sel + '>' + v.name + '</option>';
      }).join('');
    }
  }

  populateVoiceList();
  if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = populateVoiceList;

  var state = {playing:false, index:0, rate: parseFloat(localStorage.getItem('am-speaker-rate')) || 1};

  var root = document.createElement('div');
  root.id = 'am-speaker-root';
  root.innerHTML =
    '<style>' +
    '#am-speaker-root{position:fixed;right:18px;bottom:18px;z-index:99999;display:flex;align-items:center;gap:6px;' +
    'background:#1a1814;color:#f0ede6;border:1px solid #2e2c28;border-radius:999px;padding:8px 14px;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35);}' +
    '#am-speaker-root button{background:none;border:none;color:#f0ede6;cursor:pointer;font-size:15px;padding:4px 6px;' +
    'line-height:1;border-radius:6px;}' +
    '#am-speaker-root button:hover{background:rgba(255,255,255,.1);}' +
    '#am-speaker-root button:disabled{opacity:.35;cursor:default;}' +
    '#am-speaker-root button:disabled:hover{background:none;}' +
    '#am-speaker-root .am-rate{font-family:monospace;font-size:11px;color:#e8b84b;min-width:34px;text-align:center;}' +
    '#am-speaker-root .am-progress{font-family:monospace;font-size:10px;color:#8a8578;min-width:38px;text-align:center;}' +
    '#am-speaker-root select.am-voice{background:#0f0e0c;color:#d8d4c8;border:1px solid #2e2c28;border-radius:6px;' +
    'font-size:10.5px;padding:4px 6px;max-width:110px;font-family:-apple-system,sans-serif;}' +
    '.am-speaking{background:rgba(232,184,75,.22) !important;outline:2px solid rgba(232,184,75,.55);' +
    'outline-offset:2px;border-radius:4px;transition:background .15s;}' +
    '</style>' +
    '<button data-a="prev" title="Previous section">⏮</button>' +
    '<button data-a="play" title="Play">▶</button>' +
    '<button data-a="stop" title="Stop" disabled>⏹</button>' +
    '<button data-a="next" title="Next section">⏭</button>' +
    '<button data-a="rate" class="am-rate" title="Playback speed">1.0x</button>' +
    '<select class="am-voice" title="Voice — pick the best-sounding one installed on your system"></select>' +
    '<span class="am-progress">0/' + chunks.length + '</span>';
  document.body.appendChild(root);

  voiceSelect = root.querySelector('.am-voice');
  populateVoiceList();

  var playBtn = root.querySelector('[data-a="play"]');
  var stopBtn = root.querySelector('[data-a="stop"]');
  var rateBtn = root.querySelector('[data-a="rate"]');
  var progressEl = root.querySelector('.am-progress');
  var RATES = [0.75, 1, 1.25, 1.5, 2];
  rateBtn.textContent = state.rate.toFixed(2).replace(/0$/,'') + 'x';

  var lastEl = null;
  function highlight(el){
    if (lastEl) lastEl.classList.remove('am-speaking');
    if (el){
      el.classList.add('am-speaking');
      el.scrollIntoView({behavior:'smooth', block:'center'});
    }
    lastEl = el;
  }

  function expandFaq(el){
    var item = el.closest('.faq-item');
    if (item) item.classList.add('open');
  }

  var PAUSE_MS = 160;

  function speakFrom(index){
    speechSynthesis.cancel();
    if (index >= chunks.length){
      stop();
      return;
    }
    state.index = index;
    state.playing = true;
    playBtn.textContent = '⏸';
    stopBtn.disabled = false;
    var chunk = chunks[index];
    expandFaq(chunk.el);
    highlight(chunk.el);
    progressEl.textContent = (index+1) + '/' + chunks.length;
    var utter = new SpeechSynthesisUtterance(toSpeechText(chunk.text));
    utter.rate = state.rate;
    if (voice) utter.voice = voice;
    utter.onend = function(){
      if (!state.playing) return;
      setTimeout(function(){ if (state.playing) speakFrom(index + 1); }, PAUSE_MS);
    };
    utter.onerror = function(){
      if (state.playing) speakFrom(index + 1);
    };
    speechSynthesis.speak(utter);
  }

  function pause(){
    state.playing = false;
    speechSynthesis.cancel();
    playBtn.textContent = '▶';
  }

  function stop(){
    state.playing = false;
    speechSynthesis.cancel();
    playBtn.textContent = '▶';
    stopBtn.disabled = true;
    highlight(null);
    state.index = 0;
    progressEl.textContent = '0/' + chunks.length;
  }

  function currentSectionStart(index){
    var section = chunks[index] ? chunks[index].section : null;
    var start = index;
    while (start > 0 && chunks[start-1].section === section) start--;
    return start;
  }

  root.addEventListener('click', function(e){
    var btn = e.target.closest('button');
    if (!btn) return;
    var action = btn.getAttribute('data-a');
    if (action === 'play'){
      if (state.playing){ pause(); }
      else { speakFrom(state.index); }
    } else if (action === 'stop'){
      stop();
    } else if (action === 'next'){
      var section = chunks[state.index] ? chunks[state.index].section : null;
      var i = state.index;
      while (i < chunks.length && chunks[i].section === section) i++;
      if (i < chunks.length){
        if (state.playing) speakFrom(i); else { state.index = i; highlight(chunks[i].el); progressEl.textContent=(i+1)+'/'+chunks.length; }
      }
    } else if (action === 'prev'){
      var segStart = currentSectionStart(state.index);
      var target = state.index > segStart ? segStart : currentSectionStart(Math.max(segStart - 1, 0));
      if (state.playing) speakFrom(target); else { state.index = target; highlight(chunks[target].el); progressEl.textContent=(target+1)+'/'+chunks.length; }
    } else if (action === 'rate'){
      var idx = RATES.indexOf(state.rate);
      state.rate = RATES[(idx + 1) % RATES.length];
      localStorage.setItem('am-speaker-rate', state.rate);
      rateBtn.textContent = state.rate.toFixed(2).replace(/0$/,'') + 'x';
      if (state.playing) speakFrom(state.index);
    }
  });

  voiceSelect.addEventListener('change', function(){
    var voices = speechSynthesis.getVoices();
    voice = voices.find(function(v){ return savedVoiceKey(v) === voiceSelect.value; }) || voice;
    if (voice) localStorage.setItem('am-speaker-voice', savedVoiceKey(voice));
    if (state.playing) speakFrom(state.index);
  });

  window.addEventListener('pagehide', function(){ speechSynthesis.cancel(); });
})();
