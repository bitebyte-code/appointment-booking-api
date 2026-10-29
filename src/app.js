const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Appointment Booking API is running' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

app.use((req, res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`)));
app.use(errorHandler);

module.exports = app;
