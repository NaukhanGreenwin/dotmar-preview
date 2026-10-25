/* Dotmar preview — product page: gallery, zoom, lightbox, variants, buy links */
(function(){
  'use strict';
  var d=document, DM=window.DM, data=JSON.parse(d.getElementById('pdata').textContent);
  var STORE='https://dotmarfitness.com';
  var imgs=data.images, cur=0;
  /* v6 gallery: native scroll-snap track (swipe), arrows, thumbs, dots */
  var g=d.querySelector('[data-g2]'), track=g&&g.querySelector('.g2__track');
  var thumbs=g?[].slice.call(g.querySelectorAll('[data-go]')):[], dots=g?[].slice.call(g.querySelectorAll('.g2__dots i')):[], counter=g&&g.querySelector('.g2__count');
  function mark(i){ cur=i; thumbs.forEach(function(t,k){ t.setAttribute('aria-current',String(k===i)); }); dots.forEach(function(t,k){ t.classList.toggle('on',k===i); }); if(counter&&imgs.length>1) counter.textContent=(i+1)+' / '+imgs.length;
    var th=thumbs[i]; if(th&&th.parentNode.scrollWidth>th.parentNode.clientWidth){ th.parentNode.scrollTo({left:th.offsetLeft-th.parentNode.clientWidth/2+th.offsetWidth/2,behavior:'smooth'}); } }
  function show(i,instant){ if(!track||!imgs.length) return; i=(i+imgs.length)%imgs.length; track.scrollTo({left:i*track.clientWidth,behavior:instant?'auto':'smooth'}); mark(i); }
  if(track){
    mark(0);
    var rt; track.addEventListener('scroll',function(){ clearTimeout(rt); rt=setTimeout(function(){ var i=Math.round(track.scrollLeft/Math.max(1,track.clientWidth)); if(i!==cur) mark(i); },60); },{passive:true});
    thumbs.forEach(function(t){ t.addEventListener('click',function(){ show(+t.getAttribute('data-go')); }); });
    g.querySelectorAll('[data-step]').forEach(function(b){ b.addEventListener('click',function(){ show(cur+(+b.getAttribute('data-step'))); }); });
    track.addEventListener('keydown',function(e){ if(e.key==='ArrowRight'){ e.preventDefault(); show(cur+1); } if(e.key==='ArrowLeft'){ e.preventDefault(); show(cur-1); } });
    window.addEventListener('resize',function(){ show(cur,true); });
  }

  /* lightbox */
  var lb=d.getElementById('lb'), lbStage=lb&&lb.querySelector('.lb__stage'), lbImg=lb&&lb.querySelector('.lb__stage img'), lbCount=lb&&lb.querySelector('[data-lb-count]');
  var z=1,tx=0,ty=0,drag=null;
  function apply(){ lbImg.style.transform='translate(calc(-50% + '+tx+'px), calc(-50% + '+ty+'px)) scale('+z+')'; lbStage.classList.toggle('is-z',z>1); }
  function lbShow(i){ cur=(i+imgs.length)%imgs.length; z=1;tx=0;ty=0; apply(); lbImg.src=imgs[cur].L?DM.loc(imgs[cur].L,4096):DM.sized(imgs[cur].src,2048); lbCount.textContent=(cur+1)+' / '+imgs.length; }
  function lbOpen(){ if(!lb||!imgs.length) return; lb.classList.add('is-open'); lb.removeAttribute('inert'); d.documentElement.style.overflow='hidden'; lbShow(cur); lb.querySelector('[data-lb-close]').focus(); }
  function lbClose(){ lb.classList.remove('is-open'); lb.setAttribute('inert',''); d.documentElement.style.overflow=''; show(cur,true); }
  if(g){ g.querySelectorAll('[data-zoom]').forEach(function(b){ b.addEventListener('click',function(){ cur=+b.getAttribute('data-zoom'); lbOpen(); }); }); var fz=g.querySelector('[data-zoom-cur]'); if(fz) fz.addEventListener('click',lbOpen); }
  if(lb){
    lb.querySelector('[data-lb-close]').addEventListener('click',lbClose);
    var p=lb.querySelector('.lb__nav--p'), n=lb.querySelector('.lb__nav--n');
    if(p) p.addEventListener('click',function(e){ e.stopPropagation(); lbShow(cur-1); });
    if(n) n.addEventListener('click',function(e){ e.stopPropagation(); lbShow(cur+1); });
    lbStage.addEventListener('pointerdown',function(e){ if(e.target.closest('.lb__nav')) return; drag={x:e.clientX,y:e.clientY,tx:tx,ty:ty,moved:false}; try{ lbStage.setPointerCapture(e.pointerId); }catch(_){} });
    lbStage.addEventListener('pointermove',function(e){ if(!drag) return; var dx=e.clientX-drag.x, dy=e.clientY-drag.y;
      if(z===1){ if(Math.abs(dx)>8||Math.abs(dy)>8) drag.moved=true; if(drag.moved&&Math.abs(dx)>Math.abs(dy)){ tx=dx; ty=0; lbImg.style.transition='none'; apply(); } return; }  /* swipe: image follows the finger */
      if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true; tx=drag.tx+dx; ty=drag.ty+dy; lbImg.style.transition='none'; apply(); });
    lbStage.addEventListener('pointercancel',function(){ if(drag&&z===1){ tx=0;ty=0; lbImg.style.transition=''; apply(); } drag=null; });
    lbStage.addEventListener('pointerup',function(e){
      lbImg.style.transition='';
      if(drag&&!drag.moved){
        if(z>1){ z=1;tx=0;ty=0; } else { var r=lbStage.getBoundingClientRect(); z=2.4; tx=-(e.clientX-r.left-r.width/2)*1.4; ty=-(e.clientY-r.top-r.height/2)*1.4; }
        apply();
      } else if(drag&&z===1){ var dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)) lbShow(cur+(dx<0?1:-1)); else { tx=0;ty=0; apply(); } }
      drag=null;
    });
    d.addEventListener('keydown',function(e){ if(!lb.classList.contains('is-open')) return; if(e.key==='Escape') lbClose(); if(e.key==='ArrowRight') lbShow(cur+1); if(e.key==='ArrowLeft') lbShow(cur-1); });
  }

  /* variants + buy */
  var vars=data.variants, opts=data.options, sel=(vars.find(function(v){return v.a&&v.p>0;})||vars.find(function(v){return v.p>0;})||vars[0]).o.slice();  /* same default as build.py */
  var priceEl=d.getElementById('price'), stockEl=d.getElementById('stock'), affEl=d.getElementById('affirm');
  var buyNow=d.getElementById('buy-now'), addCart=d.getElementById('add-cart'), qtyIn=d.getElementById('qty');
  function variant(){ return vars.find(function(v){ return v.o.every(function(x,i){ return x===sel[i]; }); }); }
  function update(){
    var v=variant();
    d.querySelectorAll('[data-opt]').forEach(function(g){
      var i=+g.getAttribute('data-opt');
      g.querySelectorAll('button').forEach(function(b){
        var val=b.getAttribute('data-val'); b.setAttribute('aria-pressed',String(val===sel[i]));
        var test=sel.slice(); test[i]=val; var tv=vars.find(function(x){ return x.o.every(function(y,k){return y===test[k];}); });
        b.classList.toggle('is-na',!tv||!tv.a);
      });
      var s=g.querySelector('select'); if(s) s.value=sel[i];
      var lab=d.querySelector('[data-opt-val="'+i+'"]'); if(lab) lab.textContent=sel[i];
    });
    if(!v){ if(buyNow){ buyNow.setAttribute('aria-disabled','true'); } return; }
    if(data.quote) return;
    if(!(v.p>0)){ priceEl.innerHTML='<span class="now now--q">Price on request</span>'; stockEl.className='pill pill--quote'; stockEl.textContent='Quote';
      [buyNow,addCart,d.getElementById('bar-buy')].forEach(function(b){ if(b) b.setAttribute('aria-disabled','true'); }); buyNow.textContent='Call for price';
      var bp0=d.querySelector('[data-bar-price]'); if(bp0) bp0.textContent='Price on request'; var bb0=d.getElementById('bar-buy'); if(bb0) bb0.textContent='Call for price';
      if(v.img!=null&&v.img!==cur&&v.img<imgs.length) show(v.img); return; }
    priceEl.innerHTML='<span class="now">'+DM.money(v.p)+'</span>'+(v.c>v.p?'<s>'+DM.money(v.c)+'</s><span class="save">Save '+DM.money(v.c-v.p)+'</span>':'')+'<span class="cur">CAD</span>';
    stockEl.className='pill'+(v.a?'':' pill--out'); stockEl.textContent=v.a?'In stock':'Sold out';
    var q=Math.max(1,Math.min(99,parseInt(qtyIn.value,10)||1));
    buyNow.href=STORE+'/cart/'+v.id+':'+q; addCart.href=STORE+'/cart/add?id='+v.id+'&quantity='+q;
    [buyNow,addCart].forEach(function(b){ if(v.a){ b.removeAttribute('aria-disabled'); b.tabIndex=0; } else { b.setAttribute('aria-disabled','true'); } });
    buyNow.textContent=v.a?'Buy now':'Sold out';
    var bb=d.getElementById('bar-buy'), bp=d.querySelector('[data-bar-price]');
    if(bb){ bb.href=buyNow.href; bb.textContent=buyNow.textContent; if(v.a) bb.removeAttribute('aria-disabled'); else bb.setAttribute('aria-disabled','true'); }
    if(bp) bp.textContent=DM.money(v.p);
    if(v.img!=null&&v.img!==cur&&v.img<imgs.length) show(v.img);
  }
  d.querySelectorAll('[data-opt]').forEach(function(g){
    var i=+g.getAttribute('data-opt');
    g.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ sel[i]=b.getAttribute('data-val'); update(); }); });
    var s=g.querySelector('select'); if(s) s.addEventListener('change',function(){ sel[i]=s.value; update(); });
  });
  if(qtyIn){
    d.querySelectorAll('[data-qty]').forEach(function(b){ b.addEventListener('click',function(){ qtyIn.value=Math.max(1,Math.min(99,(parseInt(qtyIn.value,10)||1)+(+b.getAttribute('data-qty')))); update(); }); });
    qtyIn.addEventListener('change',update);
  }
  [buyNow,addCart,d.getElementById('bar-buy')].forEach(function(b){ if(b) b.addEventListener('click',function(e){ if(b.getAttribute('aria-disabled')==='true') e.preventDefault(); }); });
  if(vars&&vars.length&&!data.quote) update();

  /* v9 PDP details accordions (button + aria-expanded, animated via grid rows) */
  var acc=d.querySelector('.pdx-acc');
  if(acc){
    acc.classList.add('is-ready');
    acc.querySelectorAll('.pdx-acc__btn').forEach(function(b){
      b.addEventListener('click',function(){
        var it=b.closest('.pdx-acc__item'), open=b.getAttribute('aria-expanded')!=='true';
        b.setAttribute('aria-expanded',String(open)); it.classList.toggle('is-open',open);
      });
    });
  }

  /* sticky bottom buy bar (phones): visible once the main buy actions scroll out of view */
  var bar=d.getElementById('pbar'), main=d.getElementById('buy-main');
  if(bar&&main&&'IntersectionObserver' in window){
    var past=false, io=new IntersectionObserver(function(es){ es.forEach(function(e){ past=!e.isIntersecting&&e.boundingClientRect.top<0; bar.classList.toggle('is-on',past); bar.setAttribute('aria-hidden',String(!past)); }); });
    io.observe(main);
  }
})();
