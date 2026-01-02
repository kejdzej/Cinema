# Testy Manualne - Cinema App

## 1. Autentykacja i Autoryzacja

### TC-AUTH-001: Rejestracja nowego użytkownika
**Priorytet:** Wysoki
**Warunki wstępne:** Aplikacja uruchomiona, brak użytkownika o podanym emailu

**Kroki:**
1. Przejdź do `/register`
2. Wypełnij formularz:
   - Imię: "Jan Kowalski"
   - Email: "jan.kowalski@example.com"
   - Hasło: "SecurePass123!"
3. Kliknij "Zarejestruj"

**Oczekiwany rezultat:**
- ✅ Użytkownik zostaje przekierowany do strony głównej
- ✅ Wyświetla się komunikat sukcesu
- ✅ Użytkownik jest zalogowany (widoczne menu użytkownika)
- ✅ W bazie danych pojawia się nowy rekord w tabeli `users`

---

### TC-AUTH-002: Logowanie z poprawnymi danymi
**Priorytet:** Wysoki
**Warunki wstępne:** Użytkownik zarejestrowany w systemie

**Kroki:**
1. Przejdź do `/login`
2. Wprowadź email i hasło
3. Kliknij "Zaloguj"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do strony głównej
- ✅ Widoczne menu: "Moje zamówienia", "Punkty i Nagrody", "Rekomendacje"
- ✅ Token JWT zapisany w localStorage

---

### TC-AUTH-003: Logowanie z błędnymi danymi
**Priorytet:** Wysoki

**Kroki:**
1. Przejdź do `/login`
2. Wprowadź poprawny email, błędne hasło
3. Kliknij "Zaloguj"

**Oczekiwany rezultat:**
- ✅ Wyświetla się błąd: "Nieprawidłowe dane logowania"
- ✅ Użytkownik pozostaje na stronie logowania
- ✅ Brak tokena w localStorage

---

## 2. Rezerwacja Biletów

### TC-TICKET-001: Rezerwacja biletu na dostępny seans
**Priorytet:** Krytyczny
**Warunki wstępne:** Użytkownik zalogowany, istnieje seans z wolnymi miejscami

**Kroki:**
1. Przejdź do strony głównej
2. Przewiń do sekcji "Repertuar"
3. Wybierz film i kliknij na wybrany seans
4. Wybierz 2 miejsca (np. A1, A2)
5. Kliknij "Rezerwuj"
6. Wypełnij dane płatności (test card: 4242 4242 4242 4242)
7. Zatwierdź płatność

**Oczekiwany rezultat:**
- ✅ Wyświetla się podsumowanie z wybraną liczbą miejsc
- ✅ Cena jest prawidłowo obliczona (uwzględnia typ sali: standard/VIP/3D)
- ✅ Płatność przechodzi pomyślnie
- ✅ Wyświetla się komunikat sukcesu
- ✅ Bilet pojawia się w "Moje zamówienia"
- ✅ W bazie: nowy rekord w `tickets` i `payments`
- ✅ Miejsca są zajęte (nie można ich wybrać ponownie)

---

### TC-TICKET-002: Próba rezerwacji już zajętego miejsca
**Priorytet:** Wysoki
**Warunki wstępne:** Miejsce A1 jest już zarezerwowane na dany seans

**Kroki:**
1. Wybierz ten sam seans
2. Spróbuj wybrać miejsce A1

**Oczekiwany rezultat:**
- ✅ Miejsce A1 jest nieaktywne/szare/oznaczone jako zajęte
- ✅ Nie można kliknąć na miejsce A1
- ✅ Wyświetla się podpowiedź "Zajęte"

---

### TC-TICKET-003: Generowanie biletu PDF
**Priorytet:** Średni
**Warunki wstępne:** Użytkownik posiada wykupiony bilet

**Kroki:**
1. Przejdź do "Moje zamówienia"
2. Znajdź swój bilet
3. Kliknij "Pobierz PDF"

**Oczekiwany rezultat:**
- ✅ Pobiera się plik PDF z nazwą `bilet_[ID].pdf`
- ✅ PDF zawiera: tytuł filmu, datę/godzinę, miejsca, cenę, kod QR
- ✅ Polskie znaki są poprawnie wyświetlane (używa czcionki DejaVu)
- ✅ Kod QR jest czytelny

---

## 3. System Lojalnościowy

### TC-LOYALTY-001: Naliczanie punktów za zakup biletu
**Priorytet:** Wysoki
**Warunki wstępne:** Użytkownik ma 0 punktów

