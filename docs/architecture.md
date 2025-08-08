## Architektura systemu kina

### Cel
System do rezerwacji i sprzedaży biletów, obsługi baru, programu lojalnościowego oraz paneli: klient, pracownik, administrator, z modułem AI (rekomendacje + chatbot).

### Proponowany stack
- Frontend: obecny statyczny (`index.html`, `styles.css`, JS), z możliwością migracji do React/Vue w przyszłości.
- Backend (API): Node.js (Express/Fastify) lub Python (FastAPI). Proponuję Node.js + Express dla szybkości startu.
- Baza danych: PostgreSQL.
- Cache/kolejki: Redis (rezerwacje miejsc, sesje, throttling, kolejka webhooków płatności).
- Pliki: generowanie PDF (np. pdf-lib) i QR (np. qrcode) — przechowywane jako on-demand (bez stałego składowania) lub w obiekcie (np. minio/S3) jeśli potrzebne.
- Płatności: integracja z bramką (np. Stripe/PayU/Przelewy24) — abstrakcja „PaymentProvider”.
- Uwierzytelnianie i autoryzacja: JWT (httpOnly cookie), 2FA (TOTP), role i uprawnienia.
- Monitorowanie: logi strukturalne, health-check, metryki (Prometheus/OpenTelemetry).

### Moduły i odpowiedzialności
- Moduł Klienta:
  - Rejestracja/logowanie/2FA, profil (edycja danych, usunięcie konta, przypomnienie hasła)
  - Przegląd repertuaru, wyszukiwanie
  - Rezerwacja/zakup miejsc (wybór foteli, blokada, opłata, generacja biletu PDF + QR)
  - Popcorn Bar (koszyk snacków, płatność online, odbiór na miejscu)
  - Program lojalnościowy (punkty, wymiana na zniżki)
  - Chatbot i rekomendacje AI
- Moduł Administracyjny:
  - Filmy, sale, harmonogram seansów, cenniki
  - Użytkownicy i role
  - Raporty (sprzedaż, obłożenie, popularność filmów)
- Moduł Pracownika:
  - Weryfikacja biletów (skan QR / wprowadzony kod)
  - Obsługa sal (widok obłożenia), anulacje
- Moduł AI:
  - Rekomendacje (na bazie historii + trendów)
  - Chatbot Q&A

### Kluczowe przepływy i decyzje projektowe
- Model miejsc: stała siatka miejsc w tabeli `seats` powiązana z `rooms`. Dostępność na dany seans = suma rezerwacji i biletów dla `showtime_id`.
- Rezerwacja miejsc: dwustopniowo:
  1) „Hold” (rezerwacja tymczasowa) z `reserved_until` (np. 10 minut) — blokuje parę (showtime_id, seat_id) unikalnym ograniczeniem.
  2) Płatność — po sukcesie status = „paid”, generacja biletów i QR.
- Płatności: sesja kasy tworzona po „hold”; webhook aktualizuje `payments` i `bookings` atomowo (idempotencja).
- PDF i QR: generowane na żądanie (link do `/api/tickets/{id}/pdf`). Kod biletu = krótki unikatowy token.
- 2FA: TOTP (prosty QR do skonfigurowania w aplikacji typu Authy/Google Authenticator).
- Bezpieczeństwo: hasła `argon2/bcrypt`, JWT w httpOnly, walidacja wejścia, rate limiting, CSRF dla formularzy, RBAC.
- Skalowanie: bezstanowy backend + baza Postgres + Redis. Indeksy na (film_id, starts_at), (showtime_id, seat_id), (user_id, created_at).

### Mapowanie na wymagania niefunkcjonalne
- 24/7 i 1000 użytkowników równolegle: bezstanowe API, pooling DB, cache, indeksy.
- Kompatybilność z przeglądarkami: klasyczny responsywny frontend, degradacja JS.
- Wielojęzyczność: i18n na froncie (pl/en) i translatowalne pola opisowe filmów.
- Bezpieczeństwo: 2FA, szyfrowanie TLS, PII w DB szyfrowane kolumnowo opcjonalnie.
- CI/CD: zero-downtime deploy (rolling), migracje DB (prisma/migrate lub alembic).

### Integracja z obecnym repo
- Pozostawiamy obecny UI jako MVP. Backend wystawia REST API zgodnie z `docs/api-spec.md`.
- Frontend: wymiana danych statycznych (JS) na fetche do API w kolejnych iteracjach.
