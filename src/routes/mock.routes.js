import express from 'express';

const router = express.Router();

router.get('/orders/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'paid',
    order_items: [
      {
        item: { id: 'MLB123456789' },
        quantity: 3
      }
    ]
  });
});

export default router;
