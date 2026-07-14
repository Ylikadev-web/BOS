import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  DOCUMENT_ANALYSIS_MODEL,
  DOCUMENT_ANALYSIS_MODEL_FAST,
  buildDocumentAnalysisPrompt,
  guessMimeType,
  heuristicAnalyze,
  isMultimodalDocument,
  normalizeAiResult,
  type DocumentoAiResultado,
  type ExpedienteMatchHint,
} from '@ylika/shared';

const analysisSchema = z.object({
  clasificacion: z.string(),
  intencion: z.string(),
  sector: z.string(),
  modalidad: z.string().optional(),
  rolYlika: z.string().optional(),
  resumen: z.string(),
  razonamiento: z.string(),
  siguientePaso: z.string(),
  proveedor: z.string().optional(),
  cliente: z.string().optional(),
  monto: z.number().optional(),
  moneda: z.string().optional(),
  concepto: z.string().optional(),
  proyecto: z.string().optional(),
  fecha: z.string().optional(),
  rfcEmisor: z.string().optional(),
  rfcReceptor: z.string().optional(),
  riesgos: z.array(z.string()).optional(),
  entidadesDetectadas: z.array(z.string()).optional(),
  partidas: z
    .array(
      z.object({
        descripcion: z.string(),
        cantidad: z.number().optional(),
        precio: z.number().optional(),
        total: z.number().optional(),
      }),
    )
    .optional(),
  confianzaExtraccion: z.number(),
  expedienteCodigoSugerido: z.string().optional(),
  confianzaMatch: z.number().optional(),
});

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async analyzeDocument(input: {
    filename: string;
    mimeType?: string;
    buffer: Buffer;
    textHint?: string;
    expedientes?: ExpedienteMatchHint[];
  }): Promise<DocumentoAiResultado> {
    const expedientes = input.expedientes ?? [];
    const mime = input.mimeType || guessMimeType(input.filename);
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'Sin GOOGLE_GENERATIVE_AI_API_KEY — usando analizador local',
      );
      return heuristicAnalyze({
        archivo: input.filename,
        text: input.textHint,
        size: input.buffer.length,
        expedientes,
      });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const prompt = buildDocumentAnalysisPrompt(
      input.filename,
      expedientes,
      input.textHint,
    );
    const multimodal = isMultimodalDocument(mime, input.filename);
    const models = [DOCUMENT_ANALYSIS_MODEL, DOCUMENT_ANALYSIS_MODEL_FAST];

    let lastError: unknown;
    for (const modelId of models) {
      try {
        const result = await generateObject({
          model: google(modelId),
          schema: analysisSchema,
          messages: [
            {
              role: 'user',
              content: multimodal
                ? [
                    { type: 'text', text: prompt },
                    {
                      type: 'file',
                      data: input.buffer,
                      mediaType: mime,
                    },
                  ]
                : [
                    {
                      type: 'text',
                      text: `${prompt}\n\n---\n${
                        input.textHint ||
                        input.buffer.toString('utf8').slice(0, 14000)
                      }\n---`,
                    },
                  ],
            },
          ],
        });

        return normalizeAiResult({
          archivo: input.filename,
          raw: result.object,
          expedientes,
          provider: 'gemini',
          model: modelId,
        });
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `${modelId} falló: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    this.logger.error(
      `Gemini falló, fallback local: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
    const fallback = heuristicAnalyze({
      archivo: input.filename,
      text:
        input.textHint ||
        (mime.includes('xml') || mime.startsWith('text/')
          ? input.buffer.toString('utf8')
          : undefined),
      size: input.buffer.length,
      expedientes,
    });
    return {
      ...fallback,
      riesgos: [
        ...(fallback.riesgos ?? []),
        'Gemini no disponible; resultado local',
      ],
    };
  }

  classifyDocument(filename: string) {
    return heuristicAnalyze({
      archivo: filename || 'documento.pdf',
      size: 0,
      expedientes: [],
    });
  }
}
