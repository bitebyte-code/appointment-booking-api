const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed', required: true }
}, { timestamps: true });

// A slot can have only one active booking. Cancelled bookings are excluded.
bookingSchema.index(
  { slot: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
