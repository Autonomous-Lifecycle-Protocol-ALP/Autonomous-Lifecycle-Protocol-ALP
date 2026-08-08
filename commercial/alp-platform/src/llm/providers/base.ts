export type StreamCallback = (chunk: string) => void;

export interface ProviderCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onStreamChunk?: StreamCallback;
  systemPrompt?: string;
}

export interface ProviderCompletionResult {
  text: string;
  tokensUsed: number;
  finishReason: string;
  raw: unknown;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly models: { id: string; name: string; contextWindow: number; maxOutput: number }[];
  readonly defaultModel: string;
  health: { healthy: boolean; latencyMs: number; lastChecked: string; error?: string };

  complete(modelId: string, prompt: string, options?: ProviderCompletionOptions): Promise<ProviderCompletionResult>;
  supportsStreaming(modelId: string): boolean;
}
