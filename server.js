require("dotenv").config();
const express = require("express");
const multer = require("multer"); // for getting files
const pdfkit = require("pdfkit"); // for making PDF's
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const port = process.env.PORT || 5000;
const { GoogleGenerativeAI } = require("@google/generative-ai"); // for accessing with gemini ai
const app = express();

// Configuring multer
const upload = multer({ dest: "upload/" }); // upload file is the destination
app.use(express.json({ limit: "20mb" })); // Adjusting the limit of the uploading Data

// Initializing the Google Gemini-AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
app.use(express.static("public"));

// Routes
//Analyze route
app.post("/analyze", upload.single("image"), async (req, res) => {
  const file = req.file;
  console.log(file);
  res.json({ message: "File uploaded successfully" });
});
// download route
app.post("/download", async (req, res) => {
  res.json({ success: true });
});
//Starting the server
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
