export class VirtualUser {
  private id: string;
  private sessionId: string;
  private conversationId?: string;
  private apiUrl: string;
  private responseTimes: number[] = [];

  constructor(id: string, apiUrl: string) {
    this.id = id;
    this.sessionId = `load-test-${id}`;
    this.apiUrl = apiUrl;
  }

  async sendMessage(message: string): Promise<number> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: this.sessionId,
          conversation_id: this.conversationId,
          domain: 'load-test.com',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.conversationId = data.conversation_id;

      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);

      return duration;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);
      throw error;
    }
  }

  getResponseTimes(): number[] {
    return [...this.responseTimes];
  }

  getId(): string {
    return this.id;
  }
}
