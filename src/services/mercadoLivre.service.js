import axios from 'axios';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Alert from '../models/Alert.js';

// const ML_API = 'https://api.mercadolibre.com';

const ML_API = 'http://localhost:3000/mock';


/**
 * Processa o pedido a partir do resource enviado pelo webhook
 */
export async function processOrderFromResource(resource) {
  // Extrai o ID do pedido
  const orderId = resource.split('/').pop();

  // Evita processar o mesmo pedido duas vezes
  const alreadyProcessed = await Sale.findOne({ ml_order_id: orderId });
  if (alreadyProcessed) return;

  // Busca os dados do pedido no Mercado Livre
  const { data: order } = await axios.get(
    `${ML_API}/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.ML_ACCESS_TOKEN}`
      }
    }
  );

  // Só processa pedidos pagos
  if (order.status !== 'paid') return;

  // Percorre os itens do pedido
  for (const item of order.order_items) {
    const mlItemId = item.item.id;
    const quantity = item.quantity;

    // Busca o produto no estoque interno
    const product = await Product.findOne({ ml_item_id: mlItemId });
    if (!product) continue;

    // Desconta o estoque (SOMENTE NO APP)
    product.stock -= quantity;
    await product.save();

    // Registra a venda
    await Sale.create({
      product: product._id,
      ml_order_id: orderId,
      quantity
    });

    // Cria alerta se estoque ficar negativo
    if (product.stock < 0) {
      await Alert.create({
        product: product._id,
        message: `Venda sem estoque do produto: ${product.name}`
      });
    }
  }
}
