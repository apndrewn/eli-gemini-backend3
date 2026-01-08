const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // Safety Check: Ensure body exists for Vercel
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Use v1beta required for Gemini 3.0 Thinking Levels
  const modelId = req.body.model || "gemini-3-flash-preview";
  const model = genAI.getGenerativeModel({ model: modelId }, { apiVersion: 'v1beta' });

  try {
    const result = await model.generateContent({
      contents: req.body.contents,
      generationConfig: {
        thinking_config: {
          include_thoughts: true,
          // Pro supports: 'low', 'high'
          // Flash supports: 'minimal', 'low', 'medium', 'high'
          thinking_level: req.body.thinking_level || (modelId.includes("pro") ? "high" : "medium")
        }
      }
    });

    const response = await result.response;
    res.status(200).json(response);
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
