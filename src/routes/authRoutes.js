const router = require('express').Router();
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');
const { protect } = require('../middleware/auth');

router.post('/register', validate(schemas.register), controller.register);
router.post('/login', validate(schemas.login), controller.login);
router.get('/me', protect, controller.me);

module.exports = router;
