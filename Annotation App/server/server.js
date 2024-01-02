const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 5000; // Change this to your desired port

app.use(cors());
app.use(bodyParser.json());

// Load existing annotations from "annotations.json"
let existingAnnotations = {};
try {
  const annotations = fs.readFileSync("annotations.json", "utf-8");
  existingAnnotations = JSON.parse(annotations);
} catch (error) {
  console.error("Error loading existing annotations:", error);
}

// Endpoint to save annotations
app.post("/api/annotations", (req, res) => {
  try {
    const { image, split, mask, selectedCategory } = req.body;
    // Update the existingAnnotations object with the new annotation data
    if (!(image in existingAnnotations)) {
      existingAnnotations[image] = {};
    }
    if (!(split in existingAnnotations[image])) {
      existingAnnotations[image][split] = {};
    }
    existingAnnotations[image][split][mask] = selectedCategory;
    // Save the updated annotations back to "annotations.json"
    fs.writeFileSync("annotations.json", JSON.stringify(existingAnnotations));
    res
      .status(200)
      .json({
        message: "Annotation saved successfully.",
        annotations: existingAnnotations[image][split],
      });

  } catch (error) {
    res.status(500).json({ error: "Error saving annotation." });
  }
});
app.get("/api/annotations/:image/:split", (req, res) => {
  try {

    const { image, split} = req.params;
    const filePath = "./annotations.json";
    const annotations = fs.readFileSync(filePath, "utf-8");
    const existingAnnotations = JSON.parse(annotations);

    if (image in existingAnnotations && split in existingAnnotations[image]) {
      const annotationsForSplit = existingAnnotations[image][split];
      res.status(200).json(annotationsForSplit);
    } else {
      res.status(200).json({});
    }
  } catch (error) {
    res.status(500).json({ error: "Error retrieving annotations."});
  }
});


//Endpoint to retrieve annotations
app.get("/api/annotations", (req, res) => {
  try {
    res.status(200).json(existingAnnotations);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving annotations." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
