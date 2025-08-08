-- PostgreSQL DDL (zarys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Użytkownicy i role
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL -- admin, staff, customer
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Filmy i sale
CREATE TABLE films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  director TEXT,
  actors TEXT,
  duration_min INT,
  premiere_date DATE,
  age_rating TEXT,
  poster_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  total_rows INT NOT NULL,
  total_cols INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TYPE seat_type AS ENUM ('standard','vip','sofa','accessible');

CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  row_label TEXT NOT NULL,
  seat_number INT NOT NULL,
  type seat_type NOT NULL DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (room_id, row_label, seat_number)
);

CREATE TABLE showtimes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  base_price_cents INT NOT NULL DEFAULT 2200,
  language TEXT DEFAULT 'pl',
  format TEXT, -- 2D/3D/IMAX/4DX etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rezerwacje i bilety
CREATE TYPE booking_status AS ENUM ('reserved','paid','cancelled');

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'reserved',
  total_cents INT NOT NULL DEFAULT 0,
  reserved_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  price_cents INT NOT NULL,
  UNIQUE (showtime_id, seat_id) -- twarda blokada miejsca dla seansu
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  ticket_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Płatności
CREATE TYPE payment_status AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE payment_method AS ENUM ('card','blik','transfer');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount_cents INT NOT NULL,
  method payment_method,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_payment_id)
);

-- Popcorn Bar
CREATE TABLE snack_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TYPE snack_order_status AS ENUM ('pending','paid','cancelled','fulfilled');

CREATE TABLE snack_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_showtime_id UUID REFERENCES showtimes(id) ON DELETE SET NULL,
  total_cents INT NOT NULL DEFAULT 0,
  status snack_order_status NOT NULL DEFAULT 'pending',
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE snack_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snack_order_id UUID NOT NULL REFERENCES snack_orders(id) ON DELETE CASCADE,
  snack_item_id UUID NOT NULL REFERENCES snack_items(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_cents INT NOT NULL
);

-- Lojalność
CREATE TABLE loyalty_accounts (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  tier TEXT DEFAULT 'standard',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change INT NOT NULL,
  reason TEXT,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  related_snack_order_id UUID REFERENCES snack_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Promocje (prosty model)
CREATE TYPE discount_type AS ENUM ('percent','fixed');
CREATE TYPE applies_to AS ENUM ('ticket','snack','bundle');

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  discount_kind discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  applies applies_to NOT NULL,
  active_from TIMESTAMPTZ,
  active_to TIMESTAMPTZ,
  min_qty INT DEFAULT 1
);

-- Chatbot / log
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user','bot','staff')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeksy i porządkowanie
CREATE INDEX idx_showtimes_film_time ON showtimes (film_id, starts_at);
CREATE INDEX idx_booking_user ON bookings (user_id, created_at DESC);
CREATE INDEX idx_booking_showtime ON bookings (showtime_id);
CREATE INDEX idx_ticket_booking ON tickets (booking_id);
CREATE INDEX idx_snack_orders_user ON snack_orders (user_id, created_at DESC);
