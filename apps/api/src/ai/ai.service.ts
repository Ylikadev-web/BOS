import { Injectable } from '@nestjs/common';
import { documentoAiSeed } from '../common/seed';

@Injectable()
export class AiService {
  /**
   * Stub de ingestión documental.
   * En producción: OpenAI / Claude / Gemini + pgvector matching.
   */
  classifyDocument(filename: string) {
    return {
      ...documentoAiSeed,
      archivo: filename || documentoAiSeed.archivo,
      providers: ['openai', 'claude', 'gemini'],
      status: 'classified',
    };
  }
}
