const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function executeWithGemini(code, language) {
  try {
    const prompt = `You are a code execution simulator. The user has written ${language} code.
Your task is to accurately simulate the execution of this code and provide the output.

Instructions:
1. Analyze the code carefully
2. Simulate its execution step by step
3. Provide ONLY the output that would be printed/displayed
4. If there's a syntax error, explain it briefly
5. If there's a runtime error, explain what went wrong
6. Do NOT include code in your response, only the execution results

${language.toUpperCase()} CODE:
\`\`\`${language}
${code}
\`\`\`

EXECUTION OUTPUT:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const outputText = response.text().trim();

    // Check if Gemini detected an error
    if (
      outputText.toLowerCase().includes("error") ||
      outputText.toLowerCase().includes("invalid") ||
      outputText.toLowerCase().includes("syntax") ||
      outputText.toLowerCase().includes("cannot")
    ) {
      return { error: outputText };
    }

    return { output: outputText || "Code executed successfully" };
  } catch (error) {
    return { error: `Gemini execution failed: ${error.message}` };
  }
}

async function getGeminiErrorExplanation(code, language, error) {
  try {
    const prompt = `You are a helpful tutor for beginner programmers learning ${language}.
The student got an error while running their code.
Explain the error in simple, beginner-friendly language (1-2 sentences max).
Only explain what went wrong and how to fix it. No lengthy explanations.

CODE:
\`\`\`${language}
${code}
\`\`\`

ERROR:
${error}

SIMPLE EXPLANATION (1-2 sentences):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (e) {
    return `Error in ${language}: ${error}`;
  }
}

async function generateFlowchartWithGemini(code, language) {
  try {
    const prompt = `You are an expert at creating flowcharts for code logic.
Analyze this ${language} code and generate a Mermaid flowchart that shows the flow of execution.

Rules:
1. Create a clear flowchart showing the logic flow
2. Include decision points (if/else, loops)
3. Show input/output operations
4. Use proper Mermaid syntax
5. Make it simple and easy to understand for beginners
6. Return ONLY the Mermaid syntax, nothing else

${language.toUpperCase()} CODE:
\`\`\`${language}
${code}
\`\`\`

MERMAID FLOWCHART:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const mermaidCode = response.text().trim();

    // Extract just the Mermaid code if wrapped in backticks
    const mermaidMatch = mermaidCode.match(/\`\`\`(?:mermaid)?\n?([\s\S]*?)\n?\`\`\`/);
    if (mermaidMatch) {
      return mermaidMatch[1];
    }

    return mermaidCode;
  } catch (error) {
    console.error("Flowchart generation error:", error);
    return "";
  }
}

module.exports = {
  executeWithGemini,
  getGeminiErrorExplanation,
  generateFlowchartWithGemini,
};
