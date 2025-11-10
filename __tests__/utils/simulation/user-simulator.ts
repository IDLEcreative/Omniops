/**
 * User Simulator for Rollout Testing
 *
 * Simulates a user session with configurable features:
 * - Message sending/receiving
 * - Multi-tab synchronization
 * - Cross-page persistence
 * - Network condition simulation
 */

import { SimulatedUser, SIMULATION_CONFIG } from './simulation-config';

export class UserSimulator {
  private user: SimulatedUser;
  private conversationId?: string;
  private messages: string[] = [];

  constructor(userId: string, features: SimulatedUser['features']) {
    this.user = {
      id: userId,
      sessionId: `sim-session-${userId}`,
      domain: 'simulation-test.com',
      browser: this.randomChoice(SIMULATION_CONFIG.browsers),
      device: this.randomChoice(SIMULATION_CONFIG.devices),
      network: this.randomChoice(SIMULATION_CONFIG.networkConditions),
      features,
    };
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  async sendMessage(message: string): Promise<void> {
    const delay = this.getNetworkDelay();
    await this.simulateDelay(delay);

    this.messages.push(message);

    // Simulate storage if persistence enabled
    if (this.user.features.persistence) {
      await this.storeInLocalStorage(message);
    }
  }

  async receiveResponse(): Promise<string> {
    const delay = this.getNetworkDelay();
    await this.simulateDelay(delay);

    return `Response to: ${this.messages[this.messages.length - 1]}`;
  }

  async openNewTab(): Promise<void> {
    if (!this.user.features.multiTab) {
      throw new Error('Multi-tab not enabled');
    }

    // Simulate tab sync
    await this.simulateDelay(100);
  }

  async navigateToNewPage(): Promise<void> {
    if (!this.user.features.crossPage) {
      // Data should be lost without cross-page persistence
      this.messages = [];
      this.conversationId = undefined;
    } else {
      // Data should persist
      await this.loadFromLocalStorage();
    }

    await this.simulateDelay(200);
  }

  private getNetworkDelay(): number {
    switch (this.user.network) {
      case '3g':
        return 500 + Math.random() * 500; // 500-1000ms
      case '4g':
        return 100 + Math.random() * 200; // 100-300ms
      case 'wifi':
        return 20 + Math.random() * 80; // 20-100ms
      default:
        return 100;
    }
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async storeInLocalStorage(message: string): Promise<void> {
    // Simulate localStorage write
    await this.simulateDelay(10);
  }

  private async loadFromLocalStorage(): Promise<void> {
    // Simulate localStorage read
    await this.simulateDelay(10);
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  hasConversation(): boolean {
    return this.conversationId !== undefined;
  }
}
