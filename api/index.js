// api/index.js
module.exports = async (req, res) => {
  // 1. MANDATORY CORS HEADERS (Must be set for every request to prevent "Failed to fetch")
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // 2. HANDLE PRE-FLIGHT (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. VALIDATION
  if (!req.body || !req.body.contents) {
    return res.status(400).json({ error: "Missing request body or contents." });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  const modelId = req.body.model || "gemini-3-flash-preview";
  
  // 4. 2026 MODEL ROUTING LOGIC
  const isGemini3 = modelId.includes("gemini-3");

  try {
    // Determine the correct thinking configuration based on the model version
    const thinkingConfig = isGemini3 ? {
      include_thoughts: true,
      thinking_level: req.body.thinking_level || "high" // Gemini 3.0 uses Levels [cite: 5466]
    } : {
      include_thoughts: true,
      thinking_budget: 1024 // Gemini 2.5 uses numeric budgets [cite: 5466]
    };

    // 5. DIRECT FETCH TO GOOGLE API (Bypasses library crashes [cite: 5157])
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: req.body.contents,
        generationConfig: {
          thinking_config: thinkingConfig
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Catch specific API errors like "Thinking level not supported"
      throw new Error(data.error?.message || `Google API Error: ${response.status}`);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Vercel Function Error:", error.message);
    return res.status(500).json({ 
      error: "Serverless Function Crash", 
      details: error.message 
    });
  }
};
