# 🔍 Analiza błędów w logice - Raport

## ⚠️ KRYTYCZNE BŁĘDY (do naprawy natychmiast)

### 1. **AdminDashboard.jsx - Modal blokuje interfejs**
**Problem**: Modal może pozostać otwarty (`showModal = true`) i zablokować cały interfejs
**Lokalizacja**: `client/src/pages/AdminDashboard.jsx:684`
**Przyczyna**: 
- Brak resetowania `showModal` przy zmianie zakładki
- Brak obsługi ESC do zamykania modala
- Modal renderuje się zawsze gdy `showModal === true`, nawet jeśli nie powinien

**Rozwiązanie**: 
- Dodać `useEffect` który zamyka modal przy zmianie `activeTab`
- Dodać obsługę ESC
- Sprawdzić czy modal nie renderuje się gdy `activeTab === 'reports'`

### 2. **Slider.jsx - Statyczne dane zamiast z bazy**
**Problem**: Slider używa hardcoded danych zamiast pobierać filmy z API
**Lokalizacja**: `client/src/components/Slider.jsx:5-24`
**Status**: ✅ NAPRAWIONE - teraz pobiera filmy z bazy

### 3. **Reservation.jsx - Błąd parsowania miejsc**
**Problem**: 
```javascript
setBookedSeats(tRes.data.map(t => t.seats).join(",").split(","))
```
**Lokalizacja**: `client/src/pages/Reservation.jsx:25`
**Przyczyna**: 
- Jeśli `t.seats` to string "A1,A2", to `join(",")` da "A1,A2,A3,A4" (dla wielu biletów)
- Potem `split(",")` rozdzieli poprawnie, ale może być problem jeśli `seats` jest już tablicą
- Brak sprawdzenia typu danych

**Ryzyko**: Błąd jeśli `seats` jest tablicą zamiast stringa

---

## ⚠️ ŚREDNIE BŁĘDY (mogą powodować problemy)

### 4. **Dashboard.jsx - Brak obsługi błędów JSON.parse**
**Problem**: 
```javascript
items: typeof o.items === "string" ? JSON.parse(o.items) : o.items
```
**Lokalizacja**: `client/src/pages/Dashboard.jsx:26`
**Przyczyna**: 
- `JSON.parse()` może rzucić błąd jeśli string jest niepoprawny
- Brak try-catch

**Ryzyko**: Crash aplikacji przy niepoprawnych danych w bazie

### 5. **PopcornBar.jsx - Brak walidacji przed checkout**
**Problem**: 
```javascript
const checkout = async () => {
  if (!user) {
    showToast("error", "Musisz się zalogować aby kupić")
    return
  }
  // Brak sprawdzenia czy cart nie jest pusty
```
**Lokalizacja**: `client/src/components/PopcornBar.jsx:36`
**Przyczyna**: 
- Można kliknąć "Kup" z pustym koszykiem
- Brak sprawdzenia `cart.length > 0`

**Ryzyko**: Puste zamówienia w bazie

### 6. **AdminDashboard.jsx - Brak walidacji formularza**
**Problem**: 
```javascript
hall_id: formData.hall_id ? parseInt(formData.hall_id) : null
```
**Lokalizacja**: `client/src/pages/AdminDashboard.jsx:208`
**Przyczyna**: 
- `parseInt("")` zwraca `NaN`, nie `null`
- Brak sprawdzenia czy `formData.hall_id` to poprawna liczba

**Ryzyko**: `NaN` w bazie danych

### 7. **Reservation.jsx - Brak sprawdzenia czy seans nie minął**
**Problem**: 
```javascript
const purchase = async () => {
  // Brak sprawdzenia czy datetime >= NOW()
```
**Lokalizacja**: `client/src/pages/Reservation.jsx:40`
**Przyczyna**: 
- Można kupić bilet na seans który już się odbył
- Brak walidacji po stronie frontendu

**Ryzyko**: Bilety na przeszłe seanse

