/**
 * Pricing Calculator Utility
 * Centralna logika obliczania cen biletów
 */

/**
 * Wykrywa typ sali na podstawie nazwy/description (helper dla kompatybilności)
 * @param {string} hallName - Nazwa sali
 * @param {string} description - Opis sali
 * @returns {string} Typ sali: 'vip', 'mixed', lub 'standard'
 */
export function detectHallType(hallName = '', description = '') {
  const name = String(hallName).toLowerCase();
  const desc = String(description).toLowerCase();

  if (name.includes('vip') || desc.includes('vip')) {
    return 'vip';
  }

  if (name.includes('sala 3')) {
    return 'mixed';
  }

  return 'standard';
}

/**
 * Określa czy dane miejsce jest kanapą
 * @param {string} seat - Numer miejsca (np. "A1", "F5")
 * @param {string} hallType - Typ sali ('vip', 'mixed', 'standard')
 * @param {string} hallName - Nazwa sali (np. "Sala 4")
 * @param {number} hallCapacity - Pojemność sali
 * @param {number} totalRows - Liczba rzędów w sali (opcjonalnie, dla klienta)
 * @returns {boolean} true jeśli miejsce jest kanapą
 */
export function isSeatCouch(seat, hallType, hallName = '', hallCapacity = 40, totalRows = null) {
  const rowLetter = seat.trim()[0];

  // Sala 3 (mixed) i Sala 4 (VIP) - obie mają kanapy w rzędach F, G
  if (hallType === 'vip' || hallType === 'mixed') {
    return ['F', 'G'].includes(rowLetter);
  }

  // Dla sal standardowych używamy capacity
  const rowNumber = rowLetter.charCodeAt(0);

  if (totalRows !== null) {
    const rowIndex = rowLetter.charCodeAt(0) - 65;
    return rowIndex >= totalRows - 2;
  }

  if (hallCapacity === 88) { // Sala 1: kanapy w H, I
    return rowNumber === 72 || rowNumber === 73; // H=72, I=73
  } else if (hallCapacity === 70) { // Sala 2: kanapy w D, E
    return rowNumber === 68 || rowNumber === 69; // D=68, E=69
  } else {
    return rowNumber >= 70;
  }
}

/**
 * Oblicza cenę pojedynczego miejsca
 * @param {string} seat - Numer miejsca
 * @param {object} hallInfo - Informacje o sali {type, name, capacity}
 * @param {number} sessionPrice - Cena bazowa seansu (ustawiona przez admina)
 * @returns {number} Cena miejsca
 */
export function calculateSeatPrice(seat, hallInfo, sessionPrice) {
  const { type: hallType = 'standard', name: hallName = '', capacity: hallCapacity = 40 } = hallInfo;

  // Wszystkie sale używają tego samego systemu:
  // Kanapy = 2x cena bazowa, Fotele = 1x cena bazowa
  const isCouch = isSeatCouch(seat, hallType, hallName, hallCapacity);
  return isCouch ? sessionPrice * 2 : sessionPrice;
}

/**
 * Oblicza całkowitą cenę dla tablicy miejsc
 * @param {string[]} seats - Tablica numerów miejsc
 * @param {object} hallInfo - Informacje o sali {type, name, capacity}
 * @param {number} sessionPrice - Cena bazowa seansu
 * @returns {number} Całkowita cena (zaokrąglona do 2 miejsc po przecinku)
 */
export function calculateTotalPrice(seats, hallInfo, sessionPrice) {
  if (!Array.isArray(seats) || seats.length === 0) {
    return 0;
  }

  const total = seats.reduce((sum, seat) => {
    return sum + calculateSeatPrice(seat, hallInfo, sessionPrice);
  }, 0);

  // Zaokrąglij do 2 miejsc po przecinku
  return Math.round(total * 100) / 100;
}

/**
 * Konwertuje wartość na liczbę (helper do parsowania cen z bazy)
 * @param {*} value - Wartość do konwersji (string lub number)
 * @returns {number} Wartość numeryczna
 */
export function calculateNumericPrice(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Zwraca szczegółowe informacje o cenach dla wybranych miejsc
 * @param {string[]} seats - Tablica numerów miejsc
 * @param {object} hallInfo - Informacje o sali
 * @param {number} sessionPrice - Cena bazowa seansu
 * @returns {object} Obiekt z informacjami {couchSeats, normalSeats, total}
 */
export function getPriceBreakdown(seats, hallInfo, sessionPrice) {
  const { type: hallType = 'standard', name: hallName = '', capacity: hallCapacity = 40 } = hallInfo;

  const couchSeats = [];
  const normalSeats = [];

  seats.forEach(seat => {
    if (isSeatCouch(seat, hallType, hallName, hallCapacity)) {
      couchSeats.push(seat);
    } else {
      normalSeats.push(seat);
    }
  });

  // Wszystkie sale: kanapy = 2x, fotele = 1x
  const couchPrice = sessionPrice * 2;
  const normalPrice = sessionPrice;

  return {
    couchSeats,
    normalSeats,
    couchPrice,
    normalPrice,
    couchSubtotal: couchSeats.length * couchPrice,
    normalSubtotal: normalSeats.length * normalPrice,
    total: calculateTotalPrice(seats, hallInfo, sessionPrice)
  };
}
