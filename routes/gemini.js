const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/selectMeals", async (req, res) => {
  try {
    const { preferences, menu } = req.body;

    if (!preferences || !menu) {
      return res.status(400).json({
        error: "Missing preferences or menu"
      });
    }

    const prompt = `
You are selecting meals for a student.

Dietary Preferences:
${preferences}

Weekly Menu:
${JSON.stringify(menu)}

Return ONLY valid JSON:
{
  "monday": {"breakfast": false, "lunch": false, "dinner": false},
  "tuesday": {"breakfast": false, "lunch": false, "dinner": false},
  "wednesday": {"breakfast": false, "lunch": false, "dinner": false},
  "thursday": {"breakfast": false, "lunch": false, "dinner": false},
  "friday": {"breakfast": false, "lunch": false, "dinner": false},
  "saturday": {"breakfast": false, "lunch": false, "dinner": false},
  "sunday": {"breakfast": false, "lunch": false, "dinner": false}
}

Rules:
- Select only meals matching dietary preferences
- Use true for suitable meals
- Use false otherwise
- No explanations
- No markdown
- Only raw JSON
`;

    const modelNames = [
      "models/gemini-flash-latest",
      "models/gemini-2.5-flash",
      "models/gemini-2.5-flash-lite",
      "models/gemini-flash-lite-latest",
      "models/gemini-2.0-flash",
      "models/gemini-2.0-flash-001",
      "models/gemini-2.0-flash-lite",
      "models/gemini-2.0-flash-lite-001",
      "models/gemini-pro-latest"
];

    let result = null;
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName
        });

        result = await model.generateContent(prompt);

        console.log(`Success with model: ${modelName}`);
        break;

      } catch (err) {
        console.error(`Model failed: ${modelName}`, err.message);
        lastError = err;
      }
    }

    if (!result) {
      return res.status(503).json({
        error: "All Gemini models are currently unavailable. Please try again later."
      });
    }

    let text = result.response.text();

    console.log("Gemini raw response:", text);

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (jsonErr) {
      console.error("JSON Parse Error:", jsonErr);
      return res.status(500).json({
        error: "Gemini returned invalid JSON"
      });
    }

    return res.json(parsed);

  } catch (err) {
    console.error("Gemini Route Error:", err);

    return res.status(500).json({
      error: err.message || "Gemini meal selection failed"
    });
  }
});

module.exports = router;