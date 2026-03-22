import { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext";
import { GitBranch, AlertCircle, Loader } from "lucide-react";

export default function FlowchartView({ chart }) {
  const [svg, setSvg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const initialized = useRef(false);
  const { theme, fontFamily, fontSize, lineHeight } = useContext(AccessibilityContext);

  const mermaidTheme =
    theme === "light" ? "default" : theme === "high-contrast" ? "dark" : "dark";

  const flowchartThemeClasses = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900 text-white border-l border-gray-700",
    light: "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 border-l border-gray-200",
    "high-contrast": "bg-black text-yellow-300 border-l border-yellow-500",
  };

  const headerThemeClasses = {
    dark: "bg-gray-700 border-gray-600",
    light: "bg-gray-200 border-gray-300",
    "high-contrast": "bg-yellow-600 border-yellow-500",
  };

  useEffect(() => {
    if (!chart || !chart.startsWith("graph")) {
      setSvg("");
      return;
    }

    setIsLoading(true);
    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;

        if (!initialized.current) {
          mermaid.initialize({
            theme: mermaidTheme,
            startOnLoad: false,
            securityLevel: "loose",
          });
          initialized.current = true;
        } else {
          mermaid.initialize({
            theme: mermaidTheme,
            startOnLoad: false,
            securityLevel: "loose",
          });
        }

        const { svg } = await mermaid.render(
          "chart-" + Date.now(),
          chart
        );

        // Apply font styling to SVG
        const styledSvg = svg.replace(
          /<svg/,
          `<svg style="font-family: ${fontFamily}; font-size: ${fontSize}px; line-height: ${lineHeight}px;"`
        );

        setSvg(styledSvg);
      } catch (e) {
        console.error("Mermaid error:", e);
        setSvg("");
      } finally {
        setIsLoading(false);
      }
    };

    render();
  }, [chart, theme, fontFamily, fontSize, lineHeight]);

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden ${flowchartThemeClasses[theme]}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${headerThemeClasses[theme]} flex-shrink-0`}>
        <GitBranch size={20} className="opacity-80" />
        <h3 className="font-bold text-lg">Flow Visualization</h3>
        {isLoading && <Loader size={18} className="ml-auto animate-spin opacity-70" />}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {!svg ? (
          <div className="flex flex-col items-center justify-center gap-3 opacity-60">
            <AlertCircle size={40} />
            <p className="text-center font-medium">
              {isLoading ? "Generating visualization..." : "Run code to see the flowchart"}
            </p>
          </div>
        ) : (
          <div
            className="flex-1 overflow-auto"
            dangerouslySetInnerHTML={{
              __html: svg,
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily,
            }}
          />
        )}
      </div>
    </div>
  );
}
