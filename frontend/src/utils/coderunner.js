// Browser-Based Code Execution (100% Free, No APIs)
// All 6 languages run entirely in browser via WebAssembly/JavaScript compilers
// Python: Pyodide, TypeScript: ts.js, SQL: sql.js, Lua: fengari.js, HTML: iframe, JavaScript: native

export const SUPPORTED_LANGUAGES = {
  python: { browser: true, label: "Python" },
  javascript: { browser: true, label: "JavaScript" },
  typescript: { browser: true, label: "TypeScript" },
  html: { browser: true, label: "HTML/CSS" },
  sql: { browser: true, label: "SQL" },
  lua: { browser: true, label: "Lua" },
};

const ERROR_EXPLANATIONS = {
  python: {
    SyntaxError: "You have a typo or incorrect syntax. Check your colons, parentheses, and indentation.",
    NameError: "You're using a variable that doesn't exist. Check spelling and make sure you defined it first.",
    IndentationError: "Your code indentation is wrong. Python needs consistent spaces or tabs.",
    TypeError: "You're using the wrong type of data. For example, trying to add a number to text.",
    IndexError: "You're trying to access an item that doesn't exist in your list.",
    ZeroDivisionError: "You can't divide by zero. Check your math operations.",
  },
  javascript: {
    SyntaxError: "You have a typo. Check your brackets, parentheses, and semicolons.",
    ReferenceError: "You're using a variable that doesn't exist. Check spelling and declarations.",
    TypeError: "You're using data incorrectly. Maybe calling a function on something that isn't a function.",
  },
  typescript: { SyntaxError: "Check your TypeScript syntax. Look for type errors or missing annotations." },
  sql: { "syntax error": "Check your SQL syntax." },
  lua: { "SyntaxError": "Check your Lua syntax. Look for unclosed strings or brackets." },
};

// Centralized library cache
const libraries = {};

// Generic async library loader
const loadLibrary = async (name, loader) => {
  if (libraries[name]) return libraries[name];
  const lib = await loader();
  if (lib) libraries[name] = lib;
  return lib;
};

// ========== JAVASCRIPT ==========
const executeJavaScript = (code) => {
  try {
    let output = "";
    const originalLog = console.log;
    
    console.log = (...args) => {
      output += args.map(arg => {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg); }
          catch { return String(arg); }
        }
        return String(arg);
      }).join(" ") + "\n";
    };

    const result = eval(code);
    console.log = originalLog;

    if (output.trim()) {
      return { success: true, output: output.trim() };
    } else if (result !== undefined) {
      return { success: true, output: String(result) };
    } else {
      return { success: true, output: "Code executed successfully" };
    }
  } catch (error) {
    console.log = console.log;
    return { success: false, error: error.message };
  }
};

// ========== PYTHON (Pyodide) ==========
const executePython = async (code) => {
  try {
    const py = await loadLibrary('pyodide', async () => {
      try {
        if (window.loadPyodide) {
          return await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
          });
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
        return new Promise((resolve, reject) => {
          script.onload = async () => {
            try {
              const py = await window.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
              });
              resolve(py);
            } catch (error) {
              reject(error);
            }
          };
          script.onerror = () => reject(new Error("Failed to load Pyodide script"));
          document.head.appendChild(script);
        });
      } catch (error) {
        console.error("Failed to load Pyodide:", error);
        return null;
      }
    });
    
    if (!py) return { success: false, error: "Python runtime initializing... Please try again." };

    let output = "";
    
    // Use Pyodide's standard output capture mechanism
    py.setStdout({
      batched: (text) => {
        output += text;
      }
    });
    
    py.setStderr({
      batched: (text) => {
        output += text;
      }
    });

    await py.runPythonAsync(code);
    return { success: true, output: output.trim() || "Code executed successfully" };
  } catch (error) {
    const errorMsg = error.message || String(error);
    for (const [key, explanation] of Object.entries(ERROR_EXPLANATIONS.python)) {
      if (errorMsg.includes(key)) return { success: false, error: explanation };
    }
    return { success: false, error: errorMsg };
  }
};

