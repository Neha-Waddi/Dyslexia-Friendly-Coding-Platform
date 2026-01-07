import { useContext } from "react";
import { AccessibilityContext } from "../context/AccessibilityContext.jsx";

export default function useTTS() {
  const { ttsRate } = useContext(AccessibilityContext);

  const speak = (text) => {
    if (!text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  };

  const stop = () => speechSynthesis.cancel();

  return { speak, stop };
}