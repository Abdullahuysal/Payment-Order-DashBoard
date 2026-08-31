# Frontend — çalışma kuralları

## Yorum politikası (zorunlu)

Bu kod tabanı **yorumsuz** yazılır. Kod okunur, isimler açıklar.

- **Satır içi yorum yazma.** `//` açıklama satırı, `/* ... */` blok yorumu, `/* ─── bölüm ─── */`
  ayırıcıları — hiçbiri eklenmez.
- **Yeni/temas edilen dosyalardaki mevcut yorumları da kaldır** (kod stiline uyum için).
- **Tek istisna — kısa `/** ... */` özeti:** yalnızca bir fonksiyon/hook/`const`/tip alanının
  davranışı isminden anlaşılmıyorsa ve bu bilgi bir hatayı önlüyorsa (sözleşme tuhaflığı,
  yan etki, `staleTime: Infinity` gibi bilinçli tercih). Tek satır tut. İsmi tekrarlayan
  özet yazma (`/** Bölüm başlığı. */` → sil).
- Açıklama gerekiyorsa yorum yerine **daha iyi isim** veya **ara değişken** kullan.

Örnek — kabul edilebilir:
```ts
/** Önizleme çağrısı mesajları requeue eder; sabit tut, otomatik yenileme yok. */
export function useRabbitMessages(...) { ... }
```
Örnek — kaldır:
```ts
// kuyruğu isme göre filtrele
const filtered = queues.filter((q) => q.name.includes(term));
```

## Diğer konvansiyonlar

- Feature dilimi deseni: `features/<ad>/` → `types.ts`, `api/*.api.ts`, `hooks/*.ts`,
  `lib.ts` (saf yardımcılar), `<Ad>Page.tsx`, `components/*`.
- Sol menüye yeni bir modül eklerken `lib/constants.ts`'teki `MODULES` dizisinin **en sonuna**
  eklenir (aradaki mevcut sıraya sıkıştırılmaz); `router.tsx`'teki route sırası da menü
  sırasıyla eşleşir.
- Veri çekme: TanStack Query; ortak `apiClient()` (`services/http.ts`); ortam `X-Environment`
  header'ıyla, `useAppStore((s) => s.environment)` üzerinden.
- `exactOptionalPropertyTypes` açık → opsiyonel alanlar `prop?: T | undefined` biçiminde.
- `verbatimModuleSyntax` açık → tip importları `import type`.
- Stil: Tailwind v4 + `styles/index.css` içindeki tasarım token'ları (`bg`, `surface`,
  `fg-muted`, `status-*` …). Ham hex kullanma.
- Teslimden önce: `npm run typecheck`, `npm run lint`, `npm run build` temiz olmalı;
  dokunulan dosyalar için `npm run format`.
