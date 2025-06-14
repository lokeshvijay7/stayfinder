const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

// Import models
const User = require("../models/User")
const Listing = require("../models/Listing")
const Booking = require("../models/Booking")
const Review = require("../models/Review")

// Connect to MongoDB
const connectDB = require("../config/database")

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB()

    console.log("🗑️  Clearing existing data...")
    // Clear existing data
    await User.deleteMany({})
    await Listing.deleteMany({})
    await Booking.deleteMany({})
    await Review.deleteMany({})

    console.log("👥 Creating users...")
    // Create users with hashed passwords
    const users = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: await bcrypt.hash("password123", 12),
        role: "guest",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        phone: "+1-555-0101",
        isVerified: true,
        isActive: true,
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah@example.com",
        password: await bcrypt.hash("password123", 12),
        role: "host",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        phone: "+1-555-0102",
        isVerified: true,
        isActive: true,
      },
      {
        firstName: "Mike",
        lastName: "Wilson",
        email: "mike@example.com",
        password: await bcrypt.hash("password123", 12),
        role: "host",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        phone: "+1-555-0103",
        isVerified: true,
        isActive: true,
      },
      {
        firstName: "Emma",
        lastName: "Davis",
        email: "emma@example.com",
        password: await bcrypt.hash("password123", 12),
        role: "host",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        phone: "+1-555-0104",
        isVerified: true,
        isActive: true,
      },
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@stayfinder.com",
        password: await bcrypt.hash("admin123", 12),
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
        phone: "+1-555-0100",
        isVerified: true,
        isActive: true,
      },
    ]

    const createdUsers = await User.insertMany(users)
    console.log(`✅ Created ${createdUsers.length} users`)

    console.log("🏠 Creating listings with real images...")
    // Create listings with real property images
    const listings = [
      {
        title: "Luxury Beachfront Villa in Miami",
        description:
          "Experience the ultimate luxury in this stunning beachfront villa with panoramic ocean views. This property features modern amenities, private beach access, and breathtaking sunsets. Perfect for families or groups looking for an unforgettable vacation experience.",
        type: "villa",
        location: {
          address: "1234 Ocean Drive",
          city: "Miami Beach",
          state: "Florida",
          country: "USA",
          zipCode: "33139",
          coordinates: {
            latitude: 25.7617,
            longitude: -80.1918,
          },
        },
        price: 450,
        capacity: {
          guests: 10,
          bedrooms: 5,
          bathrooms: 4,
          beds: 6,
        },
        amenities: ["wifi", "pool", "parking", "kitchen", "air_conditioning", "balcony", "bbq"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
            caption: "Stunning ocean view from the villa",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
            caption: "Spacious living room with modern furnishing",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
            caption: "Private pool area",
            isPrimary: false,
          },
        ],
        host: createdUsers[1]._id,
        status: "active",
        featured: true,
        rating: {
          average: 4.8,
          count: 24,
        },
      },
      {
        title: "Cozy Mountain Cabin in Aspen",
        description:
          "Escape to this charming mountain cabin nestled in the heart of Aspen. Surrounded by pristine nature and hiking trails, this cozy retreat offers the perfect blend of rustic charm and modern comfort. Ideal for winter skiing or summer adventures.",
        type: "cabin",
        location: {
          address: "456 Mountain View Road",
          city: "Aspen",
          state: "Colorado",
          country: "USA",
          zipCode: "81611",
          coordinates: {
            latitude: 39.1911,
            longitude: -106.8175,
          },
        },
        price: 280,
        capacity: {
          guests: 6,
          bedrooms: 3,
          bathrooms: 2,
          beds: 4,
        },
        amenities: ["wifi", "parking", "kitchen", "heating", "balcony"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
            caption: "Cozy cabin exterior with mountain views",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
            caption: "Rustic interior with fireplace",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
            caption: "Beautiful mountain landscape",
            isPrimary: false,
          },
        ],
        host: createdUsers[2]._id,
        status: "active",
        featured: false,
        rating: {
          average: 4.6,
          count: 18,
        },
      },
      {
        title: "Modern Downtown Apartment in NYC",
        description:
          "Stay in the heart of Manhattan in this sleek, modern apartment. Walking distance to Times Square, Central Park, and world-class dining. Features floor-to-ceiling windows with stunning city views and all the amenities you need for a perfect NYC experience.",
        type: "apartment",
        location: {
          address: "789 Broadway Avenue",
          city: "New York",
          state: "New York",
          country: "USA",
          zipCode: "10003",
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
        price: 380,
        capacity: {
          guests: 4,
          bedrooms: 2,
          bathrooms: 2,
          beds: 2,
        },
        amenities: ["wifi", "elevator", "kitchen", "air_conditioning", "gym"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
            caption: "Modern apartment with city views",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
            caption: "Stylish living area",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
            caption: "Manhattan skyline view",
            isPrimary: false,
          },
        ],
        host: createdUsers[1]._id,
        status: "active",
        featured: true,
        rating: {
          average: 4.7,
          count: 31,
        },
      },
      {
        title: "Charming Tuscan Farmhouse",
        description:
          "Experience authentic Italian countryside living in this beautifully restored Tuscan farmhouse. Surrounded by vineyards and olive groves, this property offers tranquility and breathtaking views. Perfect for wine lovers and those seeking a peaceful retreat.",
        type: "house",
        location: {
          address: "Via del Chianti 123",
          city: "Siena",
          state: "Tuscany",
          country: "Italy",
          zipCode: "53100",
          coordinates: {
            latitude: 43.318,
            longitude: 11.3307,
          },
        },
        price: 320,
        capacity: {
          guests: 8,
          bedrooms: 4,
          bathrooms: 3,
          beds: 5,
        },
        amenities: ["wifi", "parking", "kitchen", "garden", "bbq"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
            caption: "Traditional Tuscan farmhouse",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
            caption: "Rustic interior with exposed beams",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop",
            caption: "Vineyard views from the terrace",
            isPrimary: false,
          },
        ],
        host: createdUsers[3]._id,
        status: "active",
        featured: true,
        rating: {
          average: 4.9,
          count: 15,
        },
      },
      {
        title: "Beachfront Condo in Malibu",
        description:
          "Wake up to the sound of waves in this stunning beachfront condo in Malibu. Direct beach access, panoramic ocean views, and modern amenities make this the perfect California getaway. Watch dolphins from your private balcony!",
        type: "condo",
        location: {
          address: "21000 Pacific Coast Highway",
          city: "Malibu",
          state: "California",
          country: "USA",
          zipCode: "90265",
          coordinates: {
            latitude: 34.0259,
            longitude: -118.7798,
          },
        },
        price: 420,
        capacity: {
          guests: 6,
          bedrooms: 3,
          bathrooms: 2,
          beds: 3,
        },
        amenities: ["wifi", "parking", "kitchen", "air_conditioning", "balcony"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&h=600&fit=crop",
            caption: "Beachfront condo with ocean views",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
            caption: "Modern interior with ocean view",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
            caption: "Private beach access",
            isPrimary: false,
          },
        ],
        host: createdUsers[2]._id,
        status: "active",
        featured: false,
        rating: {
          average: 4.5,
          count: 22,
        },
      },
      {
        title: "Desert Oasis in Scottsdale",
        description:
          "Relax in this stunning desert retreat featuring a private pool, spa, and breathtaking mountain views. This modern oasis combines luxury with the natural beauty of the Sonoran Desert. Perfect for golf enthusiasts and spa lovers.",
        type: "villa",
        location: {
          address: "15000 N Scottsdale Road",
          city: "Scottsdale",
          state: "Arizona",
          country: "USA",
          zipCode: "85254",
          coordinates: {
            latitude: 33.4942,
            longitude: -111.9261,
          },
        },
        price: 350,
        capacity: {
          guests: 8,
          bedrooms: 4,
          bathrooms: 3,
          beds: 4,
        },
        amenities: ["wifi", "pool", "parking", "kitchen", "air_conditioning", "bbq"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop",
            caption: "Desert villa with pool",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
            caption: "Luxury interior design",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
            caption: "Desert mountain views",
            isPrimary: false,
          },
        ],
        host: createdUsers[3]._id,
        status: "active",
        featured: false,
        rating: {
          average: 4.4,
          count: 19,
        },
      },
      {
        title: "Historic Brownstone in Boston",
        description:
          "Step into history with this beautifully preserved Victorian brownstone in Boston's Back Bay. Original hardwood floors, period details, and modern amenities create the perfect blend of old-world charm and contemporary comfort.",
        type: "house",
        location: {
          address: "456 Commonwealth Avenue",
          city: "Boston",
          state: "Massachusetts",
          country: "USA",
          zipCode: "02215",
          coordinates: {
            latitude: 42.3601,
            longitude: -71.0589,
          },
        },
        price: 290,
        capacity: {
          guests: 6,
          bedrooms: 3,
          bathrooms: 2,
          beds: 3,
        },
        amenities: ["wifi", "kitchen", "heating", "washer", "dryer"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
            caption: "Historic Boston brownstone",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop",
            caption: "Victorian interior details",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop",
            caption: "Elegant living space",
            isPrimary: false,
          },
        ],
        host: createdUsers[2]._id,
        status: "active",
        featured: false,
        rating: {
          average: 4.3,
          count: 12,
        },
      },
      {
        title: "Lakefront Cottage in Lake Tahoe",
        description:
          "Escape to this peaceful lakefront cottage with stunning views of Lake Tahoe. Perfect for both summer water activities and winter snow sports. Features a private dock, cozy fireplace, and all the amenities for a perfect mountain lake vacation.",
        type: "cabin",
        location: {
          address: "789 Lakeshore Drive",
          city: "South Lake Tahoe",
          state: "California",
          country: "USA",
          zipCode: "96150",
          coordinates: {
            latitude: 38.9399,
            longitude: -119.9772,
          },
        },
        price: 310,
        capacity: {
          guests: 8,
          bedrooms: 4,
          bathrooms: 2,
          beds: 5,
        },
        amenities: ["wifi", "parking", "kitchen", "heating", "balcony"],
        images: [
          {
            url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
            caption: "Lakefront cottage with mountain views",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
            caption: "Cozy interior with lake view",
            isPrimary: false,
          },
          {
            url: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=600&fit=crop",
            caption: "Private dock on Lake Tahoe",
            isPrimary: false,
          },
        ],
        host: createdUsers[1]._id,
        status: "active",
        featured: true,
        rating: {
          average: 4.8,
          count: 27,
        },
      },
    ]

    const createdListings = await Listing.insertMany(listings)
    console.log(`✅ Created ${createdListings.length} listings`)

    console.log("📅 Creating sample bookings...")
    // Create sample bookings
    const bookings = [
      {
        listing: createdListings[0]._id,
        guest: createdUsers[0]._id,
        host: createdListings[0].host,
        dates: {
          checkIn: new Date("2024-07-15"),
          checkOut: new Date("2024-07-20"),
          nights: 5,
        },
        guests: {
          adults: 4,
          children: 2,
          infants: 0,
        },
        pricing: {
          basePrice: 2250, // 450 * 5 nights
          cleaningFee: 225,
          serviceFee: 270,
          taxes: 196,
          total: 2941,
        },
        status: "completed",
        paymentStatus: "paid",
        specialRequests: "Late check-in requested",
      },
      {
        listing: createdListings[1]._id,
        guest: createdUsers[0]._id,
        host: createdListings[1].host,
        dates: {
          checkIn: new Date("2024-08-10"),
          checkOut: new Date("2024-08-17"),
          nights: 7,
        },
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
        },
        pricing: {
          basePrice: 1960, // 280 * 7 nights
          cleaningFee: 196,
          serviceFee: 235,
          taxes: 191,
          total: 2582,
        },
        status: "confirmed",
        paymentStatus: "paid",
      },
      {
        listing: createdListings[2]._id,
        guest: createdUsers[0]._id,
        host: createdListings[2].host,
        dates: {
          checkIn: new Date("2024-09-05"),
          checkOut: new Date("2024-09-08"),
          nights: 3,
        },
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
        },
        pricing: {
          basePrice: 1140, // 380 * 3 nights
          cleaningFee: 114,
          serviceFee: 137,
          taxes: 112,
          total: 1503,
        },
        status: "pending",
        paymentStatus: "pending",
      },
    ]

    const createdBookings = await Booking.insertMany(bookings)
    console.log(`✅ Created ${createdBookings.length} bookings`)

    console.log("⭐ Creating sample reviews...")
    // Create sample reviews for completed bookings
    const reviews = [
      {
        listing: createdListings[0]._id,
        booking: createdBookings[0]._id,
        reviewer: createdUsers[0]._id,
        host: createdListings[0].host,
        ratings: {
          overall: 5,
          cleanliness: 5,
          communication: 5,
          checkIn: 4,
          accuracy: 5,
          location: 5,
          value: 4,
        },
        comment:
          "Absolutely stunning property! The ocean views were breathtaking and the villa exceeded all our expectations. Sarah was an amazing host - very responsive and helpful. The private beach access was a huge plus. We'll definitely be back!",
        isPublic: true,
        helpfulVotes: 8,
      },
    ]

    const createdReviews = await Review.insertMany(reviews)
    console.log(`✅ Created ${createdReviews.length} reviews`)

    console.log("\n🎉 Database seeded successfully!")
    console.log("\n📊 Summary:")
    console.log(`👥 Users: ${createdUsers.length}`)
    console.log(`🏠 Listings: ${createdListings.length}`)
    console.log(`📅 Bookings: ${createdBookings.length}`)
    console.log(`⭐ Reviews: ${createdReviews.length}`)

    console.log("\n🔐 Test Accounts:")
    console.log("Guest Account:")
    console.log("  📧 Email: john@example.com")
    console.log("  🔑 Password: password123")
    console.log("\nHost Accounts:")
    console.log("  📧 Email: sarah@example.com")
    console.log("  🔑 Password: password123")
    console.log("  📧 Email: mike@example.com")
    console.log("  🔑 Password: password123")
    console.log("  📧 Email: emma@example.com")
    console.log("  🔑 Password: password123")
    console.log("\nAdmin Account:")
    console.log("  📧 Email: admin@stayfinder.com")
    console.log("  🔑 Password: admin123")

    console.log("\n🌐 API Endpoints to test:")
    console.log("  POST /api/auth/login")
    console.log("  GET  /api/listings")
    console.log("  GET  /api/listings/:id")
    console.log("  POST /api/bookings (requires auth)")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
