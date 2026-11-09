import { z } from "zod";
import type { Content } from "@google/genai";
import { ai, MODEL, extrairTexto } from "./client";
import { VagaSchema, type Vaga } from "./schema";
import { systemExtrator, type Modo } from "./prompt";

export type { Modo };

function mensagemDoAnuncio(texto: string): Content {
    return { role: "user", parts: [{ text: `<anuncio>\n${texto}\n</anuncio>` }] };
}

// Pega o que vem depois de <vaga>. O </vaga> nem chega: a stop sequence corta antes.
function lerJsonDasTags(texto: string): unknown {
    const inicio = texto.indexOf("<vaga>");
    let conteudo = inicio === -1 ? texto : texto.slice(inicio + "<vaga>".length);
    conteudo = conteudo.replace("</vaga>", "").replace(/```(json)?/g, "").trim();
    return JSON.parse(conteudo);
}

// Versão A (técnica do curso): tags + stop sequence + Zod + 1 retry
export async function extrairVagaTags(textoVaga: string): Promise<Vaga> {
    const historico: Content[] = [mensagemDoAnuncio(textoVaga)];

    for (let tentativa = 1; tentativa <= 2; tentativa++) {
        const res = await ai.models.generateContent({
            model: MODEL,
            contents: historico,
            config: {
                systemInstruction: systemExtrator("tags"),
                stopSequences: ["</vaga>"],
                maxOutputTokens: 4000, // folga para os tokens de raciocínio
            },
        });

        const bruto = extrairTexto(res);

        try {
            if (res.candidates?.[0]?.finishReason === "MAX_TOKENS") {
                throw new Error("Resposta cortada por MAX_TOKENS");
            }
            return VagaSchema.parse(lerJsonDasTags(bruto));
        } catch (err) {
            if (tentativa === 2) throw err;

            const erro = err instanceof z.ZodError ? z.prettifyError(err) : String(err);
            console.error(`(tentativa 1 falhou, tentando de novo)\n${erro}`);

            // Multi-turn: mostra ao modelo o que ele respondeu e o erro
            historico.push({ role: "model", parts: [{ text: bruto }] });
            historico.push({
                role: "user",
                parts: [{ text: `Sua resposta é inválida:\n${erro}\n\nCorrija e envie o JSON completo dentro de <vaga></vaga>.` }],
            });
        }
    }

    throw new Error("Não deveria chegar aqui");
}

// Versão B: saída estruturada nativa do Gemini
export async function extrairVagaNativo(textoVaga: string): Promise<Vaga> {
    const res = await ai.models.generateContent({
        model: MODEL,
        contents: [mensagemDoAnuncio(textoVaga)],
        config: {
            systemInstruction: systemExtrator("nativo"),
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(VagaSchema),
            maxOutputTokens: 4000,
        },
    });

    // A API segue o schema, mas o Zod continua sendo a garantia do seu lado
    return VagaSchema.parse(JSON.parse(extrairTexto(res)));
}

export function extrairVaga(textoVaga: string, modo: Modo = "nativo"): Promise<Vaga> {
    return modo === "tags" ? extrairVagaTags(textoVaga) : extrairVagaNativo(textoVaga);
}