### 8. **AdminDashboard.jsx - Race condition w loadData**
**Problem**: 
```javascript
useEffect(() => {
  if (user && user.role === 'admin') {
    loadData(activeTab);
  }
}, [activeTab, user]);
```
**Lokalizacja**: `client/src/pages/AdminDashboard.jsx:36`
**Przyczyna**: 
- Jeśli użytkownik szybko przełącza zakładki, wiele requestów może być w toku
- Brak anulowania poprzednich requestów
- Ostatni request może zwrócić dane dla poprzedniej zakładki

**Ryzyko**: Wyświetlanie nieprawidłowych danych

### 9. **StatsCard.jsx - Brak obsługi błędów**
**Problem**: 
```javascript
const loadStats = async () => {
  try {
    const [ticketsRes, ordersRes, pointsRes] = await Promise.all([
      api.get('/tickets/mine').catch(() => ({ data: [] })),
      api.get('/orders').catch(() => ({ data: [] })),
      api.get('/loyalty/points').catch(() => ({ data: { points: 0 } }))
    ]);
```
**Lokalizacja**: `client/src/components/StatsCard.jsx:15`
**Status**: ✅ OK - ma obsługę błędów

### 10. **Home.jsx - Brak sprawdzenia czy sessions istnieją**
**Problem**: 
```javascript
const filteredSessions = sessions.filter(s => {
  const sessionDate = new Date(s.datetime)
  return sessionDate.toDateString() === selectedDate.toDateString()
})
```
**Lokalizacja**: `client/src/pages/Home.jsx:39`
**Przyczyna**: 
- Jeśli `s.datetime` jest `null` lub `undefined`, `new Date(null)` zwróci `Invalid Date`
- Brak sprawdzenia czy `s.datetime` istnieje

**Ryzyko**: Błędy przy renderowaniu

---

## ⚠️ DROBNE BŁĘDY (nie krytyczne, ale warto poprawić)

### 11. **Dashboard.jsx - Brak dependency w useEffect**
**Problem**: 
```javascript
}, [showToast]); // Добавляем showToast в зависимости
```
**Lokalizacja**: `client/src/pages/Dashboard.jsx:31`
**Przyczyna**: 
- `showToast` jest funkcją z kontekstu, nie powinna być w dependencies
- Może powodować niepotrzebne re-rendery

**Rozwiązanie**: Usunąć `showToast` z dependencies lub użyć `useCallback` w kontekście

### 12. **Reservation.jsx - Brak sprawdzenia czy miejsca są dostępne**
**Problem**: 
```javascript
const toggleSeat = (seat) => {
  if (bookedSeats.includes(seat)) return
  // Brak sprawdzenia czy seans nie minął
```
**Lokalizacja**: `client/src/pages/Reservation.jsx:31`
**Przyczyna**: 
- Można wybrać miejsca nawet jeśli seans już się odbył
- Brak sprawdzenia `session.datetime >= NOW()`

### 13. **PopcornBar.jsx - Brak sprawdzenia czy produkty istnieją**
**Problem**: 
```javascript
const products = [
  { id: 1, name: "Popcorn klasyczny", price: 12, img: "/posters/popcorn.jpg" },
  // Hardcoded produkty
```
**Lokalizacja**: `client/src/components/PopcornBar.jsx:7`
**Przyczyna**: 
- Produkty są hardcoded zamiast z bazy
- Brak synchronizacji z backendem

**Uwaga**: To może być zamierzone, ale warto rozważyć API endpoint dla produktów

### 14. **AdminDashboard.jsx - Brak walidacji daty**
**Problem**: 
```javascript
datetime: item.datetime ? new Date(item.datetime).toISOString().slice(0, 16) : '',
```
**Lokalizacja**: `client/src/pages/AdminDashboard.jsx:134`
**Przyczyna**: 
- Jeśli `item.datetime` jest niepoprawną datą, `new Date()` zwróci `Invalid Date`
- Brak sprawdzenia czy data jest poprawna

