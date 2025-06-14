const express = require("express")
const Booking = require("../models/Booking")
const Listing = require("../models/Listing")
const { auth } = require("../middleware/auth")
const { validateBooking } = require("../middleware/validation")

const router = express.Router()

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post("/", auth, validateBooking, async (req, res) => {
  try {
    const { listing: listingId, dates, guests, specialRequests } = req.body

    // Get listing details
    const listing = await Listing.findById(listingId).populate("host")
    if (!listing) {
      return res.status(404).json({
        status: "error",
        message: "Listing not found",
      })
    }

    // Check if listing is active
    if (listing.status !== "active") {
      return res.status(400).json({
        status: "error",
        message: "Listing is not available for booking",
      })
    }

    // Check guest capacity
    const totalGuests = guests.adults + (guests.children || 0) + (guests.infants || 0)
    if (totalGuests > listing.capacity.guests) {
      return res.status(400).json({
        status: "error",
        message: `Property can accommodate maximum ${listing.capacity.guests} guests`,
      })
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      listing: listingId,
      status: { $in: ["confirmed", "pending"] },
      $or: [
        {
          "dates.checkIn": { $lte: new Date(dates.checkIn) },
          "dates.checkOut": { $gt: new Date(dates.checkIn) },
        },
        {
          "dates.checkIn": { $lt: new Date(dates.checkOut) },
          "dates.checkOut": { $gte: new Date(dates.checkOut) },
        },
        {
          "dates.checkIn": { $gte: new Date(dates.checkIn) },
          "dates.checkOut": { $lte: new Date(dates.checkOut) },
        },
      ],
    })

    if (conflictingBooking) {
      return res.status(400).json({
        status: "error",
        message: "Selected dates are not available",
      })
    }

    // Calculate pricing
    const checkIn = new Date(dates.checkIn)
    const checkOut = new Date(dates.checkOut)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

    const basePrice = listing.price * nights
    const cleaningFee = Math.round(basePrice * 0.1) // 10% cleaning fee
    const serviceFee = Math.round(basePrice * 0.12) // 12% service fee
    const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.08) // 8% taxes
    const total = basePrice + cleaningFee + serviceFee + taxes

    // Create booking
    const booking = new Booking({
      listing: listingId,
      guest: req.user.id,
      host: listing.host._id,
      dates: {
        checkIn,
        checkOut,
        nights,
      },
      guests,
      pricing: {
        basePrice,
        cleaningFee,
        serviceFee,
        taxes,
        total,
      },
      specialRequests,
    })

    await booking.save()

    // Populate booking details
    await booking.populate([
      { path: "listing", select: "title location images" },
      { path: "guest", select: "firstName lastName email" },
      { path: "host", select: "firstName lastName email" },
    ])

    res.status(201).json({
      status: "success",
      message: "Booking created successfully",
      data: { booking },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error creating booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   GET /api/bookings
// @desc    Get user's bookings (guest bookings)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const filter = { guest: req.user.id }
    if (status) filter.status = status

    const bookings = await Booking.find(filter)
      .populate("listing", "title location images price")
      .populate("host", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Booking.countDocuments(filter)

    res.json({
      status: "success",
      data: {
        bookings,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching bookings",
    })
  }
})

// @route   GET /api/bookings/host
// @desc    Get host's bookings (received bookings)
// @access  Private
router.get("/host", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const filter = { host: req.user.id }
    if (status) filter.status = status

    const bookings = await Booking.find(filter)
      .populate("listing", "title location images")
      .populate("guest", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Booking.countDocuments(filter)

    res.json({
      status: "success",
      data: {
        bookings,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching host bookings",
    })
  }
})

// @route   GET /api/bookings/:id
// @desc    Get single booking details
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("listing")
      .populate("guest", "firstName lastName email phone")
      .populate("host", "firstName lastName email phone")

    if (!booking) {
      return res.status(404).json({
        status: "error",
        message: "Booking not found",
      })
    }

    // Check if user is authorized to view this booking
    if (
      booking.guest._id.toString() !== req.user.id &&
      booking.host._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to view this booking",
      })
    }

    res.json({
      status: "success",
      data: { booking },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching booking details",
    })
  }
})

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm booking (Host only)
// @access  Private
router.put("/:id/confirm", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        status: "error",
        message: "Booking not found",
      })
    }

    // Check if user is the host
    if (booking.host.toString() !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "Only the host can confirm bookings",
      })
    }

    // Check if booking is in pending status
    if (booking.status !== "pending") {
      return res.status(400).json({
        status: "error",
        message: "Only pending bookings can be confirmed",
      })
    }

    booking.status = "confirmed"
    await booking.save()

    await booking.populate([
      { path: "listing", select: "title location" },
      { path: "guest", select: "firstName lastName email" },
    ])

    res.json({
      status: "success",
      message: "Booking confirmed successfully",
      data: { booking },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error confirming booking",
    })
  }
})

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        status: "error",
        message: "Booking not found",
      })
    }

    // Check if user is authorized to cancel
    if (
      booking.guest.toString() !== req.user.id &&
      booking.host.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to cancel this booking",
      })
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled" || booking.status === "completed") {
      return res.status(400).json({
        status: "error",
        message: "Booking cannot be cancelled",
      })
    }

    // Calculate refund amount based on cancellation policy
    let refundAmount = 0
    const now = new Date()
    const checkIn = new Date(booking.dates.checkIn)
    const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24))

    if (daysUntilCheckIn >= 7) {
      refundAmount = booking.pricing.total * 0.9 // 90% refund
    } else if (daysUntilCheckIn >= 3) {
      refundAmount = booking.pricing.total * 0.5 // 50% refund
    } else {
      refundAmount = 0 // No refund
    }

    booking.status = "cancelled"
    booking.cancellation = {
      cancelledBy: req.user.id,
      cancelledAt: new Date(),
      reason: reason || "No reason provided",
      refundAmount,
    }

    await booking.save()

    res.json({
      status: "success",
      message: "Booking cancelled successfully",
      data: {
        booking,
        refundAmount,
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error cancelling booking",
    })
  }
})

module.exports = router
