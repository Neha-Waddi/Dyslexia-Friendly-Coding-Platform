import { createContext, useState } from "react";

export const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [fontFamily, setFontFamily] = useState("monospace");
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(24);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [theme, setTheme] = useState("dark");

  return (
    <AccessibilityContext.Provider
      value={{
        fontFamily, setFontFamily,
        fontSize, setFontSize,
        lineHeight, setLineHeight,
        ttsRate, setTtsRate,
        theme, setTheme,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
