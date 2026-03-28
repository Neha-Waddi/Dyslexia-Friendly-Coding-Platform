import { useState } from "react";
import { useContext } from "react";

import ControlPanel from "../components/ControlPanel.jsx";
import Editor from "../components/Editor.jsx";
import FlowchartView from "../components/FlowchartView.jsx";
import OutputPanel from "../components/OutputPanel.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { AccessibilityContext } from "../context/AccessibilityContext";
import { runCode as executeCode } from "../utils/coderunner.js";

export default function Playground() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [flowchart, setFlowchart] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
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
    setExplanation("Running code...");
    setFlowchart("");
    setHtmlPreview("");

    try {
      // Run code in browser (Python via Pyodide, JavaScript via eval, etc.)
      const result = await executeCode(code, language);

      if (result.success) {
        if (language === "html" && result.isHtmlPreview) {
          // Special handling for HTML preview
          setHtmlPreview(result.preview);
          setOutput("HTML rendered successfully");
          setExplanation("✓ HTML preview loaded!");
        } else {
          setOutput(result.output || "Code executed successfully");
          setExplanation("✓ Code executed successfully!");
        }
        setError("");

        // Generate flowchart for the code
        try {
          const flowchartResponse = await fetch(`${import.meta.env.VITE_API_URL}/flowchart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          const flowchartData = await flowchartResponse.json();
          if (flowchartData.chart) {
            setFlowchart(flowchartData.chart);
          }
        } catch (flowchartErr) {
          console.error("Flowchart generation failed:", flowchartErr);
        }
      } else {
        setError(result.error || "Execution failed");
        setExplanation("");
      }
    } catch (err) {
      setError("Execution error: " + err.message);
      setExplanation("");
      console.error("Runtime error:", err);
    }
  };


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
              <OutputPanel output={output} error={error} explanation={explanation} htmlPreview={htmlPreview} />
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
