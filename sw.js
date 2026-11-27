const SH='fs-shell-v1',IM='fs-img-v1',AP='fs-api-v1',KEEP=[SH,IM,AP];
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SH).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>!KEEP.includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const ok=r=>r&&(r.ok||r.type=='opaque');
const trim=async(c,max)=>{const k=await c.keys();if(k.length>max)await Promise.all(k.slice(0,k.length-max).map(x=>c.delete(x)))};
async function swr(req,name){const c=await caches.open(name),hit=await c.match(req),net=fetch(req).then(r=>{if(ok(r))c.put(req,r.clone());return r}).catch(()=>null);return hit||(await net)||Response.error()}
async function cacheFirst(req,name,max){const c=await caches.open(name),hit=await c.match(req);if(hit)return hit;try{const r=await fetch(req);if(ok(r)){c.put(req,r.clone());trim(c,max)}return r}catch(e){return Response.error()}}
async function netFirst(req,name){const c=await caches.open(name);try{const r=await fetch(req);if(ok(r))c.put(req,r.clone());return r}catch(e){return (await c.match(req))||Response.error()}}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!='GET')return;
  const u=new URL(r.url);
  if(u.hostname.endsWith('supabase.co'))return;
  if(r.mode=='navigate'){
    e.respondWith(fetch(r).then(x=>{if(ok(x)){const y=x.clone();caches.open(SH).then(c=>c.put('./index.html',y))}return x}).catch(()=>caches.match('./index.html').then(x=>x||caches.match('./')||Response.error())));
    return;
  }
  if(u.hostname=='image.tmdb.org')return e.respondWith(cacheFirst(r,IM,500));
  if(u.hostname=='api.themoviedb.org')return e.respondWith(netFirst(r,AP));
  if(u.origin==location.origin||['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))e.respondWith(swr(r,SH));
});
