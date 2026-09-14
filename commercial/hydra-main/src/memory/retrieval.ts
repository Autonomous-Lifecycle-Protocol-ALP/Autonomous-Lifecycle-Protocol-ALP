import type { MemoryEntry, MemoryQuery, MemoryStore } from "./store";

export interface MemoryRetrievalQuery {
  semantic?: string;
  keyword?: string;
  scope?: string;
  type?: string;
  importance?: "low" | "medium" | "high" | "critical";
  timeRange?: { start?: string; end?: string };
  limit?: number;
  recencyWeight?: number;
  relevanceWeight?: number;
}

export interface RetrievalResult {
  entry: MemoryEntry;
  score: number;
  matchType: "semantic" | "keyword" | "temporal" | "structural";
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  similarity(a: number[], b: number[]): number;
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  private readonly vectors = new Map<string, number[]>();

  async embed(text: string): Promise<number[]> {
    if (this.vectors.has(text)) return this.vectors.get(text)!;
    const tokens = this.tokenize(text);
    const vector = new Array(128).fill(0);
    for (const token of tokens) {
      const idx = this.hashCode(token) % 128;
      vector[idx] = (vector[idx] || 0) + 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    const normalized = vector.map((v) => v / magnitude);
    this.vectors.set(text, normalized);
    return normalized;
  }

  similarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += (a[i] || 0) * (b[i] || 0);
      magA += (a[i] || 0) * (a[i] || 0);
      magB += (b[i] || 0) * (b[i] || 0);
    }
    return (dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1) + 1) / 2;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export class MemoryRetriever {
  private readonly store: MemoryStore;
  private readonly embeddingProvider: EmbeddingProvider;

  constructor(store: MemoryStore, embeddingProvider?: EmbeddingProvider) {
    this.store = store;
    this.embeddingProvider = embeddingProvider ?? new MockEmbeddingProvider();
  }

  async search(query: MemoryRetrievalQuery): Promise<RetrievalResult[]> {
    const structuredQuery: MemoryQuery = {
      type: query.type,
      scope: query.scope,
      importance: query.importance,
      limit: query.limit ?? 50,
    };

    const candidates = await this.store.query(structuredQuery);

    const results: RetrievalResult[] = [];
    const now = Date.now();

    for (const entry of candidates) {
      let score = 0;
      let matchType: RetrievalResult["matchType"] = "structural";

      if (query.semantic) {
        const embedding = await this.embeddingProvider.embed(query.semantic);
        const entryEmbedding = await this.embeddingProvider.embed(entry.value);
        const semanticScore = this.embeddingProvider.similarity(embedding, entryEmbedding);
        score += semanticScore * (query.relevanceWeight ?? 1.0);
        if (semanticScore > 0.3) matchType = "semantic";
      }

      if (query.keyword) {
        const keywords = query.keyword.toLowerCase().split(/\s+/).filter(Boolean);
        const content = entry.value.toLowerCase();
        const keywordScore = keywords.filter((kw) => content.includes(kw)).length / keywords.length;
        score += keywordScore * (query.relevanceWeight ?? 0.8);
        if (keywordScore > 0) matchType = keywordScore > 0.5 ? matchType : "keyword";
      }

      if (query.timeRange && (query.timeRange.start || query.timeRange.end)) {
        const entryTime = new Date(entry.createdAt).getTime();
        const startTime = query.timeRange.start ? new Date(query.timeRange.start).getTime() : 0;
        const endTime = query.timeRange.end ? new Date(query.timeRange.end).getTime() : now;

        if (entryTime >= startTime && entryTime <= endTime) {
          const recencyScore = 1 - (now - entryTime) / (endTime - startTime || 1);
          score += Math.max(0, recencyScore) * (query.recencyWeight ?? 0.3);
          if (matchType === "structural") matchType = "temporal";
        }
      }

      if (query.scope && entry.scope === query.scope) {
        score += 0.1;
      }
      if (query.type && entry.type === query.type) {
        score += 0.05;
      }

      if (score > 0) {
        results.push({ entry, score, matchType });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return query.limit ? results.slice(0, query.limit) : results;
  }

  async searchSemantic(text: string, scope?: string, limit = 10): Promise<RetrievalResult[]> {
    return this.search({ semantic: text, scope, limit });
  }

  async searchKeyword(keyword: string, scope?: string, limit = 10): Promise<RetrievalResult[]> {
    return this.search({ keyword, scope, limit });
  }

  async searchTemporal(start: string, end: string, scope?: string, limit = 10): Promise<RetrievalResult[]> {
    return this.search({ timeRange: { start, end }, scope, limit });
  }

  async hybridSearch(
    semantic: string,
    keyword?: string,
    scope?: string,
    limit = 15,
  ): Promise<RetrievalResult[]> {
    return this.search({
      semantic,
      keyword,
      scope,
      limit,
      relevanceWeight: 1.0,
      recencyWeight: 0.3,
    });
  }
}
