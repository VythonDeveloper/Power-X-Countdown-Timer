// Import required modules
import express from "express";
import circleRouter from "./routes/circle.js"; // Assuming your timer route is defined in circle.js

// Create an Express app
const app = express();

// Middleware to parse JSON data in request bodies
app.use(express.json());

// Add your routes to the app
app.use("/circle", circleRouter); // Mount the circleRouter at the /circle path

// Start the server
const PORT = process.env.PORT || 3000; // Use the environment variable PORT or port 3000 if not defined
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
