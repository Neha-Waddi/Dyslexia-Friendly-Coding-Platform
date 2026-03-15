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
  const [explanation, setExplanation] = useState("");
  const [flowchart, setFlowchart] = useState("");
  const [editorHeight, setEditorHeight] = useState(50); // percentage
  const [editorWidth, setEditorWidth] = useState(70); // percentage of main area
  const { theme } = useContext(AccessibilityContext);

const themeClasses = {
  dark: "bg-gray-900 text-white",
  light: "bg-gray-100 text-gray-900",
  "high-contrast": "bg-black text-yellow-300",
};


  const runCode = async () => {
  setOutput("");
  setError("");
  setExplanation("");
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

    // Request code explanation from backend
    try {
      const resp = await fetch("http://localhost:5000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await resp.json();
      setExplanation(data.explanation || "Could not generate explanation.");
    } catch (expErr) {
      console.error("Explanation API error", expErr);
      setExplanation("Could not generate explanation.");
    }

    // Request accurate flowchart from backend parser
    try {
      const resp = await fetch("http://localhost:5000/flowchart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await resp.json();
      setFlowchart(data.chart || "");
    } catch (fcErr) {
      console.error("Flowchart API error", fcErr);
      setFlowchart("");
    }

  } catch (err) {
    // Try to get simplified error explanation
    try {
      const resp = await fetch("http://localhost:5000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, error: err.message }),
      });
      const data = await resp.json();
      if (data.explanation) {
        setError(data.explanation);
      } else {
        setError("An error occurred, but could not generate explanation.");
      }
    } catch (expErr) {
      console.error("Error explanation API error", expErr);
      setError("An error occurred while running your code.");
    }
    }
  }


  return (
    <div className={`flex h-screen ${themeClasses[theme]}`}>

      <ControlPanel />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Editor and Output Container */}
        <div className="flex flex-col relative overflow-hidden" style={{ width: `${editorWidth}%`, flexShrink: 0 }}>
          <div style={{ height: `${editorHeight}%` }} className="overflow-hidden">
            <ErrorBoundary>
              <Editor
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
                onRun={runCode}
              />
            </ErrorBoundary>
          </div>

          {/* Height Divider */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = editorHeight;
              const container = e.currentTarget.parentElement;
              const containerHeight = container.clientHeight;

              const handleMouseMove = (moveEvent) => {
                const diff = moveEvent.clientY - startY;
                const newHeight = startHeight + (diff / containerHeight) * 100;
                if (newHeight > 20 && newHeight < 80) {
                  setEditorHeight(newHeight);
                }
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.body.style.cursor = 'auto';
              };

              document.body.style.cursor = 'row-resize';
              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            className={`w-full h-1 cursor-row-resize hover:h-1.5 z-40 transition-all ${
              theme === 'dark' ? 'bg-gray-600 hover:bg-blue-500' :
              theme === 'light' ? 'bg-gray-400 hover:bg-blue-400' :
              'bg-yellow-500 hover:bg-yellow-400'
            }`}
            title="Drag to resize editor and output"
          />

          <div style={{ height: `${100 - editorHeight}%` }} className="overflow-hidden">
            <ErrorBoundary>
              <OutputPanel output={output} error={error} explanation={explanation} />
            </ErrorBoundary>
          </div>
        </div>

        {/* Width Divider between Editor/Output and Flowchart */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            const container = e.currentTarget.parentElement;
            const containerRect = container.getBoundingClientRect();

            const handleMouseMove = (moveEvent) => {
              const mouseX = moveEvent.clientX;
              const relativeX = mouseX - containerRect.left;
              const newWidth = (relativeX / containerRect.width) * 100;
              
              if (newWidth > 30 && newWidth < 85) {
                setEditorWidth(newWidth);
              }
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
              document.body.style.cursor = 'auto';
            };

            document.body.style.cursor = 'col-resize';
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
          className={`w-1 h-full cursor-col-resize hover:w-1.5 z-40 transition-all ${
            theme === 'dark' ? 'bg-gray-600 hover:bg-blue-500' :
            theme === 'light' ? 'bg-gray-400 hover:bg-blue-400' :
            'bg-yellow-500 hover:bg-yellow-400'
          }`}
          title="Drag to resize width"
        />

        {/* Flowchart */}
        <div className="flex-1 overflow-hidden" style={{ minWidth: 0 }}>
          <ErrorBoundary>
            <FlowchartView chart={flowchart} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
