import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ASSISTANT_KNOWLEDGE } from './assistant-knowledge';
import { devMockAssistantReply } from './assistant-dev-mock';
import { AssistantChatDto } from './dto/assistant-chat.dto';

type OpenAiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

@Injectable()
export class AssistantService {
  constructor(private readonly config: ConfigService) {}

  private isDevelopment(): boolean {
    return this.config.get<string>('NODE_ENV', 'development') !== 'production';
  }

  /** En dev: activo con mock aunque no haya API key. En prod: requiere OPENAI_API_KEY. */
  private devMockActive(): boolean {
    if (!this.isDevelopment()) return false;
    const flag = this.config.get<string>('ASSISTANT_DEV_MOCK', 'true').toLowerCase();
    return flag !== 'false' && flag !== '0';
  }

  private hasApiKey(): boolean {
    return Boolean(this.config.get<string>('OPENAI_API_KEY')?.trim());
  }

  isEnabled(): boolean {
    const flag = this.config.get<string>('ASSISTANT_ENABLED', 'true').toLowerCase();
    if (flag === 'false' || flag === '0') return false;
    if (this.hasApiKey()) return true;
    return this.devMockActive();
  }

  getStatus() {
    const enabled = this.isEnabled();
    let mode: 'live' | 'mock' | 'off' = 'off';
    if (enabled) {
      mode = this.hasApiKey() ? 'live' : 'mock';
    }
    return {
      enabled,
      purpose: 'usage' as const,
      mode,
    };
  }

  async chat(dto: AssistantChatDto, userLabel?: string) {
    if (!this.isEnabled()) {
      throw new BadRequestException(
        'El asistente está desactivado (ASSISTANT_ENABLED=false).',
      );
    }

    if (!this.hasApiKey() && this.devMockActive()) {
      return { reply: devMockAssistantReply(dto.message.trim()), mode: 'mock' as const };
    }

    const apiKey = this.config.get<string>('OPENAI_API_KEY')!.trim();
    const model = this.config.get<string>('ASSISTANT_MODEL', 'gpt-4o-mini').trim();
    const baseUrl = this.config.get<string>('OPENAI_BASE_URL', 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    );

    const system = this.buildSystemPrompt(userLabel);
    const messages: OpenAiMessage[] = [system];

    for (const item of dto.history ?? []) {
      messages.push({ role: item.role, content: item.content });
    }
    messages.push({ role: 'user', content: dto.message.trim() });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 900,
          messages,
        }),
        signal: controller.signal,
      });

      const body = (await res.json()) as {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
      };

      if (!res.ok) {
        throw new BadRequestException(
          body.error?.message ?? `Error del proveedor de IA (${res.status})`,
        );
      }

      const reply = body.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        throw new BadRequestException('Respuesta vacía del asistente');
      }

      return { reply, mode: 'live' as const };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      if (e instanceof Error && e.name === 'AbortError') {
        throw new BadRequestException('La consulta tardó demasiado; inténtalo de nuevo.');
      }
      throw new BadRequestException('No se pudo contactar con el asistente');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildSystemPrompt(userLabel?: string): OpenAiMessage {
    const who = userLabel ? `El usuario se llama ${userLabel}.` : '';
    return {
      role: 'system',
      content: `Eres la agente de ayuda de Domo ERP. ${who}

Tu rol es EXCLUSIVAMENTE ayudar con dudas de uso de la aplicación (dónde está una función, pasos para hacer algo, permisos, importación CSV, onboarding).

Reglas:
- Responde en español, claro y conciso. Usa listas numeradas cuando expliques pasos.
- Basa tus respuestas en la documentación interna siguiente. Si algo no está documentado, dilo con honestidad; no inventes rutas, menús ni funciones.
- NO pidas ni supongas datos concretos de la empresa (facturas, importes, NIF de clientes, etc.).
- NO des asesoramiento fiscal, legal o contable vinculante; solo orientación de uso del software.
- NO diagnostiques fallos de servidor; si preguntan por errores técnicos, sugiere comprobar permisos, recargar, revisar que la API esté activa y usar el botón de feedback beta indicando la pantalla.
- Si la pregunta no es sobre Domo ERP, redirige amablemente al ámbito de la app.

Documentación interna:
${ASSISTANT_KNOWLEDGE}`,
    };
  }
}
