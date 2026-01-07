import { useContext, useState } from "react";
import MonacoEditor from "@monaco-editor/react";

import { AccessibilityContext } from "../context/AccessibilityContext.jsx";
import useTTS from "../hooks/useTTS.js";
import useSTT from "../hooks/useSTT.js";


import { Play, Mic, Volume2 } from "lucide-react";

export default function Editor({
  code,
  setCode,
  language,
  setLanguage,
  onRun
}) {
  const { fontFamily, fontSize, lineHeight, theme } =
  useContext(AccessibilityContext);

const monacoTheme = {
  dark: "vs-dark",
  light: "light",
  "high-contrast": "hc-black",
};


  const { speak } = useTTS();
  const { startListening, isListening } = useSTT((text) => {
    setCode((prev) => prev + "\n" + text);
    speak("Code added");
  });

  return (
    <div className="flex-1 flex flex-col border-b border-gray-700">
      <div className="flex items-center gap-3 p-3 bg-gray-800 border-b border-gray-700">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-700 px-3 py-2 rounded"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>

        <button
          onClick={onRun}
          className="bg-green-600 px-4 py-2 rounded flex items-center gap-2"
        >
          <Play size={16} /> Run
        </button>

        <button
          onClick={startListening}
          disabled={isListening}
          className="bg-gray-700 px-3 py-2 rounded"
        >
          <Mic size={16} />
        </button>

        <button
          onClick={() => speak(code)}
          className="bg-gray-700 px-3 py-2 rounded"
        >
          <Volume2 size={16} />
        </button>
      </div>

      <MonacoEditor
        height="100%"
        language={language}
        value={code}
        onChange={(v) => setCode(v || "")}
        theme={monacoTheme[theme]}
        options={{
          fontFamily,
          fontSize,
          lineHeight,
          fontLigatures: true,
          wordWrap: "on",
          minimap: { enabled: false }
        }}
      />
    </div>
  );
}
