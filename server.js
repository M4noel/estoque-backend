import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { connectDB } from './src/config/db.js';
import productRoutes from './src/routes/products.routes.js';
import warehouseRoutes from './src/routes/warehouses.routes.js';
import authRoutes from './src/routes/auth.routes.js';

// rotas de teste/mock
import webhookRoutes from './src/routes/webhook.routes.js';
import mockRoutes from './src/routes/mock.routes.js';

dotenv.config();
connectDB();

const app = express();

/* ===============================
   CORS (IMPORTANTE)
================================ */
app.use(cors({
  origin: [
    'http://localhost:5173',          // front local
    'https://estoque-front-mu.vercel.app/' // TROQUE pela sua URL real da Vercel
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 🔹 garante resposta do preflight
app.options('*', cors());

app.use(express.json());

/* ===============================
   ROTAS
================================ */

// rota raiz (teste)
app.get('/', (req, res) => {
  res.send('API Backend rodando 🚀');
});

// rotas da API
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// rotas de teste/mock
app.use('/webhook', webhookRoutes);
app.use('/mock', mockRoutes);

/* ===============================
   HANDLERS
================================ */

// erro geral
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Ocorreu um erro no servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
