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
   CORS (FORMA CORRETA)
================================ */
const allowedOrigins = [
  'http://localhost:5173',
  'https://estoque-front-mu.vercel.app' // SEM barra no final
];

app.use(cors({
  origin: (origin, callback) => {
    // permite requests sem origin (Postman, Render healthcheck)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

/* ===============================
   ROTAS
================================ */

// rota raiz
app.get('/', (req, res) => {
  res.send('API Backend rodando 🚀');
});

// rotas principais
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// rotas mock/teste
app.use('/webhook', webhookRoutes);
app.use('/mock', mockRoutes);

/* ===============================
   HANDLERS
================================ */

// erro geral
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    message: err.message || 'Erro interno do servidor'
  });
});

// 404 (FORMA CORRETA — SEM *)
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
