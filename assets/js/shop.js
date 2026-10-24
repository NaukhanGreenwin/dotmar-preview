/* Dotmar preview — category + search results engine */
(function(){
  'use strict';
  var DM=window.DM, cfg=window.DM_SHOP||{}, d=document;
  var grid=d.getElementById('grid'), countEl=d.getElementById('count'), more=d.getElementById('more'), moreWrap=d.getElementById('more-wrap'), progress=d.getElementById('progress');
  var brandBox=d.getElementById('f-brands'), sortSel=d.getElementById('sort'), stockIn=d.getElementById('f-stock');
  var PAGE=24, shown=PAGE, all=[], base=[], qp=new URLSearchParams(location.search);
  var st={sub:qp.get('sub')||'',brands:(qp.get('brand')||'').split('|').filter(Boolean),price:qp.get('price')||'',stock:qp.get('stock')==='1',sort:qp.get('sort')||'featured',q:qp.get('q')||''};
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
    if(st.q) p.set('q',st.q); if(st.sub) p.set('sub',st.sub); if(st.brands.length) p.set('brand',st.brands.join('|'));
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
    if(!n){ grid.innerHTML='<div class="empty" style="grid-column:1/-1"><p class="h3" style="color:var(--ink)">No matches.</p><p>Try removing a filter'+(st.q?' or searching a broader term':'')+'.</p></div>'; moreWrap.hidden=true; }
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
    if(cfg.cat) base=all.filter(function(p){ return (p.k||[]).indexOf(cfg.cat)>-1; });
    else base=st.q?DM.search(all,st.q):all.slice();
    if(!cfg.cat&&st.q&&st.sort==='featured'){ var order=new Map(base.map(function(p,i){return [p,i];})); SORTS.featured=function(a,b){ return order.get(a)-order.get(b); }; }
    render(true);
  });
  if(sq){ sq.value=st.q; var t; sq.addEventListener('input',function(){ clearTimeout(t); t=setTimeout(function(){ st.q=sq.value.trim(); var o=d.getElementById('q-echo'); if(o) o.textContent=st.q?'“'+st.q+'”':'All products'; base=st.q?DM.search(all,st.q):all.slice(); var order=new Map(base.map(function(p,i){return [p,i];})); SORTS.featured=st.q?function(a,b){return order.get(a)-order.get(b);}:featured; render(true); },150); }); }
})();
