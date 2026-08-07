import { LLMProvider, ProviderCompletionOptions, ProviderCompletionResult, StreamCallback } from "./base";
import { withRetry, DEFAULT_RETRY_OPTIONS } from "./retry";

export class OpenAIProvider implements LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly provider = "openai";
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly models: { id: string; name: string; contextWindow: number; maxOutput: number }[];
  readonly defaultModel: string;
  health: { healthy: boolean; latencyMs: number; lastChecked: string; error?: string };

  constructor(config: {
    id: string;
    name: string;
    apiKey?: string;
    endpoint?: string;
    models: { id: string; name: string; contextWindow: number; maxOutput: number }[];
    defaultModel: string;
  }) {
    this.id = config.id;
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint ?? "https://api.openai.com/v1";
    this.models = config.models;
    this.defaultModel = config.defaultModel;
    this.health = { healthy: true, latencyMs: 0, lastChecked: new Date().toISOString() };
  }

  async complete(modelId: string, prompt: string, options: ProviderCompletionOptions = {}): Promise<ProviderCompletionResult> {
    const onStream = options.onStreamChunk;
    const useStream = options.stream && onStream && this.supportsStreaming(modelId);

    if (useStream) {
      return this.streamComplete(modelId, prompt, options, onStream);
    }

    return withRetry(() => this.executeComplete(modelId, prompt, options), DEFAULT_RETRY_OPTIONS);
  }

  private async executeComplete(modelId: string, prompt: string, options: ProviderCompletionOptions = {}): Promise<ProviderCompletionResult> {
    const url = `${this.endpoint}/chat/completions`;
    const body = {
      model: modelId,
      messages: [
        ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    };

    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey ?? ""}`,
      },
      body: JSON.stringify(body),
    });

    this.health.latencyMs = Date.now() - start;
    this.health.lastChecked = new Date().toISOString();
    this.health.healthy = response.ok;

    if (!response.ok) {
      const errorText = await response.text();
      this.health.error = `OpenAI error ${response.status}: ${errorText}`;
      throw new Error(this.health.error);
    }

    const data = (await response.json()) as { choices: { message: { content: string }; finish_reason: string }[]; usage: { total_tokens: number } };
    return {
      text: data.choices[0]?.message?.content ?? "",
      tokensUsed: data.usage?.total_tokens ?? 0,
      finishReason: data.choices[0]?.finish_reason ?? "unknown",
      raw: data,
    };
  }

  private async streamComplete(modelId: string, prompt: string, options: ProviderCompletionOptions, onStream: StreamCallback): Promise<ProviderCompletionResult> {
    const url = `${this.endpoint}/chat/completions`;
    const body = {
      model: modelId,
      messages: [
        ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    };

    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey ?? ""}`,
      },
      body: JSON.stringify(body),
    });

    this.health.latencyMs = Date.now() - start;
    this.health.lastChecked = new Date().toISOString();
    this.health.healthy = response.ok;

    if (!response.ok) {
      const errorText = await response.text();
      this.health.error = `OpenAI error ${response.status}: ${errorText}`;
      throw new Error(this.health.error);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("OpenAI streaming response body is not readable");
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let finishReason = "unknown";
    let tokensUsed = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr) as { choices?: { delta?: { content?: string }; finish_reason?: string }[]; usage?: { total_tokens?: number } };
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onStream(content);
          }
          if (data.choices?.[0]?.finish_reason) {
            finishReason = data.choices[0].finish_reason;
          }
          if (data.usage?.total_tokens) {
            tokensUsed = data.usage.total_tokens;
          }
        } catch {
          // ignore malformed streaming chunks
        }
      }
    }

    return {
      text: fullText,
      tokensUsed,
      finishReason,
      raw: { streamed: true },
    };
  }

  supportsStreaming(modelId: string): boolean {
    return this.models.some((m) => m.id === modelId);
  }
}
