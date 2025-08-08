## REST API (zarys)
Wszystkie ścieżki poprzedzone `/api`. Autoryzacja JWT w httpOnly cookie. Role: `customer`, `staff`, `admin`.

### Auth
- POST `/auth/register` {email, password, firstName, lastName}
- POST `/auth/login` {email, password}
- POST `/auth/logout`
- GET `/auth/me`
- POST `/auth/2fa/setup` -> {otpauthUrl, secret} (admin/customer)
- POST `/auth/2fa/verify` {code}
- POST `/auth/password/forgot` {email}
- POST `/auth/password/reset` {token, newPassword}
- DELETE `/auth/account`

### Filmy i repertuar
- GET `/films` ?q=&genre=&from=&to=&page=
- GET `/films/{filmId}`
- GET `/showtimes` ?date=&filmId=&roomId=&city=
- GET `/showtimes/{showtimeId}`
- GET `/showtimes/{showtimeId}/seats` -> {room, seats: [{seatId,row,label,number,type,status}]}

### Rezerwacje i bilety
- POST `/showtimes/{showtimeId}/reserve` {seats:[seatId]} -> {bookingId, reservedUntil}
- POST `/bookings/{bookingId}/checkout` {method} -> {paymentSessionUrl | clientSecret}
- POST `/payments/webhook` (public) — idempotentny
- GET `/bookings/my` (customer)
- GET `/tickets/{ticketId}` (szczegóły)
- GET `/tickets/{ticketId}/pdf` (application/pdf)
- POST `/tickets/verify` (staff) {code} -> {valid, showtime, seat}
- DELETE `/bookings/{bookingId}` (anulacja przed seansem, jeśli unpaid)

### Popcorn Bar
- GET `/snacks`
- POST `/snack-orders` {items:[{snackItemId, qty}], pickupShowtimeId?}
- GET `/snack-orders/my`

### Program lojalnościowy
- GET `/loyalty` -> {points, tier, history}
- POST `/loyalty/redeem` {rewardId}

### Admin
- CRUD `/admin/films`
- CRUD `/admin/rooms` (z układem miejsc)
- CRUD `/admin/showtimes`
- CRUD `/admin/users` (role, blokada)
- GET `/admin/reports/sales` ?from=&to=&groupBy=day|film|room
- GET `/admin/reports/occupancy` ?from=&to=

### AI
- GET `/ai/recommendations` (dla zalogowanego lub na bazie trendów)
- POST `/ai/chat` {message} -> {reply, intents}

### Kody statusów
- 200/201 sukces, 400 walidacja, 401 nieautoryzowany, 403 brak uprawnień, 404 nie znaleziono, 409 konflikt (miejsce zajęte), 422 nieprawidłowy stan, 500 błąd.
