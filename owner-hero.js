/* ---------- util: DOM pronto ---------- */
function onReady(fn){ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',fn); } else{ fn(); } }

/* ---------- main ---------- */
onReady(function(){
  var root = document.querySelector('.owner-hero'); if(!root) return;

  /* ano corrente */
  root.querySelectorAll('.js-year').forEach(function(s){ s.textContent = new Date().getFullYear(); });

  /* subs YT (mantém lógica p/ WP depois) */
  (function(){
    var el = root.querySelector('.js-subs'); if(!el) return;
    var handle = el.dataset.handle || '@Workolic';
    var refreshS = parseInt(el.dataset.refresh||'60',10);
    var compact = el.dataset.compact==='1';
    var fallback = parseInt(el.dataset.fallback||'0',10) || null;

    function fmt(n){
      if(!Number.isFinite(n)) return '—';
      if(compact){
        if(n>=1e9) return (n/1e9).toFixed(1).replace(/\.0$/,'')+'B';
        if(n>=1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'')+'M';
        if(n>=1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'')+'k';
      }
      return n.toLocaleString('pt-PT');
    }
    function tick(){
      try{
        var u = new URL('/wp-json/lucrar/v1/youtube-subs', location.origin);
        u.searchParams.set('handle', handle);
        u.searchParams.set('ttl', String(Math.max(10, refreshS)));
        fetch(u.toString(), {cache:'no-store', credentials:'same-origin'})
          .then(function(r){ if(!r.ok) throw 0; return r.json(); })
          .then(function(j){
            if(j && typeof j.subscriberCount==='number') el.textContent = fmt(j.subscriberCount);
            else if(fallback) el.textContent = fmt(fallback);
            else el.textContent = '—';
          })
          .catch(function(){ if(fallback) el.textContent = fmt(fallback); })
          .finally(function(){ if(refreshS>0) setTimeout(tick, refreshS*1000); });
      }catch(_){
        if(fallback) el.textContent = fmt(fallback);
      }
    }
    tick();
  })();

  /* ---------- MODAIS ---------- */
  var pdfModal = document.getElementById('gbModalPdf');
  var calModal = document.getElementById('gbModalCal');
  var pdfFrame = pdfModal ? pdfModal.querySelector('iframe') : null;
  var calWrap  = calModal ? calModal.querySelector('.calwrap') : null;

  function openModal(m){
    if(!m) return;
    m.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeModal(m){
    if(!m) return;
    m.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
    if(m===pdfModal && pdfFrame){ pdfFrame.src='about:blank'; }
    if(m===calModal && calWrap){ calWrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;">A carregar…</div>'; }
  }

  /* fechar por backdrop/X/Esc */
  root.addEventListener('click',function(e){
    if(e.target.matches('[data-close], .gb-backdrop')){
      var m = e.target.closest('.gb-modal');
      closeModal(m);
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      closeModal(pdfModal); closeModal(calModal);
    }
  });

  /* Calendly loader (inline) */
  function ensureCalendly(cb){
    if(typeof Calendly !== 'undefined' && Calendly.initInlineWidget){ cb(); return; }
    var css = document.querySelector('link[href*="assets.calendly.com/assets/external/widget.css"]');
    if(!css){
      var l=document.createElement('link'); l.rel='stylesheet';
      l.href='https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(l);
    }
    var s=document.createElement('script');
    s.src='https://assets.calendly.com/assets/external/widget.js';
    s.async=true; s.onload=function(){ cb(); };
    document.head.appendChild(s);
  }

  /* abrir PDF / Calendly */
  root.addEventListener('click',function(e){
    var a = e.target.closest('a'); if(!a) return;

    /* PDF em modal */
    if(a.classList.contains('js-open-pdf')){
      e.preventDefault();
      var href = a.getAttribute('href');
      if(!href) return;
      if(pdfFrame){ pdfFrame.src = href; pdfFrame.title = a.getAttribute('data-title') || 'Documento'; }
      openModal(pdfModal);
      return;
    }

    /* Calendly em modal */
    if(a.classList.contains('gb-open-cal')){
      e.preventDefault();
      var url = a.getAttribute('data-cal') || 'https://calendly.com/workolic01/30min';
      if(calWrap){ calWrap.innerHTML = ''; }
      ensureCalendly(function(){
        Calendly.initInlineWidget({ url:url, parentElement: calWrap });
      });
      openModal(calModal);
      return;
    }
  });
});