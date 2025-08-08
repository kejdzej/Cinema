# Cinema Backend API

Backend API for the cinema booking system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Update `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `STRIPE_SECRET_KEY`: Your Stripe test key

4. Start PostgreSQL and Redis (or use Docker):
```bash
# PostgreSQL
docker run -d --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=cinema_db -p 5432:5432 postgres:15

# Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Seed the database:
```bash
npm run db:seed
```

7. Start development server:
```bash
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/films` - List films
- `GET /api/showtimes` - List showtimes
- `GET /api/showtimes/:id/seats` - Get seat availability
- `POST /api/showtimes/:id/reserve` - Reserve seats
- `POST /api/bookings/:id/checkout` - Process payment
- `GET /api/tickets/:id/pdf` - Download ticket PDF

## Development

- `npm run dev` - Start development server with hot reload
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```
src/
├── app.js              # Main application
├── routes/             # API route handlers
├── middleware/         # Express middleware
├── utils/             # Utility functions
├── database/          # Database connection and migrations
└── services/          # Business logic
```
