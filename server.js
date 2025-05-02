require("dotenv").config();
const express = require("express");
const multer = require("multer"); // for uploading files
const pdfkit = require("pdfkit"); // for making PDF's
const fs = require("fs");
const fsPromises = fs.promises;
const { PassThrough } = require("stream");
const path = require("path");
const port = process.env.PORT || 5000;
// Requiring geminiAI
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// configuring multer
const upload = multer({ dest: "upload/" });
app.use(express.json({ limit: "20mb" }));

// Serve static frontend files
app.use(express.static("public"));

// Gemini AI init
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Analyze Route
app.post("/analyze", upload.single("image"), async (req, res) => {
  const file = req.file;
  try {
    if (!file) {
      return res.status(400).send("Upload an image");
    }

    const imagePath = file.path;
    const imageData = await fsPromises.readFile(imagePath, {
      encoding: "base64",
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      "Analyze this plant image & provide detailed analysis of its species, health, & core recommendations, its characteristics, core instructions, and any interesting factor. Please provide the response in plain text without markdown.",
      {
        inlineData: {
          mimeType: file.mimetype,
          data: imageData,
        },
      },
    ]);

    const plantInfo = result.response.text();

    await fsPromises.unlink(imagePath); // cleanup

    res.json({
      result: plantInfo,
      image: `data:${file.mimetype};base64,${imageData}`,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

// Download Route (for downloading PDF)
app.post("/download", express.json(), async (req, res) => {
  const { result, image } = req.body;

  try {
    const doc = new pdfkit();
    const stream = new PassThrough();

    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Plant_Analysis_Report.pdf"'
    );

    // Pipe PDF to response
    doc.pipe(stream);
    stream.pipe(res);

    // Write content to PDF
    doc.fontSize(24).text("Plant Analysis Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(18).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(14).text(result, { align: "left" });

    // Insert image
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      doc.addPage();
      doc.image(buffer, {
        fit: [500, 300],
        align: "center",
        valign: "center",
      });
    }

    doc.end(); // Finalize the PDF
  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
});

// Start server
app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
