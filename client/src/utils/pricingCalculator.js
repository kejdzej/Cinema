/**
 * Pricing Calculator Utility - Client Side
 * Centralna logika obliczania cen biletów po stronie klienta
 */

/**
 * Określa czy dane miejsce jest kanapą
 * ZASADA: Wszystkie sale mają kanapy w OSTATNICH 2 RZĘDACH
 * @param {string} seat - Numer miejsca (np. "A1", "F5")
 * @param {string} hallType - Typ sali (nieużywane - zachowane dla kompatybilności)
 * @param {string} hallName - Nazwa sali (nieużywane - zachowane dla kompatybilności)
 * @param {number} totalRows - Liczba rzędów w sali
 * @returns {boolean} true jeśli miejsce jest kanapą
 */
export function isSeatCouch(seat, hallType, hallName, totalRows) {
  const rowLetter = seat[0];
  const rowNumber = rowLetter.charCodeAt(0) - 65;

  return rowNumber >= totalRows - 2;
}

/**
 * Oblicza cenę pojedynczego miejsca
 * @param {string} seat - Numer miejsca
 * @param {object} hallInfo - {type, name, totalRows}
 * @param {number} sessionPrice - Cena bazowa seansu (ustawiona przez admina)
 * @returns {number} Cena miejsca
 */
export function calculateSeatPrice(seat, hallInfo, sessionPrice) {
  const { type: hallType, name: hallName, totalRows } = hallInfo;

  const isCouch = isSeatCouch(seat, hallType, hallName, totalRows);
  return isCouch ? sessionPrice * 2 : sessionPrice;
}

/**
 * Oblicza całkowitą cenę dla tablicy miejsc
 * @param {string[]} seats - Tablica numerów miejsc
 * @param {object} hallInfo - {type, name, totalRows}
 * @param {number} sessionPrice - Cena bazowa seansu
 * @returns {number} Całkowita cena
 */
export function calculateTotalPrice(seats, hallInfo, sessionPrice) {
  if (!Array.isArray(seats) || seats.length === 0) {
    return 0;
  }

  return seats.reduce((sum, seat) => {
    return sum + calculateSeatPrice(seat, hallInfo, sessionPrice);
  }, 0);
}

/**
 * @param {string[]} seats - Tablica numerów miejsc
 * @param {object} hallInfo - {type, name, totalRows}
 * @param {number} sessionPrice - Cena bazowa seansu
 * @returns {object} Obiekt z informacjami {couchSeats, normalSeats, couchPrice, normalPrice}
 */
export function getPriceBreakdown(seats, hallInfo, sessionPrice) {
  const { type: hallType, name: hallName, totalRows } = hallInfo;

  const couchSeats = seats.filter(seat =>
    isSeatCouch(seat, hallType, hallName, totalRows)
  );
  const normalSeats = seats.filter(seat =>
    !isSeatCouch(seat, hallType, hallName, totalRows)
  );

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
