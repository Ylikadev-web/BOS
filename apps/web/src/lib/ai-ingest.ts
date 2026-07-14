import type {
  DocumentoAiResultado,
  ExpedienteMatchHint,
} from "@ylika/shared";
import {
  DOCUMENT_ANALYSIS_JSON_SCHEMA,
  DOCUMENT_ANALYSIS_MODEL,
  DOCUMENT_ANALYSIS_MODEL_FAST,
  buildDocumentAnalysisPrompt,
  guessMimeType,
  heuristicAnalyze,
  isMultimodalDocument,
  normalizeAiResult,
} from "@ylika/shared";

const ALLOWED_EXT = [
  ".pdf",
  ".xml",
  ".xlsx",
  ".xls",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".eml",
  ".msg",
  ".txt",
];

const GEMINI_KEY_STORAGE = "ylika-gemini-api-key";

export class GeminiRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiRequiredError";
  }
}

export function isAllowedDocument(file: File) {
  const name = file.name.toLowerCase();
  return ALLOWED_EXT.some((ext) => name.endsWith(ext)) || file.type.length > 0;
}

export function getGeminiApiKey(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY ?? "";
  }
  return (
    localStorage.getItem(GEMINI_KEY_STORAGE) ||
    process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY ||
    ""
  );
}

export function setGeminiApiKey(key: string) {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
  else localStorage.removeItem(GEMINI_KEY_STORAGE);
}

async function readTextHint(file: File): Promise<string | undefined> {
  const name = file.name.toLowerCase();
  const textual =
    file.type.startsWith("text/") ||
    file.type.includes("xml") ||
    name.endsWith(".xml") ||
    name.endsWith(".csv") ||
    name.endsWith(".txt") ||
    name.endsWith(".eml");
  if (!textual) return undefined;
  try {
    return (await file.text()).slice(0, 20000);
  } catch {
    return undefined;
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function analyzeViaApi(
  file: File,
  expedientes: ExpedienteMatchHint[],
): Promise<DocumentoAiResultado | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) return null;

  try {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("expedientes", JSON.stringify(expedientes));
    const res = await fetch(`${base}/ai/ingest`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as DocumentoAiResultado;
    if (!data?.clasificacion) return null;
    // Si la API cayó a heurística, no la tratamos como éxito Gemini
    if (data.provider === "heuristic") return null;
    return { ...data, provider: data.provider ?? "api" };
  } catch {
    return null;
  }
}

async function analyzeViaGemini(
  file: File,
  expedientes: ExpedienteMatchHint[],
  apiKey: string,
  textHint?: string,
): Promise<DocumentoAiResultado> {
  const mime = file.type || guessMimeType(file.name);
  const prompt = buildDocumentAnalysisPrompt(file.name, expedientes, textHint);
  const multimodal = isMultimodalDocument(mime, file.name);

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (multimodal) {
    parts.push({
      inline_data: {
        mime_type: mime.startsWith("image/") || mime === "application/pdf"
          ? mime
          : "application/pdf",
        data: await fileToBase64(file),
      },
    });
  } else if (textHint) {
    parts[0] = { text: `${prompt}\n\n---\n${textHint}\n---` };
  } else {
    parts.push({
      inline_data: {
        mime_type: mime || "application/octet-stream",
        data: await fileToBase64(file),
      },
    });
  }

  const models = [
    DOCUMENT_ANALYSIS_MODEL,
    DOCUMENT_ANALYSIS_MODEL_FAST,
    "gemini-2.0-flash",
  ];

  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: DOCUMENT_ANALYSIS_JSON_SCHEMA,
              temperature: 0.1,
            },
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(
          `${model}: ${res.status} ${errText.slice(0, 280)}`,
        );
        continue;
      }

      const payload = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text =
        payload.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("") || "";
      if (!text) {
        lastError = new Error(`${model}: respuesta vacía`);
        continue;
      }

      const raw = JSON.parse(text) as Record<string, unknown>;
      return normalizeAiResult({
        archivo: file.name,
        raw: raw as Parameters<typeof normalizeAiResult>[0]["raw"],
        expedientes,
        provider: "gemini",
        model,
      });
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("Gemini no respondió");
}

/**
 * Pipeline:
 * 1) API Nest con Gemini
 * 2) Gemini directo (API key)
 * 3) Solo CFDI XML local / heurística explícita (PDFs multimodales EXIGEN Gemini)
 */
export async function analyzeDocument(
  file: File,
  expedientes: ExpedienteMatchHint[] = [],
): Promise<DocumentoAiResultado> {
  const textHint = await readTextHint(file);
  const multimodal = isMultimodalDocument(
    file.type || guessMimeType(file.name),
    file.name,
  );

  const fromApi = await analyzeViaApi(file, expedientes);
  if (fromApi?.provider === "gemini" || fromApi?.provider === "api") {
    return fromApi;
  }

  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    return analyzeViaGemini(file, expedientes, geminiKey, textHint);
  }

  // CFDI XML sí se puede parsear localmente con calidad
  if (textHint && /<cfdi:Comprobante|<Comprobante/i.test(textHint)) {
    return heuristicAnalyze({
      archivo: file.name,
      text: textHint,
      size: file.size,
      expedientes,
    });
  }

  if (multimodal) {
    throw new GeminiRequiredError(
      "Este PDF/imagen necesita Gemini. Abre API key, pega tu clave de Google AI Studio y vuelve a analizar.",
    );
  }

  return heuristicAnalyze({
    archivo: file.name,
    text: textHint,
    size: file.size,
    expedientes,
  });
}
