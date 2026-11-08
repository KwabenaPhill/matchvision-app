
// ===== v16.1 (Philip, 8 Nov 2026): one PocketPlan style on EVERY tab. Small header (logo + tab name + This Week
// on every tab), no tips or warnings, quick buttons open an Add sheet right there, Settings without App look,
// Reset card in red. Nothing saved is changed.
var PP_NAMES={money:'Money',debt:'Plans',savings:'Savings',budget:'Budget',wn:'Lists',backup:'Settings'};
var PP_TIPS=[/^Add your income to see what is left$/i,/^Applies from today/i,/^Clears the \+\/- and the streak/i,/^Every payment's save share/i,
  /^No money in yet\. Add money/i,/^Tap Add to wants to start/i,/^Add YouTube, ElevenLabs/i,/^Only clears Finance Hub/i,/^Tap a plan to give it money/i,
  /^No buy plans yet\. Add one above/i,/^Know where every cedi goes$/i,/^All your pots at a glance$/i,/^Wants and needs$/i,/^Backup, money rules and looks$/i,
  /^Pay it off, one day at a time$/i,/^Where your money went$/i,/^Money you received$/i,/^Your numbers, your plan\.?$/i];
function ppActive(){ var a=document.querySelector('.nav-btn.active'); return a?a.id.slice(4):'money'; }
function ppPer(v){ spendPeriod=v; try{ switchTab(ppActive()); }catch(e){} }
function ppHeader(tab){
  var sel='';
  if(tab!=='backup'){ try{ sel=sxSel(spendPeriod,'ppPer'); }catch(e){} }
  return '<div class="pp-tophd"><div class="pp-brand"><span class="pp-logo">₵</span><b>'+(PP_NAMES[tab]||'')+'</b></div>'+sel+'</div>';
}
function ppDecorate(pg){
  if(!pg||pg.dataset.ppBusy) return; pg.dataset.ppBusy='1';
  try{
    var tab=pg.id.replace('page-','');
    [].slice.call(pg.querySelectorAll('.sx-top,.soft-title,.soft-head,.pp-hd > div:first-child')).forEach(function(e){ e.style.display='none'; });
    if(!pg.querySelector('.pp-tophd')){
      var own=pg.querySelector('.pp-hd .sx-sel'); if(own) own.closest('.pp-hd').style.display='none';
      [].slice.call(pg.querySelectorAll('.sx-sel')).forEach(function(e){ if(!e.closest('.pp-tophd')) e.style.display='none'; });
      pg.insertAdjacentHTML('afterbegin',ppHeader(tab));
    }
    [].slice.call(pg.querySelectorAll('h1,h2,div,span')).forEach(function(el){
      if(el.closest('.pp-tophd')||el.children.length>1) return;
      if((el.innerText||'').trim()===PP_NAMES[tab] && parseFloat(getComputedStyle(el).fontSize)>=18) el.style.display='none';
    });
    var w=document.createTreeWalker(pg,NodeFilter.SHOW_TEXT,null), n, hide=[];
    while((n=w.nextNode())){ var t=n.nodeValue.trim(); if(t&&PP_TIPS.some(function(r){return r.test(t);})) hide.push(n.parentElement); }
    hide.forEach(function(el){ if(el) el.style.display='none'; });
    if(tab==='backup'){
      [].slice.call(pg.querySelectorAll('*')).forEach(function(el){
        if(el.children.length<8 && /^App look/.test((el.innerText||'').trim()) && el.offsetHeight<200 && !el.querySelector('.pp-tophd')){ var row=el.closest('.sx-row,.sx-tx,[onclick]')||el; row.style.display='none'; var nx=row.nextElementSibling; if(nx&&/Dark/.test(nx.innerText||'')&&/Classic/.test(nx.innerText||'')) nx.style.display='none'; }
      });
      [].slice.call(pg.querySelectorAll('*')).forEach(function(el){
        if(/^Reset Finance Hub/.test((el.innerText||'').trim()) && el.offsetHeight<220 && el.offsetHeight>40 && /card/.test(el.className)){ el.classList.add('pp-reset'); }
      });
      var r=[].slice.call(pg.querySelectorAll('.sx-card,.card')).filter(function(c){ return /^\s*Reset Finance Hub/.test(c.innerText||''); })[0]; if(r) r.classList.add('pp-reset');
    }
  }catch(e){ console.log(e); }
  delete pg.dataset.ppBusy;
}
// ---- the Add sheet (spending / income) right where you are
function ppSheet(kind){
  var old=document.getElementById('ppSheet'); if(old) old.remove();
  var f='';
  if(kind==='spend'){
    var cats=spendCats.filter(function(c){ return !c.fixed; }); if(!cats.length) cats=spendCats;
    f='<div class="pp-sh-t">Add spending</div><input id="ppAmt" type="number" inputmode="decimal" placeholder="Amount (GHS)">'+
      '<select id="ppCat">'+cats.map(function(c){return '<option value="'+c.id+'">'+(c.icon||'')+' '+sxEsc(c.label)+'</option>';}).join('')+'</select>'+
      '<input id="ppNote" placeholder="What was it? (optional)"><input id="ppDate" type="date" value="'+TODAY+'">'+
      '<button class="pp-sh-go" onclick="ppSaveSpend()">Add spending</button>';
  } else {
    f='<div class="pp-sh-t">Add income</div><input id="ppAmt" type="number" inputmode="decimal" placeholder="Amount (GHS)">'+
      '<select id="ppSrc">'+sources.map(function(s){return '<option value="'+s.id+'">'+sxEsc(s.name)+'</option>';}).join('')+'</select>'+
      '<input id="ppDate" type="date" value="'+TODAY+'"><input id="ppNote" placeholder="Note (optional)">'+
      '<button class="pp-sh-go" style="background:#30D158;color:#06210f" onclick="ppSaveIncome()">Add income</button>';
  }
  document.body.insertAdjacentHTML('beforeend','<div id="ppSheet" onclick="if(event.target.id===\'ppSheet\')this.remove()"><div class="pp-sh">'+f+
    '<button class="pp-sh-x" onclick="document.getElementById(\'ppSheet\').remove()">Cancel</button></div></div>');
  setTimeout(function(){ var a=document.getElementById('ppAmt'); if(a) a.focus(); },80);
}
function ppSaveSpend(){
  var amt=parseFloat(document.getElementById('ppAmt').value), cat=document.getElementById('ppCat').value;
  if(!amt||amt<=0){ showToast('Enter an amount','#FF453A'); return; }
  var note=document.getElementById('ppNote').value.trim(), d=document.getElementById('ppDate').value||TODAY;
  spendData.entries.push({id:uid('sp_'),date:d,desc:note||getCat(cat).label,cat:cat,amount:amt});
  saveSpend(); document.getElementById('ppSheet').remove();
  try{ switchTab(ppActive()); }catch(e){ renderMoney(); } showToast('✅ GHS '+amt.toLocaleString()+' spending added');
}
function ppSaveIncome(){
  var amt=parseFloat(document.getElementById('ppAmt').value);
  if(!amt||amt<=0){ showToast('Enter an amount','#FF453A'); return; }
  var e=addIncome(amt,document.getElementById('ppSrc').value,document.getElementById('ppDate').value||TODAY,document.getElementById('ppNote').value);
  document.getElementById('ppSheet').remove();
  try{ renderSavings(); }catch(x){} try{ renderHome(); }catch(x){} try{ switchTab(ppActive()); }catch(x){ renderMoney(); }
  showToast('✅ GHS '+Math.round(amt).toLocaleString()+' in · '+Math.round(e.build||0).toLocaleString()+' saved, '+Math.round(e.live||0).toLocaleString()+' to spend');
}
(function(){
  var css=document.createElement('style');
  css.textContent='.pp-tophd{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 12px}.pp-tophd .sx-sel{margin:0!important;max-width:150px;flex:none}'+
  '.pp-brand{display:flex;align-items:center;gap:9px;font-size:20px;font-weight:700}.pp-logo{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#8e5cd9,#5a2fa0);display:grid;place-items:center;color:#FFD700;font-weight:800;font-size:17px}'+
  'body.look-soft .sx-dark{background:linear-gradient(160deg,#2A1840,#160F1E)!important;border:1px solid #3d2b5a!important;border-radius:20px!important}'+
  'body #page-backup .pp-reset.pp-reset,body.look-soft #page-backup .sx-card.pp-reset{background:linear-gradient(160deg,#4a1616,#2a1010)!important;border:1px solid #7a2828!important}'+
  '#ppSheet{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:flex-end}'+
  '.pp-sh{width:100%;background:#151517;border-top:1px solid #3d2b5a;border-radius:22px 22px 0 0;padding:18px 16px 26px}'+
  '.pp-sh-t{font-size:19px;font-weight:700;margin-bottom:12px;color:#fff}.pp-sh input,.pp-sh select{width:100%;box-sizing:border-box;background:#0c0c0e;border:1px solid #2a2a2e;border-radius:13px;padding:13px;color:#fff;font:inherit;font-size:15px;margin-bottom:9px}'+
  '.pp-sh-go{width:100%;border:none;border-radius:14px;padding:14px;background:#6E3FB0;color:#fff;font:inherit;font-size:15px;font-weight:700;margin-top:4px}.pp-sh-x{width:100%;border:none;background:none;color:#8a8a90;padding:12px;font:inherit;font-size:14px}';
  document.head.appendChild(css);
  // quick buttons open the sheet (not another screen)
  var oT=ppTop; ppTop=function(){ return oT.apply(this,arguments).replace("switchTab('budget')","ppSheet('spend')").replace("setMoneySide('income')\" class=\"pp-q\"","ppSheet('income')\" class=\"pp-q\""); };
  // the old "Money overview" header inside Money is replaced by the small header
  ['money','debt','savings','budget','wn','backup'].forEach(function(t){
    var pg=document.getElementById('page-'+t); if(!pg) return;
    new MutationObserver(function(){ setTimeout(function(){ ppDecorate(pg); },0); }).observe(pg,{childList:true,subtree:false});
    ppDecorate(pg);
  });
  try{ switchTab(ppActive()); }catch(e){}
})();
