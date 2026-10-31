import { Response } from 'express';

export interface SSEClient {
  userId: string;
  res: Response;
}

class SSEManager {
  private clients: Map<string, Set<Response>> = new Map();

  public addClient(userId: string, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);

    res.on('close', () => {
      const userConnections = this.clients.get(userId);
      if (userConnections) {
        userConnections.delete(res);
        if (userConnections.size === 0) {
          this.clients.delete(userId);
        }
      }
    });
  }

  public sendToUser(userId: string, data: Record<string, unknown>): void {
    const userConnections = this.clients.get(userId);
    if (!userConnections || userConnections.size === 0) return;

    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const res of userConnections) {
      try {
        res.write(payload);
      } catch {
        userConnections.delete(res);
      }
    }
  }

  public broadcast(data: Record<string, unknown>): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const [, connections] of this.clients.entries()) {
      for (const res of connections) {
        try {
          res.write(payload);
        } catch {}
      }
    }
  }
}

export const sseManager = new SSEManager();
