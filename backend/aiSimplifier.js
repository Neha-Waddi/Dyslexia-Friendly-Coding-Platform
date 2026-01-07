const axios = require("axios");

async function simplifyError(errorText, language) {
  const prompt = `
You are an assistant helping beginner programmers.
Simplify the following ${language} error message.
Use simple words. No jargon. Explain what went wrong and how to fix it.

Error:
${errorText}

Simple Explanation:
`;

  const response = await axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      params: { key: process.env.GEMINI_API_KEY },
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}

module.exports = simplifyError;
