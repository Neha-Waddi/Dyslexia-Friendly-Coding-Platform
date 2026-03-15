import useTTS from "../hooks/useTTS";
import { useContext } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext";
import { Volume2 } from "lucide-react";

export default function OutputPanel({ output, error, explanation }) {
  const { speak } = useTTS();
  const { theme } = useContext(AccessibilityContext);

  const panelThemeClasses = {
    dark: "bg-gray-800 border-gray-700 text-white",
    light: "bg-gray-200 border-gray-300 text-gray-900",
    "high-contrast": "bg-black border-yellow-500 text-yellow-300",
  };

  const outputErrorThemeClasses = {
    dark: "text-red-400",
    light: "text-red-600",
    "high-contrast": "text-red-400",
  };

  const outputSuccessThemeClasses = {
    dark: "text-green-400",
    light: "text-green-600",
    "high-contrast": "text-green-400",
  };

  return (
    <div className={`h-full p-4 border-t overflow-y-auto flex flex-col ${panelThemeClasses[theme]}`}>
      <div className="flex justify-between mb-2">
        <h3>Output</h3>
        {(output || error || explanation) && (
          <button onClick={() => speak((output || error || "") + " " + explanation)}>
            <Volume2 size={14} />
          </button>
        )}
      </div>

      {error && <pre className={outputErrorThemeClasses[theme]}>{error}</pre>}
      {output && <pre className={outputSuccessThemeClasses[theme]}>{output}</pre>}
      {explanation && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Explanation:</h4>
          <pre className="whitespace-pre-wrap text-sm">{explanation}</pre>
        </div>
      )}
    </div>
  );
}
