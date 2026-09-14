import type { ModelConfig, CompletionRequest, CompletionResult } from "./router";

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function executeOpenAI(
  model: ModelConfig,
  request: CompletionRequest,
  config: { apiKey?: string; baseUrl?: string },
): Promise<CompletionResult> {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      text: `[OpenAI stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }

  const baseUrl = config.baseUrl || "https://api.openai.com/v1";
  const body: Record<string, unknown> = {
    model: model.id,
    messages: [
      ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
      { role: "user", content: request.prompt },
    ],
    max_tokens: request.maxTokens ?? model.maxOutput,
    temperature: request.temperature ?? 0.7,
  };

  if (request.stream && request.onStreamChunk) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI stream error: HTTP ${response.status}: ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("OpenAI stream response body is empty");

    let fullText = "";
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            request.onStreamChunk(content);
          }
        } catch {
          // ignore parse errors for incomplete JSON chunks
        }
      }
    }

    return {
      text: fullText,
      tokensUsed: estimateTokens(fullText),
      finishReason: "stop",
    };
  }

  const data = (await postJson(`${baseUrl}/chat/completions`, body, {
    Authorization: `Bearer ${apiKey}`,
  })) as Record<string, unknown>;

  const choices = data.choices as Array<{ message?: { content?: string }; finish_reason?: string }>;
  const usage = data.usage as Record<string, number> | undefined;

  return {
    text: choices[0]?.message?.content ?? "",
    tokensUsed: usage?.total_tokens ?? estimateTokens(choices[0]?.message?.content ?? ""),
    finishReason: choices[0]?.finish_reason ?? "stop",
  };
}

export async function executeAnthropic(
  model: ModelConfig,
  request: CompletionRequest,
  config: { apiKey?: string; baseUrl?: string },
): Promise<CompletionResult> {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      text: `[Anthropic stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }

  const baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
  const body: Record<string, unknown> = {
    model: model.id,
    max_tokens: request.maxTokens ?? model.maxOutput,
    temperature: request.temperature ?? 0.7,
    system: request.systemPrompt,
    messages: [{ role: "user", content: request.prompt }],
  };

  const data = (await postJson(`${baseUrl}/messages`, body, {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  })) as Record<string, unknown>;

  const content = data.content as Array<{ text?: string }> | undefined;
  const usage = data.usage as Record<string, number> | undefined;

  return {
    text: content?.[0]?.text ?? "",
    tokensUsed: usage?.input_tokens && usage?.output_tokens ? usage.input_tokens + usage.output_tokens : estimateTokens(content?.[0]?.text ?? ""),
    finishReason: (data.stop_reason as string | undefined) ?? "stop",
  };
}

export async function executeAzureOpenAI(
  model: ModelConfig,
  request: CompletionRequest,
  config: { apiKey?: string; endpoint?: string; deployment?: string },
): Promise<CompletionResult> {
  const apiKey = config.apiKey || process.env.AZURE_OPENAI_API_KEY;
  const endpoint = config.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = config.deployment || model.id;

  if (!apiKey || !endpoint) {
    return {
      text: `[Azure OpenAI stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`;
  const body: Record<string, unknown> = {
    messages: [
      ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
      { role: "user", content: request.prompt },
    ],
    max_tokens: request.maxTokens ?? model.maxOutput,
    temperature: request.temperature ?? 0.7,
  };

  const data = (await postJson(url, body, {
    "api-key": apiKey,
  })) as Record<string, unknown>;

  const choices = data.choices as Array<{ message?: { content?: string }; finish_reason?: string }>;
  const usage = data.usage as Record<string, number> | undefined;

  return {
    text: choices[0]?.message?.content ?? "",
    tokensUsed: usage?.total_tokens ?? estimateTokens(choices[0]?.message?.content ?? ""),
    finishReason: choices[0]?.finish_reason ?? "stop",
  };
}

export async function executeAWSBedrock(
  model: ModelConfig,
  request: CompletionRequest,
  config: { region?: string; accessKeyId?: string; secretAccessKey?: string },
): Promise<CompletionResult> {
  const region = config.region || process.env.AWS_REGION || "us-east-1";

  if (!config.accessKeyId || !config.secretAccessKey) {
    return {
      text: `[AWS Bedrock stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }

  const payload = {
    modelId: model.id,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: request.maxTokens ?? model.maxOutput,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.prompt }],
    }),
  };

  try {
    const response = await fetch(
      `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(model.id)}/invoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `AWS4-HMAC-SHA256 ...`,
        },
        body: JSON.stringify(payload.body),
      }
    );

    if (!response.ok) {
      throw new Error(`AWS Bedrock HTTP ${response.status}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const completion = data.completion as string | undefined;
    return {
      text: completion ?? "",
      tokensUsed: estimateTokens(completion ?? ""),
      finishReason: (data.stop_reason as string | undefined) ?? "stop",
    };
  } catch {
    return {
      text: `[AWS Bedrock stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }
}

export async function executeGCPVertex(
  model: ModelConfig,
  request: CompletionRequest,
  config: { projectId?: string; region?: string; accessToken?: string },
): Promise<CompletionResult> {
  const projectId = config.projectId || process.env.GCP_PROJECT_ID;
  const region = config.region || process.env.GCP_REGION || "us-central1";

  if (!projectId || !config.accessToken) {
    return {
      text: `[GCP Vertex AI stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }

  try {
    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${encodeURIComponent(model.id)}:generateContent`;
    const body = {
      contents: [{ parts: [{ text: request.prompt }] }],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? model.maxOutput,
      },
      systemInstruction: request.systemPrompt ? { parts: [{ text: request.systemPrompt }] } : undefined,
    };

    const data = (await postJson(url, body, {
      Authorization: `Bearer ${config.accessToken}`,
    })) as Record<string, unknown>;

    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> | undefined;
    const text = candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    return {
      text,
      tokensUsed: estimateTokens(text),
      finishReason: candidates?.[0]?.finishReason ?? "stop",
    };
  } catch {
    return {
      text: `[GCP Vertex AI stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }
}

export async function executeOllama(
  model: ModelConfig,
  request: CompletionRequest,
  config: { endpoint?: string },
): Promise<CompletionResult> {
  const endpoint = config.endpoint || process.env.OLLAMA_ENDPOINT || "http://localhost:11434";

  try {
    const body = {
      model: model.id,
      prompt: request.prompt,
      system: request.systemPrompt,
      options: {
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens ?? model.maxOutput,
      },
      stream: request.stream ?? false,
    };

    if (request.stream && request.onStreamChunk) {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Ollama stream response body is empty");

      let fullText = "";
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullText += parsed.response;
              request.onStreamChunk(parsed.response);
            }
          } catch {
            // ignore
          }
        }
      }

      return {
        text: fullText,
        tokensUsed: estimateTokens(fullText),
        finishReason: "stop",
      };
    }

    const data = (await postJson(`${endpoint}/api/generate`, body)) as Record<string, unknown>;
    const text = (data.response as string) || `[Ollama stub] ${request.prompt}`;

    return {
      text,
      tokensUsed: estimateTokens(text),
      finishReason: data.done ? "stop" : "length",
    };
  } catch {
    return {
      text: `[Ollama stub] ${request.prompt}`,
      tokensUsed: estimateTokens(request.prompt),
      finishReason: "stop",
    };
  }
}

export function executeLocal(model: ModelConfig, request: CompletionRequest): CompletionResult {
  return {
    text: `[Local ${model.id}] ${request.prompt}`,
    tokensUsed: estimateTokens(request.prompt),
    finishReason: "stop",
  };
}
