import express from 'express';
import { processOrderFromResource } from '../services/mercadoLivre.service.js';

const router = express.Router();

/**
 * Webhook do Mercado Livre
 * Recebe notificações de venda
 */
router.post('/', async (req, res) => {
  try {
    const { topic, resource } = req.body;

    // Ignora eventos que não são pedidos
    if (topic !== 'orders' || !resource) {
      return res.sendStatus(200);
    }

    // Processa a venda
    await processOrderFromResource(resource);

    // Resposta obrigatória para o Mercado Livre
    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error.message);
    res.sendStatus(500);
  }
});

export default router;
