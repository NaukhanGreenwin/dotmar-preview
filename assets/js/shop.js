/* Dotmar preview — category + search results engine */
(function(){
  'use strict';
  var DM=window.DM, cfg=window.DM_SHOP||{}, d=document;
  var grid=d.getElementById('grid'), countEl=d.getElementById('count'), more=d.getElementById('more'), moreWrap=d.getElementById('more-wrap'), progress=d.getElementById('progress');
  var brandBox=d.getElementById('f-brands'), sortSel=d.getElementById('sort'), stockIn=d.getElementById('f-stock');
  var bSearch=d.getElementById('f-bsearch'), bMore=d.getElementById('f-bmore'), achips=d.getElementById('achips'), fl=d.getElementById('filters'), bg=d.getElementById('fsheet-bg');
  var PAGE=24, shown=PAGE, all=[], base=[], qp=new URLSearchParams(location.search), bq='', bAll=false, BMAX=8, acts=[];
  var st={cat:qp.get('cat')||'',sub:qp.get('sub')||'',brands:(qp.get('brand')||'').split('|').filter(Boolean),price:qp.get('price')||'',stock:qp.get('stock')==='1',sort:qp.get('sort')||'featured',q:qp.get('q')||''};
  var BUCKETS={u250:[0,25000],b1k:[25000,100000],b5k:[100000,500000],o5k:[500000,1e12]};
  var PRICE_L={u250:'Under $250',b1k:'$250 – $1,000',b5k:'$1,000 – $5,000',o5k:'$5,000+',quote:'Price on request'};
  var CHK='<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  var XS='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>';

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
  function passPrice(p,k){
    if(k===undefined) k=st.price;
    if(!k) return true; if(k==='quote') return !!p.q; if(p.q) return false;
    var b=BUCKETS[k]; return !!b&&p.p>=b[0]&&p.p<b[1];
  }
  function filtered(skip){
    return base.filter(function(p){
      if(st.sub&&(p.s||[]).indexOf(st.sub)<0) return false;
      if(st.cat&&(p.k||[]).indexOf(st.cat)<0) return false;
      if(skip!=='stock'&&st.stock&&!p.a) return false;
      if(skip!=='brand'&&st.brands.length&&st.brands.indexOf(p.b||'Other')<0) return false;
      if(skip!=='price'&&!passPrice(p)) return false;
      return true;
    });
  }
  function setV(k,t){ var e=d.getElementById('fv-'+k); if(e) e.textContent=t; }
  function chipLabel(attr,v){ var e=d.querySelector('.fchip['+attr+'="'+v+'"] span'); return e?e.textContent:v; }
  function renderBrands(){
    var pool=filtered('brand'), counts={};
    pool.forEach(function(p){ var b=p.b||'Other'; counts[b]=(counts[b]||0)+1; });
    st.brands.forEach(function(b){ if(!counts[b]) counts[b]=0; });
    var names=Object.keys(counts).sort(function(a,b){ return a==='Other'?1:b==='Other'?-1:(counts[b]-counts[a])||a.localeCompare(b); });
    var total=names.length, q=bq.trim().toLowerCase();
    var vis=q?names.filter(function(n){ return n.toLowerCase().indexOf(q)>-1; }):names;
    var collapse=!q&&!bAll&&vis.length>BMAX+2;
    if(collapse){ var top=vis.slice(0,BMAX); vis.slice(BMAX).forEach(function(n){ if(st.brands.indexOf(n)>-1) top.push(n); }); vis=top; }
    brandBox.innerHTML=vis.length?vis.map(function(b){
      var on=st.brands.indexOf(b)>-1;
      return '<label class="fbr'+(counts[b]||on?'':' is-zero')+'"><input type="checkbox" value="'+DM.esc(b)+'"'+(on?' checked':'')+'><span class="fbox">'+CHK+'</span><span class="fbr__t">'+DM.esc(b)+'</span><span class="fbr__n num">'+counts[b]+'</span></label>';
    }).join(''):'<p class="fnone">No brands match “'+DM.esc(bq.trim())+'”.</p>';
    var sw=d.getElementById('f-bsearch-wrap'); if(sw) sw.hidden=total<=BMAX+2;
    if(bMore){ bMore.hidden=!!q||total<=BMAX+2; bMore.textContent=bAll?'Show fewer':'Show all '+total+' brands'; bMore.setAttribute('aria-expanded',String(bAll)); }
    setV('brand',st.brands.length?(st.brands.length===1?st.brands[0]:st.brands.length+' selected'):'All');
  }
  function renderPrice(){
    var pool=filtered('price');
    d.querySelectorAll('[data-fprice]').forEach(function(b){
      var k=b.getAttribute('data-fprice'), n=k?pool.filter(function(p){ return passPrice(p,k); }).length:pool.length, on=k===st.price;
      b.setAttribute('aria-pressed',String(on)); b.querySelector('.n').textContent=n.toLocaleString('en-CA'); b.disabled=!n&&!on;
    });
    setV('price',st.price?PRICE_L[st.price]||st.price:'Any');
  }
  function renderActive(){
    acts=[];
    if(st.sub) acts.push([chipLabel('data-sub',st.sub),function(){ setSub(''); }]);
    if(st.cat) acts.push([chipLabel('data-cat',st.cat),function(){ setCat(''); }]);
    if(st.price) acts.push([PRICE_L[st.price]||st.price,function(){ st.price=''; }]);
    st.brands.forEach(function(b){ acts.push([b,function(){ var i=st.brands.indexOf(b); if(i>-1) st.brands.splice(i,1); }]); });
    if(st.stock) acts.push(['In stock',function(){ st.stock=false; stockIn.checked=false; }]);
    if(achips){
      achips.hidden=!acts.length;
      achips.innerHTML=acts.map(function(a,i){ return '<button type="button" class="achip" data-rm="'+i+'" aria-label="Remove filter: '+DM.esc(a[0])+'"><span>'+DM.esc(a[0])+'</span>'+XS+'</button>'; }).join('')+(acts.length>1?'<button type="button" class="achip-clear" data-clear>Clear all</button>':'');
    }
    var k=acts.length, fc=d.getElementById('fcount'); if(fc) fc.textContent=k?String(k):'';
    d.querySelectorAll('.fs-clear').forEach(function(b){ b.disabled=!k; });
    setV('stock',st.stock?'In stock':'All');
    setV('type',st.sub?chipLabel('data-sub',st.sub):st.cat?chipLabel('data-cat',st.cat):'All');
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
    renderBrands(); renderPrice(); renderActive(); sync();
    var sb=d.getElementById('show-btn'); if(sb) sb.textContent=n?'Show '+n.toLocaleString('en-CA')+(n===1?' product':' products'):'No matching products';
    fit();
  }
  function fit(){ if(!fl) return; if(innerWidth<=1068){ fl.classList.remove('is-tall'); return; } fl.classList.toggle('is-tall',fl.offsetHeight>innerHeight-180); }

  // wiring
  function press(attr,v){ d.querySelectorAll('['+attr+']').forEach(function(x){ x.setAttribute('aria-pressed',String(x.getAttribute(attr)===v)); }); }
  function setSub(v){ st.sub=v; press('data-sub',v); }
  function setCat(v){ st.cat=v; press('data-cat',v); }
  press('data-sub',st.sub); press('data-cat',st.cat);
  d.querySelectorAll('[data-sub]').forEach(function(c){ c.addEventListener('click',function(){ setSub(c.getAttribute('data-sub')); render(true); }); });
  d.querySelectorAll('[data-cat]').forEach(function(c){ c.addEventListener('click',function(){ setCat(c.getAttribute('data-cat')); render(true); }); });
  brandBox.addEventListener('change',function(e){ var v=e.target.value; var i=st.brands.indexOf(v); if(e.target.checked&&i<0) st.brands.push(v); if(!e.target.checked&&i>-1) st.brands.splice(i,1); render(true); });
  if(bSearch) bSearch.addEventListener('input',function(){ bq=bSearch.value; renderBrands(); fit(); });
  if(bMore) bMore.addEventListener('click',function(){ bAll=!bAll; renderBrands(); fit(); });
  d.querySelectorAll('[data-fprice]').forEach(function(b){ b.addEventListener('click',function(){ var k=b.getAttribute('data-fprice'); st.price=(k===st.price)?'':k; render(true); }); });
  stockIn.checked=st.stock; stockIn.addEventListener('change',function(){ st.stock=stockIn.checked; render(true); });
  var sortV=d.getElementById('sort-v');
  function sortLabel(){ if(sortV) sortV.textContent=sortSel.options[sortSel.selectedIndex].text; }
  sortSel.value=st.sort; if(sortSel.selectedIndex<0){ st.sort='featured'; sortSel.value='featured'; } sortLabel();
  sortSel.addEventListener('change',function(){ st.sort=sortSel.value; sortLabel(); render(true); });
  more.addEventListener('click',function(){ shown+=PAGE; render(false); });
  function clearAll(){ st.brands=[]; st.price=''; st.stock=false; stockIn.checked=false; setSub(''); setCat(''); bq=''; if(bSearch) bSearch.value=''; render(true); }
  d.addEventListener('click',function(e){
    var c=e.target.closest('[data-clear]'); if(c){ clearAll(); return; }
    var r=e.target.closest('[data-rm]'); if(r&&acts[+r.getAttribute('data-rm')]){ acts[+r.getAttribute('data-rm')][1](); render(true); }
  });
  // bottom sheet
  var lastF=null, html=d.documentElement;
  function openF(){ if(innerWidth>1068) return; lastF=d.activeElement; fl.classList.add('is-open'); if(bg) bg.classList.add('is-on'); html.classList.add('fs-lock'); fl.setAttribute('role','dialog'); fl.setAttribute('aria-modal','true'); setTimeout(function(){ var x=fl.querySelector('.fs-x'); if(x) x.focus({preventScroll:true}); },60); }
  function closeF(){ if(!fl.classList.contains('is-open')) return; fl.classList.remove('is-open','is-drag'); fl.style.transform=''; if(bg){ bg.classList.remove('is-on'); bg.style.opacity=''; } html.classList.remove('fs-lock'); fl.removeAttribute('role'); fl.removeAttribute('aria-modal'); if(lastF&&lastF.focus) lastF.focus({preventScroll:true}); }
  d.querySelectorAll('[data-open-filters]').forEach(function(b){ b.addEventListener('click',openF); });
  d.querySelectorAll('[data-close-filters]').forEach(function(b){ b.addEventListener('click',closeF); });
  d.addEventListener('keydown',function(e){ if(e.key==='Escape'&&fl.classList.contains('is-open')) closeF(); });
  addEventListener('resize',function(){ if(innerWidth>1068) closeF(); fit(); });
  var hd=d.getElementById('fs-head'), y0=null, dy=0;
  if(hd){
    hd.addEventListener('touchstart',function(e){ if(e.target.closest('button')) return; y0=e.touches[0].clientY; dy=0; fl.classList.add('is-drag'); },{passive:true});
    hd.addEventListener('touchmove',function(e){ if(y0===null) return; dy=Math.max(0,e.touches[0].clientY-y0); fl.style.transform='translateY('+dy+'px)'; if(bg) bg.style.opacity=String(Math.max(0,1-dy/400)); },{passive:true});
    hd.addEventListener('touchend',function(){ if(y0===null) return; y0=null; fl.classList.remove('is-drag'); if(dy>90) closeF(); else { fl.style.transform=''; if(bg) bg.style.opacity=''; } });
  }

  var sq=d.getElementById('page-q');
  DM.catalog().then(function(list){
    all=list;
    var goal=qp.get('goal');
    if(goal) all=all.filter(function(p){ return (p.g||[]).indexOf(goal)>-1; });
    if(cfg.cat) base=all.filter(function(p){ return (p.k||[]).indexOf(cfg.cat)>-1; });
    else base=st.q?DM.search(all,st.q):all.slice();
    /* ignore unknown / foreign URL params instead of showing an empty page with a raw chip */
    if(st.price&&!PRICE_L[st.price]) st.price='';
    if(st.sub&&!base.some(function(p){ return (p.s||[]).indexOf(st.sub)>-1; })) st.sub='';
    if(st.cat&&!base.some(function(p){ return (p.k||[]).indexOf(st.cat)>-1; })) st.cat='';
    if(st.brands.length){ st.brands=st.brands.filter(function(b){ return base.some(function(p){ return p.b===b; }); }); }
    if(typeof setSub==='function'&&!st.sub) try{ setSub(''); }catch(e){}
    if(typeof setCat==='function'&&!st.cat) try{ setCat(''); }catch(e){}
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
