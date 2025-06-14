const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token. User not found.",
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Account is deactivated.",
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token.",
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired.",
      })
    }

    res.status(500).json({
      status: "error",
      message: "Server error during authentication.",
    })
  }
}

// Check if user is host
const isHost = (req, res, next) => {
  if (req.user.role !== "host" && req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Host privileges required.",
    })
  }
  next()
}

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Access denied. Admin privileges required.",
    })
  }
  next()
}

module.exports = { auth, isHost, isAdmin }
