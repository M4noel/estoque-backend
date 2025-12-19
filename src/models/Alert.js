import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    message: {
      type: String,
      required: true
    },
    resolved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Alert', AlertSchema);
