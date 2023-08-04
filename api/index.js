// Import required modules
import express from "express";
import powerXRouter from "./routes/power-x.js";
import dusKaDumRouter from "./routes/dus-ka-dum.js";

const app = express();
app.use(express.json());

app.use("/power-x", powerXRouter); 
app.use("/dus-ka-dum", dusKaDumRouter); 

// Start the server
const PORT = process.env.PORT || 3000; // Use the environment variable PORT or port 3000 if not defined
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
