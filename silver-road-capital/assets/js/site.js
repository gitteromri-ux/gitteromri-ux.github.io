(function(){
  var d=document,root=d.documentElement;root.classList.remove('no-js');
  var head=d.querySelector('.site-head'),road=d.querySelector('.road');
  function onScroll(){var y=scrollY;head.classList.toggle('stuck',y>40);
    if(road){var h=d.documentElement.scrollHeight-innerHeight;road.style.setProperty('--p',h>0?Math.min(1,y/h):0);}}
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  var burger=d.querySelector('.burger');
  if(burger){burger.addEventListener('click',function(){var o=root.classList.toggle('menu-open');burger.setAttribute('aria-expanded',o);d.body.style.overflow=o?'hidden':'';});
    d.querySelectorAll('.nav a').forEach(function(a){a.addEventListener('click',function(){root.classList.remove('menu-open');d.body.style.overflow='';});});}

  // reveal + counters
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;el.classList.add('in');io.unobserve(el);
    el.querySelectorAll('[data-count]').forEach(count);if(el.hasAttribute('data-count'))count(el);});},{threshold:0,rootMargin:'0px 0px -12% 0px'});
  d.querySelectorAll('.rv').forEach(function(el){io.observe(el);});
  function count(el){var to=parseFloat(el.dataset.count),dec=(el.dataset.count.split('.')[1]||'').length,t0=null,dur=2000;
    if(matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=to.toFixed(dec);return;}
    function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);el.textContent=(to*e).toFixed(dec);if(p<1)requestAnimationFrame(step);else el.textContent=to.toFixed(dec);}
    requestAnimationFrame(step);}

  // cities <-> globe
  var cities=[].slice.call(d.querySelectorAll('.city'));
  function setCity(c){cities.forEach(function(x){x.classList.toggle('on',x===c);});dispatchEvent(new CustomEvent('srg:focus',{detail:c?c.dataset.city:null}));}
  cities.forEach(function(c){c.addEventListener('pointerenter',function(){setCity(c);});c.addEventListener('focus',function(){setCity(c);});c.addEventListener('click',function(){setCity(c);});});
  var cw=d.querySelector('.cities');if(cw)cw.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')setCity(null);});

  // activities stage
  var acts=[].slice.call(d.querySelectorAll('.act-list a')),imgs=[].slice.call(d.querySelectorAll('.acts .showcase img'));
  function setAct(i){acts.forEach(function(a,k){a.classList.toggle('on',k===i);});imgs.forEach(function(m,k){m.classList.toggle('on',k===i);});}
  acts.forEach(function(a,i){a.addEventListener('pointerenter',function(){setAct(i);});a.addEventListener('focus',function(){setAct(i);});});
  if(acts.length&&imgs.length){setAct(0);var ai=0,hov=false,list=d.querySelector('.act-list');
    list.addEventListener('pointerenter',function(){hov=true;});list.addEventListener('pointerleave',function(){hov=false;});
    setInterval(function(){if(hov||d.hidden)return;ai=(acts.findIndex(function(a){return a.classList.contains('on');})+1)%acts.length;setAct(ai);},3200);}

  // bios
  d.querySelectorAll('[data-bio]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();var dl=d.getElementById('bio-'+b.dataset.bio);if(dl&&dl.showModal)dl.showModal();});});
  d.querySelectorAll('dialog.bio').forEach(function(dl){dl.addEventListener('click',function(e){if(e.target===dl||e.target.closest('.bio-close'))dl.close();});});

  // contact form -> opens the visitor's mail app addressed to the firm
  d.querySelectorAll('form.form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var lines=[];
    [].forEach.call(f.elements,function(el){if(!el.name||el.type==='checkbox'||el.type==='submit')return;lines.push((el.dataset.label||el.name)+': '+el.value);});
    location.href='mailto:'+(f.dataset.to||'info@silverroadcapital.com')+'?subject='+encodeURIComponent('Contact from the site')+'&body='+encodeURIComponent(lines.join('\n'));});});

  var calm=matchMedia('(prefers-reduced-motion:reduce)').matches,big=innerWidth*(devicePixelRatio||1)>2200;
  function load(v){if(v.dataset.done)return;v.dataset.done=1;v.src=(big&&v.dataset.uhd)?v.dataset.uhd:v.dataset.hd;}
  function play(v){load(v);if(calm)return;var p=v.play();if(p&&p.catch)p.catch(function(){});}
  // motion footage: load when near the screen, UHD on large screens, HD on phones
  var vio=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){play(v);var c=v.closest('.city');if(c)c.classList.add('play');}else if(v.dataset.done)v.pause();});},{rootMargin:'300px'});
  d.querySelectorAll('video[data-hd]').forEach(function(v){vio.observe(v);});
  // home hero: crossfade between the films
  var hv=[].slice.call(d.querySelectorAll('.hero video'));
  if(hv.length){var hi=0;hv[0].classList.add('on');if(hv.length>1&&!calm)setInterval(function(){hv[hi].classList.remove('on');hi=(hi+1)%hv.length;play(hv[hi]);hv[hi].classList.add('on');},9000);}
})();
