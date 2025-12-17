import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import sessionRoutes from './routes/sessions.js';
import ticketRoutes from './routes/tickets.js';
import ordersRouter from "./routes/orders.js";
import paymentsRouter from './routes/payments.js';
import assistantRouter from "./routes/assistant.js";
import pdfRouter from "./routes/pdf.js";
import adminRouter from "./routes/admin.js";
import reportsRouter from "./routes/reports.js";
import employeeRouter from "./routes/employee.js";
import recommendationsRouter from "./routes/recommendations.js";
import newsRouter from "./routes/news.js";

import loyaltyRoutes from "./routes/loyalty.js";
console.log('--- LOYALTY ROUTER TYPE:', typeof loyaltyRoutes, '---');

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use("/api/orders", ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/pdf", pdfRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/employee', employeeRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/news', newsRouter);

app.use("/api/loyalty", loyaltyRoutes);


const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('Server started on port', port);
});