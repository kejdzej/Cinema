# Testy - Cinema App Backend

## 📋 Zawartość

- **Testy jednostkowe** (`unit/`) - testują pojedyncze funkcje/moduły w izolacji
- **Testy integracyjne** (`integration/`) - testują współpracę między modułami i API endpoints

## 🚀 Uruchamianie testów

### ⚠️ WAŻNE: Przygotowanie środowiska

Przed uruchomieniem testów:

**1. Uruchom serwer (Terminal 1):**
```bash
cd server
npm run dev
```
Poczekaj aż zobaczysz: `Server running on http://localhost:4000`

**2. Upewnij się że baza danych działa:**
```bash
mysql -u root -p -e "USE cinema; SELECT COUNT(*) FROM users;"
```

**3. Uruchom testy (Terminal 2 - nowe okno terminala):**
```bash
cd server
npm test
```

### Uruchomienie wszystkich testów

```bash
npm test
```

**Uwaga:** Jeśli zobaczysz błąd `❌ Server is not running!`, oznacza to że serwer nie jest uruchomiony na `localhost:4000`. Wróć do kroku 1.

### Uruchomienie testów w trybie watch (automatyczne reruns)

```bash
npm run test:watch
```

### Generowanie raportu pokrycia kodu (coverage)

```bash
npm run test:coverage
```

Raport będzie dostępny w folderze `coverage/lcov-report/index.html`

## 📂 Struktura testów

```
__tests__/
├── unit/
│   └── pricingCalculator.test.js    # Testy kalkulacji cen
├── integration/
│   ├── auth.test.js                 # Testy autentykacji
│   └── loyalty.test.js              # Testy systemu lojalnościowego
└── README.md
```

## ✅ Pokrycie testów

### Testy jednostkowe:
- ✅ `utils/pricingCalculator.js`
  - calculateNumericPrice
  - detectHallType
  - calculateTotalPrice

### Testy integracyjne:
- ✅ `routes/auth.js`
  - POST /auth/register
  - POST /auth/login
  - GET /auth/me

- ✅ `routes/loyalty.js`
  - GET /loyalty/balance
  - GET /loyalty/rewards
  - POST /loyalty/redeem
  - GET /loyalty/history
  - GET /loyalty/code

## 📝 Konwencje nazewnictwa

- Pliki testów: `*.test.js`
- Testy jednostkowe: opisują funkcjonalność pojedynczej funkcji
- Testy integracyjne: opisują pełen przepływ użytkownika (user flow)

## 🔧 Konfiguracja

Konfiguracja testów znajduje się w `jest.config.js`:
- Środowisko: Node.js
- Wykluczenia: node_modules
- Pokrycie kodu: routes, utils, middleware

## 🐛 Debugowanie testów

### Uruchomienie pojedynczego pliku testowego:

```bash
npm test -- __tests__/unit/pricingCalculator.test.js
```

### Uruchomienie z verbose output:

```bash
npm test -- --verbose
```

### Debugowanie w VS Code:

Dodaj do `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## 📊 Przykładowy wynik testów

```
PASS  __tests__/unit/pricingCalculator.test.js
  PricingCalculator - Unit Tests
    calculateNumericPrice
      ✓ should convert string price to number (3 ms)
      ✓ should handle numeric input (1 ms)
      ✓ should return 0 for invalid input (1 ms)
    detectHallType
      ✓ should detect VIP hall by name (2 ms)
      ✓ should detect 3D hall by description (1 ms)
    calculateTotalPrice
      ✓ should calculate price for standard hall (2 ms)
      ✓ should apply VIP multiplier (1.5x) (1 ms)

PASS  __tests__/integration/auth.test.js
  Auth Integration Tests
    POST /auth/register
      ✓ should register a new user successfully (234 ms)
      ✓ should reject duplicate email (102 ms)

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Time:        3.456 s
```

## ⚠️ Uwagi

- Testy integracyjne tworzą i usuwają dane w bazie - **nie uruchamiaj na produkcji**
- Użyj osobnej bazy testowej dla testów integracyjnych
- Przed uruchomieniem testów upewnij się, że serwer jest dostępny na `http://localhost:4000`

## 🔜 Kolejne kroki (TODO)

- [ ] Testy dla routes/tickets.js (rezerwacja biletów)
- [ ] Testy dla routes/orders.js (zamówienia z baru)
- [ ] Testy dla routes/employee.js (panel pracownika)
- [ ] Testy dla routes/payments.js (płatności Stripe)
- [ ] Mocki dla zewnętrznych API (Stripe, OpenAI, OMDb)
- [ ] Testy E2E z Playwright/Cypress
