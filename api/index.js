// api/index.js
module.exports = async (req, res) => {
  // 1. MANDATORY CORS HEADERS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

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
  const level = req.body.thinking_level || (modelId.includes("pro") ? "high" : "medium");

  try {
    // 4. DIRECT FETCH TO GOOGLE API (Bypasses library crashes)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: req.body.contents,
        generationConfig: {
          thinking_config: {
            include_thoughts: true,
            thinking_level: level
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
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
