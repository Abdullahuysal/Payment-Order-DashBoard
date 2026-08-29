# Backend

Bu klasör, ops panelini besleyecek backend proje(ler)i içindir:

- Servis sağlığı curl/probe tanımlarının saklanması
- QA test rule / senaryo tanımları ve koşum sonuçları
- Sipariş sorgulama (read-only) ve log/AI köprüsü için gerekli endpoint’ler
- Frontend’in `services/http` üzerinden çağıracağı `POST /health/checks` vb.

**Henüz kod yok.** Backend tool’ları ayrı bir çalışmada eklenecek.

Beklenen yerleşim (öneri):

```
backend/
  api/          ana ops API (frontend'in konuştuğu servis)
  <diğer>/      gerekirse ek servisler
```
