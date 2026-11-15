(function(){
  var d=document,root=d.documentElement;root.classList.remove('no-js');
  var head=d.querySelector('.site-head');
  function onScroll(){head.classList.toggle('stuck',scrollY>40);}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  var burger=d.querySelector('.burger');
  if(burger){burger.addEventListener('click',function(){var o=root.classList.toggle('menu-open');burger.setAttribute('aria-expanded',o);d.body.style.overflow=o?'hidden':'';});
    d.querySelectorAll('.nav a').forEach(function(a){a.addEventListener('click',function(){root.classList.remove('menu-open');d.body.style.overflow='';});});}
  var calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function count(el){var to=parseFloat(el.dataset.count),dec=(el.dataset.count.split('.')[1]||'').length,t0=null,dur=1600;
    if(calm){el.textContent=to.toFixed(dec);return;}
    function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);el.textContent=(to*e).toFixed(dec);if(p<1)requestAnimationFrame(step);else el.textContent=to.toFixed(dec);}
    requestAnimationFrame(step);}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;el.classList.add('in');io.unobserve(el);
    el.querySelectorAll('[data-count]').forEach(count);});},{threshold:0,rootMargin:'0px 0px -10% 0px'});
  d.querySelectorAll('.rv').forEach(function(el){io.observe(el);});
  // activities: the photograph follows the line being read
  var acts=[].slice.call(d.querySelectorAll('.act-list a')),imgs=[].slice.call(d.querySelectorAll('.frame img'));
  function setAct(i){acts.forEach(function(a,k){a.classList.toggle('on',k===i);});imgs.forEach(function(m,k){m.classList.toggle('on',k===i);});}
  if(imgs.length){setAct(0);acts.forEach(function(a,i){a.addEventListener('pointerenter',function(){setAct(i);});a.addEventListener('focus',function(){setAct(i);});});}
  // bios
  d.querySelectorAll('[data-bio]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();var dl=d.getElementById('bio-'+b.dataset.bio);if(dl&&dl.showModal)dl.showModal();});});
  d.querySelectorAll('dialog.bio').forEach(function(dl){dl.addEventListener('click',function(e){if(e.target===dl||e.target.closest('.bio-close'))dl.close();});});
  // contact forms open the visitor's mail app addressed to the firm
  d.querySelectorAll('form.form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var lines=[];
    [].forEach.call(f.elements,function(el){if(!el.name||el.type==='checkbox'||el.type==='submit')return;lines.push((el.dataset.label||el.name)+': '+el.value);});
    location.href='mailto:'+(f.dataset.to||'info@silverroadcapital.com')+'?subject='+encodeURIComponent('Contact from the site')+'&body='+encodeURIComponent(lines.join('\n'));});});
  var hv=d.querySelector('.hero4 video');if(hv&&calm){hv.removeAttribute('autoplay');hv.pause();}
})();
