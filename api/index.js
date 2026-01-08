const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
  // --- 1. MANDATORY CORS HEADERS ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (including Office/Word)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // --- 2. HANDLE PRE-FLIGHT (OPTIONS) ---
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- 3. CORE LOGIC ---
  if (!req.body) {
    return res.status(400).json({ error: "Missing request body." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelId = req.body.model || "gemini-3-flash-preview";
  const model = genAI.getGenerativeModel({ model: modelId }, { apiVersion: 'v1beta' });

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