**Kroki:**
1. Kup bilet za 30 PLN
2. Przejdź do "Punkty i Nagrody"

**Oczekiwany rezultat:**
- ✅ Saldo punktów: 50 pkt (bazowa wartość za zakup)
- ✅ W historii pojawia się wpis: "+50 pkt - Zakup biletu"

---

### TC-LOYALTY-002: Wymiana punktów na nagrodę barową
**Priorytet:** Wysoki
**Warunki wstępne:** Użytkownik ma 300 punktów

**Kroki:**
1. Przejdź do "Punkty i Nagrody"
2. Wybierz nagrodę "Popcorn + Cola" (300 pkt)
3. Kliknij "Odbierz"
4. Przejdź do "Moje zamówienia"
5. Znajdź zamówienie nagrody
6. Pokaż kod QR pracownikowi

**Oczekiwany rezultat:**
- ✅ Saldo punktów: 0 pkt
- ✅ Komunikat: "Nagroda dodana do Twoich zamówień"
- ✅ Zamówienie ze statusem "free" (Nagroda)
- ✅ Total: 0.00 PLN (Gratis - punkty)
- ✅ Kod QR zawiera ID zamówienia

---

### TC-LOYALTY-003: Wymiana punktów na darmowy bilet
**Priorytet:** Wysoki
**Warunki wstępne:** Użytkownik ma 500+ punktów

**Kroki:**
1. Przejdź do "Punkty i Nagrody"
2. Wybierz "Bilet gratis" (500 pkt)
3. Kliknij "Wybierz seans"
4. Zostaniesz przekierowany do strony głównej
5. Wybierz film i seans
6. Wybierz miejsca
7. Kliknij "Użyj darmowego biletu"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do repertuaru z podświetloną sekcją
- ✅ Możliwość wyboru dowolnego seansu
- ✅ Brak formularza płatności
- ✅ Saldo punktów: -500 pkt
- ✅ Bilet ze statusem "free"
- ✅ W "Moje zamówienia" widoczny darmowy bilet

---

## 4. Bar - Zamówienia

### TC-BAR-001: Zamówienie produktów z baru
**Priorytet:** Wysoki
**Warunki wstępne:** Użytkownik zalogowany

**Kroki:**
1. Przewiń do sekcji "Popcorn Bar" na stronie głównej
2. Dodaj produkty do koszyka:
   - 1x Popcorn średni (12 PLN)
   - 1x Cola 0.5L (8 PLN)
3. Kliknij "Kup teraz"
4. Wypełnij dane płatności (4242 4242 4242 4242)
5. Zatwierdź płatność

**Oczekiwany rezultat:**
- ✅ Suma: 20.00 PLN
- ✅ Płatność przechodzi
- ✅ Komunikat: "Płatność zakończona! Zamówienie oczekuje na przygotowanie"
- ✅ Koszyk jest pusty
- ✅ Zamówienie pojawia się w "Moje zamówienia" ze statusem "pending" (Oczekuje)
- ✅ Wyświetla się kod QR

---

### TC-BAR-002: Obsługa zamówienia przez pracownika
**Priorytet:** Krytyczny
**Warunki wstępne:** Istnieje zamówienie ze statusem "pending", użytkownik ma rolę "employee"

**Kroki:**
1. Zaloguj się jako pracownik
2. Przejdź do "Panel Pracownika" → zakładka "Zamówienia z baru"
3. Znajdź zamówienie klienta
4. Kliknij "Oznacz jako gotowe"
5. Po przygotowaniu, kliknij "Oznacz jako odebrane"

**Oczekiwany rezultat:**
- ✅ Zamówienie zmienia status: pending → ready → collected
- ✅ Po oznaczeniu "gotowe", klient widzi status "Gotowe" (niebieski)
- ✅ Po oznaczeniu "odebrane", zamówienie znika z listy aktywnych
- ✅ Zamówienie pojawia się w zakładce "Historia (24h)"
- ✅ Zamówienie w historii ma zielony badge "✓ Odebrane"

---

### TC-BAR-003: Skanowanie QR zamówienia
**Priorytet:** Średni
**Warunki wstępne:** Klient ma zamówienie z kodem QR

**Kroki:**
1. Jako pracownik, przejdź do "Zamówienia z baru"
2. W sekcji "Odczyt zamówienia z QR" wklej kod QR klienta
3. Kliknij "Odczytaj zamówienie"

**Oczekiwany rezultat:**
- ✅ Wyświetla się karta zamówienia z danymi klienta
- ✅ Widoczne produkty, cena, status
- ✅ Przyciski do zmiany statusu są aktywne

