const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.bookSlot = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.slotId)) throw new AppError(400, 'Invalid slotId');

  // Atomic compare-and-set: only one request can change isBooked false -> true.
  const slot = await Slot.findOneAndUpdate(
    { _id: req.body.slotId, isBooked: false, startTime: { $gt: new Date() } },
    { $set: { isBooked: true } },
    { new: true }
  );
  if (!slot) {
    const exists = await Slot.exists({ _id: req.body.slotId });
    if (!exists) throw new AppError(404, 'Slot not found');
    throw new AppError(409, 'Slot is already booked or is no longer available');
  }

  try {
    const booking = await Booking.create({
      user: req.user._id,
      slot: slot._id,
      status: 'confirmed'
    });
    await booking.populate([
      { path: 'user', select: 'name email' },
      { path: 'slot', populate: { path: 'provider', select: 'name email' } }
    ]);
    return res.status(201).json({ success: true, message: 'Appointment booked', data: { booking } });
  } catch (error) {
    // Restore slot if booking persistence fails. The conditional update avoids
    // accidentally freeing a slot changed by another operation.
    await Slot.updateOne({ _id: slot._id, isBooked: true }, { $set: { isBooked: false } });
    if (error.code === 11000) throw new AppError(409, 'Slot is already booked');
    throw error;
  }
});

exports.myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate({ path: 'slot', populate: { path: 'provider', select: 'name email' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, count: bookings.length, data: { bookings } });
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: 'confirmed'
  });
  if (!booking) throw new AppError(404, 'Active booking not found for this user');

  // Conditional status update makes repeated cancellation fail safely.
  const cancelled = await Booking.findOneAndUpdate(
    { _id: booking._id, user: req.user._id, status: 'confirmed' },
    { $set: { status: 'cancelled' } },
    { new: true }
  );
  if (!cancelled) throw new AppError(409, 'Booking has already been cancelled');

  await Slot.updateOne({ _id: booking.slot, isBooked: true }, { $set: { isBooked: false } });
  res.json({ success: true, message: 'Booking cancelled; slot is available again', data: { booking: cancelled } });
});
