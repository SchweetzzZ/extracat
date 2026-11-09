import { z } from "zod";

export const SENIORIDADES = ["estagio", "junior", "pleno", "senior", "nao_informado"] as const;
export const MODALIDADES = ["remoto", "hibrido", "presencial", "nao_informado"] as const;

export const VagaSchema = z.object({
    cargo: z.string().describe("Título do cargo como aparece no anúncio"),
    senioridade: z.enum(SENIORIDADES).describe("Nível declarado no anúncio"),
    modalidade: z.enum(MODALIDADES).describe("Regime de trabalho"),
    stack: z
        .array(z.string())
        .describe("Somente tecnologias: linguagens, frameworks, bibliotecas, bancos, cloud, ferramentas"),
    requisitos: z.array(z.string()).describe("Itens obrigatórios"),
    diferenciais: z.array(z.string()).describe("Itens desejáveis ou diferenciais"),
    salario: z.string().nullable().describe("Salário ou faixa como escrito no anúncio, ou null"),
});

// O tipo sai do schema: se você mudar o schema, o tipo muda junto
export type Vaga = z.infer<typeof VagaSchema>;