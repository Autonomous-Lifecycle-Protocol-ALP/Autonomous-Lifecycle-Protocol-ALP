import { LLMProvider, ProviderCompletionOptions, ProviderCompletionResult, StreamCallback } from "./base";
import { withRetry, DEFAULT_RETRY_OPTIONS } from "./retry";

export class AnthropicProvider implements LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly provider = "anthropic";
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
    this.endpoint = config.endpoint ?? "https://api.anthropic.com/v1";
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
    const url = `${this.endpoint}/messages`;
    const body = {
      model: modelId,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt,
      messages: [{ role: "user", content: prompt }],
    };

    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    this.health.latencyMs = Date.now() - start;
    this.health.lastChecked = new Date().toISOString();
    this.health.healthy = response.ok;

    if (!response.ok) {
      const errorText = await response.text();
      this.health.error = `Anthropic error ${response.status}: ${errorText}`;
      throw new Error(this.health.error);
    }

    const data = (await response.json()) as {
      content: { text: string }[];
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    };
    return {
      text: data.content[0]?.text ?? "",
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      finishReason: data.stop_reason ?? "unknown",
      raw: data,
    };
  }

  private async streamComplete(modelId: string, prompt: string, options: ProviderCompletionOptions, onStream: StreamCallback): Promise<ProviderCompletionResult> {
    const url = `${this.endpoint}/messages`;
    const body = {
      model: modelId,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    };

    const start = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    this.health.latencyMs = Date.now() - start;
    this.health.lastChecked = new Date().toISOString();
    this.health.healthy = response.ok;

    if (!response.ok) {
      const errorText = await response.text();
      this.health.error = `Anthropic error ${response.status}: ${errorText}`;
      throw new Error(this.health.error);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Anthropic streaming response body is not readable");
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let finishReason = "unknown";
    let inputTokens = 0;
    let outputTokens = 0;

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
          const data = JSON.parse(jsonStr) as { type?: string; delta?: { text?: string; stop_reason?: string }; usage?: { input_tokens?: number; output_tokens?: number } };
          if (data.delta?.text) {
            fullText += data.delta.text;
            onStream(data.delta.text);
          }
          if (data.delta?.stop_reason) {
            finishReason = data.delta.stop_reason;
          }
          if (data.usage) {
            inputTokens = data.usage.input_tokens ?? inputTokens;
            outputTokens = data.usage.output_tokens ?? outputTokens;
          }
        } catch {
          // ignore malformed streaming chunks
        }
      }
    }

    return {
      text: fullText,
      tokensUsed: inputTokens + outputTokens,
      finishReason,
      raw: { streamed: true },
    };
  }

  supportsStreaming(modelId: string): boolean {
    return this.models.some((m) => m.id === modelId);
  }
}
