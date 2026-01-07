import { useState } from "react";
import { runPython } from "../utils/runPython";
// import generateFlowchart from "../../../backend/flowchart.js";


import ControlPanel from "../components/ControlPanel.jsx";
import Editor from "../components/Editor.jsx";
import FlowchartView from "../components/FlowchartView.jsx";
import OutputPanel from "../components/OutputPanel.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { useContext } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext";


export default function Playground() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [flowchart, setFlowchart] = useState("");
  const { theme } = useContext(AccessibilityContext);

const themeClasses = {
  dark: "bg-gray-900 text-white",
  light: "bg-gray-100 text-gray-900",
  "high-contrast": "bg-black text-yellow-300",
};


  const runCode = async () => {
  setOutput("");
  setError("");
  setFlowchart("");

  try {
    if (language === "javascript") {
      let result = "";
      const oldLog = console.log;

      console.log = (...args) => {
        result += args.join(" ") + "\n";
      };

      eval(code);
      console.log = oldLog;

      setOutput(result || "Code executed successfully");
    } else {
      const result = await runPython(code);
      setOutput(result || "Python code executed successfully");
    }

    generateFlowchart(code); // ✅ NOW WORKS

  } catch (err) {
    setError(err.message);
  }
};


  const generateFlowchart = (source) => {
  let chart = "graph TD\n";
  let id = 0;
  const next = () => `N${id++}`;

  const sanitize = (text) =>
    text
      .replace(/[\[\]\(\)\{\}]/g, "")   // 🔥 remove brackets
      .replace(/["'`]/g, "")
      .replace(/console\.log|print/gi, "Output")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40) || "step";

  const start = next();
  chart += `${start}([Start])\n`;
  let prev = start;

  source
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith("#") || line.startsWith("//")) return;

      const node = next();
      chart += `${prev} --> ${node}[${sanitize(line)}]\n`;
      prev = node;
    });

  const end = next();
  chart += `${prev} --> ${end}([End])\n`;

  setFlowchart(chart);
};

  return (
    <div className={`flex h-screen ${themeClasses[theme]}`}>

      <ControlPanel />

      <div className="flex flex-col flex-1">
        <ErrorBoundary>
          <Editor
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            onRun={runCode}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <OutputPanel output={output} error={error} />
        </ErrorBoundary>
      </div>

      <ErrorBoundary>
        <FlowchartView chart={flowchart} />
      </ErrorBoundary>
    </div>
  );
}
