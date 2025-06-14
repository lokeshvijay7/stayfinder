const express = require("express")
const Listing = require("../models/Listing")
const Booking = require("../models/Booking")
const { auth, isHost } = require("../middleware/auth")
const { validateListing } = require("../middleware/validation")

const router = express.Router()

// @route   GET /api/listings
// @desc    Get all listings with filtering and pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      city,
      country,
      type,
      minPrice,
      maxPrice,
      guests,
      amenities,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build filter object
    const filter = { status: "active" }

    if (city) filter["location.city"] = new RegExp(city, "i")
    if (country) filter["location.country"] = new RegExp(country, "i")
    if (type) filter.type = type
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (guests) filter["capacity.guests"] = { $gte: Number(guests) }
    if (amenities) {
      const amenityArray = amenities.split(",")
      filter.amenities = { $in: amenityArray }
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    // Execute query with pagination
    const listings = await Listing.find(filter)
      .populate("host", "firstName lastName avatar rating")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()

    // Get total count for pagination
    const total = await Listing.countDocuments(filter)

    res.json({
      status: "success",
      data: {
        listings,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching listings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   GET /api/listings/featured
// @desc    Get featured listings
// @access  Public
router.get("/featured", async (req, res) => {
  try {
    const listings = await Listing.find({
      status: "active",
      featured: true,
    })
      .populate("host", "firstName lastName avatar")
      .sort({ "rating.average": -1 })
      .limit(8)

    res.json({
      status: "success",
      data: { listings },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching featured listings",
    })
  }
})

// @route   GET /api/listings/:id
// @desc    Get single listing by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      "host",
      "firstName lastName avatar phone email createdAt",
    )

    if (!listing) {
      return res.status(404).json({
        status: "error",
        message: "Listing not found",
      })
    }

    // Increment view count
    listing.views += 1
    await listing.save()

    // Get unavailable dates (booked dates)
    const bookings = await Booking.find({
      listing: listing._id,
      status: { $in: ["confirmed", "pending"] },
      "dates.checkOut": { $gte: new Date() },
    }).select("dates.checkIn dates.checkOut")

    const unavailableDates = bookings.map((booking) => ({
      from: booking.dates.checkIn,
      to: booking.dates.checkOut,
    }))

    res.json({
      status: "success",
      data: {
        listing,
        unavailableDates,
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching listing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   POST /api/listings
// @desc    Create a new listing (Host only)
// @access  Private (Host)
router.post("/", auth, isHost, validateListing, async (req, res) => {
  try {
    const listingData = {
      ...req.body,
      host: req.user.id,
    }

    const listing = new Listing(listingData)
    await listing.save()

    await listing.populate("host", "firstName lastName avatar")

    res.status(201).json({
      status: "success",
      message: "Listing created successfully",
      data: { listing },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error creating listing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   PUT /api/listings/:id
// @desc    Update listing (Host only - own listings)
// @access  Private (Host)
router.put("/:id", auth, isHost, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)

    if (!listing) {
      return res.status(404).json({
        status: "error",
        message: "Listing not found",
      })
    }

    // Check if user owns the listing
    if (listing.host.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this listing",
      })
    }

    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("host", "firstName lastName avatar")

    res.json({
      status: "success",
      message: "Listing updated successfully",
      data: { listing: updatedListing },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error updating listing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   DELETE /api/listings/:id
// @desc    Delete listing (Host only - own listings)
// @access  Private (Host)
router.delete("/:id", auth, isHost, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)

    if (!listing) {
      return res.status(404).json({
        status: "error",
        message: "Listing not found",
      })
    }

    // Check if user owns the listing
    if (listing.host.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this listing",
      })
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      listing: listing._id,
      status: { $in: ["confirmed", "pending"] },
      "dates.checkOut": { $gte: new Date() },
    })

    if (activeBookings > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete listing with active bookings",
      })
    }

    await Listing.findByIdAndDelete(req.params.id)

    res.json({
      status: "success",
      message: "Listing deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error deleting listing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   GET /api/listings/host/my-listings
// @desc    Get host's own listings
// @access  Private (Host)
router.get("/host/my-listings", auth, isHost, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const filter = { host: req.user.id }
    if (status) filter.status = status

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Listing.countDocuments(filter)

    res.json({
      status: "success",
      data: {
        listings,
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
      message: "Server error fetching host listings",
    })
  }
})

module.exports = router
