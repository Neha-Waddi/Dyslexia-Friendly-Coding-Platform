const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { exec } = require("child_process");
const axios = require("axios");
const generateFlowchart = require("./flowchart");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// Helper function to get error explanation
async function getErrorExplanation(code, language, error) {
  try {
    const prompt = `You are a brief error explainer for beginners.
ONLY give a 1-2 sentence explanation of the error and how to fix it.
NO long explanations. NO concept breakdowns. NO examples.
Just the error meaning and the fix.

Code:
${code}

Error:
${error}

Brief explanation (1-2 sentences only):`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (e) {
    return "Unable to generate explanation. " + simplifyError(error, language);
  }
}
// Initialize Express app
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple error simplification (without external API for demo)
function simplifyError(errorText, language) {
  const commonErrors = {
    python: {
      "SyntaxError": "You have a typo or incorrect syntax. Check your colons, parentheses, and indentation.",
      "NameError": "You're using a variable that doesn't exist. Check spelling and make sure you defined it first.",
      "IndentationError": "Your code indentation is wrong. Python needs consistent spaces or tabs.",
      "TypeError": "You're using the wrong type of data. For example, trying to add a number to text.",
      "IndexError": "You're trying to access an item that doesn't exist in your list.",
      "KeyError": "You're trying to access a dictionary key that doesn't exist.",
      "ZeroDivisionError": "You can't divide by zero. Check your math operations.",
      "AttributeError": "You're trying to use a method or property that doesn't exist.",
      "ImportError": "Python can't find the module you're trying to import.",
      "ValueError": "The value you're using is not appropriate for the operation."
    },
    javascript: {
      "SyntaxError": "You have a typo. Check your brackets, parentheses, and semicolons.",
      "ReferenceError": "You're using a variable that doesn't exist. Check spelling and declarations.",
      "TypeError": "You're using data incorrectly. Maybe calling a function on something that isn't a function.",
      "RangeError": "A number is outside the allowed range.",
      "is not defined": "This variable hasn't been created yet. Make sure to declare it first.",
      "undefined is not": "You're trying to use something that is undefined.",
      "Cannot read property": "You're trying to access a property of something that doesn't exist.",
      "is not a function": "You're trying to call something that isn't a function."
    },
    typescript: {
      "error TS": "TypeScript found an error in your code. Check the error details carefully.",
      "SyntaxError": "You have a syntax error. Check brackets, colons, and semicolons.",
      "Cannot find name": "You're using a variable or function that hasn't been declared.",
      "Type": "There's a type mismatch. Check that your types match what functions expect.",
      "Property does not exist": "You're trying to access a property that doesn't exist.",
      "is not assignable to type": "You're trying to assign a value of the wrong type."
    },
  };

  let simplified = "An error occurred. ";
  
  const errors = commonErrors[language.toLowerCase()] || {};
  
  for (const [key, explanation] of Object.entries(errors)) {
    if (errorText.includes(key)) {
      simplified = explanation;
      break;
    }
  }
  
  // Add line number if present
  const lineMatch = errorText.match(/line (\d+)/i);
  if (lineMatch) {
    simplified += ` Check line ${lineMatch[1]}.`;
  }
  
  return simplified;
}

// Run code endpoint
app.post("/run", async (req, res) => {
  const { code, language } = req.body;

  try {
    if (language === "python") {
      // Write code to temporary file
      fs.writeFileSync("temp.py", code);

      // Execute Python code - try both python and python3
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      exec(`${pythonCmd} temp.py`, { timeout: 5000, maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
        // Clean up temp file
        try {
          fs.unlinkSync("temp.py");
        } catch (e) {
          console.log("Could not delete temp file");
        }

        if (err) {
          const explanation = await getErrorExplanation(code, "python", stderr || err.message);
          return res.json({
            error: explanation,
          });
        }
        
        res.json({ output: stdout || "Code executed successfully" });
      });
    } else if (language === "javascript") {
      // For JavaScript, we'll use a safer evaluation method
      try {
        // Capture console.log output
        let output = "";
        const originalLog = console.log;
        console.log = (...args) => {
          output += args.join(" ") + "\n";
        };

        // Execute code
        const result = eval(code);
        
        // Restore console.log
        console.log = originalLog;

        if (output) {
          res.json({ output: output.trim() });
        } else if (result !== undefined) {
          res.json({ output: String(result) });
        } else {
          res.json({ output: "Code executed successfully" });
        }
      } catch (jsErr) {
        const explanation = await getErrorExplanation(code, "javascript", jsErr.message);
        res.json({
          error: explanation,
        });
      }
    } else if (language === "typescript") {
      // Execute TypeScript using ts-node
      fs.writeFileSync("temp.ts", code);

      exec("ts-node temp.ts", { timeout: 5000, maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
        try {
          fs.unlinkSync("temp.ts");
        } catch (e) {
          console.log("Could not delete temp file");
        }

        if (err) {
          const explanation = await getErrorExplanation(code, "typescript", stderr || err.message);
          return res.json({
            error: explanation,
          });
        }
        
        res.json({ output: stdout || "Code executed successfully" });
      });
    } else if (language === "java") {
      // Execute Java code - wrap user code in main method if not present
      let javaCode = code;
      if (!code.includes("public static void main")) {
        javaCode = `public class Main {
  public static void main(String[] args) {
    ${code.split('\n').map(line => '    ' + line).join('\n')}
  }
}`;
      } else if (!code.includes("public class Main")) {
        javaCode = `public class Main {
${code.split('\n').map(line => '  ' + line).join('\n')}
}`;
      }

      fs.writeFileSync("Main.java", javaCode);

      exec(`javac Main.java && java Main`, { timeout: 5000 }, async (err, stdout, stderr) => {
        // Clean up Java files
        try {
          fs.unlinkSync("Main.java");
        } catch (e) {
          console.log("Could not delete Main.java");
        }
        try {
          fs.unlinkSync("Main.class");
        } catch (e) {
          console.log("Could not delete Main.class");
        }

        if (err) {
          const explanation = await getErrorExplanation(code, "java", stderr || err.message);
          return res.json({
            error: explanation,
          });
        }
        
        res.json({ output: stdout || "Code executed successfully" });
      });
    } else if (language === "cpp") {
      // Execute C++ code - cross-platform
      fs.writeFileSync("temp.cpp", code);
      
      const isWindows = process.platform === 'win32';
      const executableName = isWindows ? 'temp.exe' : 'temp';
      const runCommand = isWindows ? 'temp.exe' : './temp';
      const compileCommand = `g++ temp.cpp -o ${executableName} && ${runCommand}`;

      exec(compileCommand, { timeout: 5000 }, async (err, stdout, stderr) => {
        // Clean up temp files
        try {
          fs.unlinkSync("temp.cpp");
        } catch (e) {
          console.log("Could not delete temp.cpp");
        }
        try {
          fs.unlinkSync(executableName);
        } catch (e) {
          console.log("Could not delete executable");
        }

        if (err) {
          const explanation = await getErrorExplanation(code, "cpp", stderr || err.message);
          return res.json({
            error: explanation,
          });
        }
        
        res.json({ output: stdout || "Code executed successfully" });
      });
    } else if (language === "ruby") {
      // Execute Ruby code
      fs.writeFileSync("temp.rb", code);

      exec("ruby temp.rb", { timeout: 5000, maxBuffer: 10 * 1024 * 1024 }, async (err, stdout, stderr) => {
        try {
          fs.unlinkSync("temp.rb");
        } catch (e) {
          console.log("Could not delete temp file");
        }

        if (err) {
          const explanation = await getErrorExplanation(code, "ruby", stderr || err.message);
          return res.json({
            error: explanation,
          });
        }
        
        res.json({ output: stdout || "Code executed successfully" });
      });
    } else {
      res.json({ error: "Unsupported language. Please select Python, JavaScript, TypeScript, Java, C++, or Ruby." });
    }
  } catch (e) {
    res.json({ 
      error: "An unexpected error occurred while running your code."
    });
  }
});

// Flowchart endpoint
app.post("/flowchart", (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || code.trim().length === 0) {
      return res.json({ chart: "" });
    }
    
    const chart = generateFlowchart(code);
    res.json({ chart });
  } catch (error) {
    console.error("Flowchart generation error:", error);
    res.json({ 
      chart: "",
      error: "Could not generate flowchart" 
    });
  }
});

