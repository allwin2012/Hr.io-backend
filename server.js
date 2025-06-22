// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const routes = require('./src/routes'); // All your /auth, /users, etc.

const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware — CORRECT ORDER
const allowedOrigins = [
  'http://localhost:5173',         // Dev
  'https://hrio.netlify.app'       // Deployed frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman) or matching origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));



app.use(express.json()); // ✅ Needed to parse JSON bodies

// ✅ Mount API routes once
app.use('/api', routes);

// ✅ Health check
app.get('/', (req, res) => res.send('FinanceTracker Backend is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Serve uploaded files
app.use('/uploads', express.static('uploads'));

