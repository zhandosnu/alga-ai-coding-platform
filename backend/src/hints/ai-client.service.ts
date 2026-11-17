import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface HintRequest {
  problem_title: string;
  problem_description: string;
  user_code: string;
  language: string;
  hint_level: number;
  conversation_history: Array<{ role: string; content: string }>;
}

export interface HintResponse {
  hint: string;
  model: string;
}

export interface AnalysisContext {
  verdict: string;
  passed: number;
  total: number;
  problemTitle: string;
  errorMessage?: string;
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async getHint(payload: HintRequest): Promise<HintResponse> {
    try {
      const res = await axios.post<HintResponse>(`${this.baseUrl}/hint`, payload, {
        timeout: 120_000,
      });
      return res.data;
    } catch (err: any) {
      this.logger.error(`AI service error: ${err.message}`);
      return {
        hint: 'AI hint service is temporarily unavailable. Try again in a moment.',
        model: 'fallback',
      };
    }
  }

  async analyzeCode(
    code: string,
    language: string,
    context: AnalysisContext,
  ): Promise<{ analysis: string }> {
    try {
      const res = await axios.post(
        `${this.baseUrl}/analyze`,
        { code, language, context },
        { timeout: 60_000 },
      );
      return res.data;
    } catch {
      return { analysis: '' };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const res = await axios.get(`${this.baseUrl}/models`, { timeout: 10_000 });
      return res.data;
    } catch {
      return [];
    }
  }
}
