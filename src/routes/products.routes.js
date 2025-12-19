import express from 'express';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to update inventory
const updateInventory = async (productId, warehouseId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Produto não encontrado');

  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) throw new Error('Armazém não encontrado');

  const inventoryIndex = product.inventory.findIndex(
    item => item.warehouse.toString() === warehouseId
  );

  if (inventoryIndex >= 0) {
    // Update existing inventory
    product.inventory[inventoryIndex].quantity = quantity;
  } else {
    // Add new inventory item
    product.inventory.push({ warehouse: warehouseId, quantity });
  }

  await product.save();
  return product;
};

/**
 * @route   POST /products
 * @desc    Criar produto
 */
router.post('/', async (req, res) => {
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2)); // Log the request body
    
    const { ml_item_id, name, sku } = req.body;

    // Validate required fields
    if (!ml_item_id || !name) {
      console.error('Missing required fields:', { ml_item_id, name });
      return res.status(400).json({ 
        message: 'Campos obrigatórios não fornecidos',
        required: ['ml_item_id', 'name'],
        received: { ml_item_id, name, sku }
      });
    }

    console.log('Checking if product exists with ml_item_id:', ml_item_id);
    const exists = await Product.findOne({ ml_item_id });
    if (exists) {
      console.error('Product already exists with ml_item_id:', ml_item_id);
      return res.status(400).json({ 
        message: 'Produto já existe',
        ml_item_id
      });
    }

    console.log('Creating new product with data:', { ml_item_id, name, sku });
    const product = await Product.create({
      ml_item_id,
      name,
      sku,
      inventory: []
    });

    console.log('Product created successfully:', product._id);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Erro interno ao criar produto',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /products/:id/inventory
 * @desc    Adicionar/Atualizar estoque em um armazém
 */
router.post('/:id/inventory', async (req, res) => {
  try {
    const { warehouseId, quantity } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ message: 'ID do armazém inválido' });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: 'Quantidade inválida' });
    }

    const product = await updateInventory(req.params.id, warehouseId, quantity);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /products
 * @desc    Listar produtos com opção de filtrar por armazém
 */
router.get('/', async (req, res) => {
  try {
    const { warehouse, search } = req.query;
    let query = {};

    // Filtrar por armazém se fornecido
    if (warehouse && mongoose.Types.ObjectId.isValid(warehouse)) {
      query['inventory.warehouse'] = new mongoose.Types.ObjectId(warehouse);
    }

    // Busca por nome ou SKU
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'inventory.warehouse',
          foreignField: '_id',
          as: 'warehouseDetails'
        }
      },
      {
        $project: {
          ml_item_id: 1,
          name: 1,
          sku: 1,
          totalStock: 1,
          inventory: {
            $map: {
              input: '$inventory',
              as: 'inv',
              in: {
                warehouse: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$warehouseDetails',
                        as: 'wh',
                        cond: { $eq: ['$$wh._id', '$$inv.warehouse'] }
                      }
                    },
                    0
                  ]
                },
                quantity: '$$inv.quantity'
              }
            }
          },
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /products/:id
 * @desc    Buscar produto por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /products/:id
 * @desc    Atualizar produto
 */
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /products/:id
 * @desc    Deletar produto
 */
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Produto removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
