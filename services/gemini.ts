
import { GoogleGenAI, Type } from "@google/genai";
import { ImagePrompt, GroundingSource } from "../types";

export class GeminiService {
  private getCleanKey(): string {
    return (process.env.API_KEY || "").trim();
  }

  private async callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const status = err.status || 0;
      const msg = err.toString().toLowerCase();
      const isRetryable = msg.includes("429") || msg.includes("503") || msg.includes("quota") || msg.includes("overloaded");

      if (isRetryable && retries > 0) {
        console.warn(`Neural link unstable (Status ${status}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 2);
      }
      throw err;
    }
  }

  public async testKeyAccess(): Promise<{ success: boolean; message: string; isQuota?: boolean; details?: string }> {
    const key = this.getCleanKey();
    if (!key) return { success: false, message: "API Key Missing." };

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      await this.callWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
        config: { maxOutputTokens: 1 }
      }));
      return { success: true, message: "Neural Link Online" };
    } catch (err: any) {
      const msg = err.toString().toLowerCase();
      const isQuota = msg.includes("429") || msg.includes("quota");
      return { 
        success: false, 
        message: isQuota ? "Quota Alert" : "Neural Static",
        isQuota,
        details: err.toString()
      };
    }
  }

  private getClient(): GoogleGenAI {
    const apiKey = this.getCleanKey();
    if (!apiKey) throw new Error("API_KEY_NOT_FOUND");
    return new GoogleGenAI({ apiKey });
  }

  async deepScanInternet(query: string): Promise<{ prompts: ImagePrompt[], sources: GroundingSource[] }> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `SCAN THE INTERNET for the absolute best AI image prompts for: "${query}". 
        Focus on Midjourney v6 and DALL-E 3 styles.
        Format your response exactly as follows for 5 prompts:
        ---
        TITLE: [Name]
        PROMPT: [Full prompt]
        TAGS: [tag1, tag2]`,
        config: { 
          tools: [{ googleSearch: {} }]
        },
      });

      const text = response.text || "";
      const prompts: ImagePrompt[] = [];
      const sections = text.split('---').filter(s => s.includes('PROMPT:'));

      sections.forEach(section => {
        const titleMatch = section.match(/TITLE:\s*(.*)/i);
        const promptMatch = section.match(/PROMPT:\s*(.*)/i);
        const tagsMatch = section.match(/TAGS:\s*(.*)/i);

        if (promptMatch) {
          prompts.push({
            title: titleMatch ? titleMatch[1].trim() : "Style Trace",
            prompt: promptMatch[1].trim(),
            tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : ["Web Source"],
            source: "Global Crawl"
          });
        }
      });

      const sources: GroundingSource[] = [];
      const metadata = response.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        metadata.groundingChunks.forEach((c: any) => {
          if (c.web) {
            sources.push({ title: c.web.title || "External Source", uri: c.web.uri || "#" });
          }
        });
      }

      return { prompts, sources };
    });
  }

  async generateStudioImage(prompt: string): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Professional studio photography, high dynamic range: ${prompt}` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (!part?.inlineData) throw new Error("Image buffer empty. Safety filters may have engaged.");
      return `data:image/png;base64,${part.inlineData.data}`;
    });
  }

  async refineImage(base64Image: string, instruction: string): Promise<string> {
    return this.callWithRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
            { text: `Refine lighting and details: ${instruction}` }
          ]
        },
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (!part?.inlineData) throw new Error("Refinement stream interrupted.");
      return `data:image/png;base64,${part.inlineData.data}`;
    });
  }
}
