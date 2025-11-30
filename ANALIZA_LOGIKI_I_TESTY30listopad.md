# 🔍 Analiza logiki aplikacji i plan testów

## 📋 Główne przepływy użytkownika

### 1. Rejestracja i logowanie
- ✅ Rejestracja z walidacją email
- ✅ Logowanie z JWT
- ✅ Przechowywanie użytkownika w localStorage
- ⚠️ **Edge case**: Co jeśli token wygaśnie podczas sesji?
- ⚠️ **Edge case**: Co jeśli użytkownik ma już konto?

### 2. Przeglądanie repertuaru
- ✅ Filtrowanie po dacie
- ✅ Wyświetlanie seansów
- ⚠️ **Edge case**: Co jeśli brak seansów na wybrany dzień?
- ⚠️ **Edge case**: Co jeśli seans już się odbył?

### 3. Rezerwacja miejsc
- ✅ Wybór miejsc
- ✅ Sprawdzanie zajętych miejsc
- ✅ Obliczanie ceny (fotele vs kanapy, VIP)
- ⚠️ **Edge case**: Co jeśli ktoś inny zarezerwował miejsce w tym samym czasie?
- ⚠️ **Edge case**: Co jeśli użytkownik wybierze miejsce, które już jest zajęte?
- ⚠️ **Edge case**: Co jeśli seans minął podczas rezerwacji?

### 4. Płatność
- ✅ Tworzenie PaymentIntent
- ✅ Integracja ze Stripe
- ⚠️ **Edge case**: Co jeśli płatność się nie powiedzie?
- ⚠️ **Edge case**: Co jeśli użytkownik zamknie okno podczas płatności?

### 5. Anulowanie biletu
- ✅ Sprawdzanie czy minęła 1 godzina przed seansem
- ✅ Zwrot punktów lojalnościowych
- ⚠️ **Edge case**: Co jeśli seans już się odbył?
- ⚠️ **Edge case**: Co jeśli bilet został już użyty (zweryfikowany)?

## 🐛 Zidentyfikowane edge cases

### Rezerwacja miejsc

1. **Race condition przy rezerwacji**
   - Problem: Dwa użytkownicy mogą wybrać to samo miejsce jednocześnie
   - Status: ⚠️ NIE OBSŁUŻONE - brak transakcji w bazie danych
   - Rozwiązanie: Dodać UNIQUE constraint lub użyć SELECT FOR UPDATE

2. **Seans który już się odbył**
   - Problem: Użytkownik może próbować kupić bilet na przeszły seans
   - Status: ✅ CZĘŚCIOWO OBSŁUŻONE - sprawdzane w frontendzie, ale nie w backendzie
   - Rozwiązanie: Dodać walidację w backendzie

3. **Brak miejsc w sali**
   - Problem: Co jeśli wszystkie miejsca są zajęte?
   - Status: ⚠️ NIE OBSŁUŻONE - brak komunikatu dla użytkownika
   - Rozwiązanie: Dodać komunikat "Brak wolnych miejsc"

4. **Nieprawidłowe dane miejsc**
   - Problem: Co jeśli `seats` jest null, undefined, lub nieprawidłowym formatem?
   - Status: ✅ OBSŁUŻONE - try-catch w parsowaniu

5. **Cena = 0 lub ujemna**
   - Problem: Co jeśli cena seansu jest 0 lub ujemna?
   - Status: ⚠️ NIE OBSŁUŻONE - brak walidacji

### Płatności

1. **Płatność bez biletu**
   - Problem: Co jeśli PaymentIntent zostanie utworzony, ale bilet nie?
   - Status: ⚠️ CZĘŚCIOWO OBSŁUŻONE - bilet tworzony przed PaymentIntent

2. **Podwójna płatność**
   - Problem: Co jeśli użytkownik kliknie "Zapłać" dwa razy?
   - Status: ⚠️ NIE OBSŁUŻONE - brak blokady

3. **Płatność dla nieistniejącego biletu**
   - Problem: Co jeśli `ticketId` w PaymentIntent nie istnieje?
   - Status: ⚠️ NIE OBSŁUŻONE - brak walidacji

### Anulowanie biletu

1. **Anulowanie już zweryfikowanego biletu**
   - Problem: Co jeśli pracownik już zweryfikował bilet QR?
   - Status: ⚠️ NIE OBSŁUŻONE - brak sprawdzenia statusu weryfikacji

2. **Anulowanie w ostatniej godzinie**
   - Problem: Co jeśli użytkownik próbuje anulować < 1h przed seansem?
   - Status: ✅ OBSŁUŻONE - sprawdzane w frontendzie i backendzie

3. **Zwrot punktów przy anulowaniu**
   - Problem: Co jeśli użytkownik nie miał punktów przed zakupem?
   - Status: ⚠️ NIE OBSŁUŻONE - może spowodować ujemne punkty

### Program lojalnościowy

1. **Ujemne punkty**
   - Problem: Co jeśli użytkownik ma ujemne punkty?
   - Status: ⚠️ NIE OBSŁUŻONE - brak walidacji

