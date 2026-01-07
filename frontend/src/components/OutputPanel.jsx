import useTTS from "../hooks/useTTS";
import { Volume2 } from "lucide-react";

export default function OutputPanel({ output, error }) {
  const { speak } = useTTS();

  return (
    <div className="h-56 bg-gray-800 p-4 border-t border-gray-700">
      <div className="flex justify-between mb-2">
        <h3>Output</h3>
        {(output || error) && (
          <button onClick={() => speak(output || error)}>
            <Volume2 size={14} />
          </button>
        )}
      </div>

      {error && <pre className="text-red-400">{error}</pre>}
      {output && <pre className="text-green-400">{output}</pre>}
    </div>
  );
}
