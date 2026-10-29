const AppError = require('../utils/AppError');

module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  if (error) {
    return next(new AppError(400, error.details.map(d => d.message).join('; ')));
  }
  req.body = value;
  next();
};
