## Backlog i user stories (zwięźle)

### MVP (Iteracja 1)
- Jako klient chcę przeglądać repertuar i szczegóły filmu, aby wybrać seans.
- Jako klient chcę zarejestrować konto, zalogować się i edytować profil.
- Jako klient chcę wybrać miejsca na seansie i tymczasowo je zarezerwować.
- Jako klient chcę opłacić rezerwację online i otrzymać bilet PDF z kodem QR.
- Jako pracownik chcę zweryfikować bilet (kod/QR) przy wejściu.
- Jako administrator chcę dodać film, zdefiniować salę i dodać seans.
- Raport podstawowy: sprzedaż dzienna (liczba biletów, przychód).

### Iteracja 2
- Program lojalnościowy: naliczanie punktów za bilety i przekąski, podgląd salda, historia.
- Popcorn Bar: katalog produktów, zamówienie online, płatność i odbiór.
- Anulowanie rezerwacji przed seansem (jeśli nieopłacona) + zwrot (jeśli polityka przewiduje).
- 2FA dla logowania i reset hasła.

### Iteracja 3
- Rekomendacje AI (prosty model: popularność + historia użytkownika).
- Chatbot: FAQ + ręczne przekierowanie do konsultanta (asynchronicznie).
- Zaawansowane raporty: popularność filmów, obłożenie sal.
- Wielojęzyczność (PL/EN) w UI i metadanych filmów.

### Kryteria akceptacji (przykłady)
- Rezerwacja blokuje miejsca (showtime_id, seat_id) i wygasa po X minutach.
- Bilet PDF zawiera czytelny kod, tytuł, datę, salę, rząd/miejsce.
- Webhook płatności jest idempotentny i odporny na ponowne wywołania.
- Weryfikacja biletu przez pracownika zawsze zwraca jednoznaczny wynik (ważny/nieważny/powtórnie użyty).

### Definicja ukończenia
- Testy jednostkowe i integracyjne kluczowych ścieżek (auth, rezerwacja, płatność, weryfikacja).
- Monitorowanie: health-check `/health`, logi i metryki dla płatności i rezerwacji.
- Migracje bazy i instrukcja deployu.