---

## 5. Panel Administratora

### TC-ADMIN-001: Dodanie nowego seansu
**Priorytet:** Wysoki
**Warunki wstępne:** Zalogowany jako admin

**Kroki:**
1. Przejdź do "Panel Admin"
2. Zakładka "Filmy i Seanse"
3. Wybierz istniejący film z listy
4. Kliknij "Dodaj seans"
5. Wypełnij:
   - Data: jutrzejsza data
   - Godzina: 18:00
   - Sala: Sala VIP Premium
   - Cena: 35.00 PLN
   - Format: 3D
6. Zatwierdź

**Oczekiwany rezultat:**
- ✅ Seans pojawia się na liście seansów
- ✅ Seans jest widoczny w repertuarze na stronie głównej
- ✅ Cena uwzględnia typ sali (VIP) i format (3D)

---

### TC-ADMIN-002: Dodanie filmu z OMDb API
**Priorytet:** Średni
**Warunki wstępne:** Klucz API OMDb skonfigurowany

**Kroki:**
1. Panel Admin → "Filmy i Seanse"
2. Wprowadź tytuł filmu: "Inception"
3. Kliknij "Szukaj w OMDb"
4. Wybierz film z wyników
5. Kliknij "Dodaj film"

**Oczekiwany rezultat:**
- ✅ Film pojawia się na liście z pełnymi danymi:
  - Tytuł, opis, plakat, reżyser, obsada
  - Czas trwania, rok produkcji, gatunek
- ✅ Plakat wyświetla się poprawnie

---

### TC-ADMIN-003: Dodanie aktualności
**Priorytet:** Niski

**Kroki:**
1. Panel Admin → "Aktualności"
2. Kliknij "Dodaj aktualność"
3. Wypełnij:
   - Tytuł: "Nowa promocja!"
   - Treść: "Każdy poniedziałek -50% na bilety"
   - Wyróżniona: TAK
4. Opublikuj

**Oczekiwany rezultat:**
- ✅ Aktualność pojawia się w sekcji "Aktualności" na stronie głównej
- ✅ Jest wyróżniona (inny styl/większa czcionka)
- ✅ Data publikacji jest aktualna

---

## 6. Panel Pracownika

### TC-EMPLOYEE-001: Weryfikacja biletu QR
**Priorytet:** Krytyczny
**Warunki wstępne:** Zalogowany jako pracownik, klient ma bilet na seans za 20 minut

**Kroki:**
1. Przejdź do "Panel Pracownika" → "Weryfikacja biletów"
2. Wklej/zeskanuj kod QR biletu (format: TICKET:123|Film|A1,A2|...)
3. Kliknij "Zweryfikuj bilet"

**Oczekiwany rezultat:**
- ✅ Wyświetla się zielona karta z danymi biletu:
  - Tytuł filmu
  - Data i godzina seansu
  - Sala
  - Miejsca
  - Imię klienta
- ✅ Komunikat: "Bilet zweryfikowany pomyślnie"

---

### TC-EMPLOYEE-002: Odrzucenie biletu spoza okna czasowego
**Priorytet:** Wysoki
**Warunki wstępne:** Klient ma bilet na seans za 45 minut

**Kroki:**
1. Panel Pracownika → Weryfikacja biletów
2. Zeskanuj kod QR biletu

**Oczekiwany rezultat:**
- ✅ Komunikat błędu: "Seans rozpocznie się za 45 minut. Weryfikacja możliwa 30 minut przed seansem"
- ✅ Bilet NIE jest akceptowany

---

### TC-EMPLOYEE-003: Historia odebranych zamówień
**Priorytet:** Średni
**Warunki wstępne:** Istnieją zamówienia z dzisiaj oznaczone jako "collected"

**Kroki:**
1. Panel Pracownika → zakładka "Historia (24h)"
2. Kliknij "Odśwież"

**Oczekiwany rezultat:**
- ✅ Wyświetlają się tylko zamówienia ze statusem "collected"
- ✅ Tylko z ostatnich 24 godzin
- ✅ Badge: "✓ Odebrane" (zielony)
- ✅ Brak przycisków do zmiany statusu
- ✅ Zamówienia starsze niż 24h nie są widoczne

---

## 7. Wyszukiwarka Filmów

### TC-SEARCH-001: Wyszukiwanie filmu po tytule
**Priorytet:** Średni

**Kroki:**
1. W górnym pasku wprowadź: "Inter"
2. Poczekaj na wyniki (auto-complete)
3. Kliknij na wynik "Interstellar"

