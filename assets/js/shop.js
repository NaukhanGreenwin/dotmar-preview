/* Dotmar preview — category + search results engine */
(function(){
  'use strict';
  var DM=window.DM, cfg=window.DM_SHOP||{}, d=document;
  var grid=d.getElementById('grid'), countEl=d.getElementById('count'), more=d.getElementById('more'), moreWrap=d.getElementById('more-wrap'), progress=d.getElementById('progress');
  var brandBox=d.getElementById('f-brands'), sortSel=d.getElementById('sort'), stockIn=d.getElementById('f-stock');
  var PAGE=24, shown=PAGE, all=[], base=[], qp=new URLSearchParams(location.search);
  var st={cat:qp.get('cat')||'',sub:qp.get('sub')||'',brands:(qp.get('brand')||'').split('|').filter(Boolean),price:qp.get('price')||'',stock:qp.get('stock')==='1',sort:qp.get('sort')||'featured',q:qp.get('q')||''};
  var BUCKETS={u250:[0,25000],b1k:[25000,100000],b5k:[100000,500000],o5k:[500000,1e12]};

  function featured(a,b){ return (b.a-a.a)||((!!b.i)-(!!a.i))||(a.q-b.q)||((b.c>b.p)-(a.c>a.p))||(b.d-a.d); }
  var SORTS={
    featured:featured,
    'price-asc':function(a,b){ return (a.q-b.q)||(a.p-b.p); },
    'price-desc':function(a,b){ return (a.q-b.q)||(b.p-a.p); },
    newest:function(a,b){ return b.d-a.d; },
    az:function(a,b){ return a.t.localeCompare(b.t); }
  };
  function sync(){
    var p=new URLSearchParams();
    if(qp.get('goal')) p.set('goal',qp.get('goal'));
    if(st.q) p.set('q',st.q); if(st.cat) p.set('cat',st.cat); if(st.sub) p.set('sub',st.sub); if(st.brands.length) p.set('brand',st.brands.join('|'));
    if(st.price) p.set('price',st.price); if(st.stock) p.set('stock','1'); if(st.sort!=='featured') p.set('sort',st.sort);
    var s=p.toString(); history.replaceState(null,'',location.pathname+(s?'?'+s:''));
  }
  function passPrice(p){
    if(!st.price) return true; if(st.price==='quote') return !!p.q; if(p.q) return false;
    var b=BUCKETS[st.price]; return p.p>=b[0]&&p.p<b[1];
  }
  function filtered(skip){
    return base.filter(function(p){
      if(st.sub&&(p.s||[]).indexOf(st.sub)<0) return false;
      if(st.cat&&(p.k||[]).indexOf(st.cat)<0) return false;
      if(st.stock&&!p.a) return false;
      if(skip!=='brand'&&st.brands.length&&st.brands.indexOf(p.b||'Other')<0) return false;
      if(skip!=='price'&&!passPrice(p)) return false;
      return true;
    });
  }
  function renderBrands(){
    var pool=filtered('brand'), counts={};
    pool.forEach(function(p){ var b=p.b||'Other'; counts[b]=(counts[b]||0)+1; });
    st.brands.forEach(function(b){ if(!counts[b]) counts[b]=0; });
    var names=Object.keys(counts).sort(function(a,b){ return a==='Other'?1:b==='Other'?-1:a.localeCompare(b); });
    brandBox.innerHTML=names.map(function(b){
      return '<label class="fopt"><input type="checkbox" value="'+DM.esc(b)+'"'+(st.brands.indexOf(b)>-1?' checked':'')+'><span>'+DM.esc(b)+'</span><span class="n num">'+counts[b]+'</span></label>';
    }).join('');
  }
  function render(reset){
    if(reset) shown=PAGE;
    var list=filtered().sort(SORTS[st.sort]||featured);
    var n=list.length;
    countEl.textContent=n.toLocaleString('en-CA')+(n===1?' product':' products');
    if(!n){ var R=DM.ROOT; grid.innerHTML='<div class="empty2" style="grid-column:1/-1"><span class="empty2__ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5M8 10.5h5"/></svg></span><h2 class="h2">No matches'+(st.q?' for “'+DM.esc(st.q)+'”':'')+'.</h2><p class="lede">'+(st.brands.length||st.price||st.stock||st.cat?'Try removing a filter, or ':'Check the spelling, or ')+'try one of these.</p><div class="empty2__chips">'+['Spin bikes|spin bike','Treadmills|treadmill','Refurbished|refurbished','Dumbbells|dumbbell','Stages parts|stages parts'].map(function(x){ x=x.split('|'); return '<a class="chip" href="'+R+'search.html?q='+encodeURIComponent(x[1])+'">'+x[0]+'</a>'; }).join('')+'</div><p class="empty2__help">Can’t find it? <a href="'+R+'contact.html">Ask our team</a> or call <a href="tel:+19052723663">905-272-3663</a>.</p></div>'; moreWrap.hidden=true; }
    else {
      grid.innerHTML=list.slice(0,shown).map(function(p){ return DM.card(p); }).join('');
      DM.lazy(grid);
      moreWrap.hidden=n<=shown; progress.textContent='Showing '+Math.min(shown,n)+' of '+n.toLocaleString('en-CA');
    }
    renderBrands(); sync();
    var fc=d.getElementById('fcount'); if(fc){ var k=st.brands.length+(st.price?1:0)+(st.stock?1:0); fc.textContent=k?'('+k+')':''; }
    var sb=d.getElementById('show-btn'); if(sb) sb.textContent='Show '+n.toLocaleString('en-CA')+' results';
  }

  // wiring
  d.querySelectorAll('[data-sub]').forEach(function(c){
    c.setAttribute('aria-pressed',String(c.getAttribute('data-sub')===st.sub));
    c.addEventListener('click',function(){ st.sub=c.getAttribute('data-sub'); d.querySelectorAll('[data-sub]').forEach(function(x){ x.setAttribute('aria-pressed',String(x===c)); }); render(true); });
  });
  d.querySelectorAll('[data-cat]').forEach(function(c){
    c.setAttribute('aria-pressed',String(c.getAttribute('data-cat')===st.cat));
    c.addEventListener('click',function(){ st.cat=c.getAttribute('data-cat'); d.querySelectorAll('[data-cat]').forEach(function(x){ x.setAttribute('aria-pressed',String(x===c)); }); render(true); });
  });
  brandBox.addEventListener('change',function(e){ var v=e.target.value; var i=st.brands.indexOf(v); if(e.target.checked&&i<0) st.brands.push(v); if(!e.target.checked&&i>-1) st.brands.splice(i,1); render(true); });
  d.querySelectorAll('input[name=price]').forEach(function(r){ r.checked=r.value===st.price; r.addEventListener('change',function(){ st.price=r.value; render(true); }); });
  stockIn.checked=st.stock; stockIn.addEventListener('change',function(){ st.stock=stockIn.checked; render(true); });
  sortSel.value=st.sort; sortSel.addEventListener('change',function(){ st.sort=sortSel.value; render(true); });
  more.addEventListener('click',function(){ shown+=PAGE; render(false); });
  d.querySelectorAll('[data-clear]').forEach(function(b){ b.addEventListener('click',function(){ st.brands=[]; st.price=''; st.stock=false; stockIn.checked=false; d.querySelectorAll('input[name=price]').forEach(function(r){ r.checked=r.value===''; }); render(true); }); });
  var fl=d.getElementById('filters');
  d.querySelectorAll('[data-open-filters]').forEach(function(b){ b.addEventListener('click',function(){ fl.classList.add('is-open'); document.documentElement.style.overflow='hidden'; }); });
  d.querySelectorAll('[data-close-filters]').forEach(function(b){ b.addEventListener('click',function(){ fl.classList.remove('is-open'); document.documentElement.style.overflow=''; }); });

  var sq=d.getElementById('page-q');
  DM.catalog().then(function(list){
    all=list;
    var goal=qp.get('goal');
    if(goal) all=all.filter(function(p){ return (p.g||[]).indexOf(goal)>-1; });
    if(cfg.cat) base=all.filter(function(p){ return (p.k||[]).indexOf(cfg.cat)>-1; });
    else base=st.q?DM.search(all,st.q):all.slice();
    if(!cfg.cat&&st.q&&st.sort==='featured'){ var order=new Map(base.map(function(p,i){return [p,i];})); SORTS.featured=function(a,b){ return order.get(a)-order.get(b); }; }
    render(true);
  });
  if(sq){
    sq.value=st.q;
    var clr=d.querySelector('[data-clear-q]'), sg=d.getElementById('sugg'), SG=window.DM_SUGG||{cats:[],logos:{}}, act=-1, t;
    function setQ(v){
      st.q=v; var o=d.getElementById('q-echo'); if(o) o.textContent=st.q?'“'+st.q+'”':'Find your equipment.';
      base=st.q?DM.search(all,st.q):all.slice(); var order=new Map(base.map(function(p,i){return [p,i];})); SORTS.featured=st.q?function(a,b){return order.get(a)-order.get(b);}:featured; render(true);
    }
    function close(){ if(!sg) return; sg.hidden=true; sq.setAttribute('aria-expanded','false'); act=-1; }
    function suggest(){
      if(!sg) return; var q=sq.value.trim(); if(clr) clr.hidden=!q;
      if(!q||!all.length){ close(); return; }
      var nq=q.toLowerCase(), R=DM.ROOT;
      var prods=DM.search(all,q).slice(0,6);
      var cats=SG.cats.filter(function(c){ return c.l.toLowerCase().indexOf(nq)>-1||nq.split(' ').some(function(w){ return w.length>2&&c.l.toLowerCase().indexOf(w.replace(/s$/,''))>-1; }); }).slice(0,4);
      var bc={}; all.forEach(function(p){ if(p.b&&p.b.toLowerCase().indexOf(nq)>-1) bc[p.b]=(bc[p.b]||0)+1; });
      if(!Object.keys(bc).length) all.forEach(function(p){ if(p.b&&nq.split(' ').some(function(w){ return w.length>2&&p.b.toLowerCase().indexOf(w)===0; })) bc[p.b]=(bc[p.b]||0)+1; });
      var brands=Object.keys(bc).sort(function(a,b){ return bc[b]-bc[a]; }).slice(0,3);
      var h='';
      if(prods.length) h+='<div class="sugg__grp"><p class="sugg__h">Products</p>'+prods.map(function(p){ return '<a class="sugg__p" role="option" href="'+R+'p/'+p.h+'.html"><span class="sugg__th">'+(p.i?'<img src="'+(p.L?DM.loc(p.L,120):DM.sized(p.i,120))+'" alt="" loading="lazy" decoding="async">':'')+'</span><span class="sugg__t"><b>'+DM.esc(p.t)+'</b><span class="price">'+(p.q?'Price on request':(p.m?'From ':'')+DM.money(p.p))+(p.a?'':' · Sold out')+'</span></span></a>'; }).join('')+'</div>';
      var side='';
      if(cats.length) side+='<div class="sugg__grp"><p class="sugg__h">Categories</p>'+cats.map(function(c){ return '<a class="sugg__l" role="option" href="'+R+c.u+'"><span>'+DM.esc(c.l)+(c.c?' <i>'+DM.esc(c.c)+'</i>':'')+'</span><span class="num">'+c.n+'</span></a>'; }).join('')+'</div>';
      if(brands.length) side+='<div class="sugg__grp"><p class="sugg__h">Brands</p>'+brands.map(function(b){ var lg=SG.logos[b]; return '<a class="sugg__l sugg__b" role="option" href="'+R+'search.html?brand='+encodeURIComponent(b)+'">'+(lg?'<span class="sugg__logo"><img src="'+R+lg+'" alt="'+DM.esc(b)+'"></span>':'<span>'+DM.esc(b)+'</span>')+'<span class="num">'+bc[b]+'</span></a>'; }).join('')+'</div>';
      if(!h&&!side){ h='<p class="sugg__none">No matches for “'+DM.esc(q)+'”.</p>'; }
      sg.innerHTML='<div class="sugg__cols">'+(h?'<div>'+h+'</div>':'')+(side?'<div class="sugg__side">'+side+'</div>':'')+'</div><button type="button" class="sugg__all" data-see-all>See all '+DM.search(all,q).length.toLocaleString('en-CA')+' results</button>';
      sg.hidden=false; sq.setAttribute('aria-expanded','true'); act=-1;
      var sa=sg.querySelector('[data-see-all]'); if(sa) sa.addEventListener('click',function(){ close(); var r=d.getElementById('results'); if(r) r.scrollIntoView({behavior:'smooth'}); });
    }
    sq.addEventListener('input',function(){ clearTimeout(t); suggest(); t=setTimeout(function(){ setQ(sq.value.trim()); },150); });
    sq.addEventListener('focus',function(){ if(sq.value.trim()) suggest(); });
    sq.addEventListener('keydown',function(e){
      var links=sg?sg.querySelectorAll('a'):[];
      if((e.key==='ArrowDown'||e.key==='ArrowUp')&&links.length){ e.preventDefault(); act=(act+(e.key==='ArrowDown'?1:-1)+links.length)%links.length; links.forEach(function(l,i){ l.classList.toggle('is-active',i===act); }); }
      else if(e.key==='Enter'){ e.preventDefault(); if(act>-1&&links[act]){ location.href=links[act].href; return; } close(); setQ(sq.value.trim()); sq.blur(); var r=d.getElementById('results'); if(r) r.scrollIntoView({behavior:'smooth'}); }
      else if(e.key==='Escape') close();
    });
    d.addEventListener('click',function(e){ if(sg&&!e.target.closest('[data-suggest]')) close(); });
    if(clr){ clr.hidden=!st.q; clr.addEventListener('click',function(){ sq.value=''; clr.hidden=true; close(); setQ(''); sq.focus(); }); }
    d.querySelectorAll('.shero__pop [data-q]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); sq.value=a.getAttribute('data-q'); if(clr) clr.hidden=false; close(); setQ(sq.value); var r=d.getElementById('results'); if(r) r.scrollIntoView({behavior:'smooth'}); }); });
  }
})();
