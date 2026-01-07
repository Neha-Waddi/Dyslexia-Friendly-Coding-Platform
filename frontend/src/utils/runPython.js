let pyodide = null;

export async function runPython(code) {
  if (!window.loadPyodide) {
    throw new Error("Pyodide not loaded");
  }

  if (!pyodide) {
    pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
    });
  }

  let output = "";

  pyodide.setStdout({
    batched: (text) => {
      output += text + "\n";
    },
  });

  pyodide.setStderr({
    batched: (text) => {
      output += "Error: " + text + "\n";
    },
  });

  await pyodide.runPythonAsync(code);

  return output.trim();
}