**Oczekiwany rezultat:**
- ✅ Wyświetlają się wyniki po wpisaniu 2+ znaków
- ✅ Wyniki zawierają plakat i tytuł
- ✅ Po kliknięciu przekierowanie do `/movie/:id`
- ✅ Strona filmu wyświetla szczegóły i dostępne seanse

---

## 8. Rekomendacje AI

### TC-AI-001: Generowanie rekomendacji filmowych
**Priorytet:** Niski
**Warunki wstępne:** Klucz API OpenAI skonfigurowany

**Kroki:**
1. Przejdź do "Rekomendacje"
2. Wprowadź preferencje:
   - Gatunek: "Sci-Fi, Thriller"
   - Nastrój: "Akcja, Suspens"
3. Kliknij "Generuj rekomendacje"

**Oczekiwany rezultat:**
- ✅ Po kilku sekundach wyświetlają się rekomendacje (3-5 filmów)
- ✅ Każda rekomendacja zawiera: tytuł, opis, powód polecenia
- ✅ W przypadku błędu API wyświetla się komunikat błędu

---

## 9. Responsywność i UX

### TC-UX-001: Responsywność na urządzeniach mobilnych
**Priorytet:** Średni

**Kroki:**
1. Otwórz aplikację w trybie mobilnym (375px width)
2. Przetestuj:
   - Nawigację
   - Wybór miejsc
   - Formularz rezerwacji
   - Płatności

**Oczekiwany rezultat:**
- ✅ Wszystkie elementy są czytelne
- ✅ Przyciski są łatwe do kliknięcia (min. 44px)
- ✅ Brak poziomego scrollowania
- ✅ Menu jest dostępne (hamburger lub lista)

---

### TC-UX-002: Toast notifications
**Priorytet:** Niski

**Kroki:**
1. Wykonaj różne akcje:
   - Udana rezerwacja
   - Nieudana płatność
   - Dodanie do koszyka

**Oczekiwany rezultat:**
- ✅ Sukces: zielony toast, auto-hide po 3-5s
- ✅ Błąd: czerwony toast, auto-hide po 5s
- ✅ Info: niebieski toast
- ✅ Komunikaty są czytelne i zrozumiałe

---

## 10. Bezpieczeństwo

### TC-SEC-001: SQL Injection Protection
**Priorytet:** Krytyczny

**Kroki:**
1. Formularz logowania - email: `' OR '1'='1' --`
2. Spróbuj zalogować

**Oczekiwany rezultat:**
- ✅ Błąd logowania
- ✅ Brak dostępu do systemu
- ✅ Logi nie zawierają błędów SQL

---

### TC-SEC-002: XSS Protection
**Priorytet:** Wysoki

**Kroki:**
1. Formularz rejestracji - imię: `<script>alert('XSS')</script>`
2. Zarejestruj użytkownika
3. Sprawdź wyświetlanie imienia w różnych miejscach

**Oczekiwany rezultat:**
- ✅ Script nie jest wykonywany
- ✅ Wyświetla się jako tekst: `<script>alert('XSS')</script>`
- ✅ Brak alertu w przeglądarce

---

### TC-SEC-003: JWT Token Expiration
**Priorytet:** Średni

**Kroki:**
1. Zaloguj się
2. Poczekaj do wygaśnięcia tokena (lub zmodyfikuj ręcznie)
3. Spróbuj wykonać chronioną akcję (np. rezerwacja)

**Oczekiwany rezultat:**
- ✅ Automatyczne wylogowanie
- ✅ Przekierowanie do `/login`
- ✅ Komunikat: "Sesja wygasła, zaloguj się ponownie"

---

## Podsumowanie Testów

### Krytyczne (muszą działać):
- TC-TICKET-001: Rezerwacja biletu
- TC-BAR-002: Obsługa zamówienia przez pracownika
- TC-EMPLOYEE-001: Weryfikacja biletu QR
- TC-AUTH-001, TC-AUTH-002: Rejestracja i logowanie
- TC-SEC-001: Ochrona przed SQL Injection

### Wysokie:
- Wszystkie testy z kategorii Auth, Loyalty, Tickets
- TC-BAR-001: Zamówienie z baru
- TC-ADMIN-001: Dodanie seansu

### Średnie:
- Testy UX i wyszukiwarki
- Panel admina (dodawanie filmów)

### Niskie:
- Rekomendacje AI
- Toast notifications
- Aktualności

---

**Data ostatniej aktualizacji:** 2025-12-20
**Wersja:** 1.0
**Tester:** _______________
