import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { ExpedienteMatchHint } from '@ylika/shared';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ingest')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async ingest(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('expedientes') expedientesRaw?: string,
    @Body('filename') filenameBody?: string,
  ) {
    let expedientes: ExpedienteMatchHint[] = [];
    if (expedientesRaw) {
      try {
        expedientes = JSON.parse(expedientesRaw) as ExpedienteMatchHint[];
      } catch {
        expedientes = [];
      }
    }

    if (!file) {
      return this.aiService.classifyDocument(filenameBody ?? 'documento.pdf');
    }

    const mime = file.mimetype || '';
    const textHint =
      mime.includes('xml') ||
      mime.startsWith('text/') ||
      file.originalname.toLowerCase().endsWith('.xml') ||
      file.originalname.toLowerCase().endsWith('.csv') ||
      file.originalname.toLowerCase().endsWith('.txt') ||
      file.originalname.toLowerCase().endsWith('.eml')
        ? file.buffer.toString('utf8').slice(0, 20000)
        : undefined;

    return this.aiService.analyzeDocument({
      filename: file.originalname || filenameBody || 'documento',
      mimeType: file.mimetype,
      buffer: file.buffer,
      textHint,
      expedientes,
    });
  }
}
