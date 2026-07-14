import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ingest')
  ingest(@Body() body: { filename?: string }) {
    return this.aiService.classifyDocument(body.filename ?? 'documento.pdf');
  }
}
