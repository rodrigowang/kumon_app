# PWA Cache Strategy

Documentação das estratégias de cache implementadas no Kumon Math App.

## Visão Geral

O app utiliza o **Workbox** (via `vite-plugin-pwa`) para gerenciar cache de assets e garantir funcionamento offline.

## Estratégias de Cache

### 1. CacheFirst (Cache-First, Network Fallback)

**Fluxo:**
1. Verifica cache primeiro
2. Se encontrar → retorna imediatamente
3. Se não encontrar → busca na rede → cacheia → retorna

**Usado para:**
- Modelos MNIST (`.bin`, `.json`) — `/models/**`
- Áudio (`.mp3`, `.wav`, `.ogg`) — `/sounds/**`
- Imagens (`.png`, `.jpg`, `.svg`, etc.)
- Google Fonts

**Vantagens:**
- ✅ Resposta instantânea (sem latência de rede)
- ✅ Funciona offline perfeitamente
- ✅ Ideal para assets pesados e estáticos

**Desvantagens:**
- ⚠️ Conteúdo pode ficar desatualizado (até expirar)
- ⚠️ Requer invalidação manual ou expiration policy

---

### 2. StaleWhileRevalidate (Stale-While-Revalidate)

**Fluxo:**
1. Retorna do cache imediatamente (se disponível)
2. Revalida em background buscando versão atualizada
3. Próxima requisição usa versão atualizada

**Usado para:**
- CDNs externas (`https://cdn.jsdelivr.net/**`) — TensorFlow.js, etc.

**Vantagens:**
- ✅ Resposta rápida (do cache)
- ✅ Sempre atualiza em background
- ✅ Equilíbrio entre performance e freshness

**Desvantagens:**
- ⚠️ Primeira visita após update ainda usa versão antiga
- ⚠️ Consome banda em background

---

## Caches Criados

| Cache Name | Estratégia | Conteúdo | Expiration |
|------------|-----------|----------|------------|
| `mnist-model-cache` | CacheFirst | Modelos `.bin`, `.json` | 30 dias, max 20 |
| `audio-cache` | CacheFirst | `.mp3`, `.wav`, `.ogg` | 30 dias, max 30 |
| `images-cache` | CacheFirst | `.png`, `.jpg`, `.svg`, etc. | 30 dias, max 50 |
| `google-fonts-cache` | CacheFirst | Google Fonts (CSS) | 1 ano, max 10 |
| `gstatic-fonts-cache` | CacheFirst | Google Fonts (WOFF2) | 1 ano, max 10 |
| `cdn-cache` | StaleWhileRevalidate | CDNs externas | 7 dias, max 20 |
| `workbox-precache-v2-*` | Precache | App shell (JS, CSS, HTML) | Até nova versão |

---

## Configuração Workbox

### Limite de Arquivo

```typescript
maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
```

**Justificativa**: Modelos MNIST podem ter 1-5MB. Sem aumentar o limite, Workbox emitiria warnings.

---

### Cache para Modelos MNIST

```typescript
{
  urlPattern: /\/models\/.*\.(bin|json)$/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'mnist-model-cache',
    expiration: {
      maxEntries: 20,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
    },
    cacheableResponse: {
      statuses: [0, 200], // Suporta opaque responses (CORS)
    },
  },
}
```

**Opaque Responses**: `status: 0` permite cachear recursos de CDNs sem CORS.

---

### Precache de App Shell

```typescript
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
```

**O que é precacheado:**
- `index.html`
- Bundles JS (`main-*.js`, `vendor-*.js`)
- CSS compilado (`index-*.css`)
- Ícones PWA (`pwa-192x192.png`, `pwa-512x512.png`)
- Fontes WOFF2 locais (se houver)

**Quando é cacheado**: No primeiro load do app (install event do Service Worker).

---

## Como Testar

### 1. Build e Preview
```bash
npm run build
npm run preview
```

### 2. DevTools > Application
- **Service Workers**: Verificar que SW está ativo
- **Cache Storage**: Verificar os 7 caches criados

### 3. Simular Offline
- DevTools > Network > Throttling > **Offline**
- Recarregar página — app deve funcionar normalmente
- Testar OCR — modelo deve carregar do cache

### 4. Inspecionar Cache de Modelos
```javascript
// Console do DevTools
caches.open('mnist-model-cache').then(cache => {
  cache.keys().then(keys => {
    console.log('Modelos cacheados:', keys.map(k => k.url));
  });
});
```

---

## Fluxo de Cache em Produção

### Primeira Visita (Online)
1. Service Worker instala e cacheia app shell (precache)
2. Usuário acessa app
3. Modelos MNIST são carregados e cacheados (`mnist-model-cache`)
4. Sons e imagens são cacheados conforme uso

### Segunda Visita (Online)
1. App shell carrega do cache (`workbox-precache`)
2. Modelos carregam do cache instantaneamente
3. CDNs revalidam em background (StaleWhileRevalidate)

### Visita Offline
1. Service Worker intercepta requisições
2. Retorna tudo do cache (app shell + modelos + sons + imagens)
3. App funciona 100% offline

---

## Trade-offs e Decisões

### Por que CacheFirst para MNIST?

**Alternativa considerada**: StaleWhileRevalidate

**Decisão**: CacheFirst

**Justificativa:**
1. Modelos MNIST são estáticos (raramente mudam)
2. Arquivos pesados (1-5MB) — revalidação frequente consome banda
3. Performance > Freshness (criança não pode esperar carregamento)
4. Expiration de 30 dias é suficiente para invalidar versões antigas

---

### Por que StaleWhileRevalidate para CDNs?

**Alternativa considerada**: CacheFirst

**Decisão**: StaleWhileRevalidate

**Justificativa:**
1. TensorFlow.js pode ter patches de segurança/performance
2. Revalidação em background não afeta UX (usuário já viu versão cacheada)
3. Expiration de 7 dias equilibra freshness e performance

---

## Troubleshooting

### Cache não está sendo criado
1. Verificar que `npm run build` gerou `dist/sw.js`
2. Verificar que `dist/manifest.webmanifest` existe
3. Limpar cache do browser (DevTools > Application > Clear Storage)
4. Recarregar app

### Modelos MNIST não cacheiam
1. Verificar que arquivos estão em `public/models/` (não `src/`)
2. Verificar que URL de fetch usa `/models/...` (caminho absoluto)
3. Inspecionar Network tab — requisição deve ser interceptada pelo SW
4. Verificar que arquivo não ultrapassa 5MB

### App não funciona offline
1. Verificar que Service Worker está **ativo** (não apenas instalado)
2. Forçar update do SW (DevTools > Application > Service Workers > Update)
3. Hard refresh (Ctrl+Shift+R ou Cmd+Shift+R)
4. Verificar que precache inclui todos os JS/CSS necessários

---

## Referências

- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [VitePWA Workbox Options](https://vite-pwa-org.netlify.app/workbox/)
- [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
