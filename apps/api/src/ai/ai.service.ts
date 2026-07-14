import { Injectable, Logger } from '@nestjs/common';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  DOCUMENT_ANALYSIS_MODEL,
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
  resumen: z.string(),
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

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const prompt = buildDocumentAnalysisPrompt(
        input.filename,
        expedientes,
        input.textHint,
      );

      const multimodal = isMultimodalDocument(mime, input.filename);
      const result = await generateObject({
        model: google(DOCUMENT_ANALYSIS_MODEL),
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
                      input.buffer.toString('utf8').slice(0, 12000)
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
        model: DOCUMENT_ANALYSIS_MODEL,
      });
    } catch (err) {
      this.logger.error(
        `Gemini falló, fallback local: ${
          err instanceof Error ? err.message : String(err)
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
  }

  /** Compat: clasificación solo por nombre */
  classifyDocument(filename: string) {
    return heuristicAnalyze({
      archivo: filename || 'documento.pdf',
      size: 0,
      expedientes: [],
    });
  }
}
