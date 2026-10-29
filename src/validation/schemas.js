const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const isoDate = Joi.date().iso();

module.exports = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().max(254).required(),
    password: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid('user', 'provider').default('user')
  }),
  login: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(1).required()
  }),
  createSlot: Joi.object({
    startTime: isoDate.required(),
    endTime: isoDate.required()
  }),
  book: Joi.object({
    slotId: objectId.required()
  })
};
