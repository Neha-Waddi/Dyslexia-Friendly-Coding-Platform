import { AccessibilityProvider } from "./context/AccessibilityContext.jsx";
import Playground from "./pages/Playground.jsx";

export default function App() {
  return (
    <AccessibilityProvider>
      <Playground />
    </AccessibilityProvider>
  );
}