2. **Wymiana nagród bez wystarczających punktów**
   - Problem: Co jeśli użytkownik próbuje wymienić nagrodę bez punktów?
   - Status: ⚠️ NIE SPRAWDZONE - wymaga testu

### Panel administratora

1. **Race condition przy ładowaniu danych**
   - Problem: Szybkie przełączanie zakładek może powodować race condition
   - Status: ✅ OBSŁUŻONE - AbortController w AdminDashboard

2. **Edycja seansu który już się odbył**
   - Problem: Czy admin może edytować przeszły seans?
   - Status: ⚠️ NIE OBSŁUŻONE - brak walidacji

3. **Usunięcie sali która ma seanse**
   - Problem: Co jeśli admin próbuje usunąć salę z przypisanymi seansami?
   - Status: ⚠️ NIE OBSŁUŻONE - może spowodować błąd foreign key

### Panel pracownika

1. **Weryfikacja już zweryfikowanego biletu**
   - Problem: Co jeśli pracownik próbuje zweryfikować bilet dwa razy?
   - Status: ⚠️ NIE OBSŁUŻONE - brak sprawdzenia

2. **Weryfikacja anulowanego biletu**
   - Problem: Co jeśli pracownik próbuje zweryfikować anulowany bilet?
   - Status: ⚠️ NIE OBSŁUŻONE - brak sprawdzenia

## 🧪 Plan testów

### Testy funkcjonalne

#### 1. Rezerwacja i zakup biletów
- [ ] Wybór pojedynczego miejsca
- [ ] Wybór wielu miejsc
- [ ] Wybór miejsca które jest już zajęte
- [ ] Wybór miejsca na seans który już się odbył
- [ ] Wybór miejsca na seans który zaczyna się za < 1h
- [ ] Obliczanie ceny dla foteli standardowych
- [ ] Obliczanie ceny dla kanap (2x cena)
- [ ] Obliczanie ceny dla foteli VIP (35 zł)
- [ ] Obliczanie ceny dla kanap VIP (70 zł)
- [ ] Rezerwacja w sali 1 (72 miejsca, ostatnie 2 rzędy to kanapy)
- [ ] Rezerwacja w sali 2 (50 miejsc, ostatnie 2 rzędy to kanapy)
- [ ] Rezerwacja w sali 3 (96 miejsc, rzędy I-J to kanapy)
- [ ] Rezerwacja w sali 4 VIP (72 miejsca, rzędy F-G to kanapy)

#### 2. Płatności
- [ ] Płatność za bilet
- [ ] Płatność za zamówienie z baru
- [ ] Anulowanie płatności
- [ ] Płatność która się nie powiodła
- [ ] Podwójna płatność (kliknięcie dwa razy)

#### 3. Anulowanie biletu
- [ ] Anulowanie > 1h przed seansem
- [ ] Anulowanie < 1h przed seansem (powinno się nie udać)
- [ ] Anulowanie biletu który już się odbył (powinno się nie udać)
- [ ] Zwrot punktów lojalnościowych przy anulowaniu
- [ ] Sprawdzenie czy bilet został usunięty z bazy

#### 4. Program lojalnościowy
- [ ] Przyznawanie punktów za zakup biletu (100 punktów)
- [ ] Przyznawanie punktów za zakup w barze
- [ ] Wymiana punktów na nagrody
- [ ] Sprawdzenie czy użytkownik ma wystarczająco punktów
- [ ] Historia punktów

#### 5. Panel administratora
- [ ] Dodawanie filmu
- [ ] Edycja filmu
- [ ] Usuwanie filmu (sprawdzić czy są seanse)
- [ ] Dodawanie seansu
- [ ] Edycja seansu
- [ ] Usuwanie seansu (sprawdzić czy są bilety)
- [ ] Dodawanie sali
- [ ] Edycja sali
- [ ] Usuwanie sali (sprawdzić czy są seanse)
- [ ] Zarządzanie użytkownikami
- [ ] Zmiana roli użytkownika
- [ ] Generowanie raportów

#### 6. Panel pracownika
- [ ] Weryfikacja biletu QR
- [ ] Weryfikacja już zweryfikowanego biletu
- [ ] Weryfikacja anulowanego biletu
- [ ] Wyświetlanie zamówień z baru
- [ ] Zmiana statusu zamówienia (pending → ready → collected)

### Testy edge cases

#### 1. Dane wejściowe
- [ ] Pusty email przy rejestracji
- [ ] Nieprawidłowy format email
- [ ] Zbyt krótkie hasło
- [ ] Puste pola w formularzach
- [ ] Ujemne ceny
- [ ] Cena = 0
- [ ] Nieprawidłowa data (przeszłość)
- [ ] Nieprawidłowa data (za daleko w przyszłość)

#### 2. Stan aplikacji
- [ ] Brak połączenia z serwerem
- [ ] Timeout przy zapytaniu
- [ ] Błąd 404 (nieistniejący seans/bilet)
- [ ] Błąd 500 (błąd serwera)
- [ ] Token wygasł podczas sesji
- [ ] Użytkownik wylogowany podczas rezerwacji

