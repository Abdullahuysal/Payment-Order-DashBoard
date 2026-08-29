# Payment & Order Ops — Frontend

Boyner ödeme/sipariş ekibi (dev + QA) için internal ops panel. **Faz 0** — proje
kurulumu, katmanlı mimari ve uygulama kabuğu. Modüllerin iş mantığı sonraki
fazlarda. Monorepo içinde `frontend/`; backend `../backend/` (henüz boş).

## Çalıştırma

```bash
cd frontend
npm install
cp .env.example .env      # değerleri kendi ortamına göre düzenle
npm run dev               # http://localhost:5173
```

Diğer script'ler:

| komut               | ne yapar                                  |
| ------------------- | ----------------------------------------- |
| `npm run build`     | tsc project build + Vite production build |
| `npm run preview`   | build çıktısını lokalde servis eder       |
| `npm run lint`      | ESLint (flat config, type-aware)          |
| `npm run typecheck` | sadece tip kontrolü                       |
| `npm run format`    | Prettier                                  |

## Sayfalar

`/` → uygulamayı anlatan kısa genel bakış (modül kartları + aktif ortam). Modüller:

| #   | Modül          | Route         | Durum                                 |
| --- | -------------- | ------------- | ------------------------------------- |
| 1   | Servis Sağlığı | `/health`     | **pattern örneği** — api+hook+sayfa   |
| 2   | Test Koşumları | `/test-runs`  | "yakında" placeholder                 |
| 3   | Sipariş Kontrol| `/orders`     | "yakında" placeholder                 |
| 4   | Log & AI       | `/logs`       | "yakında" placeholder                 |

## Ortam & tema

- **Ortamlar**: `dev` · `preprod` · `production` — Topbar'daki seçiciden runtime'da
  değişir. Her biri `.env` içinde `VITE_API_BASE_URL_{DEV,PREPROD,PRODUCTION}`.
- **Tema**: `dark` (varsayılan) ve `light` ("light black") — Topbar'daki güneş/ay
  düğmesi. Seçim `localStorage`'da; `index.html` içindeki küçük script ilk boyamadan
  önce uygular (flash yok).

## Klasör yapısı

```
src/
  app/            uygulama kabuğu
    layout/       AppShell, Sidebar, Topbar, Breadcrumbs, EnvSwitcher, ThemeToggle, CommandPalette
    hooks/        useApplyTheme (tema → <html data-theme>)
    HomePage.tsx  "/" genel bakış sayfası
    router.tsx    route tablosu (createBrowserRouter)
    providers.tsx QueryClient + RouterProvider
    store.ts      Zustand — env seçimi, tema, sidebar collapse, palette open
  features/       her modül izole: api/ components/ hooks/ store.ts types.ts <X>Page.tsx
    health/       ← referans modül: seed + kullanıcı ekli (curl parse) kontroller,
                    kalıcı config store, tipli mock sonuç
    test-runs/ orders/ logs/   ← stub sayfa
  services/       ORTAK SERVİS KATMANI
    http.ts       typed fetch wrapper (base URL, timeout, interceptor, hata normalizasyonu)
    config.ts     .env okuma + izlenen uygulama listesi tipi/seed'i
  components/ui/  paylaşılan primitive'ler (Button, Card, StatusDot, Badge, ComingSoon)
  lib/            cn, format, constants (modül registry)
  types/          global tipler
  styles/         Tailwind girişi + tema token'ları
```

## Mimari kararlar

1. **Feature-sliced + tek yönlü katman bağımlılığı.** Akış her zaman
   `features/<modül>/components → hooks → api → services/http → services/config`.
   `services/` ve `components/ui/` yukarıya (feature'lara) bağımlı değil; bir
   feature başka bir feature'ı import etmez. Yeni modül = `features/` altında bir
   klasör + `router.tsx` ve `lib/constants.ts`'e birer satır.

2. **UI asla `fetch` çağırmaz — sınır `features/<modül>/api`.** Tüm HTTP
   `services/http.ts` üzerinden geçer: base URL çözümü, timeout (`AbortSignal`),
   JSON/hata parse, `HttpError` normalizasyonu ve request/response/error
   interceptor'ları tek yerde. Backend gerçek olduğunda sadece `api/` dosyalarındaki
   yorumlu satırlar açılır; önyüzde değişiklik olmaz.

3. **Sunucu durumu TanStack Query, global UI durumu Zustand.** Sağlık board'u
   `refetchInterval` ile otomatik yenilenir; seçili ortam (`env`) query key'in
   parçası olduğu için ortam değişince tüm feature'lar otomatik refetch eder.
   Zustand yalnızca hafif UI state tutar (env, sidebar, palette) ve `persist` ile
   `localStorage`'a yazar.

4. **Config tek kapıdan.** `import.meta.env` yalnızca `services/config.ts` içinde
   okunur; `.env` üç ortam için ayrı `VITE_API_BASE_URL_{DEV,PREPROD,PRODUCTION}`
   verir, aktif ortam Topbar'daki seçiciden runtime'da belirlenir ve
   `resolveApiBaseUrl(env)` ile base URL'e çevrilir. Zustand `persist` v1 migrasyonu
   eski değerleri (`prod/staging/test`) yeni sete taşır.

5. **Tema = CSS değişken override.** `styles/index.css` `@theme` koyu değerleri
   tutar (Tailwind utility'leri buradan üretilir); `[data-theme='light']` aynı
   değişkenleri yeniden işaret eder, tüm utility'ler takip eder. Theme provider
   yok; renk yalnızca durum semantiği (`up/degraded/down`) + tek Log&AI aksanı için.

## Kapsam dışı (bu faz)

- Backend / gerçek entegrasyon yok — health sonuçları tipli mock.
- Cmd+K paleti yalnızca kısayol + aç/kapa; içerik sonraki fazda.
- Test Koşumları / Sipariş / Log&AI sayfaları placeholder.
- Servis Sağlığı: "Servis ekle" ile kullanıcı curl yapıştırıp ya da elle kontrol
  ekler; tanım + alive-path override’ları `localStorage`’da (`boyner-ops-health`).
  Gerçek probe faz 1’de ops backend’de koşar (`POST /health/checks`).
