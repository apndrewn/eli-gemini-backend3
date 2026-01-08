// api/index.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // CORS and Headers (Keep outside the try block)
  res.setHeader('Access-Control-Allow-Origin', '*');

  // --- START THE TRY BLOCK HERE ---
  try {
    // 1. Initial validation
    if (!req.body) throw new Error("Request body is missing.");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }, { apiVersion: 'v1beta' });

    // 2. The asynchronous AI call (This is where most 500 errors happen)
    const result = await model.generateContent({
      contents: req.body.contents,
      generationConfig: {
        thinking_config: { include_thoughts: true, thinking_level: "medium" }
      }
    });

    const response = await result.response;
    
    // 3. Send successful response
    res.status(200).json(response);

  } catch (error) {
    // --- START THE CATCH BLOCK HERE ---
    // This captures any crash from the code above
    console.error("Vercel Function Crash:", error.message);

    // Return the actual error message to ELI instead of a generic 500
    res.status(500).json({ 
      error: "Serverless Function Error", 
      details: error.message 
    });
  }
};
