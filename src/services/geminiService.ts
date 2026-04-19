import { GoogleGenAI } from "@google/genai";

export async function performAgenticSearch(query: string, streamCallback?: (text: string) => void) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Neural Engine Protocol Failure");
    }

    const data = await response.json();
    const text = data.text;

    if (streamCallback) {
      // Simulate streaming for UI continuity since we switched to a non-streaming endpoint for stability
      const words = text.split(" ");
      let current = "";
      for (const word of words) {
        current += word + " ";
        streamCallback(current);
        await new Promise((resolve) => setTimeout(resolve, 20)); // Subtle typing effect
      }
    }

    return text;
  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    throw error;
  }
}
