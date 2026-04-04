import { useContext, useState, useRef, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";

import { AccessibilityContext } from "../context/AccessibilityContext.jsx";
import useTTS from "../hooks/useTTS.js";
import useSTT from "../hooks/useSTT.js";

import { Play, Mic, Volume2, Copy, Trash2, Code2, Square, FileJson, Database, Zap, Palette } from "lucide-react";

// Language configuration with proper icons
const LANGUAGES = {
  python: { label: "Python", icon: Code2 },
  javascript: { label: "JavaScript", icon: FileJson },
  typescript: { label: "TypeScript", icon: Code2 },
  html: { label: "HTML/CSS", icon: Palette },
};

const LanguageIcon = ({ language }) => {
  const config = LANGUAGES[language];
  const Icon = config?.icon || Code2;
  return <Icon size={18} />;
};

// Function to remove special characters from code for speech
const cleanCodeForSpeech = (text) => {
  if (!text) return text;
  return text
    .replace(/[`~\-_+=\[\]{}()]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

export default function Editor({
  code,
  setCode,
  language,
  setLanguage,
  onRun
}) {
  const { fontFamily, fontSize, lineHeight, theme } = useContext(AccessibilityContext);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isCodeSpeaking, setIsCodeSpeaking] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const monacoTheme = {
    dark: "vs-dark",
    light: "light",
    "high-contrast": "hc-black",
  };

  const editorThemeClasses = {
    dark: "bg-gray-800 border-gray-700",
    light: "bg-gray-100 border-gray-300",
    "high-contrast": "bg-black border-yellow-500",
  };

  const editorHeaderThemeClasses = {
    dark: "bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 text-white shadow-lg",
    light: "bg-gradient-to-r from-gray-200 to-gray-100 border-gray-300 text-gray-900 shadow-md",
    "high-contrast": "bg-black border-yellow-500 text-yellow-300",
  };

  const editorSelectThemeClasses = {
    dark: "bg-gray-600 text-white border border-gray-500 hover:bg-gray-500 shadow-md",
    light: "bg-gray-300 text-gray-900 border border-gray-400 hover:bg-gray-200 shadow-sm",
    "high-contrast": "bg-yellow-500 text-black border border-yellow-400",
  };

  const editorButtonThemeClasses = {
    dark: "bg-gray-600 text-white hover:bg-gray-500 shadow-md",
    light: "bg-gray-300 text-gray-900 hover:bg-gray-200 shadow-sm",
    "high-contrast": "bg-yellow-500 text-black hover:bg-yellow-600",
  };

  const { speak, stop } = useTTS();
  const { startListening, isListening } = useSTT((text) => {
    setCode((prev) => prev + "\n" + text);
    speak("Code added");
  });

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);

    // If there's no code, just change the language without conversion
    if (!code || code.trim().length === 0) {
      return;
    }

    // Convert the code to the new language
    setIsConverting(true);
    try {
      const response = await fetch("http://localhost:5000/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          fromLanguage: language,
          toLanguage: newLanguage,
        }),
      });

      const data = await response.json();
      if (data.convertedCode) {
        setCode(data.convertedCode);
      } else if (data.error) {
        console.error("Conversion error:", data.error);
      }
    } catch (error) {
      console.error("Failed to convert code:", error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className={`relative flex flex-col h-full w-full ${editorThemeClasses[theme]} border-r`}>
      {/* Header */}
      <div className={`flex items-center gap-2 p-4 border-b ${editorHeaderThemeClasses[theme]}`}>
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <LanguageIcon language={language} />
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={isConverting}
            className={`px-3 py-2 rounded-lg font-medium ${editorSelectThemeClasses[theme]} focus:ring-2 focus:ring-blue-500 transition-all ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML/CSS</option>
          </select>
          {isConverting && (
            <span className={`text-sm font-medium animate-pulse ${
              theme === 'dark' ? 'text-blue-400' :
              theme === 'light' ? 'text-blue-600' :
              'text-yellow-300'
            }`}>
              Converting...
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Run Button - Primary */}
        <button
          onClick={onRun}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all transform hover:scale-105 active:scale-95 ${
            theme === 'light' ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl' :
            theme === 'high-contrast' ? 'bg-yellow-500 text-black hover:bg-yellow-600 shadow-md' :
            'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
          }`}
          title="Run code (Ctrl+Enter)"
        >
          <Play size={18} fill="currentColor" /> Run
        </button>

        {/* Speech to Text Button */}
        <button
          onClick={startListening}
          disabled={isListening}
          className={`p-2.5 rounded-lg transition-all transform ${
            isListening ? (
              theme === 'dark' ? 'bg-red-600 text-white shadow-lg animate-pulse' :
              theme === 'light' ? 'bg-red-500 text-white shadow-lg animate-pulse' :
              'bg-yellow-500 text-black shadow-lg animate-pulse'
            ) : editorButtonThemeClasses[theme]
          } hover:scale-105 active:scale-95 disabled:opacity-70`}
          title={isListening ? "Listening..." : "Speak code"}
        >
          <Mic size={18} />
        </button>

        {/* Read Code Button */}
        <button
          onClick={() => {
            if (isCodeSpeaking) {
              stop();
              setIsCodeSpeaking(false);
            } else {
              const cleanedCode = cleanCodeForSpeech(code);
              speak(cleanedCode);
              setIsCodeSpeaking(true);
              
              // Estimate duration and auto-stop
              const estimatedDuration = (cleanedCode.length / 10) * 1000;
              setTimeout(() => setIsCodeSpeaking(false), estimatedDuration);
            }
          }}
          className={`p-2.5 rounded-lg transition-all transform hover:scale-105 active:scale-95 ${
            isCodeSpeaking 
              ? (theme === 'dark' ? 'bg-red-600 text-white shadow-lg' :
                 theme === 'light' ? 'bg-red-500 text-white shadow-lg' :
                 'bg-yellow-500 text-black shadow-lg')
              : editorButtonThemeClasses[theme]
          }`}
          title={isCodeSpeaking ? "Stop reading code" : "Read code aloud"}
        >
          {isCodeSpeaking ? <Square size={18} fill="currentColor" /> : <Volume2 size={18} />}
        </button>

        {/* Copy Button */}
        <button
          onClick={handleCopyCode}
          className={`p-2.5 rounded-lg transition-all transform hover:scale-105 active:scale-95 ${editorButtonThemeClasses[theme]}`}
          title="Copy code"
        >
          <Copy size={18} />
        </button>

        {/* Clear Button */}
        <button
          onClick={() => setCode("")}
          className={`p-2.5 rounded-lg transition-all transform hover:scale-105 active:scale-95 ${editorButtonThemeClasses[theme]}`}
          title="Clear code"
        >
          <Trash2 size={18} />
        </button>

        {/* Copy Feedback */}
        {copiedFeedback && (
          <div className={`absolute top-16 right-4 px-3 py-2 rounded-lg text-sm font-medium animate-slide-in-top ${
            theme === 'dark' ? 'bg-green-600 text-white' :
            theme === 'light' ? 'bg-green-500 text-white' :
            'bg-yellow-500 text-black'
          }`}>
            ✓ Copied!
          </div>
        )}
      </div>

      {/* Editor */}
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
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "blink",
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
}
