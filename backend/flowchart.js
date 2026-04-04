function generateFlowchart(code) {
  let chart = "graph TD\n";
  let nodeCounter = 0;
  const createNodeId = () => `N${nodeCounter++}`;

  // Sanitize text for Mermaid - remove special characters that break syntax
  function sanitize(text) {
    return text
      // Remove brackets and braces (they break Mermaid node syntax)
      .replace(/[\[\]\(\)\{\}]/g, " ")
      // Remove quotes
      .replace(/["'`]/g, "")
      // Convert logical operators to text to avoid | and & conflicts with Mermaid
      .replace(/\|\|/g, "or")
      .replace(/&&/g, "and")
      .replace(/[|&]/g, " ")
      // Replace common functions
      .replace(/console\.log/gi, "Output")
      .replace(/print/g, "Output")
      // Remove ONLY characters that actually break Mermaid (not operators)
      .replace(/[<>:;~?@#$^`]/g, " ")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      .trim()
      // Limit length for readability
      .substring(0, 50) || "step";
  }

  // Parse code into tokens handling multi-line statements
  function parseTokens(code) {
    const lines = code.split("\n");
    const tokens = [];
    let i = 0;
    
    while (i < lines.length) {
      let line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith("//") || line.startsWith("#")) {
        i++;
        continue;
      }

      // Handle multi-line statements (Python: ends with :, JS: starts with { or contains unclosed parens)
      let fullStatement = line;
      let parenCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      
      // Collect lines until statement is complete
      while ((line.endsWith(":") || parenCount > 0 || braceCount > 0) && i + 1 < lines.length) {
        i++;
        line = lines[i].trim();
        if (line && !line.startsWith("//") && !line.startsWith("#")) {
          fullStatement += " " + line;
          parenCount += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
          braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        }
      }

      if (fullStatement) {
        tokens.push(fullStatement);
      }
      i++;
    }
    
    return tokens;
  }

  // Detect language (Python or JavaScript)
  const isPython = code.includes("def ") || code.includes("for ") && code.includes(":") || code.includes("import ");
  const isJavaScript = code.includes("function ") || code.includes("const ") || code.includes("let ") || code.includes("var ");

  // Start node
  const startId = createNodeId();
  chart += `  ${startId}([Start])\n`;
  let currentNode = startId;

  const tokens = parseTokens(code);
  
  for (let i = 0; i < tokens.length; i++) {
    const statement = tokens[i];
    
    // Function/Method definitions
    if (statement.match(/^(def |function |async function |const \w+\s*=\s*\(|async \()/)) {
      const funcId = createNodeId();
      const funcName = statement.match(/(?:def |function |async function |const )(\w+)/)?.[1] || "function";
      chart += `  ${currentNode} --> ${funcId}["📦 Define Function: ${funcName}"]\n`;
      currentNode = funcId;
      continue;
    }

    // Class definitions
    if (statement.match(/^class\s+/)) {
      const classId = createNodeId();
      const className = statement.match(/^class\s+(\w+)/)?.[1] || "Class";
      chart += `  ${currentNode} --> ${classId}["📦 Define Class: ${className}"]\n`;
      currentNode = classId;
      continue;
    }

    // Python for loop
    if (statement.match(/^for\s+\w+\s+in/) && isPython) {
      const loopVar = statement.match(/for\s+(\w+)\s+in/)?.[1] || "item";
      const iterable = statement.match(/in\s+(.+?):/)?.[1] || "iterable";
      const loopId = createNodeId();
      const condId = createNodeId();
      const bodyId = createNodeId();
      const exitId = createNodeId();
      
      chart += `  ${currentNode} --> ${loopId}{{🔄 For ${loopVar} in ${sanitize(iterable)} }}\n`;
      chart += `  ${loopId} --> ${condId}{More items?}\n`;
      chart += `  ${condId} -->|Yes| ${bodyId}["Execute Loop Body"]\n`;
      chart += `  ${bodyId} --> ${loopId}\n`;
      chart += `  ${condId} -->|No| ${exitId}[" "]\n`;
      currentNode = exitId;
      continue;
    }

    // JavaScript for loop
    if (statement.match(/^for\s*\(/) && isJavaScript) {
      const condition = sanitize(statement.replace(/^for\s*\(/, "").replace(/\)\s*\{/, ""));
      const loopId = createNodeId();
      const condId = createNodeId();
      const bodyId = createNodeId();
      const exitId = createNodeId();
      
      chart += `  ${currentNode} --> ${loopId}{{🔄 Initialize: ${condition} }}\n`;
      chart += `  ${loopId} --> ${condId}{Continue?}\n`;
      chart += `  ${condId} -->|Yes| ${bodyId}["Execute Loop Body"]\n`;
      chart += `  ${bodyId} --> ${loopId}\n`;
      chart += `  ${condId} -->|No| ${exitId}[" "]\n`;
      currentNode = exitId;
      continue;
    }

    // For-of or for-in loop (JavaScript)
    if (statement.match(/^for\s*\(\s*(const|let|var)\s+\w+\s+(of|in)\s+/)) {
      const varName = statement.match(/(?:const|let|var)\s+(\w+)\s+(?:of|in)/)?.[1] || "item";
      const loopType = statement.match(/\s+(of|in)\s+/)?.[1] || "of";
      const iterable = statement.match(/\s+(?:of|in)\s+(.+?)\s*\{/)?.[1] || "iterable";
      const loopId = createNodeId();
      const condId = createNodeId();
      const bodyId = createNodeId();
      const exitId = createNodeId();
      
      chart += `  ${currentNode} --> ${loopId}{{🔄 For ${varName} ${loopType} ${sanitize(iterable)} }}\n`;
      chart += `  ${loopId} --> ${condId}{More items?}\n`;
      chart += `  ${condId} -->|Yes| ${bodyId}["Execute Loop Body"]\n`;
      chart += `  ${bodyId} --> ${loopId}\n`;
      chart += `  ${condId} -->|No| ${exitId}[" "]\n`;
      currentNode = exitId;
      continue;
    }

    // While loops
    if (statement.match(/^while\s+/) && isPython) {
      const condition = sanitize(statement.replace(/^while\s+/, "").replace(/:.*/, ""));
      const loopId = createNodeId();
      const condId = createNodeId();
      const bodyId = createNodeId();
      const exitId = createNodeId();
      
      chart += `  ${currentNode} --> ${loopId}{{🔁 While}}\n`;
      chart += `  ${loopId} --> ${condId}{${condition}?}\n`;
      chart += `  ${condId} -->|True| ${bodyId}["Execute Loop Body"]\n`;
      chart += `  ${bodyId} --> ${loopId}\n`;
      chart += `  ${condId} -->|False| ${exitId}[" "]\n`;
      currentNode = exitId;
      continue;
    }

    if (statement.match(/^while\s*\(/) && isJavaScript) {
      const condition = sanitize(statement.replace(/^while\s*\(/, "").replace(/\)\s*\{/, ""));
      const loopId = createNodeId();
      const condId = createNodeId();
      const bodyId = createNodeId();
      const exitId = createNodeId();
      
      chart += `  ${currentNode} --> ${loopId}{{🔁 While}}\n`;
      chart += `  ${loopId} --> ${condId}{${condition}?}\n`;
      chart += `  ${condId} -->|True| ${bodyId}["Execute Loop Body"]\n`;
      chart += `  ${bodyId} --> ${loopId}\n`;
      chart += `  ${condId} -->|False| ${exitId}[" "]\n`;
      currentNode = exitId;
      continue;
    }

    // If-else chains (Python)
    if (statement.match(/^if\s+/) && isPython) {
      const condition = sanitize(statement.replace(/^if\s+/, "").replace(/:.*/, ""));
      const ifId = createNodeId();
      const yesId = createNodeId();
      const noId = createNodeId();
      const mergeId = createNodeId();
      
      chart += `  ${currentNode} --> ${ifId}{❓ ${condition}?}\n`;
      chart += `  ${ifId} -->|True| ${yesId}["Execute If Block"]\n`;
      chart += `  ${ifId} -->|False| ${noId}["Check Else/Elif"]\n`;
      chart += `  ${yesId} --> ${mergeId}[" "]\n`;
      chart += `  ${noId} --> ${mergeId}\n`;
      currentNode = mergeId;
      continue;
    }

    // If-else chains (JavaScript)
    if (statement.match(/^if\s*\(/) && isJavaScript) {
      const condition = sanitize(statement.replace(/^if\s*\(/, "").replace(/\)\s*\{/, ""));
      const ifId = createNodeId();
      const yesId = createNodeId();
      const noId = createNodeId();
      const mergeId = createNodeId();
      
      chart += `  ${currentNode} --> ${ifId}{❓ ${condition}?}\n`;
      chart += `  ${ifId} -->|True| ${yesId}["Execute If Block"]\n`;
      chart += `  ${ifId} -->|False| ${noId}["Check Else"]\n`;
      chart += `  ${yesId} --> ${mergeId}[" "]\n`;
      chart += `  ${noId} --> ${mergeId}\n`;
      currentNode = mergeId;
      continue;
    }

    // Return statements
    if (statement.match(/^return\s/)) {
      const returnId = createNodeId();
      const value = sanitize(statement.replace(/^return\s+/, ""));
      chart += `  ${currentNode} --> ${returnId}(["↩️  Return: ${value}"])\n`;
      currentNode = returnId;
      continue;
    }

    // Print/Output statements
    if (statement.match(/^print\s*\(/) || statement.match(/console\.log/)) {
      const printId = createNodeId();
      let text = statement.replace(/^print\s*\(/, "").replace(/console\.log\s*\(/, "").replace(/\).*/, "");
      text = sanitize(text);
      chart += `  ${currentNode} --> ${printId}["🖨️  Output: ${text}"]\n`;
      currentNode = printId;
      continue;
    }

    // Variable assignments (handles multiple assignment types)
    if (statement.match(/^\w+\s*(=|:=)/) && !statement.match(/^(if|for|while|def|class|function|return|import|from)/)) {
      const assignId = createNodeId();
      const varName = statement.match(/^(\w+)\s*(=|:=)/)?.[1];
      const value = sanitize(statement.replace(/^\w+\s*(=|:=)\s*/, ""));
      chart += `  ${currentNode} --> ${assignId}["💾 ${varName} = ${value}"]\n`;
      currentNode = assignId;
      continue;
    }

    // Function calls
    if (statement.match(/^\w+\s*\(/) && !statement.match(/^(if|for|while|print|console|return)/)) {
      const callId = createNodeId();
      const funcName = statement.match(/^(\w+)\s*\(/)?.[1];
      const args = sanitize(statement.replace(/^\w+\s*\(/, "").replace(/\).*/, ""));
      chart += `  ${currentNode} --> ${callId}["📞 Call ${funcName}(${args})"]\n`;
      currentNode = callId;
      continue;
    }

    // Try-catch blocks
    if (statement.match(/^try\s*:/)) {
      const tryId = createNodeId();
      chart += `  ${currentNode} --> ${tryId}["🛡️  Try Block"]\n`;
      currentNode = tryId;
      continue;
    }

    if (statement.match(/^(except|catch)/)) {
      const catchId = createNodeId();
      const errorType = sanitize(statement.match(/(?:except|catch)\s+(\w+)?/)?.[1] || "Exception");
      chart += `  ${currentNode} --> ${catchId}["⚠️  Catch ${errorType}"]\n`;
      currentNode = catchId;
      continue;
    }

    // Import/Require statements
    if (statement.match(/^(import|from|require)/)) {
      const importId = createNodeId();
      const imported = sanitize(statement.replace(/^(import|from|require)\s+/, "").replace(/\s+as\s+.+/, ""));
      chart += `  ${currentNode} --> ${importId}["📚 Import: ${imported}"]\n`;
      currentNode = importId;
      continue;
    }

    // Break/Continue statements
    if (statement.match(/^(break|continue)\s*$/)) {
      const flowId = createNodeId();
      const action = statement.trim().toUpperCase();
      chart += `  ${currentNode} --> ${flowId}["⏭️  ${action}"]\n`;
      currentNode = flowId;
      continue;
    }

    // Generic statement/expression
    if (statement.length > 1) {
      const stmtId = createNodeId();
      const statement_sanitized = sanitize(statement);
      chart += `  ${currentNode} --> ${stmtId}["⚙️  ${statement_sanitized}"]\n`;
      currentNode = stmtId;
    }
  }

  // End node
  const endId = createNodeId();
  chart += `  ${currentNode} --> ${endId}([✅ End])\n`;

  return chart;
}

module.exports = generateFlowchart;