// ========== TYPESCRIPT (Compile to JS) ==========
const executeTypeScript = async (code) => {
  try {
    const ts = await loadLibrary('typescript', async () => {
      if (window.ts) return window.ts;
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/typescript@5.2.2/lib/typescript.js';
      return new Promise((resolve, reject) => {
        script.onload = () => resolve(window.ts);
        script.onerror = () => reject(new Error("Failed to load TypeScript"));
        document.head.appendChild(script);
      });
    });

    if (!ts) return { success: false, error: "TypeScript compiler not available" };

    const jsCode = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;

    return executeJavaScript(jsCode);
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== SQL (sql.js) ==========
const executeSql = async (code) => {
  try {
    const sqlDb = await loadLibrary('sql', async () => {
      try {
        const wasmBinary = await (await fetch('https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.wasm')).arrayBuffer();
        const module = await import('https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.js');
        return await module.default({ wasmBinary });
      } catch (error) {
        console.error("Failed to load sql.js:", error);
        return null;
      }
    });

    if (!sqlDb) return { success: false, error: "SQL runtime not available" };

    const db = new sqlDb.Database();
    let output = "";

    const statements = code.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      
      if (trimmed.toUpperCase().startsWith('SELECT')) {
        const results = db.exec(stmt);
        if (results.length > 0) {
          const { columns, values } = results[0];
          output += "| " + columns.join(" | ") + " |\n";
          output += "|" + columns.map(() => "---|").join("") + "\n";
          values.forEach(row => { output += "| " + row.join(" | ") + " |\n"; });
          output += "\n";
        }
      } else {
        db.run(stmt);
        output += "✓ Query executed\n";
      }
    }

    return { success: true, output: output.trim() || "SQL executed successfully" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== LUA (Fengari) ==========
const executeLua = async (code) => {
  try {
    const fengari = await loadLibrary('fengari', async () => {
      if (window.fengari) return window.fengari;
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/fengari@0.11.3/dist/fengari.min.js';
      return new Promise((resolve, reject) => {
        script.onload = () => resolve(window.fengari);
        script.onerror = () => reject(new Error("Failed to load Fengari"));
        document.head.appendChild(script);
      });
    });

    if (!fengari) return { success: false, error: "Lua runtime not available. Please reload the page." };

    let output = "";
    const L = fengari.lauxlib.luaL_newstate();
    fengari.lualib.luaL_openlibs(L);

    fengari.lua.lua_pushcfunction(L, (n) => {
      const numArgs = fengari.lua.lua_gettop(n);
      const results = [];
      for (let i = 1; i <= numArgs; i++) {
        const str = fengari.lua.lua_tostring(n, i);
        results.push(str || "");
      }
      output += results.join("\t") + "\n";
      return 0;
    });
    fengari.lua.lua_setglobal(L, "print");

    const result = fengari.lauxlib.luaL_dostring(L, code);
    if (result !== fengari.lua.LUA_OK) {
      const error = fengari.lua.lua_tostring(L, -1);
      return { success: false, error };
    }

    return { success: true, output: output.trim() || "Lua executed successfully" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== HTML/CSS (Preview in iframe) ==========
const executeHtml = (code) => {
  try {
    return {
      success: true,
      output: "HTML/CSS Preview",
      isHtmlPreview: true,
      preview: code  // Return the code itself, not a blob URL
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== MAIN EXECUTION FUNCTION ==========
export const runCode = async (code, language) => {
  if (language === "javascript") {
    return executeJavaScript(code);
  }
  
  if (language === "python") {
    return executePython(code);
  }

  if (language === "typescript") {
    return executeTypeScript(code);
  }

  if (language === "sql") {
    return executeSql(code);
  }

  if (language === "lua") {
    return executeLua(code);
  }

  if (language === "html") {
    return executeHtml(code);
  }
  
  return {
    success: false,
    error: `Language "${language}" is not supported`,
  };
};

// Simplify error messages
export const simplifyError = (stderr, language) => {
  if (!stderr) return "An error occurred.";

  const errors = ERROR_EXPLANATIONS[language] || {};
  
  for (const [key, explanation] of Object.entries(errors)) {
    if (stderr.includes(key)) {
      return explanation;
    }
  }

  const firstLine = stderr.split("\n")[0];
  return firstLine || "An error occurred. Check your code and try again.";
};
