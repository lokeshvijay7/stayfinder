const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const rateLimit = require("express-rate-limit")

// Load environment variables
dotenv.config()

// Database connection
const connectDB = require("./config/database")

// Import routes
const authRoutes = require("./routes/auth")
const listingRoutes = require("./routes/listings")
const bookingRoutes = require("./routes/bookings")
const userRoutes = require("./routes/users")
const reviewRoutes = require("./routes/reviews")

// Import middleware
const errorHandler = require("./middleware/errorHandler")

const app = express()

// Connect to MongoDB Atlas
connectDB()

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware
app.use(limiter)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/listings", listingRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/users", userRoutes)
app.use("/api/reviews", reviewRoutes)

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "StayFinder API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
})

// API Documentation route
app.get("/api", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to StayFinder API",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/me",
      },
      listings: {
        getAll: "GET /api/listings",
        getById: "GET /api/listings/:id",
        create: "POST /api/listings (Auth Required)",
        update: "PUT /api/listings/:id (Auth Required)",
        delete: "DELETE /api/listings/:id (Auth Required)",
      },
      bookings: {
        create: "POST /api/bookings (Auth Required)",
        getMyBookings: "GET /api/bookings (Auth Required)",
        getHostBookings: "GET /api/bookings/host (Auth Required)",
      },
    },
  })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🌐 API URL: http://localhost:${PORT}/api`)
})

module.exports = app
