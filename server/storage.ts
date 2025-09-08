import { type S3Session } from "@shared/schema";

export interface IStorage {
  getSession(sessionId: string): Promise<S3Session | undefined>;
  createSession(credentials: any): Promise<S3Session>;
  deleteSession(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, S3Session> = new Map();

  async getSession(sessionId: string): Promise<S3Session | undefined> {
    return this.sessions.get(sessionId);
  }

  async createSession(credentials: any): Promise<S3Session> {
    const sessionId = Math.random().toString(36).substring(7);
    const session: S3Session = {
      id: sessionId,
      credentials,
      createdAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

export const storage = new MemStorage();
