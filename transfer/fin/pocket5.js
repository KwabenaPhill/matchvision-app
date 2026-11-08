
// ===== v16.3 (Philip, 8 Nov 2026): EVERY TAB LIKE THE APPROVED PREVIEW ("Finance Hub new look").
// Header: coloured icon per tab + name + purple "This week" pill. Each tab: bright purple card with ring and 3 numbers,
// 3 quick buttons, then its own lists. Readable colours. Drawn in the same frame as the page (smooth tab change).
var PP_NAMES={money:'Money',debt:'Plans',savings:'Savings',budget:'Budget',wn:'Lists',backup:'Settings'};
var PP_ICON={money:['\ud83d\udcb0','linear-gradient(135deg,#1f8f4e,#0d4a28)'],debt:['\ud83c\udfaf','linear-gradient(135deg,#d9822b,#7a3d0c)'],
  savings:['\ud83d\udc37','linear-gradient(135deg,#1c9fb5,#0b4c58)'],budget:['\ud83d\udcca','linear-gradient(135deg,#c9a20f,#6b5206)'],
  wn:['\ud83d\udcdd','linear-gradient(135deg,#9b5de5,#4a2380)'],backup:['\u2699\ufe0f','linear-gradient(135deg,#5a5a66,#26262c)']};
var PP_TIPS=[/^Add your income to see what is left$/i,/^Applies from today/i,/^Clears the \+\/- and the streak/i,/^Every payment's save share/i,
  /^No money in yet\. Add money/i,/^Tap Add to wants to start/i,/^Add YouTube, ElevenLabs/i,/^Only clears Finance Hub/i,/^Tap a plan to give it money/i,
  /^No buy plans yet\. Add one above/i,/^Know where every cedi goes$/i,/^All your pots at a glance$/i,/^Wants and needs$/i,/^Backup, money rules and looks$/i,
  /^Pay it off, one day at a time$/i,/^Where your money went$/i,/^Money you received$/i,/^Your numbers, your plan\.?$/i];
