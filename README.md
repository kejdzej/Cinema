# 🎬 Cinema App (React + Node.js + MySQL)


- **Client**: React (Vite), React Router, Axios, Context API.
- **Server**: Node.js + Express, MySQL (mysql2), JWT, bcrypt, CORS.
- **DB**: mySQL.

## Start

### 1) BD
Stworz nowa baze i zaimportuj `server/sql/schema.sql`:


### 2) server
```bash
cd server
npm install
npm run dev
```

### 3) client
```bash
cd client
npm install
npm run dev
```
Откройте http://localhost:5173

######
- Działa rejestracja i logowanie, zapis tego w bazie
- JWT w `localStorage` 
- rezerwacja miejsc
- Prykladowy zakup biletow