### 15. **Recommendations.jsx - Brak obsługi pustej listy**
**Problem**: 
```javascript
if (watchedIds.length > 0) {
  const [recRows] = await pool.query(/* ... */);
  recommendations = recRows;
} else {
  // Losowe filmy
}
```
**Lokalizacja**: `server/routes/recommendations.js`
**Przyczyna**: 
- Jeśli `recRows` jest pusty, użytkownik nie zobaczy rekomendacji
- Brak fallback do losowych filmów gdy brak rekomendacji

---

## 📋 PODSUMOWANIE

### Błędy krytyczne: 3
1. ✅ Modal blokuje interfejs (NAPRAWIONE - dodano reset przy zmianie zakładki)
2. ✅ Slider używa statycznych danych (NAPRAWIONE - teraz pobiera z bazy)
3. ⚠️ Reservation.jsx - błąd parsowania miejsc (WYMAGA NAPRAWY)

### Błędy średnie: 7
4. ⚠️ Dashboard.jsx - brak obsługi błędów JSON.parse
5. ⚠️ PopcornBar.jsx - brak walidacji przed checkout
6. ⚠️ AdminDashboard.jsx - brak walidacji formularza
7. ⚠️ Reservation.jsx - brak sprawdzenia czy seans nie minął
8. ⚠️ AdminDashboard.jsx - race condition w loadData
9. ✅ StatsCard.jsx - OK (ma obsługę błędów)
10. ⚠️ Home.jsx - brak sprawdzenia czy sessions istnieją

### Błędy drobne: 5
11. ⚠️ Dashboard.jsx - niepotrzebna dependency
12. ⚠️ Reservation.jsx - brak sprawdzenia dostępności miejsc
13. ⚠️ PopcornBar.jsx - hardcoded produkty
14. ⚠️ AdminDashboard.jsx - brak walidacji daty
15. ⚠️ Recommendations.jsx - brak obsługi pustej listy

---

## 🎯 PRIORYTETY NAPRAWY

### Wysoki priorytet (przed prezentacją):
1. ✅ Modal blokuje interfejs - **NAPRAWIONE**
2. ✅ Slider - **NAPRAWIONE**
3. ⚠️ Reservation.jsx - parsowanie miejsc (dodać try-catch i sprawdzenie typu)
4. ⚠️ PopcornBar.jsx - walidacja przed checkout (sprawdzić `cart.length > 0`)
5. ⚠️ AdminDashboard.jsx - race condition (dodać AbortController)

### Średni priorytet:
6. ⚠️ Dashboard.jsx - obsługa błędów JSON.parse
7. ⚠️ Reservation.jsx - sprawdzenie czy seans nie minął
8. ⚠️ Home.jsx - sprawdzenie czy sessions istnieją

### Niski priorytet:
9. ⚠️ Pozostałe drobne błędy

---

## 📝 UWAGI

- Większość błędów to brak walidacji danych
- Brak obsługi edge cases (puste dane, niepoprawne typy)
- Niektóre komponenty nie sprawdzają czy dane istnieją przed użyciem
- Brak error boundaries w React

---

## ✅ CO ZOSTAŁO NAPRAWIONE:

1. ✅ **Modal blokuje interfejs** - dodano reset `showModal` przy zmianie zakładki
2. ✅ **Slider** - teraz pobiera filmy z bazy danych
3. ✅ **closeModal** - dodano reset formData

---

## ⚠️ CO WYMAGA NAPRAWY:

1. ⚠️ **Reservation.jsx** - parsowanie miejsc (linia 25)
2. ⚠️ **PopcornBar.jsx** - walidacja przed checkout (linia 36)
3. ⚠️ **AdminDashboard.jsx** - race condition w loadData (linia 36)
4. ⚠️ **Dashboard.jsx** - obsługa błędów JSON.parse (linia 26)
5. ⚠️ **Reservation.jsx** - sprawdzenie czy seans nie minął (linia 40)

