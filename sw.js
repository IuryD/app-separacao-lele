// Service worker: deixa o app abrir mesmo com internet fraca no estoque.
// Sempre tenta a versão nova primeiro; se não tiver internet, usa a cópia salva.
const CACHE = 'separacao-v31';
const ARQUIVOS = ['./', './index.html', './config.js', './baixas.js', './contagem.js', './validade.js', './logo-lele.png', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Planilha enviada pelo "Compartilhar" do WhatsApp
  if (e.request.method === 'POST' && url.pathname.endsWith('/compartilhar')){
    e.respondWith((async () => {
      try{
        const fd = await e.request.formData();
        const f = fd.getAll('arquivo').find(x => x && x.size) || null;
        if (f){
          const c = await caches.open('compartilhado');
          await c.put('arquivo', new Response(f, {headers: {'x-nome': encodeURIComponent(f.name || 'picklist.xlsx')}}));
        }
      }catch(err){}
      return Response.redirect('./index.html?shared=1', 303);
    })());
    return;
  }
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Firebase e CDNs passam direto
  e.respondWith(
    fetch(e.request, {cache: 'no-cache'}).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
