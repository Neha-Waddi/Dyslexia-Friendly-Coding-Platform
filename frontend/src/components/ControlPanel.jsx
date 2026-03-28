import { useContext, useState, useRef, useEffect } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext.jsx";
import {
  Settings,
  Moon,
  Sun,
  Type,
  Volume2,
  Contrast,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  GripVertical,
  Sliders,
  Palette,
} from "lucide-react";

export default function ControlPanel() {
  const {
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    lineHeight, setLineHeight,
    ttsRate, setTtsRate,
    theme, setTheme,
  } = useContext(AccessibilityContext);

  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(320); // Default 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);

  const panelTheme = {
    dark: "bg-gradient-to-b from-gray-900 to-gray-800 text-white border-gray-700",
    light: "bg-gradient-to-b from-gray-100 to-gray-50 text-gray-900 border-gray-300",
    "high-contrast": "bg-black text-yellow-300 border-yellow-500",
  };

  const sectionHeaderClasses = {
    dark: "text-gray-300",
    light: "text-gray-600",
    "high-contrast": "text-yellow-400",
  };

  const inputClasses = {
    dark: "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20",
    light: "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20",
    "high-contrast": "bg-gray-900 border-yellow-500 text-yellow-300 focus:border-yellow-400 focus:ring-yellow-500/20",
  };

  const themes = [
    { id: "dark", name: "Dark", icon: <Moon size={18} /> },
    { id: "light", name: "Light", icon: <Sun size={18} /> },
    { id: "high-contrast", name: "High Contrast", icon: <Contrast size={18} /> },
  ];

  const fonts = [
    { value: "'OpenDyslexic', Arial, sans-serif", label: "OpenDyslexic" },
    { value: "monospace", label: "Monospace" },
    { value: "'Courier New', monospace", label: "Courier New" },
    { value: "'Consolas', monospace", label: "Consolas" },
    { value: "'Source Code Pro', monospace", label: "Source Code Pro" },
    { value: "'Fira Code', monospace", label: "Fira Code" },
  ];

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !panelRef.current) return;
      const newWidth = e.clientX;
      if (newWidth > 250 && newWidth < 600) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'auto';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = 'auto';
      };
    }
  }, [isResizing]);

  return (
    <>
      {/* Toggle Button - Shows when panel is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed left-0 top-4 z-50 p-3 rounded-r-lg transform transition-all hover:scale-110 ${
            theme === 'dark' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-lg' :
            theme === 'light' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg' :
            'bg-yellow-500 text-black hover:bg-yellow-600 shadow-lg'
          }`}
          aria-label="Open accessibility panel"
          title="Open Panel"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Sidebar Panel */}
      <div 
        ref={panelRef}
        className={`${isOpen ? '' : 'w-0'} transition-all duration-300 overflow-hidden relative border-r overflow-y-auto ${panelTheme[theme]} shadow-xl`}
        style={{ width: isOpen ? `${width}px` : '0px' }}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className={`absolute top-4 right-4 p-2 rounded-lg z-10 transition-all ${
            theme === 'dark' ? 'hover:bg-gray-700' :
            theme === 'light' ? 'hover:bg-gray-300' :
            'hover:bg-gray-900'
          }`}
          aria-label="Close accessibility panel"
          title="Close Panel"
        >
          <X size={20} />
        </button>

        {/* Resize Handle with Icon */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className={`absolute top-1/2 -right-4 transform -translate-y-1/2 z-50 p-2 rounded-full cursor-col-resize transition-all ${
            isResizing 
              ? (theme === 'dark' ? 'bg-indigo-500 scale-125 shadow-lg' :
                 theme === 'light' ? 'bg-blue-500 scale-125 shadow-lg' :
                 'bg-yellow-400 scale-125 shadow-lg')
              : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white hover:scale-110 shadow-lg' :
                 theme === 'light' ? 'bg-gray-300 text-gray-700 hover:bg-blue-500 hover:text-white hover:scale-110 shadow-lg' :
                 'bg-yellow-400 text-black hover:bg-yellow-500 hover:scale-110 shadow-lg')
          } select-none`}
          style={{ cursor: isResizing ? 'col-resize' : 'grab' }}
          aria-label="Drag to resize panel"
          title="Drag to resize"
        >
          <GripVertical size={20} />
        </div>

        {/* Content with padding */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-current/20">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 rounded-lg ${
                theme === 'dark' ? 'bg-indigo-600/20' :
                theme === 'light' ? 'bg-blue-100' :
                'bg-yellow-900/40'
              }`}>
                <Settings size={24} />
              </div>
              <h2 className="text-2xl font-bold">Accessibility</h2>
            </div>
            <p className="text-sm opacity-70 pl-11">
              Customize your experience
            </p>
          </div>

          {/* Theme Selector */}
          <div className="mb-8">
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${sectionHeaderClasses[theme]}`}>
              <Palette size={16} />
              Theme
            </h3>
            <div className="space-y-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-full p-3 rounded-lg border-2 flex items-center justify-between transition-all transform hover:scale-102 ${
                    theme === t.id
                      ? theme === 'dark' ? 'border-indigo-500 bg-indigo-600/10' :
                        theme === 'light' ? 'border-blue-500 bg-blue-100' :
                        'border-yellow-400 bg-yellow-900/20'
                      : theme === 'dark' ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30' :
                        theme === 'light' ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-200' :
                        'border-yellow-700 hover:border-yellow-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {t.icon}
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  {theme === t.id && <Check size={18} />}
                </button>
              ))}
            </div>
          </div>

          {/* Typography Section */}
          <div className="mb-8 pb-8 border-b border-current/20">
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${sectionHeaderClasses[theme]}`}>
              <Type size={16} />
              Typography
            </h3>

            {/* Font Family */}
            <div className="mb-6">
              <label className="text-xs font-semibold opacity-80 mb-2 block">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all ${inputClasses[theme]}`}
                style={{ fontFamily }}
              >
                {fonts.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold opacity-80">Font Size</label>
                <span className={`text-sm font-bold ${
                  theme === 'dark' ? 'text-indigo-400' :
                  theme === 'light' ? 'text-blue-600' :
                  'text-yellow-300'
                }`}>{fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="28"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Line Height */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold opacity-80">Line Spacing</label>
                <span className={`text-sm font-bold ${
                  theme === 'dark' ? 'text-indigo-400' :
                  theme === 'light' ? 'text-blue-600' :
                  'text-yellow-300'
                }`}>{lineHeight}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="48"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Section */}
          <div className="mb-8">
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${sectionHeaderClasses[theme]}`}>
              <Volume2 size={16} />
              Audio
            </h3>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold opacity-80">Speech Speed</label>
                <span className={`text-sm font-bold ${
                  theme === 'dark' ? 'text-indigo-400' :
                  theme === 'light' ? 'text-blue-600' :
                  'text-yellow-300'
                }`}>{ttsRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={ttsRate}
                onChange={(e) => setTtsRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Preview */}
          <div className={`mt-10 p-4 rounded-lg border-2 ${
            theme === 'dark' ? 'border-gray-700 bg-gray-900/50' :
            theme === 'light' ? 'border-gray-300 bg-white/50' :
            'border-yellow-700 bg-gray-900/50'
          }`}>
            <p className="text-xs font-semibold opacity-70 mb-3 flex items-center gap-2">
              <Sliders size={14} />
              Live Preview
            </p>
            <div
              className={`p-3 rounded border ${
                theme === 'dark' ? 'border-gray-600 bg-gray-800' :
                theme === 'light' ? 'border-gray-300 bg-gray-50' :
                'border-yellow-600 bg-gray-900'
              }`}
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}px`,
              }}
            >
              <code>def hello():</code>
              <br />
              <code className="ml-4">print("Hi!")</code>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

