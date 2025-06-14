const express = require("express")
const User = require("../models/User")
const Booking = require("../models/Booking")
const Listing = require("../models/Listing")
const { auth, isAdmin } = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    res.json({
      status: "success",
      data: { user },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching profile",
    })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const allowedUpdates = ["firstName", "lastName", "phone", "dateOfBirth", "address", "avatar"]

    const updates = {}
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })

    res.json({
      status: "success",
      message: "Profile updated successfully",
      data: { user },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error updating profile",
    })
  }
})

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role

    const dashboardData = {}

    if (userRole === "guest" || userRole === "host") {
      // Get booking statistics
      const totalBookings = await Booking.countDocuments({ guest: userId })
      const upcomingBookings = await Booking.countDocuments({
        guest: userId,
        status: "confirmed",
        "dates.checkIn": { $gte: new Date() },
      })
      const completedBookings = await Booking.countDocuments({
        guest: userId,
        status: "completed",
      })

      dashboardData.bookings = {
        total: totalBookings,
        upcoming: upcomingBookings,
        completed: completedBookings,
      }
    }

    if (userRole === "host") {
      // Get hosting statistics
      const totalListings = await Listing.countDocuments({ host: userId })
      const activeListings = await Listing.countDocuments({
        host: userId,
        status: "active",
      })
      const totalHostBookings = await Booking.countDocuments({ host: userId })
      const pendingBookings = await Booking.countDocuments({
        host: userId,
        status: "pending",
      })

      // Calculate total earnings
      const completedBookings = await Booking.find({
        host: userId,
        status: "completed",
      }).select("pricing.total")

      const totalEarnings = completedBookings.reduce((sum, booking) => sum + booking.pricing.total, 0)

      dashboardData.hosting = {
        totalListings,
        activeListings,
        totalBookings: totalHostBookings,
        pendingBookings,
        totalEarnings,
      }
    }

    res.json({
      status: "success",
      data: dashboardData,
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching dashboard data",
    })
  }
})

// @route   POST /api/users/become-host
// @desc    Upgrade user to host
// @access  Private
router.post("/become-host", auth, async (req, res) => {
  try {
    if (req.user.role === "host") {
      return res.status(400).json({
        status: "error",
        message: "User is already a host",
      })
    }

    const user = await User.findByIdAndUpdate(req.user.id, { role: "host" }, { new: true })

    res.json({
      status: "success",
      message: "Successfully upgraded to host account",
      data: { user },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error upgrading to host",
    })
  }
})

module.exports = router
