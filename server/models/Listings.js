const mongoose = require("mongoose")

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      required: [true, "Property type is required"],
      enum: ["apartment", "house", "villa", "cabin", "condo", "hotel", "other"],
    },
    location: {
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    capacity: {
      guests: {
        type: Number,
        required: [true, "Guest capacity is required"],
        min: [1, "Must accommodate at least 1 guest"],
      },
      bedrooms: {
        type: Number,
        required: [true, "Number of bedrooms is required"],
        min: [0, "Bedrooms cannot be negative"],
      },
      bathrooms: {
        type: Number,
        required: [true, "Number of bathrooms is required"],
        min: [0, "Bathrooms cannot be negative"],
      },
      beds: {
        type: Number,
        default: 1,
      },
    },
    amenities: [
      {
        type: String,
        enum: [
          "wifi",
          "parking",
          "pool",
          "gym",
          "kitchen",
          "washer",
          "dryer",
          "air_conditioning",
          "heating",
          "tv",
          "pets_allowed",
          "smoking_allowed",
          "wheelchair_accessible",
          "elevator",
          "balcony",
          "garden",
          "bbq",
        ],
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host is required"],
    },
    availability: {
      checkIn: {
        type: String,
        default: "15:00",
      },
      checkOut: {
        type: String,
        default: "11:00",
      },
      minStay: {
        type: Number,
        default: 1,
      },
      maxStay: {
        type: Number,
        default: 365,
      },
      blockedDates: [
        {
          from: Date,
          to: Date,
          reason: String,
        },
      ],
    },
    rules: {
      smokingAllowed: {
        type: Boolean,
        default: false,
      },
      petsAllowed: {
        type: Boolean,
        default: false,
      },
      partiesAllowed: {
        type: Boolean,
        default: false,
      },
      additionalRules: [String],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
listingSchema.index({ "location.city": 1, "location.country": 1 })
listingSchema.index({ price: 1 })
listingSchema.index({ "rating.average": -1 })
listingSchema.index({ status: 1 })
listingSchema.index({ host: 1 })

// Virtual for full location
listingSchema.virtual("fullLocation").get(function () {
  return `${this.location.city}, ${this.location.state}, ${this.location.country}`
})

module.exports = mongoose.model("Listing", listingSchema)
