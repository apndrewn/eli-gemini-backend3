const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // 1. Safety Check: Ensure req.body exists
  if (!req.body) {
    return res.status(400).json({ 
      error: "Missing request body. Ensure Content-Type is set to application/json." 
    });
  }

  const { model, contents, thinking_level } = req.body;
  
  if (!contents) {
    return res.status(400).json({ error: "Missing 'contents' in request body." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const targetModel = model || "gemini-3-flash-preview";

  const geminiModel = genAI.getGenerativeModel({ 
    model: targetModel 
  }, { apiVersion: 'v1beta' });

  try {
    const result = await geminiModel.generateContent({
      contents: contents,
      generationConfig: {
        thinking_config: {
          include_thoughts: true,
          thinking_level: thinking_level || "medium"
        }
      }
    });

    const response = await result.response;
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
