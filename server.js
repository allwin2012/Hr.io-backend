// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // your frontend URL
  credentials: true
}));
app.use(express.json());

// Centralized route import
const allRoutes = require('./src/routes');
app.use('/api', allRoutes); // now /api/auth/* and /api/test/*

app.get('/', (req, res) => res.send('FinanceTracker Backend is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
