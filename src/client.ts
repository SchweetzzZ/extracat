import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

process.loadEnvFile();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY não encontrada no .env");
}

export const ai = new GoogleGenAI({ apiKey });
export const MODEL = "gemini-3.6-flash";

export function extrairTexto(res: GenerateContentResponse): string {
    const parts = res.candidates?.[0]?.content?.parts ?? [];
    return parts
        .filter((p) => p.text && !p.thought)
        .map((p) => p.text)
        .join("");
}

export const pausa = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function comRetry<T>(fn: () => Promise<T>, maxTentativas = 4): Promise<T> {
    for (let tentativa = 1; ; tentativa++) {
        try {
            return await fn();
        } catch (err) {
            const status = (err as { status?: number }).status;
            const temporario = status === 429 || status === 500 || status === 503;
            if (!temporario || tentativa >= maxTentativas) throw err;

            const espera = 2 ** tentativa * 5000;
            console.warn(`  erro ${status}, nova tentativa em ${espera / 1000}s...`);
            await pausa(espera);
        }
    }
}