/* Dotmar preview — shared behaviour (header, mega menu, sheet, search, reveal, rails) */
(function(){
  'use strict';
  var d=document, root=d.documentElement;
  root.classList.remove('no-js');
  var ROOT=window.DM_ROOT||'';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- helpers (shared with shop/pdp via window.DM) ---------- */
  function money(c){ return '$'+(c/100).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function sized(src,w){ return src+(src.indexOf('?')>-1?'&':'?')+'width='+w; }
  function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  var W=[240,360,480,720,960];
  function loc(L,w){ var ks=Object.keys(L).map(Number).sort(function(a,b){return a-b;}); for(var i=0;i<ks.length;i++){ if(ks[i]>=w) return ROOT+L[ks[i]]; } return ROOT+L[ks[ks.length-1]]; }
  function lset(L){ return Object.keys(L).map(function(k){ return ROOT+L[k]+' '+k+'w'; }).join(', '); }
  function srcset(src){ return W.map(function(w){return sized(src,w)+' '+w+'w';}).join(', '); }
  var NOI={"wrench": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/></svg>", "card": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" aria-hidden=\"true\"><rect x=\"2.5\" y=\"5\" width=\"19\" height=\"14\" rx=\"2\"/><path d=\"M2.5 10h19\"/></svg>", "parts": "<svg viewBox=\"0 0 32 32\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M16 2.75l11.5 6.63v13.24L16 29.25 4.5 22.62V9.38z\"/><circle cx=\"16\" cy=\"16\" r=\"5.25\"/></svg>"};
  function card(p,sizes){
    var tag='';
    if(p.q) tag='<span class="card__tag card__tag--mute">Quote</span>';
    else if(p.c>p.p) tag='<span class="card__tag">Save '+money(p.c-p.p).replace('.00','')+'</span>';
    else if(!p.a) tag='<span class="card__tag card__tag--mute">Sold out</span>';
    var price = p.q ? '<span class="q">Price on request</span>' :
      ((p.m?'From ':'')+money(p.p)+(p.c>p.p?' <s>'+money(p.c)+'</s>':''));
    var img = p.i ? '<img class="lz" src="'+(p.L?loc(p.L,512):sized(p.i,480))+'" srcset="'+(p.L?lset(p.L):srcset(p.i))+'" sizes="'+(sizes||'(max-width:734px) 46vw, (max-width:1068px) 31vw, 290px')+'" alt="" loading="lazy" decoding="async" width="480" height="480">' : '';
    if(!p.i && p.n && NOI[p.n]) img='<span class="card__noimg" aria-hidden="true">'+NOI[p.n]+'</span>';
    return '<a class="card" href="'+ROOT+'p/'+p.h+'.html"><div class="card__media">'+img+tag+'</div>'+
      '<p class="card__brand">'+(p.b?esc(p.b):'&nbsp;')+'</p>'+'<h3 class="card__title">'+esc(p.t)+'</h3><p class="card__price price">'+price+'</p></a>';
  }
  var catalogP=null;
  function catalog(){ if(!catalogP) catalogP=fetch(ROOT+'data/catalog.json').then(function(r){return r.json();}); return catalogP; }
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
  var SYN={'indoor-cycle':'spin bike bikes cycling','treadmill':'treadmills running','upright-bikes':'bike bikes','recumbent-bikes':'bike bikes','rowers':'rowing','dumbbells-barbells':'dumbbells','stages-parts':'parts','schwinn-bike-parts':'parts','pedals-cleats':'parts','power-racks-and-rigs':'power rack racks rig','refurbished':'refurbished used pre owned'};
  function syn(p){ return (p.s||[]).concat(p.k||[]).map(function(k){ return SYN[k]||''; }).join(' '); }
  var TYPO={tredmill:'treadmill',tredmills:'treadmills',treadmil:'treadmill',dumbells:'dumbbells',dumbell:'dumbbell',kettlebel:'kettlebell',kettlebels:'kettlebells',eliptical:'elliptical',ellipitcal:'elliptical',startrac:'star trac',rowing:'rower'};
  var SUBW={'indoor-cycle':'spin bike bikes cycle cycling','treadmill':'treadmill treadmills running','upright-bikes':'bike bikes upright','recumbent-bikes':'bike bikes recumbent','ellipticals':'elliptical ellipticals','rowers':'rower rowers rowing','steppers-stepmills':'stepper stepmill stairs','dumbbells-barbells':'dumbbell dumbbells','power-racks-and-rigs':'rack racks rig','kettlebells-med-balls':'kettlebell kettlebells','medicine-ball-1':'medicine ball balls'};
  function words(s){ return ' '+norm(s)+' '; }
  function search(list,q){
    var nq=norm(q); Object.keys(TYPO).forEach(function(k){ nq=(' '+nq+' ').replace(' '+k+' ',' '+TYPO[k]+' ').trim(); });
    var terms=nq.split(' ').filter(Boolean); if(terms.length>1) terms=terms.filter(function(t){ return t.length>1; }); if(!terms.length) return [];
    var out=[];
    for(var i=0;i<list.length;i++){
      var p=list[i];
      if(!p._n){ p._n=' '+norm(p.t+' '+p.b+' '+(p.s||[]).join(' ').replace(/-/g,' ')+' '+(p.k||[]).join(' ')+' '+syn(p))+' '; p._t=words(p.t); p._b=words(p.b); p._s=' '+(p.s||[]).map(function(k){ return SUBW[k]||''; }).join(' ')+' '; }
      var sc=0,ok=true,tmatch=0;
      for(var j=0;j<terms.length;j++){
        var t0=terms[j], cand=[t0]; if(t0.length>3&&/s$/.test(t0)) cand.push(t0.replace(/(es|s)$/,''),t0.slice(0,-1));
        var best=-1;
        for(var c=0;c<cand.length;c++){ var t=cand[c], v=-1;
          if(p._t.indexOf(' '+t+' ')>-1||p._t.indexOf(' '+t+'s ')>-1){ v=10; tmatch++; }
          else if(p._b.indexOf(' '+t+' ')>-1) v=8;
          else if(p._s.indexOf(' '+t+' ')>-1) v=8;
          else if(p._t.indexOf(' '+t)>-1) v=4;
          else if(p._n.indexOf(' '+t)>-1) v=2;
          else if(t.length>3&&p._n.indexOf(t)>-1) v=1;
          if(v>best) best=v; }
        if(best<0){ ok=false; break; }
        sc+=best;
        if(p._s.indexOf(' '+t0+' ')>-1||p._s.indexOf(' '+t0.replace(/s$/,'')+' ')>-1) sc+=8;   /* product IS that type */
      }
      if(!ok) continue;
      if(terms.length>1&&p._b.indexOf(' '+terms.join(' ')+' ')>-1) sc+=15;   /* exact brand phrase */
      if(p.a) sc+=2; if(p.i) sc+=1; if(!p.q) sc+=1;
      out.push([sc,p]);
    }
    out.sort(function(a,b){return b[0]-a[0];});
    return out.map(function(x){return x[1];});
  }
  window.DM={loc:loc,lset:lset,money:money,sized:sized,srcset:srcset,card:card,esc:esc,catalog:catalog,search:search,ROOT:ROOT,lazy:lazyFade};

  /* ---------- lazy fade-in for card images ---------- */
  function lazyFade(scope){
    (scope||d).querySelectorAll('img.lz').forEach(function(im){
      if(im.complete&&im.naturalWidth){ im.classList.remove('lz'); return; }
      im.addEventListener('load',function(){ im.classList.remove('lz'); },{once:true});
      im.addEventListener('error',function(){ im.classList.remove('lz'); im.style.visibility='hidden'; },{once:true});
    });
  }
  lazyFade();

  /* ---------- header shrink ---------- */
  var hdr=d.querySelector('.hdr');
  function onScroll(){ if(hdr) hdr.classList.toggle('is-scrolled',window.scrollY>8); }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* ---------- mega menu (v8: hover intent, focus, sliding indicator) ---------- */
  var scrim=d.querySelector('.scrim'); var openItem=null, tmr=null;
  var nav=d.querySelector('.nav'), ind=nav&&nav.querySelector('.nav__ind');
  function moveInd(a){
    if(!ind) return;
    if(!a) a=openItem?openItem.querySelector('.nav__link'):nav.querySelector('.nav__link[aria-current=page]');
    if(!a||!a.offsetWidth){ ind.classList.remove('is-on'); return; }
    var op=ind.offsetParent||nav, nr=op.getBoundingClientRect(), r=a.getBoundingClientRect(), cs=getComputedStyle(a), pl=parseFloat(cs.paddingLeft)||0, pr=parseFloat(cs.paddingRight)||0;
    ind.style.setProperty('--x',(r.left-nr.left+pl)+'px'); ind.style.top=(r.bottom-nr.top-22)+'px'; ind.style.setProperty('--w',(r.width-pl-pr)+'px'); ind.classList.add('is-on');
  }
  if(ind){ nav.classList.add('has-ind'); ind.classList.add('no-anim'); moveInd(); requestAnimationFrame(function(){ requestAnimationFrame(function(){ ind.classList.remove('no-anim'); }); });
    window.addEventListener('resize',function(){ ind.classList.add('no-anim'); moveInd(); requestAnimationFrame(function(){ ind.classList.remove('no-anim'); }); });
    if(d.fonts&&d.fonts.ready) d.fonts.ready.then(function(){ moveInd(); });
    nav.querySelectorAll('.nav__link').forEach(function(a){ a.addEventListener('pointerenter',function(e){ if(e.pointerType==='mouse') moveInd(a); }); a.addEventListener('focus',function(){ moveInd(a); }); });
    nav.addEventListener('pointerleave',function(){ setTimeout(function(){ moveInd(); },200); });
  }
  function megaImgs(scope){ scope.querySelectorAll('[data-srcset],img[data-src]').forEach(function(x){ if(x.dataset.srcset){ x.srcset=x.dataset.srcset; x.removeAttribute('data-srcset'); } if(x.dataset.src){ x.src=x.dataset.src; x.removeAttribute('data-src'); } }); }
  function setOpen(item){
    if(openItem&&openItem!==item){ openItem.classList.remove('is-open'); openItem.querySelector('.nav__link').setAttribute('aria-expanded','false'); }
    openItem=item;
    if(item){ megaImgs(item); item.classList.add('is-open'); item.querySelector('.nav__link').setAttribute('aria-expanded','true'); }
    if(scrim) scrim.classList.toggle('is-on',!!item);
    if(hdr) hdr.classList.toggle('is-mega',!!item);
    if(typeof solid==='function') solid();
    moveInd();
  }
  d.querySelectorAll('.nav__item[data-mega]').forEach(function(item){
    var link=item.querySelector('.nav__link');
    item.addEventListener('pointerenter',function(e){ if(e.pointerType!=='mouse') return; megaImgs(item); clearTimeout(tmr); tmr=setTimeout(function(){setOpen(item);},openItem?40:120); });
    item.addEventListener('pointerleave',function(e){ if(e.pointerType!=='mouse') return; clearTimeout(tmr); tmr=setTimeout(function(){ if(openItem===item) setOpen(null); },180); });
    link.addEventListener('focus',function(){ var fv=true; try{ fv=link.matches(':focus-visible'); }catch(_){} if(fv){ clearTimeout(tmr); setOpen(item); } });
    item.addEventListener('keydown',function(e){
      if(e.key==='Escape'){ e.stopPropagation(); setOpen(null); link.focus(); }
      else if(e.key==='ArrowDown'&&e.target===link){ e.preventDefault(); setOpen(item); var f=item.querySelector('.mega a'); if(f) f.focus(); }
    });
    item.addEventListener('focusout',function(e){ if(!item.contains(e.relatedTarget)&&openItem===item) setOpen(null); });
  });
  if(scrim) scrim.addEventListener('click',function(){ setOpen(null); });

  /* ---------- mobile sheet (v8: accordion, focus trap) ---------- */
  var sheet=d.getElementById('sheet'), menuBtn=d.querySelector('[data-open-sheet]');
  var lockY=0, locked=false, bd=d.body;
  function lock(on){
    if(on===locked) return; locked=on;
    if(on){ lockY=window.scrollY||root.scrollTop||0; bd.style.position='fixed'; bd.style.top=(-lockY)+'px'; bd.style.left='0'; bd.style.right='0'; bd.style.width='100%'; }
    else { bd.style.position=''; bd.style.top=''; bd.style.left=''; bd.style.right=''; bd.style.width=''; var b=root.style.scrollBehavior; root.style.scrollBehavior='auto'; window.scrollTo(0,lockY); root.style.scrollBehavior=b; }
  }
  function closeSheet(ret){ if(!sheet||!sheet.classList.contains('is-open')) return; sheet.classList.remove('is-open'); sheet.setAttribute('inert',''); lock(false); if(menuBtn){ menuBtn.setAttribute('aria-expanded','false'); if(ret) menuBtn.focus({preventScroll:true}); } if(typeof solid==='function') solid(); }
  d.querySelectorAll('[data-open-sheet]').forEach(function(b){ b.addEventListener('click',function(){ sheet.classList.add('is-open'); sheet.removeAttribute('inert'); lock(true); b.setAttribute('aria-expanded','true'); var c=sheet.querySelector('[data-close-sheet]'); if(c) c.focus({preventScroll:true}); }); });
  d.querySelectorAll('[data-close-sheet]').forEach(function(b){ b.addEventListener('click',function(){ closeSheet(true); }); });
  if(sheet){
    sheet.querySelectorAll('button.sheet__cat[aria-controls]').forEach(function(b){ b.addEventListener('click',function(){
      var on=b.getAttribute('aria-expanded')!=='true';
      sheet.querySelectorAll('button.sheet__cat[aria-expanded=true]').forEach(function(o){ if(o!==b) o.setAttribute('aria-expanded','false'); });
      b.setAttribute('aria-expanded',on?'true':'false');
    }); });
    sheet.addEventListener('keydown',function(e){
      if(e.key!=='Tab') return;
      var f=[].filter.call(sheet.querySelectorAll('a[href],button'),function(x){ var sb=x.closest('.sheet__sub'); return x.offsetParent!==null&&(!sb||sb.previousElementSibling.getAttribute('aria-expanded')==='true'); });
      if(!f.length) return; var first=f[0], last=f[f.length-1];
      if(e.shiftKey&&d.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey&&d.activeElement===last){ e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- search overlay ---------- */
  var srch=d.getElementById('srch'), sIn=d.getElementById('srch-in'), sRes=d.getElementById('srch-res'), sAll=d.getElementById('srch-all'), sQuick=d.getElementById('srch-quick');
  var active=-1;
  function openSearch(){ if(!srch) return; srch.classList.add('is-open'); srch.removeAttribute('inert'); lock(true); setOpen(null); catalog(); void srch.offsetWidth; sIn.focus({preventScroll:true}); setTimeout(function(){ if(d.activeElement!==sIn) sIn.focus({preventScroll:true}); },60); }
  function closeSearch(){ if(!srch.classList.contains('is-open')) return; srch.classList.remove('is-open'); srch.setAttribute('inert',''); lock(false); }
  d.querySelectorAll('[data-open-search]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); if(sheet) { sheet.classList.remove('is-open'); sheet.setAttribute('inert',''); } openSearch(); }); });
  if(srch){
    srch.querySelectorAll('[data-close-search]').forEach(function(b){ b.addEventListener('click',closeSearch); });
    var run=function(){
      var q=sIn.value.trim();
      sQuick.hidden=!!q; sAll.hidden=!q;
      if(!q){ sRes.innerHTML=''; return; }
      sAll.href=ROOT+'search.html?q='+encodeURIComponent(q);
      catalog().then(function(list){
        if(sIn.value.trim()!==q) return;
        var r=search(list,q); active=-1;
        sAll.textContent=r.length?('See all '+r.length+' results'):'No matches. Try another term';
        sRes.innerHTML=r.slice(0,8).map(function(p){
          return '<li><a href="'+ROOT+'p/'+p.h+'.html"><span class="th">'+(p.i?'<img src="'+(p.L?loc(p.L,120):sized(p.i,120))+'" alt="" loading="lazy">':'')+'</span><span><span class="t">'+esc(p.t)+'</span><span class="p price">'+(p.q?'Price on request':(p.m?'From ':'')+money(p.p))+'</span></span></a></li>';
        }).join('');
      });
    };
    var deb; sIn.addEventListener('input',function(){ clearTimeout(deb); deb=setTimeout(run,90); });
    sIn.addEventListener('keydown',function(e){
      var links=sRes.querySelectorAll('a');
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); if(!links.length) return; active=(active+(e.key==='ArrowDown'?1:-1)+links.length)%links.length; links.forEach(function(l,i){l.classList.toggle('is-active',i===active);}); }
      else if(e.key==='Enter'){ e.preventDefault(); if(active>-1&&links[active]) location.href=links[active].href; else if(sIn.value.trim()) location.href=ROOT+'search.html?q='+encodeURIComponent(sIn.value.trim()); }
    });
  }
  d.addEventListener('keydown',function(e){
    if(e.key==='Escape'){ if(srch&&srch.classList.contains('is-open')) closeSearch(); closeSheet(true); setOpen(null); }
    if(srch&&srch.classList.contains('is-open')&&d.activeElement!==sIn&&e.key.length===1&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!/input|textarea|select/i.test(e.target.tagName)){ e.preventDefault(); sIn.focus({preventScroll:true}); sIn.value+=e.key; sIn.dispatchEvent(new Event('input')); return; }
    if((e.key==='/'&&!/input|textarea|select/i.test(e.target.tagName))||((e.metaKey||e.ctrlKey)&&e.key==='k')){ e.preventDefault(); openSearch(); }
  });

  /* ---------- hero entrance + reveal ---------- */
  d.querySelectorAll('.hero,.page-hero,.hero2').forEach(function(h){
    var im=h.querySelector('.hero__media img,.hero2__media img');
    var go=function(){ requestAnimationFrame(function(){ h.classList.add('is-in'); }); };
    if(!im||im.complete) go(); else { im.addEventListener('load',go,{once:true}); im.addEventListener('error',go,{once:true}); setTimeout(go,1600); }
  });
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);} }); },{rootMargin:'0px 0px -8% 0px',threshold:.08});
    d.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });
  } else d.querySelectorAll('.rv').forEach(function(el){ el.classList.add('is-in'); });

  /* ---------- stat count-up (proof band) ---------- */
  var cnt=[].slice.call(d.querySelectorAll('[data-count]'));
  if(cnt.length&&!reduce&&'IntersectionObserver' in window&&window.requestAnimationFrame){
    var cio=new IntersectionObserver(function(es){ es.forEach(function(e){
      if(!e.isIntersecting) return; cio.unobserve(e.target);
      var el=e.target, to=+el.getAttribute('data-count'), fr=+(el.getAttribute('data-from')||0), t0=null, dur=1400;
      if(e.boundingClientRect.top<innerHeight*0.6&&performance.now()<1500) return;  /* already on screen at load: keep the real number */
      var tick=function(t){ if(t0===null) t0=t; var k=Math.min(1,(t-t0)/dur), ez=1-Math.pow(1-k,4);
        el.textContent=String(Math.round(fr+(to-fr)*ez)); if(k<1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }); },{threshold:.5});
    cnt.forEach(function(el){ cio.observe(el); });
  }

  /* ---------- subtle parallax on hero + bands ---------- */
  var px=[].slice.call(d.querySelectorAll('[data-parallax]'));
  if(px.length&&!reduce){
    var ticking=false;
    var upd=function(){ ticking=false; var vh=innerHeight;
      px.forEach(function(el){ var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return;
        var p=Math.max(-1,Math.min(1,(r.top+r.height/2-vh/2)/vh)); var im=el.querySelector('img'); if(!im) return;
        var amt=(el.classList.contains('hero__media')||el.classList.contains('hero2__media'))&&el.getBoundingClientRect().top<=0?-Math.max(0,-r.top)*0.18:p*-48;
        im.style.translate='0 '+amt.toFixed(1)+'px'; });
    };
    window.addEventListener('scroll',function(){ if(!ticking){ ticking=true; requestAnimationFrame(upd);} },{passive:true}); upd();
  }

  /* ---------- rails ---------- */
  d.querySelectorAll('[data-rail]').forEach(function(wrap){
    var rail=wrap.querySelector('.rail'), prev=wrap.querySelector('[data-prev]'), next=wrap.querySelector('[data-next]');
    if(!rail||!prev) return;
    var step=function(dir){ rail.scrollBy({left:dir*rail.clientWidth*0.9,behavior:reduce?'auto':'smooth'}); };
    prev.addEventListener('click',function(){step(-1);}); next.addEventListener('click',function(){step(1);});
    var st=function(){ prev.disabled=rail.scrollLeft<4; next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-4; };
    rail.addEventListener('scroll',st,{passive:true}); window.addEventListener('resize',st); st();
  });


  /* ---------- v5: testimonial carousel ---------- */
  d.querySelectorAll('[data-tst]').forEach(function(sec){
    var track=sec.querySelector('.tst__track'); if(!track) return;
    var slides=[].slice.call(track.children), dots=[].slice.call(sec.querySelectorAll('.tst__dot')), idx=sec.querySelector('[data-tst-i]');
    var cur=0, timer=null, resume=null, paused=false, inview=false, hold=0, DUR=6000, n=slides.length;
    function run(){ clearTimeout(timer); sec.classList.remove('is-run'); void sec.offsetWidth;
      if(reduce||paused||!inview||d.hidden||Date.now()<hold||n<2) return;
      sec.classList.add('is-run'); timer=setTimeout(function(){ go(cur+1); },DUR); }
    function go(i,fromScroll){ i=(i+n)%n; cur=i;
      slides.forEach(function(s,k){ s.classList.toggle('is-on',k===i); if(k===i) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden','true'); });
      dots.forEach(function(b,k){ if(k===i) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current'); });
      if(idx) idx.textContent=(i<9?'0':'')+(i+1);
      if(!fromScroll) track.scrollTo({left:i*track.clientWidth,behavior:reduce?'auto':'smooth'});
      run(); }
    function touch(){ hold=Date.now()+12000; clearTimeout(resume); resume=setTimeout(run,12100); run(); }
    dots.forEach(function(b,k){ b.addEventListener('click',function(){ touch(); go(k); }); });
    var pv=sec.querySelector('[data-tst-prev]'), nx=sec.querySelector('[data-tst-next]');
    if(pv) pv.addEventListener('click',function(){ touch(); go(cur-1); });
    if(nx) nx.addEventListener('click',function(){ touch(); go(cur+1); });
    var st; track.addEventListener('scroll',function(){ clearTimeout(st); st=setTimeout(function(){ var i=Math.round(track.scrollLeft/Math.max(1,track.clientWidth)); if(i!==cur) go(i,true); },100); },{passive:true});
    track.addEventListener('pointerdown',touch,{passive:true});
    track.addEventListener('touchstart',touch,{passive:true});
    track.addEventListener('keydown',function(e){ if(e.key==='ArrowRight'){ e.preventDefault(); touch(); go(cur+1); } if(e.key==='ArrowLeft'){ e.preventDefault(); touch(); go(cur-1); } });
    if(fine){
      sec.addEventListener('pointerenter',function(e){ if(e.pointerType==='mouse'){ paused=true; run(); } });
      sec.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse'){ paused=false; run(); } });
    }
    sec.addEventListener('focusin',function(e){ if(e.target.matches&&e.target.matches(':focus-visible')){ paused=true; run(); } });
    sec.addEventListener('focusout',function(e){ if(!sec.contains(e.relatedTarget)){ paused=false; run(); } });
    d.addEventListener('visibilitychange',run);
    if('IntersectionObserver' in window){ new IntersectionObserver(function(es){ inview=es[0].isIntersecting; run(); },{threshold:.35}).observe(sec); } else { inview=true; }
    window.addEventListener('resize',function(){ track.scrollLeft=cur*track.clientWidth; });
    go(0,true);
  });

  /* ---------- v5: today's pickup hours (Toronto time) ---------- */
  var hrs=d.querySelector('[data-hours]');
  if(hrs){ try{ var wd=new Date(new Date().toLocaleString('en-US',{timeZone:'America/Toronto'})).getDay();
    hrs.querySelectorAll('[data-d]').forEach(function(r){ var v=r.getAttribute('data-d'), on=v.indexOf('-')>-1?(wd>=+v[0]&&wd<=+v[2]):(+v===wd); r.classList.toggle('is-today',on); }); }catch(e){} }


  /* ---------- v5b: overlay header -> solid after hero; hold tickers on touch ---------- */
  var heroEl=d.body.classList.contains('has-hero')?d.querySelector('main>.hero,main>.page-hero'):null;
  function solid(){ if(!hdr) return; var on=!heroEl||heroEl.getBoundingClientRect().bottom<=hdr.offsetHeight+4||!!openItem||(sheet&&sheet.classList.contains('is-open')); hdr.classList.toggle('is-solid',on); }
  window.addEventListener('scroll',solid,{passive:true}); window.addEventListener('resize',solid); solid();
  d.querySelectorAll('[data-ticker],[data-marquee]').forEach(function(el){
    var t; function hold(){ el.classList.add('is-held'); clearTimeout(t); }
    function rel(){ clearTimeout(t); t=setTimeout(function(){ el.classList.remove('is-held'); },1500); }
    el.addEventListener('touchstart',hold,{passive:true}); el.addEventListener('touchend',rel,{passive:true}); el.addEventListener('touchcancel',rel,{passive:true});
    if(fine){ el.addEventListener('pointerenter',hold); el.addEventListener('pointerleave',rel); }
  });

  /* ---------- mailto forms (no backend) ---------- */
  d.querySelectorAll('form[data-mailto]').forEach(function(f){
    var qp=new URLSearchParams(location.search), pre=qp.get('product');
    if(pre){ var msg=f.querySelector('textarea'); if(msg&&!msg.value) msg.value='I would like a quote for: '+pre+'\n\n'; }
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!f.reportValidity()) return;
      var fd=new FormData(f), lines=[], seen={};
      fd.forEach(function(v,k){ if(!v) return; if(seen[k]){ seen[k].push(v); } else { seen[k]=[v]; } });
      Object.keys(seen).forEach(function(k){ lines.push(k+': '+seen[k].join(', ')); });
      var subj=f.getAttribute('data-subject')||'Website enquiry';
      var org=fd.get('Organization')||fd.get('Name')||'';
      location.href='mailto:info@dotmarfitness.com?subject='+encodeURIComponent(subj+(org?' — '+org:''))+'&body='+encodeURIComponent(lines.join('\n'));
      var ok=f.querySelector('[data-sent]'); if(ok) ok.hidden=false;
    });
  });
})();
