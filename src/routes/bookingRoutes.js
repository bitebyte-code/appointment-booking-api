const router = require('express').Router();
const controller = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('user'));
router.post('/', validate(schemas.book), controller.bookSlot);
router.get('/my', controller.myBookings);
router.patch('/:id/cancel', controller.cancelBooking);

module.exports = router;
