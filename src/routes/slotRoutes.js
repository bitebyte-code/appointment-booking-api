const router = require('express').Router();
const controller = require('../controllers/slotController');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');
const { protect, authorize } = require('../middleware/auth');

router.get('/', controller.listAvailableSlots);
router.post('/', protect, authorize('provider'), validate(schemas.createSlot), controller.createSlot);

module.exports = router;
