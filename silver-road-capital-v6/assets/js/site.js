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
  // activities: one panel open at a time
  var pns=[].slice.call(d.querySelectorAll('.pn')),wide=matchMedia('(min-width:861px)'),touch=matchMedia('(hover:none)');
  function open(i){pns.forEach(function(p,k){p.classList.toggle('on',k===i);});}
  if(pns.length){open(0);pns.forEach(function(p,i){p.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')open(i);});p.addEventListener('focus',function(){open(i);});
    p.addEventListener('click',function(e){if(wide.matches&&touch.matches&&!p.classList.contains('on')){e.preventDefault();open(i);}});});}
  // bios
  d.querySelectorAll('[data-bio]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();var dl=d.getElementById('bio-'+b.dataset.bio);if(dl&&dl.showModal)dl.showModal();});});
  d.querySelectorAll('dialog.bio').forEach(function(dl){dl.addEventListener('click',function(e){if(e.target===dl||e.target.closest('.bio-close'))dl.close();});});
  // contact forms open the visitor's mail app addressed to the firm
  d.querySelectorAll('form.form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var lines=[];
    [].forEach.call(f.elements,function(el){if(!el.name||el.type==='checkbox'||el.type==='submit')return;lines.push((el.dataset.label||el.name)+': '+el.value);});
    location.href='mailto:'+(f.dataset.to||'info@silverroadcapital.com')+'?subject='+encodeURIComponent('Contact from the site')+'&body='+encodeURIComponent(lines.join('\n'));});});
  // hero: the firm's eight paths running to one horizon, in light
  var cv=d.querySelector('.paths');
  if(cv){var hero=cv.parentNode,ctx=cv.getContext('2d'),W,H,DPR,vp,tx=0,ty=0,cx=0,cy=0,t0=null,vis=true,N=8,vid=hero.querySelector('video');
    function size(){DPR=Math.min(devicePixelRatio||1,2);W=hero.clientWidth;H=hero.clientHeight;cv.width=W*DPR;cv.height=H*DPR;}
    function pt(i,t,off){var bx=vp.x+((i-(N-1)/2)/((N-1)/2))*W*(W>860?.78:1.15)+off*t,by=H+30;return [vp.x+(bx-vp.x)*t,vp.y+(by-vp.y)*t];}
    function quad(i,a,b,w){var p1=pt(i,a,-w),p2=pt(i,a,w),p3=pt(i,b,w),p4=pt(i,b,-w);ctx.beginPath();ctx.moveTo(p1[0],p1[1]);ctx.lineTo(p2[0],p2[1]);ctx.lineTo(p3[0],p3[1]);ctx.lineTo(p4[0],p4[1]);ctx.closePath();}
    function frame(ts){if(!t0)t0=ts;var T=(ts-t0)/1000;cx+=(tx-cx)*.05;cy+=(ty-cy)*.05;
      vp={x:W*(W>860?.67:.5)+cx*26,y:H*(W>860?.5:.36)+cy*12};
      ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
      var wN=W>860?W*.02:W*.045;
      for(var i=0;i<N;i++){var p=calm?1:Math.max(0,Math.min(1,(T-.25-i*.09)/1.3));p=1-Math.pow(1-p,3);if(p<=0)continue;
        var a=1-p,g=ctx.createLinearGradient(vp.x,vp.y,vp.x,H);g.addColorStop(0,'rgba(210,232,250,.9)');g.addColorStop(.35,'rgba(160,205,240,.34)');g.addColorStop(1,'rgba(120,180,230,.05)');
        quad(i,Math.max(a,.004),1,wN);ctx.fillStyle=g;ctx.fill();
        if(calm)continue;
        for(var k=0;k<2;k++){var sph=((T*.16+i*.37+k*.5)%1),t=Math.pow(1-sph,2.4),t2=Math.min(1,t*1.22+.004),al=Math.sin(Math.PI*sph)*p;
          if(t<a)continue;ctx.save();ctx.shadowColor=(i%3===1)?'rgba(234,185,81,.95)':'rgba(37,178,231,.95)';ctx.shadowBlur=22;quad(i,t,t2,wN*.9);ctx.fillStyle=(i%3===1)?'rgba(255,226,160,'+(.85*al)+')':'rgba(225,244,255,'+(.85*al)+')';ctx.fill();ctx.restore();}}
      var gl=calm?1:Math.max(0,Math.min(1,(T-1.3)/1.4)),R=W>860?W*.085:W*.2;
      if(gl>0){var rg=ctx.createRadialGradient(vp.x,vp.y,0,vp.x,vp.y,R*2.6);rg.addColorStop(0,'rgba(190,228,255,'+(.75*gl)+')');rg.addColorStop(.18,'rgba(37,178,231,'+(.34*gl)+')');rg.addColorStop(1,'rgba(27,117,186,0)');
        ctx.save();ctx.beginPath();ctx.rect(0,0,W,vp.y+2);ctx.clip();ctx.fillStyle=rg;ctx.fillRect(vp.x-R*3,vp.y-R*3,R*6,R*6);
        ctx.beginPath();ctx.arc(vp.x,vp.y,R,Math.PI,2*Math.PI);ctx.strokeStyle='rgba(235,246,255,'+(.8*gl)+')';ctx.lineWidth=1.5;ctx.shadowColor='rgba(37,178,231,1)';ctx.shadowBlur=24;ctx.stroke();ctx.restore();
        var hg=ctx.createLinearGradient(0,0,W,0);hg.addColorStop(0,'rgba(255,255,255,0)');hg.addColorStop(Math.max(0,Math.min(1,vp.x/W)),'rgba(235,246,255,'+(.75*gl)+')');hg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=hg;ctx.fillRect(0,vp.y,W,1);}
      if(vid){hero.style.setProperty('--fx',(-cx*10)+'px');hero.style.setProperty('--fy',(-cy*6)+'px');}
      if(!calm&&vis)requestAnimationFrame(frame);}
    size();addEventListener('resize',function(){size();if(calm)requestAnimationFrame(frame);});
    hero.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*2-1;ty=(e.clientY-r.top)/r.height*2-1;});
    hero.addEventListener('pointerleave',function(){tx=0;ty=0;});
    new IntersectionObserver(function(es){var was=vis;vis=es[0].isIntersecting;if(vis&&!was&&!calm)requestAnimationFrame(frame);}).observe(hero);
    requestAnimationFrame(frame);}
  var hv=d.querySelector('.hero5 video');if(hv&&calm){hv.removeAttribute('autoplay');hv.pause();}
})();
