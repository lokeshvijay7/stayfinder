const express = require("express")
const User = require("../models/User")
const { auth } = require("../middleware/auth")
const { validateRegister, validateLogin } = require("../middleware/validation")

const router = express.Router()

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User with this email already exists",
      })
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || "guest",
    })

    await user.save()

    // Generate token
    const token = user.generateAuthToken()

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists and include password for comparison
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated. Please contact support.",
      })
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = user.generateAuthToken()

    res.json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          address: user.address,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error fetching user profile",
    })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", auth, (req, res) => {
  res.json({
    status: "success",
    message: "Logged out successfully",
  })
})

module.exports = router
