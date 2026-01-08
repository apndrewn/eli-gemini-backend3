// api/index.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // 1. MANDATORY CORS HEADERS (Must be set for every request)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins including Office/Word
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 2. HANDLE PRE-FLIGHT (OPTIONS)
  // Browsers send this check before the real POST request. 
  // If not handled, subsequent calls will result in "Failed to fetch".
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. CORE LOGIC WRAPPED IN TRY...CATCH
  try {
    // Basic Request Validation
    if (!req.body) {
      return res.status(400).json({ error: "Missing request body." });
    }

    const { contents, model: modelId, thinking_level } = req.body;

    if (!contents) {
      return res.status(400).json({ error: "Missing 'contents' in request body." });
    }

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use v1beta required for Gemini 3.0 reasoning parameters
    const targetModel = modelId || "gemini-3-flash-preview";
    const model = genAI.getGenerativeModel(
      { model: targetModel }, 
      { apiVersion: 'v1beta' }
    );

    // 4. CALL GEMINI API
    // This is the most likely failure point for a 500 error
    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        thinking_config: {
          include_thoughts: true,
          // Fallback logic for reasoning levels
          thinking_level: thinking_level || (targetModel.includes("pro") ? "high" : "medium")
        }
      }
    });

    const response = await result.response;
    
    // Send back the full structured JSON response
    return res.status(200).json(response);

  } catch (error) {
    // 5. ERROR LOGGING & HANDLING
    // This converts a silent "Function Crash" into a visible error in your ELI logs
    console.error("Vercel Backend Logic Error:", error.message);

    return res.status(500).json({ 
      error: "Serverless Function Crash", 
      details: error.message,
      model_attempted: req.body?.model || "unknown"
    });
  }
};
