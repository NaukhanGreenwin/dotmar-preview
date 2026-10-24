/* Dotmar preview — product page: gallery, zoom, lightbox, variants, buy links */
(function(){
  'use strict';
  var d=document, DM=window.DM, data=JSON.parse(d.getElementById('pdata').textContent);
  var STORE='https://dotmarfitness.com';
  var imgs=data.images, cur=0;
  var stage=d.getElementById('stage'), stageImg=stage?stage.querySelector('img'):null;
  var thumbs=[].slice.call(d.querySelectorAll('.gal__thumbs button'));
  var counter=d.getElementById('gal-count');
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  function show(i){
    if(!imgs.length||!stageImg) return; cur=(i+imgs.length)%imgs.length; var im=imgs[cur];
    stageImg.style.opacity='0';
    var n=new Image(); if(im.L){ n.src=DM.loc(im.L,1024); n.srcset=DM.lset(im.L); } else { n.src=DM.sized(im.src,1200); n.srcset=DM.srcset(im.src)+', '+DM.sized(im.src,1440)+' 1440w'; }
    var swap=function(){ stageImg.src=n.src; stageImg.srcset=n.srcset; stageImg.style.opacity='1'; };
    if(n.decode) n.decode().then(swap,swap); else n.onload=swap;
    thumbs.forEach(function(t,k){ t.setAttribute('aria-current',String(k===cur)); });
    if(counter) counter.textContent=(cur+1)+' / '+imgs.length;
  }
  thumbs.forEach(function(t,k){ t.addEventListener('click',function(){ show(k); }); });

  /* hover zoom (mouse only) */
  if(stage&&fine){
    stage.addEventListener('pointermove',function(e){ if(e.pointerType!=='mouse') return; var r=stage.getBoundingClientRect(); stageImg.style.transformOrigin=((e.clientX-r.left)/r.width*100)+'% '+((e.clientY-r.top)/r.height*100)+'%'; });
    stage.addEventListener('pointerenter',function(e){ if(e.pointerType==='mouse') stage.classList.add('is-zoom'); });
    stage.addEventListener('pointerleave',function(){ stage.classList.remove('is-zoom'); });
  }
  /* swipe on touch stage */
  if(stage){
    var sx=null;
    stage.addEventListener('touchstart',function(e){ sx=e.touches[0].clientX; },{passive:true});
    stage.addEventListener('touchend',function(e){ if(sx===null) return; var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>40){ show(cur+(dx<0?1:-1)); stage._swiped=true; setTimeout(function(){stage._swiped=false;},300);} sx=null; });
  }

  /* lightbox */
  var lb=d.getElementById('lb'), lbStage=lb&&lb.querySelector('.lb__stage'), lbImg=lb&&lb.querySelector('.lb__stage img'), lbCount=lb&&lb.querySelector('[data-lb-count]');
  var z=1,tx=0,ty=0,drag=null;
  function apply(){ lbImg.style.transform='translate(calc(-50% + '+tx+'px), calc(-50% + '+ty+'px)) scale('+z+')'; lbStage.classList.toggle('is-z',z>1); }
  function lbShow(i){ cur=(i+imgs.length)%imgs.length; z=1;tx=0;ty=0; apply(); lbImg.src=imgs[cur].L?DM.loc(imgs[cur].L,2048):DM.sized(imgs[cur].src,2048); lbCount.textContent=(cur+1)+' / '+imgs.length; }
  function lbOpen(){ if(!lb||!imgs.length) return; lb.classList.add('is-open'); lb.removeAttribute('inert'); d.documentElement.style.overflow='hidden'; lbShow(cur); lb.querySelector('[data-lb-close]').focus(); }
  function lbClose(){ lb.classList.remove('is-open'); lb.setAttribute('inert',''); d.documentElement.style.overflow=''; show(cur); }
  if(stage) stage.addEventListener('click',function(){ if(!stage._swiped) lbOpen(); });
  if(lb){
    lb.querySelector('[data-lb-close]').addEventListener('click',lbClose);
    var p=lb.querySelector('.lb__nav--p'), n=lb.querySelector('.lb__nav--n');
    if(p) p.addEventListener('click',function(e){ e.stopPropagation(); lbShow(cur-1); });
    if(n) n.addEventListener('click',function(e){ e.stopPropagation(); lbShow(cur+1); });
    lbStage.addEventListener('pointerdown',function(e){ drag={x:e.clientX,y:e.clientY,tx:tx,ty:ty,moved:false}; lbStage.setPointerCapture(e.pointerId); });
    lbStage.addEventListener('pointermove',function(e){ if(!drag||z===1) return; var dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true; tx=drag.tx+dx; ty=drag.ty+dy; lbImg.style.transition='none'; apply(); });
    lbStage.addEventListener('pointerup',function(e){
      lbImg.style.transition='';
      if(drag&&!drag.moved){
        if(z>1){ z=1;tx=0;ty=0; } else { var r=lbStage.getBoundingClientRect(); z=2.4; tx=-(e.clientX-r.left-r.width/2)*1.4; ty=-(e.clientY-r.top-r.height/2)*1.4; }
        apply();
      } else if(drag&&z===1){ var dx=e.clientX-drag.x; if(Math.abs(dx)>50) lbShow(cur+(dx<0?1:-1)); }
      drag=null;
    });
    d.addEventListener('keydown',function(e){ if(!lb.classList.contains('is-open')) return; if(e.key==='Escape') lbClose(); if(e.key==='ArrowRight') lbShow(cur+1); if(e.key==='ArrowLeft') lbShow(cur-1); });
  }

  /* variants + buy */
  var vars=data.variants, opts=data.options, sel=(vars.find(function(v){return v.a;})||vars[0]).o.slice();
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
    priceEl.innerHTML='<span class="now">'+DM.money(v.p)+'</span>'+(v.c>v.p?'<s>'+DM.money(v.c)+'</s><span class="save">Save '+DM.money(v.c-v.p)+'</span>':'')+'<span class="cur">CAD</span>';
    stockEl.className='stock'+(v.a?'':' stock--out'); stockEl.textContent=v.a?'In stock':'Sold out';
    var q=Math.max(1,Math.min(99,parseInt(qtyIn.value,10)||1));
    buyNow.href=STORE+'/cart/'+v.id+':'+q; addCart.href=STORE+'/cart/add?id='+v.id+'&quantity='+q;
    [buyNow,addCart].forEach(function(b){ if(v.a){ b.removeAttribute('aria-disabled'); b.tabIndex=0; } else { b.setAttribute('aria-disabled','true'); } });
    buyNow.textContent=v.a?'Buy on Dotmar':'Sold out';
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
  [buyNow,addCart].forEach(function(b){ if(b) b.addEventListener('click',function(e){ if(b.getAttribute('aria-disabled')==='true') e.preventDefault(); }); });
  if(vars&&vars.length&&!data.quote) update();
})();
