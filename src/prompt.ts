import { z } from "zod";
import { VagaSchema } from "./schema";

// Mude este rótulo toda vez que alterar o prompt (Etapa 7.4)
export const VERSAO_PROMPT = "v1";

const JSON_SCHEMA = JSON.stringify(z.toJSONSchema(VagaSchema), null, 2);

const REGRAS = `Você extrai dados estruturados de anúncios de vagas de emprego em tecnologia.

O anúncio vem entre as tags <anuncio></anuncio>.

O resultado deve seguir este JSON Schema:
${JSON_SCHEMA}

Regras:
1. Nunca invente. Se a informação não estiver no anúncio, use "nao_informado" (senioridade e modalidade) ou null (salario).
2. "senioridade": use o nível declarado no anúncio. Se não for declarado, "nao_informado".
3. "stack": APENAS tecnologias. Nada de soft skills, metodologias (Scrum, ágil) ou conceitos genéricos.
4. Escreva cada tecnologia com o nome oficial (ex.: "Node.js", "PostgreSQL", "React").
5. "requisitos" = o que é obrigatório. "diferenciais" = o que é desejável, plus ou diferencial.
6. "salario": copie como está no anúncio (ex.: "R$ 3.000 a R$ 4.000"). "A combinar" conta como null.`;

export type Modo = "tags" | "nativo";

export function systemExtrator(modo: Modo): string {
    if (modo === "tags") {
        return `${REGRAS}

Formato da resposta: escreva o JSON dentro das tags <vaga></vaga>, sem markdown e sem nenhum texto fora das tags.`;
    }
    return REGRAS; // no modo nativo, o formato é garantido pela config
}