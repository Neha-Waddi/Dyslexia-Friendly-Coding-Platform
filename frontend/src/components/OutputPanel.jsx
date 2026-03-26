import useTTS from "../hooks/useTTS";
import { useContext, useState } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext";
import { Volume2, AlertCircle, CheckCircle, Square, Terminal, Lightbulb } from "lucide-react";

// Function to remove markdown formatting and special characters for speech
const cleanForSpeech = (text) => {
  if (!text) return text;
  return text
    .replace(/\*\*?(.*?)\*\*?/g, "$1") // Remove **bold** and *italic*
    .replace(/^(#{1,6})\s+/gm, "") // Remove # headers
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```/g, "").trim();
    })
    .replace(/[`~\-_+=\[\]{}()]/g, "") // Remove special characters: ` ~ - _ + = [ ] { } ( )
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

// Function to remove markdown formatting for display
const cleanMarkdown = (text) => {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove **bold**
    .replace(/\*(.*?)\*/g, "$1") // Remove *italic*
    .replace(/^\*\s+/gm, "") // Remove bullet points (* )
    .replace(/^(#{1,6})\s+/gm, "") // Remove # headers
    .replace(/```[\s\S]*?```/g, (match) => {
      // Extract code from code blocks
      return match.replace(/```/g, "").trim();
    });
};

// Function to parse and format explanation
const parseExplanation = (text) => {
  const sections = text.split("\n\n").filter(s => s.trim());
  return sections.map((section, idx) => {
    const cleaned = cleanMarkdown(section);
    return cleaned;
  });
};

export default function OutputPanel({ output, error, explanation, htmlPreview }) {
  const { speak, stop } = useTTS();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { theme, fontFamily, fontSize, lineHeight } = useContext(AccessibilityContext);

  const panelThemeClasses = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white border-t",
    light: "bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300 text-gray-900 border-t",
    "high-contrast": "bg-black border-yellow-500 text-yellow-300 border-t",
  };

  const outputErrorThemeClasses = {
    dark: "text-red-300",
    light: "text-red-600",
    "high-contrast": "text-red-400",
  };

  const outputSuccessThemeClasses = {
    dark: "text-green-300",
    light: "text-green-600",
    "high-contrast": "text-green-400",
  };

  const explanationBoxClasses = {
    dark: "bg-red-950/40 border-red-700 text-red-50",
    light: "bg-red-50 border-red-300 text-red-900",
    "high-contrast": "bg-yellow-900/20 border-yellow-500 text-yellow-300",
  };

  const outputBoxClasses = {
    dark: "bg-emerald-950/30 border-emerald-700 text-emerald-50",
    light: "bg-green-50 border-green-300 text-green-900",
    "high-contrast": "bg-green-900/20 border-green-500 text-green-300",
  };

  const explanationHeaderClasses = {
    dark: "text-red-300",
    light: "text-red-700",
    "high-contrast": "text-yellow-300",
  };

  const outputHeaderClasses = {
    dark: "text-emerald-300",
    light: "text-green-700",
    "high-contrast": "text-green-300",
  };

  return (
    <div className={`h-full overflow-y-auto flex flex-col ${panelThemeClasses[theme]}`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-4 border-b ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' :
        theme === 'light' ? 'border-gray-300 bg-gray-200' :
        'border-yellow-500 bg-gray-900'
      } sticky top-0 z-10`}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          {error || explanation ? (
            <>
              <AlertCircle size={20} />
              {error ? "Error & Help" : "Explanation"}
            </>
          ) : (
            <>
              <Terminal size={20} />
              Output
            </>
          )}
        </h3>
        {(output || error || explanation) && (
          <button 
            onClick={() => {
              if (isSpeaking) {
                stop();
                setIsSpeaking(false);
              } else {
                const textToSpeak = cleanForSpeech((output || error || "") + " " + (explanation || ""));
                speak(textToSpeak);
                setIsSpeaking(true);
                
                // Stop listening after speech ends (approximate duration based on text length)
                const estimatedDuration = (textToSpeak.length / 10) * 1000;
                setTimeout(() => setIsSpeaking(false), estimatedDuration);
              }
            }}
            className={`p-2.5 rounded-lg transition-all transform hover:scale-105 active:scale-95 ${
              isSpeaking 
                ? (theme === 'dark' ? 'bg-red-600 text-white shadow-lg' :
                   theme === 'light' ? 'bg-red-500 text-white shadow-lg' :
                   'bg-yellow-500 text-black shadow-lg')
                : (theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' :
                   theme === 'light' ? 'bg-gray-300 text-gray-900 hover:bg-gray-400' :
                   'bg-yellow-600 text-black hover:bg-yellow-500')
            }`}
            title={isSpeaking ? "Stop reading" : "Read aloud"}
          >
            {isSpeaking ? <Square size={18} fill="currentColor" /> : <Volume2 size={18} />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!output && !error && !explanation && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <Terminal size={40} />
            <p className="text-center font-medium">Run code to see output</p>
          </div>
        )}

        {error && (
          <div className={`p-4 border-l-4 rounded-lg transform transition-all animate-slide-in-top ${explanationBoxClasses[theme]}`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={22} className="flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold mb-2 text-base ${explanationHeaderClasses[theme]}`}>
                  ⚠️ Error Found
                </h4>
                <pre 
                  className="text-sm overflow-x-auto bg-black/20 p-2 rounded"
                  style={{ fontFamily, fontSize: `${fontSize * 0.85}px`, lineHeight: `${lineHeight}px` }}
                >
                  {error}
                </pre>
              </div>
            </div>
          </div>
        )}

        {explanation && error && (
          <div className={`p-4 border-l-4 rounded-lg transform transition-all ${explanationBoxClasses[theme]}`}>
            <div className="flex items-start gap-3">
              <Lightbulb size={22} className="flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold mb-3 text-base ${explanationHeaderClasses[theme]}`}>
                  💡 How to Fix
                </h4>
                <div className="space-y-3">
                  {parseExplanation(explanation).map((section, idx) => (
                    <div key={idx} className="text-sm leading-relaxed">
                      <p style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}>
                        {section}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {explanation && !error && (
          <div className={`p-4 border-l-4 rounded-lg transform transition-all ${outputBoxClasses[theme]}`}>
            <div className="flex items-start gap-3">
              <Lightbulb size={22} className="flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold mb-3 text-base ${outputHeaderClasses[theme]}`}>
                  📝 What This Code Does
                </h4>
                <div className="space-y-3">
                  {parseExplanation(explanation).map((section, idx) => (
                    <div key={idx} className="text-sm leading-relaxed">
                      <p style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}>
                        {section}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {output && (
          <div className={`p-4 border-l-4 rounded-lg transform transition-all ${outputBoxClasses[theme]}`}>
            <div className="flex items-start gap-3">
              <CheckCircle size={22} className="flex-shrink-0 mt-1 text-green-500" />
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold mb-2 text-base ${outputHeaderClasses[theme]}`}>
                  ✓ Output
                </h4>
                <pre 
                  className="text-sm overflow-x-auto bg-black/20 p-2 rounded"
                  style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px` }}
                >
                  {output}
                </pre>
              </div>
            </div>
          </div>
        )}

        {htmlPreview && (
          <div className={`p-4 border-l-4 rounded-lg transform transition-all ${outputBoxClasses[theme]}`}>
            <div className="flex items-start gap-3">
              <CheckCircle size={22} className="flex-shrink-0 mt-1 text-green-500" />
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold mb-2 text-base ${outputHeaderClasses[theme]}`}>
                  ✓ HTML Preview
                </h4>
                <iframe 
                  srcDoc={htmlPreview}
                  className="w-full h-80 border rounded bg-white"
                  title="HTML Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
