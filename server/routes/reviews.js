const express = require("express")
const Review = require("../models/Review")
const Booking = require("../models/Booking")
const Listing = require("../models/Listing")
const { auth } = require("../middleware/auth")

const router = express.Router()

// @route   POST /api/reviews
// @desc    Create a review for a completed booking
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { bookingId, ratings, comment } = req.body

    // Validate booking
    const booking = await Booking.findById(bookingId).populate("listing").populate("host")

    if (!booking) {
      return res.status(404).json({
        status: "error",
        message: "Booking not found",
      })
    }

    // Check if user is the guest of this booking
    if (booking.guest.toString() !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You can only review your own bookings",
      })
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({
        status: "error",
        message: "You can only review completed bookings",
      })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId })
    if (existingReview) {
      return res.status(400).json({
        status: "error",
        message: "Review already exists for this booking",
      })
    }

    // Create review
    const review = new Review({
      listing: booking.listing._id,
      booking: bookingId,
      reviewer: req.user.id,
      host: booking.host._id,
      ratings,
      comment,
    })

    await review.save()

    // Update listing rating
    await updateListingRating(booking.listing._id)

    await review.populate([
      { path: "reviewer", select: "firstName lastName avatar" },
      { path: "listing", select: "title location" },
    ])

    res.status(201).json({
      status: "success",
      message: "Review created successfully",
      data: { review },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error creating review",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   GET /api/reviews/listing/:listingId
// @desc    Get reviews for a specific listing
// @access  Public
router.get("/listing/:listingId", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const reviews = await Review.find({
      listing: req.params.listingId,
      isPublic: true,
    })
      .populate("reviewer", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Review.countDocuments({
      listing: req.params.listingId,
      isPublic: true,
    })

    res.json({
      status: "success",
      data: {
        reviews,
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
      message: "Server error fetching reviews",
    })
  }
})

// @route   PUT /api/reviews/:id/respond
// @desc    Host response to a review
// @access  Private
router.put("/:id/respond", auth, async (req, res) => {
  try {
    const { comment } = req.body
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      })
    }

    // Check if user is the host of this review
    if (review.host.toString() !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "Only the host can respond to this review",
      })
    }

    review.hostResponse = {
      comment,
      respondedAt: new Date(),
    }

    await review.save()

    res.json({
      status: "success",
      message: "Response added successfully",
      data: { review },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error adding response",
    })
  }
})

// Helper function to update listing rating
async function updateListingRating(listingId) {
  try {
    const reviews = await Review.find({ listing: listingId })

    if (reviews.length === 0) return

    const totalRating = reviews.reduce((sum, review) => sum + review.ratings.overall, 0)
    const averageRating = totalRating / reviews.length

    await Listing.findByIdAndUpdate(listingId, {
      "rating.average": Math.round(averageRating * 10) / 10,
      "rating.count": reviews.length,
    })
  } catch (error) {
    console.error("Error updating listing rating:", error)
  }
}

module.exports = router
