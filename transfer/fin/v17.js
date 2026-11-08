
// ===== v17.0 (Philip, 8 Nov 2026): AFFINITY LIGHT VIOLET. Big cards deep plum (#431B4B), every small card the
// light Affinity "Personal dashboard" violet (#EFE9F5), each pot / plan / category its own colour, nothing repeats.
var V17_PAL=[['#FFE4E6','#E11D48'],['#EDE4FF','#7C3AED'],['#C9F2DF','#0F9D58'],['#D6ECFA','#0E7FA8'],['#FFE0B8','#C2410C'],['#FFF0B3','#A16207']];
function v17imp(el,p,v){ try{ el.style.setProperty(p,v,'important'); }catch(e){} }
function v17seen(el){ try{ _softSeen.add(el); }catch(e){} try{ _shaped.add(el); }catch(e){} }
function v17(pg){
  if(!pg) return;
  try{
    var tab=pg.id.replace('page-','');
    // 1. nothing repeats: the big card already shows total / saved / left
    [].slice.call(pg.querySelectorAll('.sx-card,.card')).forEach(function(c){
      var t=(c.innerText||'').trim();
      if(/^Total progress/i.test(t) && t.length<160 && !c.closest('.pp-hero')) c.style.display='none';
    });
    var hero=pg.querySelector('.pp-hero');
    if(hero){
      var g=hero.querySelector('.pp-g'), mini=(hero.querySelector('.pp-mini')||{}).innerText||'';
      if(g){
        var parts=g.textContent.split(' \u00b7 ').filter(function(x){
          if(/SAVED/i.test(mini) && /[\d,]+\s*saved/i.test(x)) return false;
          if(/PAID/i.test(mini) && /[\d,]+\s*paid/i.test(x)) return false;
          if(/lifetime|this week|this month|this year/i.test(x) && /^\+?GHS/i.test(x.trim())) return false;
          return true; });
        if(tab==='savings' && typeof savSide!=='undefined' && savSide==='income'){
          var pots=[].slice.call(pg.querySelectorAll('.sx-card')).filter(function(c){ return /Take out/.test(c.innerText||'') && /History/.test(c.innerText||''); }).length;
          var pc=(pg.innerText.match(/(\d+)%\s*\n/)||[])[1];
          parts=[pots+' pot'+(pots!==1?'s':'')+(pc?' \u00b7 '+pc+'% of each payment':'')];
        }
        g.textContent=parts.join(' \u00b7 ');
        if(!g.textContent.trim()) g.style.display='none';
      }
    }
    // 2. hints become short titles
    var w=document.createTreeWalker(pg,NodeFilter.SHOW_TEXT,null), n;
    while((n=w.nextNode())){
      var v=n.nodeValue.trim();
      if(/^Enter amount, then pick a plan to log to$/i.test(v)) n.nodeValue=(typeof planSide!=='undefined'&&planSide==='debt')?'Log a payment':'Log a saving';
    }
    // 3. small cards: light Affinity violet; 4. each item its own colour
    var k=0;
    [].slice.call(pg.querySelectorAll('.sx-card,.sx-acc,.card,.history-card,.goal-card,.savings-goal-card,.wn-item,.pp-card,.debt-card,.buy-card,.plan-card,.budget-cat,.cat-row')).forEach(function(c){
      if(c.closest('.pp-hero')||c.classList.contains('pp-reset')||c.closest('.pp-qa')||c.closest('#ppSheet')) return;
      v17imp(c,'background','#EFE9F5'); v17imp(c,'border','none'); v17imp(c,'box-shadow','none'); v17seen(c);
      var ic=c.querySelector('.sx-ic,.sx-bub,.cbb-icon');
      var bars=c.querySelectorAll('.sx-prog i,[class*="prog"] i,[class*="fill"],.bar i');
      if(ic && (bars.length || /Take out|left|spent|of /i.test(c.innerText||''))){
        var p=V17_PAL[k++%V17_PAL.length];
        v17imp(ic,'background',p[0]); v17imp(ic,'color',p[1]); v17seen(ic);
        [].slice.call(ic.querySelectorAll('svg,svg *')).forEach(function(s){ v17imp(s,'stroke',p[1]); });
        [].slice.call(bars).forEach(function(b){ v17imp(b,'background',p[1]); v17seen(b); });
        var amt=[].slice.call(c.querySelectorAll('b')).filter(function(b){ return /^[\d,.\s]+(left)?$/i.test((b.textContent||'').trim()) || /left$/i.test((b.textContent||'').trim()); })[0];
        if(amt){ v17imp(amt,'color',p[1]); v17imp(amt,'font-weight','700'); v17seen(amt); }
      }
      [].slice.call(c.querySelectorAll('input')).forEach(function(i){ v17imp(i,'background','#fff'); });
      [].slice.call(c.querySelectorAll('.sx-mini.g,.sx-mini:not(.g)')).forEach(function(b){
        if(b.classList.contains('g')){ v17imp(b,'background','#fff'); v17imp(b,'color','#431B4B'); }
        else { v17imp(b,'background','#431B4B'); v17imp(b,'color','#fff'); }
      });
    });
  }catch(e){ console.log(e); }
}
(function(){
  var css=document.createElement('style');
  css.textContent='body.look-soft .pp-hero,.pp-new .pp-hero{background:#431B4B!important}'+
    'body.look-soft .pp-ring div{background:#431B4B!important}'+
    'body.look-soft .sx-seg{background:#EFE9F5!important;border:none!important}body.look-soft .sx-seg button.on{background:#431B4B!important;color:#fff!important}'+
    '.pp-tophd .sx-sel{background:#EFE9F5!important}'+
    'body.look-soft .sx-prog,body.look-soft [class*="prog"]:not(i){background:#fff!important}';
  document.head.appendChild(css);
  var map={renderSpendMoney:'money',renderIncome:'money',renderMoney:'money',renderDebt:'debt',renderSavings:'savings',renderBudget:'budget',renderWN:'wn',renderBackup:'backup'};
  Object.keys(map).forEach(function(fn){
    var o=window[fn]; if(typeof o!=='function') return;
    window[fn]=function(){ var r=o.apply(this,arguments); v17(document.getElementById('page-'+map[fn])); return r; };
  });
  ['setPlanSide','setSavSide','wnSetTab','setMoneySide'].forEach(function(fn){
    var o=window[fn]; if(typeof o!=='function') return;
    window[fn]=function(){ var r=o.apply(this,arguments); var a=document.querySelector('.nav-btn.active'); v17(document.getElementById('page-'+(a?a.id.slice(4):'money'))); return r; };
  });
  try{ var a=document.querySelector('.nav-btn.active'); switchTab(a?a.id.slice(4):'money'); }catch(e){}
})();
