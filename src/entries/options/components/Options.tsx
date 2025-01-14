import { AISelector } from "./AISelector";
import { PromptSelector } from "./PromptSelector";

export function Options() {
  return (
    <div id="summarizer-root" className="w-full h-full">
      <div className="min-h-screen w-full bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <AISelector />
          <PromptSelector />
        </div>
      </div>
    </div>
  );
}