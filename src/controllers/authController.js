const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function makeToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError(409, 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: normalizedEmail, passwordHash, role });
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: makeToken(user) }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new AppError(401, 'Invalid email or password');
  }
  res.json({
    success: true,
    data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: makeToken(user) }
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});
