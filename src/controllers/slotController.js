const Slot = require('../models/Slot');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.createSlot = asyncHandler(async (req, res) => {
  const startTime = new Date(req.body.startTime);
  const endTime = new Date(req.body.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new AppError(400, 'startTime and endTime must be valid dates');
  }
  if (startTime <= new Date()) throw new AppError(400, 'Slot must start in the future');
  if (endTime <= startTime) throw new AppError(400, 'endTime must be later than startTime');

  // Prevent overlapping slots for the same provider.
  const overlap = await Slot.exists({
    provider: req.user._id,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  });
  if (overlap) throw new AppError(409, 'This slot overlaps another slot belonging to this provider');

  const slot = await Slot.create({ provider: req.user._id, startTime, endTime });
  res.status(201).json({ success: true, data: { slot } });
});

exports.listAvailableSlots = asyncHandler(async (req, res) => {
  const filter = { isBooked: false, startTime: { $gt: new Date() } };
  if (req.query.providerId) filter.provider = req.query.providerId;
  const slots = await Slot.find(filter)
    .populate('provider', 'name email')
    .sort({ startTime: 1 });
  res.json({ success: true, count: slots.length, data: { slots } });
});
