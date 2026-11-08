const CACHE_NAME='british-speaking-studio-practice-v1';
const CACHEABLE=/\/(?:audio|images)\/|\/timings(?:-trial-\d+)?\.json$/;

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('british-speaking-studio-practice-')&&name!==CACHE_NAME).map(name=>caches.delete(name)));await self.clients.claim()})()));

async function cacheAssets(assets){const cache=await caches.open(CACHE_NAME);await Promise.all(assets.filter(asset=>typeof asset==='string'&&CACHEABLE.test(new URL(asset,self.registration.scope).pathname)).map(async asset=>{const url=new URL(asset,self.registration.scope).href;if(await cache.match(url))return;const response=await fetch(url,{credentials:'same-origin'});if(response.ok)await cache.put(url,response.clone())}))}

self.addEventListener('message',event=>{if(event.data?.type==='warm-session'&&Array.isArray(event.data.assets))event.waitUntil(cacheAssets(event.data.assets))});

async function rangeFromCache(request,cached){const range=request.headers.get('range');if(!range)return cached;const match=/bytes=(\d*)-(\d*)/.exec(range);if(!match)return cached;const bytes=await cached.arrayBuffer();const start=match[1]?Number(match[1]):0;const end=match[2]?Math.min(Number(match[2]),bytes.byteLength-1):bytes.byteLength-1;if(start>end||start>=bytes.byteLength)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.byteLength}`}});const slice=bytes.slice(start,end+1);return new Response(slice,{status:206,statusText:'Partial Content',headers:{'Content-Type':cached.headers.get('Content-Type')||'audio/mpeg','Content-Length':String(slice.byteLength),'Content-Range':`bytes ${start}-${end}/${bytes.byteLength}`,'Accept-Ranges':'bytes'}})}

self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!CACHEABLE.test(url.pathname))return;event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);const cached=await cache.match(url.href);if(cached)return rangeFromCache(request,cached);const network=await fetch(request);if(network.ok&&!request.headers.has('range'))cache.put(url.href,network.clone());return network})())});
