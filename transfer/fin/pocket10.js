
// ===== v16.6 (Philip, 8 Nov 2026): lighter violet, no orange glow. v16.4 AFFINITY COLOURS, deeper (white pages, deep plum cards, small orange glow, pastel buttons). v16.3: EVERY TAB LIKE THE APPROVED PREVIEW ("Finance Hub new look").
// Header: coloured icon per tab + name + purple "This week" pill. Each tab: bright purple card with ring and 3 numbers,
// 3 quick buttons, then its own lists. Readable colours. Drawn in the same frame as the page (smooth tab change).
var PP_NAMES={money:'Money',debt:'Plans',savings:'Savings',budget:'Budget',wn:'Lists',backup:'Settings'};
var PP_SVG={money:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',debt:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3M9 11h6M9 15h4"/>',
  savings:'<path d="M5 11a7 6 0 0 1 13-2h2v4l-2 1v3h-3l-1-2H9l-1 2H5v-3a5 5 0 0 1 0-3z"/>',budget:'<path d="M12 3v9h9A9 9 0 1 1 12 3z"/><path d="M15 3a7 7 0 0 1 6 6h-6z"/>',
  wn:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',backup:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  up:'<path d="M12 15V4M8 8l4-4 4 4"/><rect x="3" y="14" width="18" height="7" rx="2"/>',wallet:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13h2M7 7V5h8v2"/>',
  list:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',check:'<path d="M5 12l4 4 10-10"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',cart:'<path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>'};
var PP_ICON={money:['#D6ECFA','#0E7FA8'],debt:['#FFE0B8','#C2410C'],savings:['#C9F2DF','#0F9D58'],budget:['#FFF0B3','#A16207'],wn:['#E9DDF7','#6D28D9'],backup:['#ECEAF0','#3A1242']};
function ppI(k,c,sz){ return '<svg viewBox="0 0 24 24" style="width:'+(sz||22)+'px;height:'+(sz||22)+'px;fill:none;stroke:'+c+';stroke-width:2;stroke-linecap:round;stroke-linejoin:round">'+(PP_SVG[k]||'')+'</svg>'; }
var PP_TIPS=[/^Add your income to see what is left$/i,/^Applies from today/i,/^Clears the \+\/- and the streak/i,/^Every payment's save share/i,
  /^No money in yet\. Add money/i,/^Tap Add to wants to start/i,/^Add YouTube, ElevenLabs/i,/^Only clears Finance Hub/i,/^Tap a plan to give it money/i,
  /^No buy plans yet\. Add one above/i,/^Know where every cedi goes$/i,/^All your pots at a glance$/i,/^Wants and needs$/i,/^Backup, money rules and looks$/i,
  /^Pay it off, one day at a time$/i,/^Where your money went$/i,/^Money you received$/i,/^Your numbers, your plan\.?$/i];
function ppActive(){ var a=document.querySelector('.nav-btn.active'); return a?a.id.slice(4):'money'; }
function ppPer(v){ spendPeriod=v; try{ isavPeriod=v; }catch(e){} try{ switchTab(ppActive()); }catch(e){} }
function ppN(v){ return Math.round(v||0).toLocaleString(); }
function ppHero(l,v,g,ring,mini){
  return '<div class="pp-hero"><div class="pp-row"><div style="min-width:0"><div class="pp-l">'+l+'</div><div class="pp-v">'+v+'</div>'+(g?'<div class="pp-g">'+g+'</div>':'')+'</div>'+
    (ring?'<div class="pp-ring" style="background:conic-gradient('+(ring[2]||'#D9B8FF')+' 0 '+ring[0]+'%,rgba(255,255,255,.12) '+ring[0]+'% 100%)"><div>'+ring[0]+'%<small>'+ring[1]+'</small></div></div>':'')+'</div>'+
    '<div class="pp-mini">'+mini.map(function(m){ return '<div><span>'+m[0]+'</span><b style="color:'+m[2]+'">'+m[1]+'</b></div>'; }).join('')+'</div></div>';
}
var PP_QC=[['#D6ECFA','#0E7FA8'],['#FFE0B8','#C2410C'],['#C9F2DF','#0F9D58']];
function ppQA(a){ return '<div class="pp-qa">'+a.map(function(x,i){ var q=PP_QC[i%3]; return '<button class="pp-q" style="background:'+q[0]+'" onclick="'+x[2]+'"><span>'+(PP_SVG[x[0]]?ppI(x[0],q[1],24):x[0])+'</span>'+x[1]+'</button>'; }).join('')+'</div>'; }
function ppProg(pg){ var el=[].slice.call(pg.querySelectorAll('*')).filter(function(e){ return /^Total progress/.test((e.innerText||'').trim()) && e.offsetHeight<240 && e.offsetHeight>40; }).pop(); var t=el?el.innerText:'';
  var num=function(re){ var m=t.match(re); return m?+m[1].replace(/,/g,''):0; }; return {paid:num(/GHS\s*([\d,]+)\s*(?:paid|saved)/i),left:num(/GHS\s*([\d,]+)\s*left/i),n:num(/(\d+)\s*active/i)}; }
function ppClickText(re){ var b=[].slice.call(document.querySelectorAll('.page.active button, [id^=page-].active button')).filter(function(x){ return re.test((x.innerText||'').trim()); })[0]; if(b){ b.click(); b.scrollIntoView({behavior:'smooth',block:'center'}); } }
function ppScrollTo(re){ var e=[].slice.call(document.querySelectorAll('.page.active *, [id^=page-].active *')).filter(function(x){ return x.children.length<3 && re.test((x.innerText||'').trim()); })[0]; if(e) e.scrollIntoView({behavior:'smooth',block:'start'}); }
function ppTabTop(tab){
  try{
    if(tab==='debt'){
      var d=dtStats(), t=sideTracker(planSide), pr=ppProg(document.getElementById('page-debt')), tot=pr.paid+pr.left, pc=tot>0?Math.round(pr.paid/tot*100):0;
      var bal=t.daysBehind>0?t.daysBehind+' days behind':t.daysAhead>0?t.daysAhead+' days ahead':'on track';
      var tag=ppN(d.rate)+'/day \u00b7 '+bal;
      if(planSide==='buy') return ppHero('Buy plans','GHS '+ppN(tot),pr.n+' thing'+(pr.n!==1?'s':'')+' to buy \u00b7 '+ppN(pr.paid)+' saved \u00b7 '+tag,[pc,'saved','#FFCB6B'],
        [['TOTAL',ppN(tot),'#FFCB6B'],['SAVED',ppN(pr.paid),'#7EF0B8'],['LEFT',ppN(pr.left),'#FF9AA5']])+
        ppQA([['plus','Add buy plan',"ppClickText(/Add (new )?buy plan/i)"],['check','Log saving',"ppScrollTo(/^(To buy|Your|Total progress)/i)"],['target','Daily target','dtOpenEdit()']]);
      return ppHero('You owe','GHS '+ppN(pr.left),pr.n+' debt'+(pr.n!==1?'s':'')+' \u00b7 '+ppN(pr.paid)+' paid so far \u00b7 '+tag,[pc,'paid','#FF9AA5'],
        [['OWED',ppN(tot),'#FF9AA5'],['PAID',ppN(pr.paid),'#7EF0B8'],['STREAK',t.streak+' days','#FFCB6B']])+
        ppQA([['plus','Add debt',"ppClickText(/Add (new )?debt/i)"],['check','Log payment',"ppScrollTo(/^(Your debts|Total progress)/i)"],['target','Daily target','dtOpenEdit()']]);
    }
    if(tab==='savings'){
      if(savSide!=='income'){ var gs=(typeof savGoals!=='undefined'&&savGoals)||[], tg=0, sd=0; gs.forEach(function(g){ tg+=+(g.target||g.amount||0); sd+=+(g.saved||0); });
        return ppHero('Saved in goals','GHS '+ppN(sd),'of GHS '+ppN(tg)+' \u00b7 '+gs.length+' goal'+(gs.length!==1?'s':''),[tg>0?Math.round(sd/tg*100):0,'done','#8BE6EE'],
          [['TARGET',ppN(tg),'#8BE6EE'],['SAVED',ppN(sd),'#7EF0B8'],['LEFT',ppN(tg-sd),'#FF9AA5']])+
          ppQA([['plus','New goal','openSavModal()'],['wallet','Add income',"ppSheet('income')"],['savings','Income pots',"setSavSide('income')"]]); }
      var from=rangeFrom(isavPeriod), per=potRows(from,''), T=per.reduce(function(a,r){return {earned:a.earned+r.earned,saved:a.saved+r.saved+r.carry,out:a.out+r.out};},{earned:0,saved:0,out:0});
      var inPots=potRows('','').reduce(function(a,r){return a+r.net;},0), pc=T.earned>0?Math.min(100,Math.round(T.saved/T.earned*100)):0;
      return ppHero('In your income pots now','GHS '+ppN(inPots),'+GHS '+ppN(T.saved-T.out)+' '+({week:'this week',month:'this month',year:'this year',lifetime:'lifetime'}[isavPeriod]||''),[pc,'saved','#8BE6EE'],
        [['EARNED',ppN(T.earned),'#7EF0B8'],['SAVED',ppN(T.saved),'#8BE6EE'],['TAKEN OUT',ppN(T.out),'#FF9AA5']])+
        ppQA([['wallet','Add income',"ppSheet('income')"],['up','Take out',"ppScrollTo(/^Your pots/i)"],['savings','New pot','openNewPot()']]);
    }
    if(tab==='budget'){
      var ym=selBudgetMonth, cur=TODAY.slice(0,7), cats=budgetCats(), subs=subsTotalMonthly();
      var spent=cats.reduce(function(s,c){return s+catSpentMonth(c.id,ym);},0)+((ym===cur)?subs:0), planned=monthlyPlan||0, pc=planned>0?Math.min(100,Math.round(spent/planned*100)):0;
      return ppHero('Budget left \u00b7 '+monthLabel(ym),'GHS '+ppN(planned-spent),'GHS '+ppN(planned)+' planned',[pc,'spent','#FFCB6B'],
        [['PLANNED',ppN(planned),'#7EF0B8'],['SPENT',ppN(spent),'#FF9AA5'],['SUBSCRIPTIONS',ppN(subs),'#D9B8FF']])+
        ppQA([['up','Log spending',"ppSheet('spend')"],['edit','Set plan',"ppClickText(/Set monthly plan|Set plan|Edit plan/i)"],['plus','Category','openCatModal()']]);
    }
    if(tab==='wn'){
      var wT=WNtotal(wnData.wants), nT=WNtotal(wnData.needs), n=wnData.wants.length+wnData.needs.length;
      return ppHero('Wants and needs','GHS '+ppN(wT+nT),n+' item'+(n!==1?'s':'')+' to buy',null,[['WANTS',ppN(wT),'#D9B8FF'],['NEEDS',ppN(nT),'#8BE6EE'],['ITEMS',n,'#fff']])+
        ppQA([['plus','Add want',"wnSetTab('wants');setTimeout(wnOpenAdd,60)"],['plus','Add need',"wnSetTab('needs');setTimeout(wnOpenAdd,60)"],['cart','Make buy plan',"ppClickText(/Combine items/i)"]]);
    }
    if(tab==='money' && typeof moneySide!=='undefined' && moneySide==='income'){
      var pr=periodRange(), list=incomeData.entries.filter(function(e){return inRange(e.date,pr.from,pr.to);});
      var inT=incomeTotal(pr.from,pr.to), sv=list.reduce(function(a,e){return a+(e.build||0);},0), lv=list.reduce(function(a,e){return a+(e.live||0);},0);
      return ppHero('Money in \u00b7 '+pr.label.toLowerCase(),'GHS '+ppN(inT),list.length+' payment'+(list.length!==1?'s':''),[inT>0?Math.round(sv/inT*100):0,'saved','#7EF0B8'],
        [['SAVED',ppN(sv),'#7EF0B8'],['TO SPEND',ppN(lv),'#FFCB6B'],['SOURCES',sources.length,'#D9B8FF']])+
        ppQA([['wallet','Add income',"ppSheet('income')"],['savings','Income pots',"switchTab('savings')"],['list','History',"ppScrollTo(/^History$/)"]]);
    }
  }catch(e){ console.log(e); }
  return '';
}
function ppHideOld(pg,tab){
  var hideSel=[];
  if(tab==='debt') hideSel=['.sx-dark','.sx-stat'];
  if(tab==='savings') hideSel=savSide==='income'?['.sx-dark']:['.sx-dark','.sx-stat'];
  if(tab==='money' && moneySide==='income') hideSel=['.sx-dark'];
  hideSel.forEach(function(s){ [].slice.call(pg.querySelectorAll(s)).forEach(function(e){ if(e.closest('.pp-new')) return; var box=e.closest('.sx-up')||e; if(s==='.sx-stat') box=e.parentElement; box.style.display='none'; }); });
  if(tab==='savings'){ [].slice.call(pg.querySelectorAll('.sx-card')).forEach(function(c){ if(/^\s*In your income pots now/.test(c.innerText||'')) c.style.display='none'; }); }
  if(tab==='budget'){ [].slice.call(pg.querySelectorAll('.sx-card')).forEach(function(c){ if(!c.closest('.pp-new') && /Planned/.test(c.innerText||'') && /Spent/.test(c.innerText||'') && (c.innerText||'').length<300) c.style.display='none'; }); }
  if(tab==='wn'){ [].slice.call(pg.querySelectorAll('.sx-grid2')).forEach(function(c){ if(/Wants total/.test(c.innerText||'')) c.style.display='none'; }); }
}
function ppMine(pg){ try{ [].slice.call(pg.querySelectorAll('.pp-tophd,.pp-tophd *,.pp-new,.pp-new *,.pp-hero,.pp-hero *,.pp-qa,.pp-qa *')).forEach(function(e){ try{ _softSeen.add(e); }catch(x){} try{ _shaped.add(e); }catch(x){} }); }catch(e){} }
function ppDecorate(pg){
  if(!pg) return;
  try{
    var tab=pg.id.replace('page-','');
    [].slice.call(pg.querySelectorAll('.sx-top,.soft-title,.soft-head')).forEach(function(e){ e.style.display='none'; });
    var oldHd=pg.querySelector('.pp-hd'); if(oldHd) oldHd.style.display='none';
    [].slice.call(pg.querySelectorAll('.sx-sel,.period-select-wrap')).forEach(function(e){ if(!e.closest('.pp-tophd')) e.style.display='none'; });
    [].slice.call(pg.querySelectorAll('.pp-tophd,.pp-new')).forEach(function(e){ e.remove(); });
    var ic=PP_ICON[tab]||['#eee','#333'], sel='';
    if(tab!=='backup'){ try{ sel=sxSel(tab==='savings'?isavPeriod:spendPeriod,'ppPer'); }catch(e){} }
    pg.insertAdjacentHTML('afterbegin','<div class="pp-tophd"><div class="pp-brand"><span class="pp-logo" style="background:'+ic[0]+'">'+ppI(tab,ic[1],22)+'</span><b>'+(PP_NAMES[tab]||'')+'</b></div>'+sel+'</div>');
    var top=ppTabTop(tab);
    if(top){
      var seg=pg.querySelector('.sx-seg'); var holder=document.createElement('div'); holder.className='pp-new'; holder.innerHTML=top;
      var anchor=(seg&&!seg.closest('.pp-tophd'))?(seg.closest('.sx')&&seg.closest('.sx')!==pg.firstElementChild?seg.closest('.sx'):seg):pg.querySelector('.pp-tophd');
      if(tab==='money'&&seg) anchor=seg;
      anchor.parentNode.insertBefore(holder,anchor.nextSibling);
      ppHideOld(pg,tab);
    }
    ppMine(pg);
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
      '<button class="pp-sh-go" style="background:#0F9D58" onclick="ppSaveIncome()">Add income</button>';
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
  try{ if(localStorage.getItem('pp_aff_v1')!=='1'){ localStorage.setItem('pp_aff_v1','1'); if(localStorage.getItem(LOOK_KEY)!=='soft'){ localStorage.setItem(LOOK_KEY,'soft'); location.reload(); return; } } }catch(e){}
  var css=document.createElement('style');
  css.textContent='[id^=page-] .soft-title,[id^=page-] .soft-head,[id^=page-] .sx-top{display:none!important}'+
  'body.look-soft{--acc:#6A4085!important}'+
  '.pp-tophd{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 12px}'+
  '.pp-tophd .sx-sel{margin:0!important;width:auto!important;flex:none;background:#F1ECF3!important;border:none!important;border-radius:20px!important;padding:4px 10px!important;height:auto!important;min-height:0!important;box-shadow:none!important}'+
  '.pp-tophd .sx-sel select{color:#3A1242!important;background:transparent!important;font-weight:700!important;font-size:12.5px!important;width:auto!important;padding:2px 2px!important;height:auto!important;text-align:left!important}.pp-tophd .sx-sel svg{display:none}'+
  '.pp-brand{display:flex;align-items:center;gap:10px;font-size:23px;font-weight:800;color:#2B0F33}.pp-logo{width:40px;height:40px;border-radius:50%;display:grid;place-items:center}'+
  '.pp-hero,.pp-new .pp-hero,body.look-soft .pp-hero{position:relative;overflow:hidden;background:linear-gradient(150deg,#8A5BA6,#6A4085)!important;color:#fff!important;border:none!important;box-shadow:0 6px 18px rgba(106,64,133,.22);border-radius:22px;padding:17px;margin-bottom:12px;color:#fff}'+
  '.pp-hero:before{display:none!important}'+
  '.pp-hero>*{position:relative;z-index:1}'+
  '.pp-row{display:flex;justify-content:space-between;align-items:center;gap:10px}.pp-l{font-size:11.5px!important;font-weight:700;letter-spacing:.6px;text-transform:none;color:#EBDDF0!important}'+
  '.pp-v{font-size:30px!important;font-weight:800;margin:4px 0 3px;color:#fff!important}.pp-g{font-size:12px;font-weight:600;color:#7EF0B8!important}'+
  '.pp-ring{width:80px;height:80px;border-radius:50%;display:grid;place-items:center;flex:none}.pp-ring div{width:64px;height:64px;border-radius:50%;background:#5C3676!important;display:grid;place-items:center;text-align:center;font-weight:800;font-size:14px;color:#fff;line-height:1.1}.pp-ring small{display:block;font-size:9px;color:#EBDDF0;font-weight:600}'+
  '.pp-mini{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;border:none!important;margin-top:13px;padding:0}.pp-mini>div{background:rgba(255,255,255,.12);border-radius:12px;padding:8px}.pp-mini span{display:block;font-size:9.5px;font-weight:700;letter-spacing:.7px;color:#EBDDF0!important}.pp-mini b{display:block;font-size:16px;font-weight:800;margin-top:3px}'+
  '.pp-qa .pp-q:nth-child(1){background:#D6ECFA!important}.pp-qa .pp-q:nth-child(2){background:#FFE0B8!important}.pp-qa .pp-q:nth-child(3){background:#C9F2DF!important}.pp-qa .pp-q:nth-child(1) span{color:#0E7FA8!important}.pp-qa .pp-q:nth-child(2) span{color:#C2410C!important}.pp-qa .pp-q:nth-child(3) span{color:#0F9D58!important}.pp-qa{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:12px}.pp-q{border:none!important;border-radius:16px;padding:12px 10px;font-weight:700;font-size:12.5px;color:#2B0F33!important;cursor:pointer;font-family:inherit;text-align:left}.pp-q span{display:block;margin-bottom:7px;font-size:20px;color:#3A1242}'+
  '.pp-card{background:#F3F1F6!important;border:none!important;color:#2B0F33}.pp-donut div{background:#F3F1F6!important;color:#2B0F33}.pp-donut b{color:#2B0F33!important}.pp-ch span{color:#C2410C!important}.pp-leg{color:#2B0F33}'+
  'body #page-backup .pp-reset.pp-reset,body.look-soft #page-backup .sx-card.pp-reset{background:#FFE4E6!important;border:1px solid #FDA4AF!important}body #page-backup .pp-reset *{color:#B91C1C!important}'+
  '#ppSheet{position:fixed;inset:0;background:rgba(43,15,51,.45);z-index:10000;display:flex;align-items:flex-end}'+
  '.pp-sh{width:100%;background:#fff;border-radius:22px 22px 0 0;padding:18px 16px 26px}'+
  '.pp-sh-t{font-size:19px;font-weight:800;margin-bottom:12px;color:#2B0F33}.pp-sh input,.pp-sh select{width:100%;box-sizing:border-box;background:#F3F1F6;border:1px solid #E5E0EA;border-radius:13px;padding:13px;color:#2B0F33;font:inherit;font-size:15px;margin-bottom:9px}'+
  '.pp-sh-go{width:100%;border:none;border-radius:14px;padding:14px;background:#6A4085;color:#fff;font:inherit;font-size:15px;font-weight:700;margin-top:4px}.pp-sh-x{width:100%;border:none;background:none;color:#7A6A80;padding:12px;font:inherit;font-size:14px}';
  document.head.appendChild(css);
  // quick buttons on Money open the sheet (not another screen)
  var oT=ppTop; ppTop=function(){ return oT.apply(this,arguments).replace("switchTab('budget')","ppSheet('spend')").replace("setMoneySide('income')\" class=\"pp-q\"","ppSheet('income')\" class=\"pp-q\""); };
  // draw the header in the SAME frame as each page (smooth tab change, no jump)
  var map={renderMoney:'money',renderDebt:'debt',renderSavings:'savings',renderBudget:'budget',renderWN:'wn',renderBackup:'backup'};
  Object.keys(map).forEach(function(fn){
    var o=window[fn]; if(typeof o!=='function') return;
    window[fn]=function(){ var r=o.apply(this,arguments); ppDecorate(document.getElementById('page-'+map[fn])); return r; };
  });
  try{ renderMoney=window.renderMoney; renderDebt=window.renderDebt; renderSavings=window.renderSavings; renderBudget=window.renderBudget; renderWN=window.renderWN; renderBackup=window.renderBackup; }catch(e){}
  try{ switchTab(ppActive()); }catch(e){}
})();
