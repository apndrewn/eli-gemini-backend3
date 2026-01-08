// api/index.js
module.exports = async (req, res) => {
  // 1. MANDATORY CORS HEADERS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 2. HANDLE PRE-FLIGHT (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. VALIDATION & ENVIRONMENT
  if (!req.body || !req.body.contents) {
    return res.status(400).json({ error: "Missing request body or contents." });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  const modelId = req.body.model || "gemini-3-flash-preview";
  
  // 4. ROUTING LOGIC: Level for Gemini 3 vs. Budget for Gemini 2.5
  const isGemini3 = modelId.includes("gemini-3");

  try {
    const thinkingConfig = isGemini3 ? {
      include_thoughts: true,
      // Use 'low' for rapid proofreading speed
      thinking_level: req.body.thinking_level || "low" 
    } : {
      include_thoughts: true,
      thinking_budget: 1024 
    };

    // 5. DIRECT FETCH TO GOOGLE API (Bypasses library crashes)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: req.body.contents,
        generationConfig: {
          temperature: 1.0, // MANDATORY for Gemini 3 Reasoning
          thinking_config: thinkingConfig
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Google API Error: ${response.status}`);
    }

    // Return the standard structured JSON response
    return res.status(200).json(data);

  } catch (error) {
    console.error("Vercel Function Error:", error.message);
    return res.status(500).json({ 
      error: "Serverless Function Crash", 
      details: error.message 
    });
  }
};
