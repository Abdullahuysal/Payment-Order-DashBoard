<div align="center">

# Payment &amp; Order Ops — Frontend

### Boyner ödeme/sipariş ekibi (dev + QA) için internal ops paneli.

Servis sağlığını izle, test senaryolarını koştur, sipariş sorgula, mesaj kuyruklarını
incele, logları AI ile yorumla — hepsi seçili ortam üzerinden, tek panelde.

<br/>

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)

![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-2D3748?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![react-i18next](https://img.shields.io/badge/i18n-TR%20%2F%20EN-26A69A?style=flat-square&logo=i18next&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)

</div>

---

## İçindekiler

- [Çalıştırma](#çalıştırma)
- [Modüller](#modüller)
- [Ortam · Tema · Dil](#ortam--tema--dil)
- [Mock katmanı](#mock-katmanı)
- [Klasör yapısı](#klasör-yapısı)
- [Mimari kararlar](#mimari-kararlar)
- [Katkı kuralları](#katkı-kuralları)

---

## Çalıştırma

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_BASE_URL'i kendi API adresine göre düzenle
npm run dev               # http://localhost:5173
```

Backend `../backend/` içinde (.NET 10 ops API, `http://localhost:5080`). API ayağa
kalkmadan panel açılır ama modüller “yapılandırılmamış / erişilemiyor” durumları gösterir.

| Komut               | Ne yapar                                   |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Vite dev sunucusu (HMR)                    |
| `npm run build`     | `tsc -b` proje derlemesi + Vite prod build |
| `npm run preview`   | Build çıktısını lokalde servis eder        |
| `npm run lint`      | ESLint (flat config, tip-farkındalıklı)    |
| `npm run typecheck` | Yalnızca tip kontrolü (`tsc -b --noEmit`)  |
| `npm run format`    | Prettier (`src/**/*.{ts,tsx,css}`)         |

---

## Modüller

`/` → uygulamayı anlatan kısa genel bakış (modül kartları + aktif ortam).

| Modül                    | Route         | Durum                                       |
| ------------------------ | ------------- | ------------------------------------------- |
| Servis Sağlığı           | `/health`     | ✅ referans dilim — api + hook + sayfa       |
| Test Koşumları           | `/test-runs`  | ✅ *(mock’lanabilir)*                        |
| Sipariş Kontrol          | `/orders`     | ✅ *(mock’lanabilir — backend planlı)*       |
| Mesaj Kuyrukları &amp; DLQ    | `/queues`     | ✅                                           |
| Log &amp; AI                  | `/logs`       | ✅ Elasticsearch araması + AI “ne oldu” özeti |
| Yapılacaklar             | `/todo`       | ✅                                           |
| Geliştirici Araçları     | `/dev-tools`  | ✅ *(mock’lanabilir)*                        |
| Test Verisi Üretici      | `/test-data`  | 🚧 “yakında” placeholder                    |
| Hata Panosu              | `/errors`     | 🚧 “yakında” placeholder                    |

Yeni modül eklerken sıra: `lib/constants.ts`’teki `MODULES` dizisinin **sonuna** bir satır,
`app/router.tsx`’e eşleşen route, `i18n/` altına `tr` + `en` namespace.

---

## Ortam · Tema · Dil

- **Ortam** — `dev` · `preprod` · `production`. Topbar’daki seçiciden runtime’da değişir;
  seçim `X-Environment` header’ı olarak **tek** `VITE_API_BASE_URL`’e gönderilir (ortam
  başına ayrı URL yok). Ortam, TanStack Query key’lerinin parçası olduğu için değişince tüm
  sorgular otomatik yenilenir.
- **Tema** — 10 tema (`dark` varsayılan · `midnight` · `grape` · `ember` · `forest` ·
  `light` · `sage` · `sepia` · `blush` · `lavender`). Topbar’daki düğme + Cmd/Ctrl+K
  paleti. Seçim `localStorage`’da; `index.html` içindeki küçük script ilk boyamadan önce
  `<html data-theme>`’i işler (flash yok).
- **Dil** — `tr` (varsayılan) / `en`, react-i18next. Tüm kullanıcı metinleri `i18n/locales/`
  altında; `en` bundle’ları `typeof tr…` ile tipli tutulur.

`.env` anahtarları:

| Anahtar                 | Varsayılan               | Açıklama                            |
| ----------------------- | ------------------------ | ---------------------------------- |
| `VITE_API_BASE_URL`     | `http://localhost:5080`  | Ops API kök adresi                 |
| `VITE_DEFAULT_ENV`      | `dev`                    | İlk açılıştaki ortam               |
| `VITE_HTTP_TIMEOUT_MS`  | `10000`                  | İstek zaman aşımı (`AbortSignal`)  |

---

## Mock katmanı

Bazı modüller, backend ucu hazır olana kadar tipli mock veriyle çalışır. `.env`’de ilgili
bayrağı `false` yapınca gerçek `apiClient()`’a düşer:

| Bayrak                 | Modül                |
| ---------------------- | -------------------- |
| `VITE_TESTRUNS_MOCK`   | Test Koşumları       |
| `VITE_ORDERS_MOCK`     | Sipariş Kontrol      |
| `VITE_DEVTOOLS_MOCK`   | Geliştirici Araçları |

---

## Klasör yapısı

```
src/
  app/            uygulama kabuğu
    layout/       AppShell · Sidebar · Topbar · Breadcrumbs · EnvSwitcher · ThemeToggle · CommandPalette
    hooks/        useApplyTheme (tema → <html data-theme>)
    HomePage.tsx  "/" genel bakış
    router.tsx    route tablosu (createBrowserRouter)
    providers.tsx QueryClient + RouterProvider
    store.ts      Zustand — ortam, tema, dil, sidebar, palette (persist → localStorage)
  features/       her modül izole: api/ components/ hooks/ lib.ts types.ts <X>Page.tsx
    health/       ← referans dilim (seed + curl-parse kontroller, kalıcı config, tipli mock)
    test-runs/ orders/ queues/ logs/ todo/ dev-tools/
    test-data/ errors/          ← placeholder sayfa
  services/       ORTAK SERVİS KATMANI
    http.ts       typed fetch wrapper (base URL, timeout, interceptor, HttpError normalizasyonu)
    config.ts     .env okuma + ortam sabitleri (import.meta.env yalnızca burada)
  components/ui/  paylaşılan primitive’ler (Button · Card · Badge · Segmented · Drawer · CopyButton · ComingSoon)
  i18n/           react-i18next kurulumu + locales/{tr,en}/<namespace>.ts
  lib/            cn · format (Intl) · constants (modül registry)
  types/          global tipler (AppEnvironment, ApiErrorShape)
  styles/         Tailwind girişi + @theme tasarım token’ları
```

---

## Mimari kararlar

1. **Feature-sliced + tek yönlü katman bağımlılığı.** Akış her zaman
   `features/<modül>/components → hooks → api → services/http → services/config`.
   `services/` ve `components/ui/` feature’lara bağımlı değil; bir feature başka bir
   feature’ı import etmez.

2. **UI asla `fetch` çağırmaz — sınır `features/<modül>/api`.** Tüm HTTP `services/http.ts`
   üzerinden: base URL çözümü, timeout, JSON/hata parse, `HttpError` normalizasyonu ve
   interceptor’lar tek yerde.

3. **Sunucu durumu TanStack Query, global UI durumu Zustand.** Seçili ortam query key’in
   parçası → ortam değişince tüm feature’lar refetch eder. Zustand yalnızca hafif UI state
   tutar (ortam, tema, dil, sidebar) ve `persist` ile `localStorage`’a yazar.

4. **Config tek kapıdan.** `import.meta.env` yalnızca `services/config.ts` içinde okunur.
   Tek bir `VITE_API_BASE_URL` vardır; ortam ayrımı URL ile değil, her isteğe eklenen
   `X-Environment` header’ı ile yapılır (backend’in “tek deployment, üç mantıksal ortam”
   modeliyle birebir).

5. **Tema = CSS değişken override.** `styles/index.css` `@theme` koyu değerleri tutar
   (Tailwind utility’leri buradan üretilir); `[data-theme='...']` blokları aynı değişkenleri
   yeniden işaret eder, tüm utility’ler takip eder. Renk yalnızca durum semantiği
   (`up/degraded/down`) + tek Log &amp; AI aksanı için — ham hex kullanılmaz.

6. **Metin = i18n.** Kullanıcıya görünen her string `react-i18next` üzerinden; yeni modül
   kendi `tr` + `en` namespace’ini `i18n/resources.ts`’e ekler.

---

## Katkı kuralları

Kod **yorumsuz** yazılır (isimler açıklar); yalnızca davranışı isimden anlaşılmayan kısa
`/** ... */` özetlerine izin var. `exactOptionalPropertyTypes` ve `verbatimModuleSyntax`
açık. Ayrıntılar: **[`CLAUDE.md`](CLAUDE.md)**.

Teslimden önce temiz olmalı:

```bash
npm run typecheck && npm run lint && npm run build
npm run format          # dokunulan dosyalar için
```
