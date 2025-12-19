import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { _id: false });

const ProductSchema = new mongoose.Schema(
  {
    ml_item_id: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    sku: {
      type: String
    },
    inventory: [inventoryItemSchema],
    totalStock: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Calculate total stock before saving
ProductSchema.pre('save', function() {
  this.totalStock = this.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  // No need to call next() in Mongoose 6.0.0 and later
});

export default mongoose.model('Product', ProductSchema);
