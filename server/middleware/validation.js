const Joi = require("joi")

// User registration validation
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("guest", "host").optional(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      status: "error",
      message: error.details[0].message,
    })
  }
  next()
}

// User login validation
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      status: "error",
      message: error.details[0].message,
    })
  }
  next()
}

// Listing validation
const validateListing = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(20).max(2000).required(),
    type: Joi.string().valid("apartment", "house", "villa", "cabin", "condo", "hotel", "other").required(),
    location: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
      zipCode: Joi.string().optional(),
      coordinates: Joi.object({
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
      }).optional(),
    }).required(),
    price: Joi.number().min(0).required(),
    capacity: Joi.object({
      guests: Joi.number().min(1).required(),
      bedrooms: Joi.number().min(0).required(),
      bathrooms: Joi.number().min(0).required(),
      beds: Joi.number().min(1).optional(),
    }).required(),
    amenities: Joi.array().items(Joi.string()).optional(),
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          caption: Joi.string().optional(),
          isPrimary: Joi.boolean().optional(),
        }),
      )
      .min(1)
      .required(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      status: "error",
      message: error.details[0].message,
    })
  }
  next()
}

// Booking validation
const validateBooking = (req, res, next) => {
  const schema = Joi.object({
    listing: Joi.string().required(),
    dates: Joi.object({
      checkIn: Joi.date().min("now").required(),
      checkOut: Joi.date().greater(Joi.ref("checkIn")).required(),
    }).required(),
    guests: Joi.object({
      adults: Joi.number().min(1).required(),
      children: Joi.number().min(0).optional(),
      infants: Joi.number().min(0).optional(),
    }).required(),
    specialRequests: Joi.string().max(500).optional(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({
      status: "error",
      message: error.details[0].message,
    })
  }
  next()
}

module.exports = {
  validateRegister,
  validateLogin,
  validateListing,
  validateBooking,
}
