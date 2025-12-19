import express from 'express';
import Warehouse from '../models/Warehouse.js';

const router = express.Router();

/**
 * @route   POST /api/warehouses
 * @desc    Create a new warehouse
 */
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;

    // Check if warehouse with same name already exists
    const existingWarehouse = await Warehouse.findOne({ name });
    if (existingWarehouse) {
      return res.status(400).json({ message: 'Um armazém com este nome já existe' });
    }

    const warehouse = await Warehouse.create({ name, location });
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/warehouses
 * @desc    Get all warehouses
 */
router.get('/', async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/warehouses/:id
 * @desc    Get warehouse by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Armazém não encontrado' });
    }
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/warehouses/:id
 * @desc    Update a warehouse
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, location, isActive } = req.body;
    
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Armazém não encontrado' });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== warehouse.name) {
      const existingWarehouse = await Warehouse.findOne({ name });
      if (existingWarehouse) {
        return res.status(400).json({ message: 'Já existe um armazém com este nome' });
      }
      warehouse.name = name;
    }

    if (location) warehouse.location = location;
    if (isActive !== undefined) warehouse.isActive = isActive;

    await warehouse.save();
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/warehouses/:id
 * @desc    Delete a warehouse
 */
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Check if warehouse has inventory before deleting
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Armazém não encontrado' });
    }
    res.json({ message: 'Armazém removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
