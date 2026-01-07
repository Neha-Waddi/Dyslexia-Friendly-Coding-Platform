function generateFlowchart(code) {
  let chart = "graph TD\n";
  let nodeCounter = 0;
  const createNodeId = () => `N${nodeCounter++}`;

  // Sanitize text for Mermaid
  function sanitize(text) {
  return text
    // remove all brackets completely
    .replace(/[\[\]\(\)\{\}]/g, " ")
    // remove quotes
    .replace(/["'`]/g, "")
    // replace print / console.log
    .replace(/console\.log|print/gi, "Output")
    // collapse spaces
    .replace(/\s+/g, " ")
    .trim()
    // fallback label
    .substring(0, 40) || "step";
}

  // Start node
  const startId = createNodeId();
  chart += `  ${startId}([Start])\n`;
  let currentNode = startId;

  // Parse lines
  const lines = code.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip comments
    if (line.startsWith("//") || line.startsWith("#")) continue;

    // Function definitions (Python & JS)
    if (line.match(/^(def |function |const \w+\s*=\s*\(|async function)/)) {
      const funcId = createNodeId();
      const funcName = line.match(/(?:def |function |const )(\w+)/)?.[1] || "function";
      chart += `  ${currentNode} --> ${funcId}[Define Function: ${funcName}]\n`;
      currentNode = funcId;
      continue;
    }

    // For loops (Python & JS)
    if (line.match(/^for\s+(.*?):/)) {
      // Python for loop
      const loopVar = line.match(/for\s+(\w+)\s+in/)?.[1] || "item";
      const loopId = createNodeId();
      const condId = createNodeId();
      const bodyId = createNodeId();
      
      chart += `  ${currentNode} --> ${loopId}[Initialize loop: ${loopVar}]\n`;
      chart += `  ${loopId} --> ${condId}{More items?}\n`;
      chart += `  ${condId} -->|Yes| ${bodyId}[Loop body]\n`;
      chart += `  ${bodyId} --> ${condId}\n`;
      
      const exitId = createNodeId();
      chart += `  ${condId} -->|No| ${exitId}[ ]\n`;
      currentNode = exitId;
      continue;
    }
    
    if (line.match(/^for\s*\(/)) {
      // JavaScript for loop
      const condition = sanitize(line.replace(/^for\s*\(/, "").replace(/\).*/, ""));
      const loopId = createNodeId();
      const condId = createNodeId();
      const bodyId = createNodeId();
      
      chart += `  ${currentNode} --> ${loopId}[${condition}]\n`;
      chart += `  ${loopId} --> ${condId}{Continue?}\n`;
      chart += `  ${condId} -->|Yes| ${bodyId}[Loop body]\n`;
      chart += `  ${bodyId} --> ${loopId}\n`;
      
      const exitId = createNodeId();
      chart += `  ${condId} -->|No| ${exitId}[ ]\n`;
      currentNode = exitId;
      continue;
    }

    // While loops
    if (line.match(/^while\s+(.*?):/)) {
      // Python while
      const condition = sanitize(line.replace(/^while\s+/, "").replace(/:.*/, ""));
      const whileId = createNodeId();
      const bodyId = createNodeId();
      
      chart += `  ${currentNode} --> ${whileId}{${condition}}\n`;
      chart += `  ${whileId} -->|True| ${bodyId}[Loop body]\n`;
      chart += `  ${bodyId} --> ${whileId}\n`;
      
      const exitId = createNodeId();
      chart += `  ${whileId} -->|False| ${exitId}[ ]\n`;
      currentNode = exitId;
      continue;
    }

    if (line.match(/^while\s*\(/)) {
      // JavaScript while
      const condition = sanitize(line.replace(/^while\s*\(/, "").replace(/\).*/, ""));
      const whileId = createNodeId();
      const bodyId = createNodeId();
      
      chart += `  ${currentNode} --> ${whileId}{${condition}}\n`;
      chart += `  ${whileId} -->|True| ${bodyId}[Loop body]\n`;
      chart += `  ${bodyId} --> ${whileId}\n`;
      
      const exitId = createNodeId();
      chart += `  ${whileId} -->|False| ${exitId}[ ]\n`;
      currentNode = exitId;
      continue;
    }

    // If statements (Python)
    if (line.match(/^if\s+(.*?):/)) {
      const condition = sanitize(line.replace(/^if\s+/, "").replace(/:.*/, ""));
      const ifId = createNodeId();
      
      chart += `  ${currentNode} --> ${ifId}{${condition}}\n`;
      
      const yesId = createNodeId();
      const noId = createNodeId();
      chart += `  ${ifId} -->|True| ${yesId}[If block]\n`;
      chart += `  ${ifId} -->|False| ${noId}[Else block]\n`;
      
      const mergeId = createNodeId();
      chart += `  ${yesId} --> ${mergeId}[ ]\n`;
      chart += `  ${noId} --> ${mergeId}[ ]\n`;
      currentNode = mergeId;
      continue;
    }

    // If statements (JS)
    if (line.match(/^if\s*\(/)) {
      const condition = sanitize(line.replace(/^if\s*\(/, "").replace(/\).*/, ""));
      const ifId = createNodeId();
      
      chart += `  ${currentNode} --> ${ifId}{${condition}}\n`;
      
      const yesId = createNodeId();
      const noId = createNodeId();
      chart += `  ${ifId} -->|True| ${yesId}[If block]\n`;
      chart += `  ${ifId} -->|False| ${noId}[Else block]\n`;
      
      const mergeId = createNodeId();
      chart += `  ${yesId} --> ${mergeId}[ ]\n`;
      chart += `  ${noId} --> ${mergeId}[ ]\n`;
      currentNode = mergeId;
      continue;
    }

    // Elif/else if
    if (line.match(/^(elif|else if)/)) {
      // Already handled in if block
      continue;
    }

    // Else
    if (line.match(/^else\s*:?/)) {
      // Already handled in if block
      continue;
    }

    // Return statements
    if (line.match(/^return\s/)) {
      const returnId = createNodeId();
      const value = sanitize(line.replace(/^return\s+/, ""));
      chart += `  ${currentNode} --> ${returnId}([Return ${value}])\n`;
      currentNode = returnId;
      continue;
    }

    // Print statements (Python)
    if (line.match(/^print\s*\(/)) {
      const printId = createNodeId();
      let text = line
        .replace(/^print\s*\(/, "")
        .replace(/\).*/, "")
        .replace(/^f["']/, "")
        .replace(/["']/g, "")
        .replace(/\{[^}]*\}/g, "");
      text = sanitize(text);
      chart += `  ${currentNode} --> ${printId}[Print: ${text}]\n`;
      currentNode = printId;
      continue;
    }

    // Console.log (JavaScript)
    if (line.match(/console\.log\s*\(/)) {
      const printId = createNodeId();
      let text = line
        .replace(/.*console\.log\s*\(/, "")
        .replace(/\).*/, "");
      text = sanitize(text);
      chart += `  ${currentNode} --> ${printId}[Output: ${text}]\n`;
      currentNode = printId;
      continue;
    }

    // Variable assignments
    if (line.match(/^\w+\s*=/)) {
      const assignId = createNodeId();
      const varName = line.match(/^(\w+)\s*=/)?.[1];
      const value = sanitize(line.replace(/^\w+\s*=\s*/, ""));
      chart += `  ${currentNode} --> ${assignId}[${varName} = ${value}]\n`;
      currentNode = assignId;
      continue;
    }

    // Function calls
    if (line.match(/^\w+\s*\(/)) {
      const callId = createNodeId();
      const funcName = line.match(/^(\w+)\s*\(/)?.[1];
      chart += `  ${currentNode} --> ${callId}[Call ${funcName}]\n`;
      currentNode = callId;
      continue;
    }

    // Try-catch blocks
    if (line.match(/^try\s*:/)) {
      const tryId = createNodeId();
      chart += `  ${currentNode} --> ${tryId}[Try block]\n`;
      currentNode = tryId;
      continue;
    }

    if (line.match(/^except|^catch/)) {
      const catchId = createNodeId();
      chart += `  ${currentNode} --> ${catchId}[Handle error]\n`;
      currentNode = catchId;
      continue;
    }

    // Class definitions
    if (line.match(/^class\s+/)) {
      const classId = createNodeId();
      const className = line.match(/^class\s+(\w+)/)?.[1];
      chart += `  ${currentNode} --> ${classId}[Define class: ${className}]\n`;
      currentNode = classId;
      continue;
    }

    // Import statements
    if (line.match(/^(import|from|require)/)) {
      const importId = createNodeId();
      const statement = sanitize(line);
      chart += `  ${currentNode} --> ${importId}[${statement}]\n`;
      currentNode = importId;
      continue;
    }

    // Generic statement
    if (line.length > 1 && !line.match(/^[{}]$/)) {
      const stmtId = createNodeId();
      const statement = sanitize(line);
      chart += `  ${currentNode} --> ${stmtId}[${statement}]\n`;
      currentNode = stmtId;
    }
  }

  // End node
  const endId = createNodeId();
  chart += `  ${currentNode} --> ${endId}([End])\n`;

  return chart;
}

module.exports = generateFlowchart;