const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // 1. Initial Check
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not defined in Vercel." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // 2. Select Model & API Version (v1beta required for Thinking Configuration)
  const model = genAI.getGenerativeModel({ 
    model: req.body.model || "gemini-3-flash-preview" 
  }, { apiVersion: 'v1beta' });

  try {
    // 3. Configure Thinking Level (minimal, low, medium, high)
    const result = await model.generateContent({
      contents: req.body.contents,
      generationConfig: {
        thinking_config: {
          include_thoughts: true,
          thinking_level: req.body.thinking_level || "medium"
        }
      }
    });

    const response = await result.response;
    return res.status(200).json(response);

  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return res.status(500).json({ 
      error: "AI Generation Failed", 
      details: error.message 
    });
  }
};