#### 3. Race conditions
- [ ] Dwa użytkownicy rezerwują to samo miejsce
- [ ] Szybkie przełączanie zakładek w panelu admina
- [ ] Podwójne kliknięcie przy płatności

#### 4. Granice danych
- [ ] Maksymalna liczba miejsc w sali
- [ ] Maksymalna liczba seansów
- [ ] Maksymalna liczba użytkowników
- [ ] Bardzo długie nazwy filmów
- [ ] Bardzo długie opisy

### Testy bezpieczeństwa

- [ ] Próba dostępu do panelu admina bez uprawnień
- [ ] Próba dostępu do panelu pracownika bez uprawnień
- [ ] Próba edycji cudzego biletu
- [ ] Próba anulowania cudzego biletu
- [ ] Próba dostępu do cudzych zamówień
- [ ] SQL injection (sprawdzić czy wszystkie zapytania używają prepared statements)
- [ ] XSS (sprawdzić czy dane użytkownika są escapowane)

### Testy wydajności

- [ ] Ładowanie strony głównej z wieloma seansami
- [ ] Ładowanie panelu admina z wieloma danymi
- [ ] Generowanie raportów dla dużych ilości danych
- [ ] Wyszukiwanie filmów

## 🔧 Rekomendowane poprawki

### Krytyczne (przed wdrożeniem)

1. **Race condition przy rezerwacji miejsc** ⚠️
   - Problem: Dwa użytkownicy mogą zarezerwować to samo miejsce jednocześnie
   - Obecny stan: Brak ochrony przed race condition
   - Rozwiązanie:
   ```javascript
   // W tickets.js przed INSERT - sprawdź czy miejsce nie jest już zajęte
   for (const seat of seatArr) {
     const [existing] = await pool.query(
       "SELECT id FROM tickets WHERE session_id = ? AND FIND_IN_SET(?, seats) > 0",
       [session_id, seat.trim()]
     );
     if (existing.length > 0) {
       return res.status(409).json({ message: `Miejsce ${seat} jest już zajęte` });
     }
   }
   ```

2. **Walidacja seansu w backendzie** ⚠️
   - Problem: Frontend sprawdza czy seans minął, ale backend nie
   - Obecny stan: Tylko frontend sprawdza
   - Rozwiązanie:
   ```javascript
   // W tickets.js przed utworzeniem biletu
   if (new Date(session.datetime) < new Date()) {
     return res.status(400).json({ message: "Nie można kupić biletu na seans który już się odbył" });
   }
   ```

3. **Sprawdzenie czy wszystkie miejsca są wolne** ⚠️
   - Problem: Jeśli użytkownik wybierze 5 miejsc, a jedno jest zajęte, cała transakcja powinna się nie powieść
   - Obecny stan: Brak sprawdzenia przed INSERT
   - Rozwiązanie: Sprawdzić wszystkie miejsca przed utworzeniem biletu (patrz punkt 1)

### Ważne (do poprawy)

4. **Walidacja ceny** ⚠️
   - Problem: Brak sprawdzenia czy cena jest > 0
   - Rozwiązanie:
   ```javascript
   if (sessionPrice <= 0) {
     return res.status(400).json({ message: "Nieprawidłowa cena seansu" });
   }
   ```

5. **Sprawdzenie czy miejsce istnieje w sali** ⚠️
   - Problem: Użytkownik może wysłać nieistniejące miejsce (np. Z99)
   - Rozwiązanie: Sprawdzić czy miejsce jest w zakresie sali przed rezerwacją

6. **Walidacja punktów lojalnościowych** ✅
   - Status: CZĘŚCIOWO OBSŁUŻONE - sprawdzane w `/loyalty/spend`
   - Problem: Brak sprawdzenia przy anulowaniu biletu (może spowodować ujemne punkty)
   - Rozwiązanie: Sprawdzić `points >= pointsToReturn` przed odjęciem

7. **Błąd w loyalty.js** ⚠️
   - Problem: W linii 69 używa `points` zamiast `change_amount` w INSERT
   - Rozwiązanie: Poprawić na `change_amount`

### Opcjonalne (ulepszenia)

7. **Cache dla często używanych danych**
8. **Paginacja dla długich list**
9. **Lepsze komunikaty błędów**
10. **Logowanie akcji administratora**

## 📝 Checklist przed wdrożeniem

- [ ] Wszystkie edge cases są obsłużone
- [ ] Wszystkie testy funkcjonalne przeszły
- [ ] Testy bezpieczeństwa przeszły
- [ ] Dokumentacja jest aktualna
- [ ] Błędy są logowane
- [ ] Komunikaty błędów są zrozumiałe dla użytkownika
- [ ] Wszystkie zapytania SQL używają prepared statements
- [ ] Wszystkie dane użytkownika są walidowane
- [ ] Wszystkie dane użytkownika są escapowane przed wyświetleniem

