const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: req.body.model || "gemini-3-flash-preview" 
  }, { apiVersion: 'v1beta' });

  try {
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
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};