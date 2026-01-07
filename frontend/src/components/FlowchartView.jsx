import { useEffect, useRef, useState } from "react";
import { useContext } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext";

export default function FlowchartView({ chart }) {
  const [svg, setSvg] = useState("");
  const initialized = useRef(false);
  const { theme } = useContext(AccessibilityContext);

const mermaidTheme =
  theme === "light" ? "default" : "dark";


  useEffect(() => {
  if (!chart || !chart.startsWith("graph")) {
    setSvg("");
    return;
  }

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
      }

      const { svg } = await mermaid.render(
        "chart-" + Date.now(),
        chart
      );

      setSvg(svg);
    } catch (e) {
      console.error("Mermaid error:", e);
      setSvg("<p class='text-red-400'>Flowchart error</p>");
    }
  };

  render();
}, [chart]);


  return (
    <div className="w-96 bg-gray-800 p-4 overflow-auto">
      <h3 className="font-bold mb-2">Flowchart</h3>
      <div
        dangerouslySetInnerHTML={{
          __html: svg || "<p>No chart</p>",
        }}
      />
    </div>
  );
}
