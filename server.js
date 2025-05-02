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
  try {
    if (!file) {
      return res.status(400).send("Upload a image");
    }

    // configure image path and read it
    const imagePath = req.file.path;
    const ImageData = await fsPromises.readFile(imagePath, {
      encoding: "base64",
    });

    //Use GeminiAI to analyze image
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Make request
    const result = await model.generateContent([
      "Analyze this plant image & provide detailed analysis of its species,health,& core recommendations,its characteristics,core instructions,and any interesting factor.Please provide the response in the plain text without using any markdown formatting",
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: ImageData,
        },
      },
    ]);

    // Response in plain text
    const plantInfo = result.response.text();

    // Remove the uploaded img
    const deleteImg = await fsPromises.unlink(imagePath);

    //Send the response
    res.json({
      result: plantInfo,
      image: `data:${req.file.mimetype};base64,${ImageData}`,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
// download route
app.post("/download", async (req, res) => {
  res.json({ success: true });
});

//Starting the server
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
