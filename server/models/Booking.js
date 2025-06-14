const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing is required"],
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guest is required"],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host is required"],
    },
    dates: {
      checkIn: {
        type: Date,
        required: [true, "Check-in date is required"],
      },
      checkOut: {
        type: Date,
        required: [true, "Check-out date is required"],
      },
      nights: {
        type: Number,
        required: true,
      },
    },
    guests: {
      adults: {
        type: Number,
        required: [true, "Number of adults is required"],
        min: [1, "At least 1 adult is required"],
      },
      children: {
        type: Number,
        default: 0,
        min: [0, "Children cannot be negative"],
      },
      infants: {
        type: Number,
        default: 0,
        min: [0, "Infants cannot be negative"],
      },
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      cleaningFee: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      taxes: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "refunded"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer"],
      default: "credit_card",
    },
    specialRequests: {
      type: String,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
    },
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      cancelledAt: Date,
      reason: String,
      refundAmount: Number,
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

// Validate check-out date is after check-in date
bookingSchema.pre("save", function (next) {
  if (this.dates.checkOut <= this.dates.checkIn) {
    next(new Error("Check-out date must be after check-in date"))
  }

  // Calculate number of nights
  const timeDiff = this.dates.checkOut.getTime() - this.dates.checkIn.getTime()
  this.dates.nights = Math.ceil(timeDiff / (1000 * 3600 * 24))

  next()
})

// Indexes
bookingSchema.index({ guest: 1, createdAt: -1 })
bookingSchema.index({ host: 1, createdAt: -1 })
bookingSchema.index({ listing: 1, "dates.checkIn": 1, "dates.checkOut": 1 })
bookingSchema.index({ status: 1 })

module.exports = mongoose.model("Booking", bookingSchema)
