const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require('cors')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); // Enables Cross-Origin Resource Sharing



// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Basic test route
app.get("/api", (req, res) => {
  res.send("API is running...");
});

// Use the post router for all API endpoints starting with /api/posts
// The path now correctly points to the VIPchakrarouter.js file.
app.use("/api", require("./routes/VIPchakraroutes"));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
