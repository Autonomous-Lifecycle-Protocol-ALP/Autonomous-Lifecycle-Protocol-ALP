export interface VoiceSession {
  sessionId: string;
  status: "idle" | "listening" | "processing" | "speaking";
  transcript?: string;
  response?: string;
  startedAt?: string;
}

export interface MultimodalInput {
  type: "text" | "audio" | "image" | "video";
  data: string;
  mimeType?: string;
}

export interface VoiceOptions {
  language?: string;
  voice?: string;
  speed?: number;
}

export class VoiceMultimodalEngine {
  private readonly sessions = new Map<string, VoiceSession>();

  startSession(options: VoiceOptions = {}): VoiceSession {
    const sessionId = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session: VoiceSession = {
      sessionId,
      status: "idle",
      startedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): VoiceSession | undefined {
    return this.sessions.get(sessionId);
  }

  endSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  async processInput(sessionId: string, input: MultimodalInput): Promise<VoiceSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    session.status = "processing";
    if (input.type === "text") {
      session.transcript = input.data;
    }
    session.response = `Processed ${input.type} input`;
    session.status = "speaking";
    return session;
  }
}