function ppActive(){ var a=document.querySelector('.nav-btn.active'); return a?a.id.slice(4):'money'; }
function ppPer(v){ spendPeriod=v; try{ isavPeriod=v; }catch(e){} try{ switchTab(ppActive()); }catch(e){} }
function ppN(v){ return Math.round(v||0).toLocaleString(); }
function ppHero(l,v,g,ring,mini){
  return '<div class="pp-hero"><div class="pp-row"><div style="min-width:0"><div class="pp-l">'+l+'</div><div class="pp-v">'+v+'</div>'+(g?'<div class="pp-g">'+g+'</div>':'')+'</div>'+
    (ring?'<div class="pp-ring" style="background:conic-gradient('+(ring[2]||'#C9A0FF')+' 0 '+ring[0]+'%,rgba(255,255,255,.12) '+ring[0]+'% 100%)"><div>'+ring[0]+'%<small>'+ring[1]+'</small></div></div>':'')+'</div>'+
    '<div class="pp-mini">'+mini.map(function(m){ return '<div><span>'+m[0]+'</span><b style="color:'+m[2]+'">'+m[1]+'</b></div>'; }).join('')+'</div></div>';
}
function ppQA(a){ return '<div class="pp-qa">'+a.map(function(x){ return '<button class="pp-q" onclick="'+x[2]+'"><span>'+x[0]+'</span>'+x[1]+'</button>'; }).join('')+'</div>'; }
function ppClickText(re){ var b=[].slice.call(document.querySelectorAll('.page.active button, [id^=page-].active button')).filter(function(x){ return re.test((x.innerText||'').trim()); })[0]; if(b){ b.click(); b.scrollIntoView({behavior:'smooth',block:'center'}); } }
function ppScrollTo(re){ var e=[].slice.call(document.querySelectorAll('.page.active *, [id^=page-].active *')).filter(function(x){ return x.children.length<3 && re.test((x.innerText||'').trim()); })[0]; if(e) e.scrollIntoView({behavior:'smooth',block:'start'}); }
function ppTabTop(tab){
  try{
    if(tab==='debt'){
      var d=dtStats(), t=sideTracker(planSide), clear=dtDaysToClear();
      var pg=document.getElementById('page-debt'), m=(pg.innerText||'').match(/GH\u20b5\s*([\d,]+)\s*\/\s*([\d,]+)/), paid=m?+m[1].replace(/,/g,''):0, tot=m?+m[2].replace(/,/g,''):0;
      var pc=tot>0?Math.min(100,Math.round(paid/tot*100)):0;
      var bal=t.daysBehind>0?t.daysBehind+' days behind':t.daysAhead>0?t.daysAhead+' days ahead':'On track';
      return ppHero('Daily target \u00b7 '+ppN(d.rate)+'/day',tot>0?'GHS '+ppN(tot-paid)+' left':'GHS '+ppN(d.rate)+' /day',bal+(t.streak?' \u00b7 '+t.streak+' days in a row':''),[pc,'paid'],
        [['STREAK',t.streak,'#FFD60A'],[t.daysBehind>0?'BEHIND':'ON TRACK',t.daysBehind>0?t.daysBehind:(t.daysAhead||0),t.daysBehind>0?'#FF8A80':'#8CF5B0'],['DAYS '+(planSide==='buy'?'SAVED':'PAID'),t.daysPaid,'#7FE3F0']])+
        ppQA([['\uff0b',planSide==='buy'?'Add buy plan':'Add debt',"ppClickText(/Add (Buy Plan|Debt)/i)"],['\u2713','Log payment',"ppScrollTo(/^(Your |Total progress)/i)"],['\u270e','Daily target','dtOpenEdit()']]);
    }
    if(tab==='savings'){
      if(savSide!=='income') return ppQA([['\uff0b','New goal',"ppClickText(/Add (Savings )?Goal|New goal/i)"],['\u2295','Add income',"ppSheet('income')"],['\u25d0','Income pots',"setSavSide('income')"]]);
      var from=rangeFrom(isavPeriod), per=potRows(from,''), T=per.reduce(function(a,r){return {earned:a.earned+r.earned,saved:a.saved+r.saved+r.carry,out:a.out+r.out};},{earned:0,saved:0,out:0});
      var inPots=potRows('','').reduce(function(a,r){return a+r.net;},0), pc=T.earned>0?Math.min(100,Math.round(T.saved/T.earned*100)):0;
      return ppHero('In your income pots now','GHS '+ppN(inPots),'+GHS '+ppN(T.saved-T.out)+' '+({week:'this week',month:'this month',year:'this year',lifetime:'lifetime'}[isavPeriod]||''),[pc,'saved','#7FE3F0'],
        [['EARNED',ppN(T.earned),'#8CF5B0'],['SAVED',ppN(T.saved),'#7FE3F0'],['TAKEN OUT',ppN(T.out),'#FF8A80']])+
        ppQA([['\uff0b','Add money',"ppSheet('income')"],['\u2296','Take out',"ppScrollTo(/^Your pots/i)"],['\u25d0','New pot','openNewPot()']]);
    }
    if(tab==='budget'){
      var ym=selBudgetMonth, cur=TODAY.slice(0,7), cats=budgetCats(), subs=subsTotalMonthly();
      var spent=cats.reduce(function(s,c){return s+catSpentMonth(c.id,ym);},0)+((ym===cur)?subs:0), planned=monthlyPlan||0, pc=planned>0?Math.min(100,Math.round(spent/planned*100)):0;
      return ppHero('Budget left \u00b7 '+monthLabel(ym),'GHS '+ppN(planned-spent),'GHS '+ppN(planned)+' planned',[pc,'spent','#FFD60A'],
        [['PLANNED',ppN(planned),'#8CF5B0'],['SPENT',ppN(spent),'#FF8A80'],['SUBSCRIPTIONS',ppN(subs),'#C9A0FF']])+
        ppQA([['\u2296','Log spending',"ppSheet('spend')"],['\u270e','Set plan',"ppClickText(/Set monthly plan|Set plan|Edit plan/i)"],['\uff0b','Category','openCatModal()']]);
    }
    if(tab==='wn'){
      var wT=WNtotal(wnData.wants), nT=WNtotal(wnData.needs), n=wnData.wants.length+wnData.needs.length;
      return ppHero('Wants and needs','GHS '+ppN(wT+nT),n+' item'+(n!==1?'s':'')+' to buy',null,[['WANTS',ppN(wT),'#C9A0FF'],['NEEDS',ppN(nT),'#7FE3F0'],['ITEMS',n,'#fff']])+
        ppQA([['\uff0b','Add want',"wnSetTab('wants');setTimeout(wnOpenAdd,60)"],['\uff0b','Add need',"wnSetTab('needs');setTimeout(wnOpenAdd,60)"],['\u21e2','Make buy plan',"ppClickText(/Combine items/i)"]]);
    }
    if(tab==='money' && typeof moneySide!=='undefined' && moneySide==='income'){
      var pr=periodRange(), list=incomeData.entries.filter(function(e){return inRange(e.date,pr.from,pr.to);});
      var inT=incomeTotal(pr.from,pr.to), sv=list.reduce(function(a,e){return a+(e.build||0);},0), lv=list.reduce(function(a,e){return a+(e.live||0);},0);
      return ppHero('Money in \u00b7 '+pr.label.toLowerCase(),'GHS '+ppN(inT),list.length+' payment'+(list.length!==1?'s':''),[inT>0?Math.round(sv/inT*100):0,'saved','#8CF5B0'],
        [['SAVED',ppN(sv),'#8CF5B0'],['TO SPEND',ppN(lv),'#FFD60A'],['SOURCES',sources.length,'#C9A0FF']])+
        ppQA([['\u2295','Add income',"ppSheet('income')"],['\u25d0','Income pots',"switchTab('savings')"],['\u2630','History',"ppScrollTo(/^History$/)"]]);
    }
  }catch(e){ console.log(e); }
  return '';
}
function ppHideOld(pg,tab){
  var hideSel=[];
  if(tab==='debt') hideSel=['.sx-dark','.sx-stat'];
  if(tab==='savings') hideSel=['.sx-dark'];
  if(tab==='money' && moneySide==='income') hideSel=['.sx-dark'];
  hideSel.forEach(function(s){ [].slice.call(pg.querySelectorAll(s)).forEach(function(e){ if(e.closest('.pp-new')) return; var box=e.closest('.sx-up')||e; if(s==='.sx-stat') box=e.parentElement; box.style.display='none'; }); });
  if(tab==='savings'){ [].slice.call(pg.querySelectorAll('.sx-card')).forEach(function(c){ if(/^\s*In your income pots now/.test(c.innerText||'')) c.style.display='none'; }); }
  if(tab==='budget'){ [].slice.call(pg.querySelectorAll('.sx-card')).forEach(function(c){ if(!c.closest('.pp-new') && /Planned/.test(c.innerText||'') && /Spent/.test(c.innerText||'') && (c.innerText||'').length<300) c.style.display='none'; }); }
  if(tab==='wn'){ [].slice.call(pg.querySelectorAll('.sx-grid2')).forEach(function(c){ if(/Wants total/.test(c.innerText||'')) c.style.display='none'; }); }
}
function ppDecorate(pg){
  if(!pg) return;
  try{
    var tab=pg.id.replace('page-','');
    [].slice.call(pg.querySelectorAll('.sx-top,.soft-title,.soft-head')).forEach(function(e){ e.style.display='none'; });
    var oldHd=pg.querySelector('.pp-hd'); if(oldHd) oldHd.style.display='none';
    [].slice.call(pg.querySelectorAll('.sx-sel,.period-select-wrap')).forEach(function(e){ if(!e.closest('.pp-tophd')) e.style.display='none'; });
    [].slice.call(pg.querySelectorAll('.pp-tophd,.pp-new')).forEach(function(e){ e.remove(); });
    var ic=PP_ICON[tab]||['','#333'], sel='';
    if(tab!=='backup'){ try{ sel=sxSel(tab==='savings'?isavPeriod:spendPeriod,'ppPer'); }catch(e){} }
    pg.insertAdjacentHTML('afterbegin','<div class="pp-tophd"><div class="pp-brand"><span class="pp-logo" style="background:'+ic[1]+'">'+ic[0]+'</span><b>'+(PP_NAMES[tab]||'')+'</b></div>'+sel+'</div>');
    var top=ppTabTop(tab);
    if(top){
      var seg=pg.querySelector('.sx-seg'); var holder=document.createElement('div'); holder.className='pp-new'; holder.innerHTML=top;
      var anchor=(seg&&!seg.closest('.pp-tophd'))?(seg.closest('.sx')&&seg.closest('.sx')!==pg.firstElementChild?seg.closest('.sx'):seg):pg.querySelector('.pp-tophd');
      if(tab==='money'&&seg) anchor=seg;
      anchor.parentNode.insertBefore(holder,anchor.nextSibling);
      ppHideOld(pg,tab);
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
        if(el.children.length<8 && /^App look/.test((el.innerText||'').trim()) && el.offsetHeight<200){ var row=el.closest('.sx-row,.sx-tx,[onclick]')||el; row.style.display='none'; var nx=row.nextElementSibling; if(nx&&/Dark/.test(nx.innerText||'')&&/Classic/.test(nx.innerText||'')) nx.style.display='none'; }
      });
      var r=[].slice.call(pg.querySelectorAll('.sx-card,.card')).filter(function(c){ return /^\s*Reset Finance Hub/.test(c.innerText||''); })[0]; if(r) r.classList.add('pp-reset');
    }
  }catch(e){ console.log(e); }
}
// ---- the Add sheet (spending / income) right where you are
function ppSheet(kind){
  var old=document.getElementById('ppSheet'); if(old) old.remove();
  var f;
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
  try{ switchTab(ppActive()); }catch(e){ renderMoney(); } showToast('\u2705 GHS '+amt.toLocaleString()+' spending added');
}
function ppSaveIncome(){
  var amt=parseFloat(document.getElementById('ppAmt').value);
  if(!amt||amt<=0){ showToast('Enter an amount','#FF453A'); return; }
  var e=addIncome(amt,document.getElementById('ppSrc').value,document.getElementById('ppDate').value||TODAY,document.getElementById('ppNote').value);
  document.getElementById('ppSheet').remove();
  try{ renderHome(); }catch(x){} try{ switchTab(ppActive()); }catch(x){ renderMoney(); }
  showToast('\u2705 GHS '+Math.round(amt).toLocaleString()+' in \u00b7 '+Math.round(e.build||0).toLocaleString()+' saved, '+Math.round(e.live||0).toLocaleString()+' to spend');
}
(function(){
  var css=document.createElement('style');
  css.textContent='.pp-tophd{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 12px}'+
  '.pp-tophd .sx-sel{margin:0!important;max-width:140px;flex:none;background:#6E3FB0!important;border:none!important;border-radius:20px!important;padding:6px 12px!important;color:#fff!important}'+
  '.pp-tophd .sx-sel select{color:#fff!important;background:transparent!important;font-weight:600!important;font-size:13px!important}.pp-tophd .sx-sel svg{display:none}'+
  '.pp-brand{display:flex;align-items:center;gap:10px;font-size:21px;font-weight:800}.pp-logo{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:20px}'+
  '.pp-hero{background:linear-gradient(150deg,#5B33A0,#2E1856 70%,#22113F)!important;border:1px solid #7a52c4!important;box-shadow:0 8px 24px rgba(91,51,160,.35);border-radius:20px;padding:16px;margin-bottom:12px;color:#fff}'+
  '.pp-row{display:flex;justify-content:space-between;align-items:center;gap:10px}.pp-l{font-size:10.5px!important;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#EDE3FF!important}'+
  '.pp-v{font-size:30px!important;font-weight:800;margin:5px 0 3px;color:#fff}.pp-g{font-size:12px;font-weight:600;color:#8CF5B0!important}'+
  '.pp-ring{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;flex:none}.pp-ring div{width:68px;height:68px;border-radius:50%;background:#2A1650!important;display:grid;place-items:center;text-align:center;font-weight:700;font-size:14px;color:#E4D2FF;line-height:1.1}.pp-ring small{display:block;font-size:9px;color:#D9CCF2;font-weight:500}'+
  '.pp-mini{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid rgba(255,255,255,.18)!important;margin-top:12px;padding-top:10px}.pp-mini span{display:block;font-size:9.5px;font-weight:700;letter-spacing:1px;color:#D9CCF2!important}.pp-mini b{display:block;font-size:16px;font-weight:800;margin-top:3px}'+
  '.pp-qa{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:12px}.pp-q{background:#141416;border:1px solid #26262a;border-radius:15px;padding:12px 3px;font-weight:600;font-size:11.5px;color:#fff;cursor:pointer;font-family:inherit}.pp-q span{display:block;font-size:18px;color:#C9A0FF;margin-bottom:5px}'+
  'body.look-soft .sx-card,body.look-soft .sx-acc{background:#141416!important;border:1px solid #26262a!important;border-radius:18px!important}'+
  'body #page-backup .pp-reset.pp-reset,body.look-soft #page-backup .sx-card.pp-reset{background:linear-gradient(160deg,#4a1616,#2a1010)!important;border:1px solid #7a2828!important}'+
  '#ppSheet{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:flex-end}'+
  '.pp-sh{width:100%;background:#151517;border-top:1px solid #3d2b5a;border-radius:22px 22px 0 0;padding:18px 16px 26px}'+
  '.pp-sh-t{font-size:19px;font-weight:700;margin-bottom:12px;color:#fff}.pp-sh input,.pp-sh select{width:100%;box-sizing:border-box;background:#0c0c0e;border:1px solid #2a2a2e;border-radius:13px;padding:13px;color:#fff;font:inherit;font-size:15px;margin-bottom:9px}'+
  '.pp-sh-go{width:100%;border:none;border-radius:14px;padding:14px;background:#6E3FB0;color:#fff;font:inherit;font-size:15px;font-weight:700;margin-top:4px}.pp-sh-x{width:100%;border:none;background:none;color:#8a8a90;padding:12px;font:inherit;font-size:14px}';
  document.head.appendChild(css);
  // quick buttons on Money open the sheet (not another screen)
  var oT=ppTop; ppTop=function(){ return oT.apply(this,arguments).replace("switchTab('budget')","ppSheet('spend')").replace("setMoneySide('income')\" class=\"pp-q\"","ppSheet('income')\" class=\"pp-q\""); };
  // draw the header in the SAME frame as each page (smooth tab change, no jump)
  var map={renderSpendMoney:'money',renderIncome:'money',renderMoney:'money',renderDebt:'debt',renderSavings:'savings',renderBudget:'budget',renderWN:'wn',renderBackup:'backup'};
  Object.keys(map).forEach(function(fn){
    var o=window[fn]; if(typeof o!=='function') return;
    window[fn]=function(){ var r=o.apply(this,arguments); ppDecorate(document.getElementById('page-'+map[fn])); return r; };
  });
  try{ switchTab(ppActive()); }catch(e){}
})();