// Explain code endpoint
app.post("/explain", async (req, res) => {
  try {
    const { code, language, error } = req.body;
    
    if (error) {
      // Explain the error
      const prompt = `You are a brief error explainer for beginners.
ONLY give a 1-2 sentence explanation of the error and how to fix it.
NO long explanations. NO concept breakdowns. NO examples.
Just the error meaning and the fix.

Code:
${code}

Error:
${error}

Brief explanation (1-2 sentences only):`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const explanation = response.text().trim();
      res.json({ explanation });
    } else {
      // Explain the code
      if (!code || code.trim().length === 0) {
        return res.json({ explanation: "No code provided to explain." });
      }
      
      const prompt = `You are a brief code explainer for beginners.
ONLY give a 1-2 sentence explanation of what this code does.
NO step-by-step breakdown. NO detailed explanations of concepts. NO examples.
Just the main action in simple words.

Code:
${code}

Brief explanation (1-2 sentences only):`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const explanation = response.text().trim();
      res.json({ explanation });
    }
  } catch (apiError) {
    console.error("Explanation generation error:", apiError);
    res.json({ 
      explanation: "Could not generate explanation. Please check your code and try again.",
      error: apiError.message 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Endpoints available:`);
  console.log(`   POST /run - Execute code`);
  console.log(`   POST /flowchart - Generate flowchart`);
  console.log(`   GET /health - Health check`);
});