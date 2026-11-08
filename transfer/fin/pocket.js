
// ===== v16.0 (Philip, 8 Nov 2026): POCKETPLAN LAYOUT for the Money tab (his option 1). His colours, every old part kept.
// Order like PocketPlan: Money overview + period, Available to spend card with ring, Income / Spent / Budget left,
// 3 quick buttons, Spending by category donut, then his Debt paid / Savings / Lists / Budget boxes and Transactions.
// Settings: "Classic layout" link at the bottom of Money (localStorage fhLayout = classic) brings the old screen back.
function ppOn(){ try{ return localStorage.getItem('fhLayout')!=='classic'; }catch(e){ return true; } }
function ppSetLayout(x){ try{ localStorage.setItem('fhLayout',x); }catch(e){} renderMoney(); }
function ppNum(v){ v=Math.round(v||0); return Math.abs(v)>=10000?(v/1000).toFixed(v%1000?1:0)+'k':v.toLocaleString(); }
function ppTop(){
  var pr=periodRange(), all=getPeriodEntries(), arch=archiveForPeriod();
  var spent=all.reduce(function(s,e){return s+e.amount;},0)+arch.debt+arch.sav+arch.wants+arch.needs+arch.budget;
  var inc=0; try{ inc=incomeTotal(pr.from,pr.to)||0; }catch(e){}
  var bl=0; try{ var ym=TODAY.slice(0,7), cats=budgetCats(); var bs=cats.reduce(function(s,c){return s+catSpentMonth(c.id,ym);},0)+(typeof subsTotalMonthly==='function'?subsTotalMonthly():0); bl=(monthlyPlan||0)-bs; }catch(e){}
  var avail=inc-spent, pct=inc>0?Math.max(0,Math.min(100,Math.round(avail/inc*100))):0;
  var byCat={}; all.forEach(function(e){ var c=getCat(e.cat)||{label:e.cat,color:'#9B6BD9'}; var k=c.label||e.cat; if(!byCat[k]) byCat[k]={l:k,a:0,c:c.color||'#9B6BD9'}; byCat[k].a+=e.amount; });
  var cats=Object.keys(byCat).map(function(k){return byCat[k];}).sort(function(a,b){return b.a-a.a;});
  var tot=cats.reduce(function(s,c){return s+c.a;},0), at=0;
  var grad=tot>0?cats.map(function(c){ var a=at; at+=c.a/tot*100; return c.c+' '+a.toFixed(2)+'% '+at.toFixed(2)+'%'; }).join(','):'var(--line,#2a2a2e) 0 100%';
  var acc='var(--acc,#7B4BC4)';
  var q=function(ic,l,go){ return '<button onclick="'+go+'" class="pp-q"><span>'+ic+'</span>'+l+'</button>'; };
  return '<div class="pp-hd"><div><div class="pp-t1">Money overview</div><div class="pp-t2">Your numbers, your plan.</div></div></div>'+
    '<div class="pp-hero"><div class="pp-row"><div><div class="pp-l">Available to spend · '+pr.label.toLowerCase()+'</div><div class="pp-v">GHS '+Math.round(avail).toLocaleString()+'</div>'+
    '<div class="pp-g" style="color:'+(avail>=0?'#30D158':'#FF453A')+'">'+(inc>0?(avail>=0?'↑ ':'↓ ')+pct+'% of income left':'Add your income to see what is left')+'</div></div>'+
    '<div class="pp-ring" style="background:conic-gradient(#B48CF0 0 '+pct+'%,rgba(255,255,255,.08) '+pct+'% 100%)"><div>'+pct+'%<small>left</small></div></div></div>'+
    '<div class="pp-mini"><div><span>INCOME</span><b style="color:#30D158">'+ppNum(inc)+'</b></div><div><span>SPENT</span><b style="color:#FF6B5E">'+ppNum(spent)+'</b></div><div><span>BUDGET LEFT</span><b style="color:#4DD0E1">'+ppNum(bl)+'</b></div></div></div>'+
    '<div class="pp-qa">'+q('⊖','Add spending',"switchTab('budget')")+q('⊕','Add income',"setMoneySide('income')")+q('⇄','Transactions',"var t=document.getElementById('ppTx');if(t)t.scrollIntoView({behavior:'smooth'})")+'</div>'+
    '<div class="pp-card"><div class="pp-ch">Spending by category<span>'+pr.label+'</span></div><div class="pp-row" style="gap:16px">'+
    '<div class="pp-donut" style="background:conic-gradient('+grad+')"><div><small>SPENT</small><b>'+ppNum(spent)+'</b></div></div>'+
    '<div class="pp-leg">'+(cats.length?cats.slice(0,6).map(function(c){return '<p><span><i style="background:'+c.c+'"></i>'+sxEsc(c.l)+'</span>'+ppNum(c.a)+'</p>';}).join(''):'<p style="color:var(--muted,#8a8a90)">No spending yet</p>')+'</div></div></div>';
}
(function(){
  var css=document.createElement('style');
  css.textContent='.pp-hd{margin:2px 0 12px;display:flex;justify-content:space-between;align-items:center;gap:10px}.pp-t1{font-size:26px;font-weight:700;letter-spacing:-.3px}.pp-t2{font-size:13px;color:var(--muted,#8a8a90);margin-top:2px}'+
  '.pp-hero{background:linear-gradient(160deg,#2A1840,#160F1E);border:1px solid #3d2b5a;border-radius:22px;padding:18px;margin-bottom:12px;color:#fff}'+
  '.pp-row{display:flex;justify-content:space-between;align-items:center}.pp-l{font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#B8AECB}'+
  '.pp-v{font-size:34px;font-weight:800;margin:6px 0 4px}.pp-g{font-size:12px;font-weight:600}'+
  '.pp-ring{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;flex:none}.pp-ring div{width:76px;height:76px;border-radius:50%;background:#1D1429;display:grid;place-items:center;text-align:center;font-weight:700;font-size:15px;color:#D2B6FF;line-height:1.1}.pp-ring small{display:block;font-size:10px;color:#8a8a90;font-weight:500}'+
  '.pp-mini{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid #3a2c52;margin-top:14px;padding-top:12px}.pp-mini span{display:block;font-size:10px;font-weight:700;letter-spacing:1px;color:#8a8a90}.pp-mini b{display:block;font-size:18px;font-weight:800;margin-top:4px}'+
  '.pp-qa{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px}.pp-q{background:var(--card,#141416);border:1px solid var(--line,#26262a);border-radius:16px;padding:14px 4px;font:700 12px inherit;color:inherit;cursor:pointer}.pp-q span{display:block;font-size:20px;color:#B48CF0;margin-bottom:6px}'+
  '.pp-card{background:var(--card,#141416);border:1px solid var(--line,#26262a);border-radius:20px;padding:16px;margin-bottom:12px}.pp-ch{display:flex;justify-content:space-between;font-size:16px;font-weight:700;margin-bottom:12px}.pp-ch span{font-size:12px;font-weight:600;color:#B48CF0}'+
  '.pp-donut{width:116px;height:116px;border-radius:50%;display:grid;place-items:center;flex:none}.pp-donut div{width:84px;height:84px;border-radius:50%;background:var(--card,#141416);display:grid;place-items:center;text-align:center}.pp-donut small{display:block;font-size:10px;font-weight:700;color:#8a8a90}.pp-donut b{font-size:17px;font-weight:800}'+
  '.pp-leg{flex:1;font-size:13px;min-width:0}.pp-leg p{display:flex;justify-content:space-between;margin:6px 0;gap:6px}.pp-leg span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pp-leg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px}'+
  '.pp-sw{display:block;margin:14px auto 4px;background:none;border:none;color:var(--muted,#8a8a90);font-size:12px;text-decoration:underline;cursor:pointer}';
  document.head.appendChild(css);
  var oS=renderSpendMoney;
  renderSpendMoney=function(){
    var r=oS.apply(this,arguments);
    var pg=document.getElementById('page-money'); if(!pg) return r;
    if(!ppOn()){ pg.insertAdjacentHTML('beforeend','<button class="pp-sw" onclick="ppSetLayout(\'pocket\')">Switch to the PocketPlan layout</button>'); return r; }
    try{
      var root=pg.querySelector('.sx')||pg;
      var hero=root.querySelector('.sx-dark')||root.querySelector('.spend-big');
      var box=document.createElement('div'); box.innerHTML=ppTop();
      root.insertBefore(box,root.firstChild); if(hero) hero.style.display='none';
      var t=root.querySelector('.sx-top'); if(t) t.style.display='none';
      var hd=box.querySelector('.pp-hd'), sel=root.querySelector('.sx-sel'), seg=root.querySelector('.sx-seg');
      if(sel&&hd){ sel.style.margin='0'; sel.style.minWidth='130px'; hd.appendChild(sel); }
      if(seg&&hd) hd.parentNode.insertBefore(seg,hd.nextSibling);
      var h2=[].slice.call(root.querySelectorAll('.sx-h2,.spend-history-header')).filter(function(x){return /Transactions/.test(x.textContent);})[0]; if(h2) h2.id='ppTx';
      root.insertAdjacentHTML('beforeend','<button class="pp-sw" onclick="ppSetLayout(\'classic\')">Use the classic layout</button>');
    }catch(e){ console.log(e); }
    return r;
  };
  try{ var a=document.querySelector('.nav-btn.active'); if(a&&a.id.slice(4)==='money') renderMoney(); }catch(e){}
})();
