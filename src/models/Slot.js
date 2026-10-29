const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isBooked: { type: Boolean, default: false, index: true }
}, { timestamps: true });

slotSchema.index({ startTime: 1, isBooked: 1 });

module.exports = mongoose.model('Slot', slotSchema);
