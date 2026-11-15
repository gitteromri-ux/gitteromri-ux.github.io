(()=>{
 'use strict';
 const $=(s,r=document)=>r?.querySelector(s), $$=(s,r=document)=>[...(r?.querySelectorAll(s)||[])];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const header=$('header.elementor-location-header');
 const toggle=$('.elementor-menu-toggle',header);
 if(toggle){toggle.setAttribute('role','button');toggle.setAttribute('tabindex','0');toggle.setAttribute('aria-expanded','false');const act=()=>{const on=header.classList.toggle('sr-menu-open');toggle.setAttribute('aria-expanded',String(on));$('nav.elementor-nav-menu--dropdown',header)?.setAttribute('aria-hidden',String(!on))};toggle.addEventListener('click',act);toggle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act()}})}
 $$('.menu-item-has-children>a').forEach(a=>{a.setAttribute('aria-haspopup','true');a.addEventListener('click',e=>{if(innerWidth<1025||a.getAttribute('href')==='#'){e.preventDefault();const li=a.parentElement;li.classList.toggle('sr-open');a.setAttribute('aria-expanded',String(li.classList.contains('sr-open')))}})});
 const progress=document.createElement('div');progress.className='sr-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max?scrollY/max:0})`};window.addEventListener('scroll',update,{passive:true});update();
 const cinema=$('.sr-cinema');
 if(cinema){
   const art=document.createElement('div');art.className='sr-sculpture';art.setAttribute('aria-hidden','true');
   const curves=Array.from({length:26},(_,i)=>{const x=150+i*23;return `<path d="M ${x-240} 760 C ${x+70} 570, ${x+90} 210, 540 38 C ${x+5} 295, ${x+150} 530, ${x+380} 760" stroke="url(#srSilver)" stroke-width="${i%5===0?2:0.8}" fill="none" opacity="${.3+(i%5)*.13}"/>`}).join('');
   art.innerHTML=`<svg viewBox="0 0 1100 800" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="srSilver" x1="0" y1="1" x2=".7" y2="0"><stop stop-color="#6ae8c3" stop-opacity=".05"/><stop offset=".5" stop-color="#bcefff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><radialGradient id="srPool"><stop stop-color="#77edff" stop-opacity=".2"/><stop offset="1" stop-color="#77edff" stop-opacity="0"/></radialGradient></defs><ellipse cx="560" cy="570" rx="500" ry="200" fill="url(#srPool)"/><g>${curves}</g><ellipse cx="540" cy="720" rx="450" ry="35" fill="none" stroke="#9bfbdf" stroke-opacity=".25"/><ellipse cx="540" cy="720" rx="340" ry="24" fill="none" stroke="#b7edff" stroke-opacity=".2"/></svg>`;
   cinema.append(art);
   const scroll=document.createElement('a');scroll.className='sr-scroll';scroll.href='#sr-introduction';scroll.setAttribute('aria-label','Scroll to introduction');cinema.append(scroll);
   const intro=$('.sr-intro');if(intro)intro.id='sr-introduction';
   const video=$('video',cinema);if(video){if(reduced){video.pause();video.parentElement.style.backgroundImage=`url("${video.poster}")`}else video.play().catch(()=>{video.parentElement.style.backgroundImage=`url("${video.poster}")`})}
   if(!reduced)cinema.addEventListener('pointermove',e=>cinema.style.setProperty('--mouse-x',(e.clientX/innerWidth-.5).toFixed(2)),{passive:true});
 }
 const io=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting})=>{if(!isIntersecting)return;const end=Number(target.dataset.toValue),start=performance.now(),duration=reduced?0:1600,dec=String(target.dataset.toValue).includes('.')?1:0;const tick=t=>{const p=duration?Math.min(1,(t-start)/duration):1;target.textContent=(end*(1-Math.pow(1-p,3))).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec});if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);io.unobserve(target)})},{threshold:.4});
 $$('.elementor-counter-number').forEach(el=>io.observe(el));
 $$('.ha-ia-item').forEach(el=>{el.tabIndex=0});
 $$('.e-hotspot').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Show map detail');el.setAttribute('aria-expanded','false');const set=on=>{el.classList.toggle('e-hotspot--active',on);el.setAttribute('aria-expanded',String(on))};el.addEventListener('pointerenter',()=>set(true));el.addEventListener('pointerleave',()=>set(false));el.addEventListener('focus',()=>set(true));el.addEventListener('blur',()=>set(false));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();set(!el.classList.contains('e-hotspot--active'))}if(e.key==='Escape')set(false)})});
 if(!reduced&&matchMedia('(pointer:fine)').matches)$$('.sr-service-card,.sr-stats .elementor-widget-counter').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--px',`${x*100}%`);el.style.setProperty('--py',`${y*100}%`);el.style.transform=`perspective(1100px) rotateX(${(y-.5)*-4}deg) rotateY(${(x-.5)*4}deg) translateY(-6px)`},{passive:true});el.addEventListener('pointerleave',()=>{el.style.transform=''})});
 let active=null,opener=null;
 function close(){if(!active)return;active.classList.remove('sr-bio-open');document.body.style.overflow='';active=null;opener?.focus()}
 $$('a[href*="elementor-action"]').forEach(a=>{
   a.addEventListener('click',e=>{
     const href=decodeURIComponent(a.getAttribute('href'));const settings=href.split('settings=')[1];if(!settings)return;
     try{const data=JSON.parse(atob(settings));const modal=$(`[data-elementor-type="popup"][data-elementor-id="${data.id}"]`);if(!modal)return;e.preventDefault();close();opener=a;active=modal;
       if(!$('.sr-close',modal)){const b=document.createElement('button');b.className='sr-close';b.type='button';b.setAttribute('aria-label','Close biography');b.innerHTML='&times;';b.addEventListener('click',close);modal.prepend(b)}
       modal.classList.add('sr-bio-open');document.body.style.overflow='hidden';modal.focus();
     }catch(err){console.warn('Biography unavailable',err)}
   })
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();header?.classList.remove('sr-menu-open');toggle?.setAttribute('aria-expanded','false')}if(e.key==='Tab'&&active){const f=$$('a[href],button,input,[tabindex="0"]',active).filter(x=>x.getClientRects().length);if(!f.length)return;const first=f[0],last=f.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===active)){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 $$('.elementor-gallery-item__image[data-thumbnail]').forEach(el=>{el.style.backgroundImage=`url("${el.dataset.thumbnail}")`});
 $$('.elementor-form').forEach(form=>{
   const note=document.createElement('p');note.className='sr-form-note';note.textContent='Design preview: submitting opens an email draft. No inquiry is sent automatically.';form.after(note);
   form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const lines=[...new FormData(form).entries()].filter(([k,v])=>k.startsWith('form_fields')&&v).map(([k,v])=>`${k.replace('form_fields[','').replace(']','')}: ${v}`);location.href='mailto:office@silverroadcapital.com?subject='+encodeURIComponent('Silver Road Capital inquiry')+'&body='+encodeURIComponent(lines.join('\n'));note.textContent='Email draft requested. Review and send it in your email application; this website has not sent your inquiry.'});
 });
 window.srReady=true;
})();
