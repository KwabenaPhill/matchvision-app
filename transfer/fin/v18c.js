// ===== v18.0 (Philip, 8 Nov 2026; v18.2 = his OLD layout, only the black colours): STYLE A (Ledger black). Black page, big centred number with purple glow,
// dark boxes, 2 big dark buttons, clean lists, floating bottom bar. Replaces the v17 light look.
(function(){
  try{ if(localStorage.getItem('v18_dark')!=='1'){ localStorage.setItem('v18_dark','1'); if(localStorage.getItem(LOOK_KEY)!=='dark'){ localStorage.setItem(LOOK_KEY,'dark'); location.reload(); return; } } }catch(e){}
  var css=document.createElement('style');
  css.textContent=
  'html,html body,html body.look-soft{background:#000!important;color:#fff!important}'+
  'html body [id^=page-]{background:#000!important;color:#fff!important}'+
  'html body [id^=page-] .sx-card,html body [id^=page-] .sx-acc,html body [id^=page-] .card,html body [id^=page-] .history-card,html body [id^=page-] .pp-card,html body [id^=page-] .wn-item,html body [id^=page-] .goal-card,html body [id^=page-] .savings-goal-card{background:#1C1C1E!important;border:none!important;box-shadow:none!important;color:#fff!important}'+
  'html body [id^=page-] small,html body [id^=page-] .sx-small,html body [id^=page-] .sx-small span,html body [id^=page-] .sx-k,html body [id^=page-] .entry-meta{color:#A1A1AA!important;font-size:13px!important}'+
  'html body [id^=page-] input,html body [id^=page-] select{background:#2A2A2E!important;color:#fff!important;border:none!important}'+
  /* header */
  '.pp-brand{color:#fff!important;font-size:26px!important;font-weight:800!important}.pp-logo{background:#1C1C1E!important}.pp-logo svg{stroke:#fff!important}'+
  '.pp-tophd .sx-sel{background:#1C1C1E!important;border:none!important;border-radius:22px!important;padding:6px 12px!important}.pp-tophd .sx-sel select{color:#fff!important;background:transparent!important;font-weight:700!important;font-size:13px!important}'+
  /* switch */
  'html body .sx-seg{background:#1C1C1E!important;border:none!important;border-radius:22px!important}html body .sx-seg button{color:#A1A1AA!important;background:transparent!important;border-radius:18px!important;font-weight:700!important}html body .sx-seg button.on{background:#3A3A3C!important;color:#fff!important}'+
  /* hero */
  'html body .pp-hero,html body .pp-new .pp-hero{background:radial-gradient(circle at 88% 0%,rgba(168,85,247,.34),transparent 62%)!important;border:none!important;box-shadow:none!important;border-radius:22px!important;padding:17px!important;margin-bottom:12px!important}'+
  'html body .pp-hero:before{display:none!important}.pp-hero .pp-ring div{background:#1C1C1E!important;color:#fff!important}.pp-hero .pp-ring small{color:#A1A1AA!important}'+
  '.pp-hero .pp-l{color:#A1A1AA!important;font-size:14px!important;text-transform:none!important;letter-spacing:0!important;font-weight:600!important}'+
  '.pp-hero .pp-v{font-size:32px!important;font-weight:800!important;letter-spacing:-1px;color:#fff!important}.pp-hero .pp-g{color:#4ADE80!important;font-size:14px!important;font-weight:700!important}'+
  '.pp-hero .pp-mini{gap:8px!important;margin-top:16px!important;border:none!important}.pp-hero .pp-mini>div{background:#2A2A2E!important;border-radius:12px!important;padding:8px!important}'+
  '.pp-hero .pp-mini span{color:#A1A1AA!important;font-size:11.5px!important;letter-spacing:0!important;text-transform:none!important;font-weight:600!important}.pp-hero .pp-mini b{font-size:18px!important}'+
  /* 2 big dark buttons */
  
  'html body .pp-qa .pp-q,html body .pp-qa .pp-q:nth-child(1),html body .pp-qa .pp-q:nth-child(2),html body .pp-qa .pp-q:nth-child(3){background:#1C1C1E!important;color:#fff!important;border:none!important;border-radius:18px!important;font-weight:700!important}'+
  'html body .pp-qa .pp-q span,html body .pp-qa .pp-q:nth-child(1) span,html body .pp-qa .pp-q:nth-child(2) span,html body .pp-qa .pp-q:nth-child(3) span{color:#C4A1FF!important}html body .pp-qa .pp-q svg{stroke:#C4A1FF!important}'+
  /* section titles + buttons */
  'html body [id^=page-] .section-title,html body [id^=page-] .sx-h2{color:#fff!important}'+
  'html body [id^=page-] .sx-btn,html body [id^=page-] .sx-mini:not(.g){background:#3A3A3C!important;color:#fff!important;border:none!important}html body [id^=page-] .sx-btn2,html body [id^=page-] .sx-mini.g{background:#1C1C1E!important;color:#fff!important;border:1px solid #3A3A3C!important}'+
  'html body #page-backup .pp-reset{background:#2A0F12!important;border:1px solid #7F1D1D!important}html body #page-backup .pp-reset *{color:#F87171!important}'+
  /* floating bottom bar */
  '.v18dock{background:#0C0C0E!important;border-top:1px solid #222!important}.v18dock .nav-btn,.v18dock .nav-btn *{color:#A1A1AA!important}.v18dock .nav-btn.active,.v18dock .nav-btn.active *{color:#C4A1FF!important}'+
  '#ppSheet .pp-sh{background:#1C1C1E!important}#ppSheet .pp-sh-t{color:#fff!important}#ppSheet input,#ppSheet select{background:#2A2A2E!important;color:#fff!important;border:none!important}#ppSheet .pp-sh-go{background:#fff!important;color:#000!important}';
  css.textContent+=
  'html body.look-soft [id^=page-] .pp-hero.pp-hero.pp-hero,html body [id^=page-] .pp-hero.pp-hero.pp-hero{background:radial-gradient(circle at 88% 0%,rgba(168,85,247,.34),transparent 62%) #1C1C1E!important;background-color:#1C1C1E!important;border:none!important;box-shadow:none!important}'+
  'html body.look-soft [id^=page-] .pp-tophd .sx-sel.sx-sel,html body [id^=page-] .pp-tophd .sx-sel.sx-sel{background:#1C1C1E!important;background-color:#1C1C1E!important;border:none!important;box-shadow:none!important}'+
  'html body.look-soft [id^=page-] .pp-donut div.pp-donut div,html body [id^=page-] .pp-donut>div{background:#1C1C1E!important;color:#fff!important}html body [id^=page-] .pp-donut b{color:#fff!important}'+
  '';
  document.head.appendChild(css);
  var b=document.querySelector('.nav-btn'); if(b&&b.parentElement) b.parentElement.classList.add('v18dock');
  var mt=document.querySelector('meta[name="theme-color"]'); if(mt) mt.setAttribute('content','#000000');
})();
