import { VirtualUser } from './virtual-user';

export class ScenarioRunner {
  private users: VirtualUser[] = [];
  private config: any;
  private metrics: any;
  private startTime: number;

  constructor(
    config: any,
    metrics: any,
    startTime: number,
    private executeRequest: (user: VirtualUser, message: string) => Promise<void>,
    private printProgressReport: () => void,
    private formatMemory: (bytes: number) => string,
    private getCurrentMemory: () => number,
    private recordMemorySnapshot: () => void
  ) {
    this.config = config;
    this.metrics = metrics;
    this.startTime = startTime;
  }

  async runBurstScenario(): Promise<VirtualUser[]> {
    console.log(`🎯 Scenario: BURST (${this.config.users} simultaneous users)`);

    for (let i = 0; i < this.config.users; i++) {
      this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
    }

    const promises = this.users.map(async (user) => {
      for (let i = 0; i < this.config.messagesPerUser; i++) {
        await this.executeRequest(user, `Burst message ${i}`);
      }
    });

    await Promise.all(promises);
    return this.users;
  }

  async runSustainedScenario(): Promise<VirtualUser[]> {
    console.log(
      `🎯 Scenario: SUSTAINED (${this.config.users} users over ${this.config.duration}s)`
    );

    for (let i = 0; i < this.config.users; i++) {
      this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
    }

    const endTime = Date.now() + this.config.duration * 1000;
    let reportTime = Date.now() + this.config.reportInterval * 1000;

    while (Date.now() < endTime) {
      const promises = this.users.map((user) =>
        this.executeRequest(user, `Sustained message at ${Date.now()}`)
      );

      await Promise.all(promises);

      if (Date.now() >= reportTime) {
        this.printProgressReport();
        reportTime = Date.now() + this.config.reportInterval * 1000;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return this.users;
  }

  async runRampUpScenario(): Promise<VirtualUser[]> {
    console.log(
      `🎯 Scenario: RAMP-UP (0 → ${this.config.users} users over ${this.config.duration}s)`
    );

    const usersPerInterval = Math.ceil(
      this.config.users / (this.config.duration / 5)
    );
    const endTime = Date.now() + this.config.duration * 1000;
    let reportTime = Date.now() + this.config.reportInterval * 1000;

    while (Date.now() < endTime && this.users.length < this.config.users) {
      const currentCount = this.users.length;
      const newCount = Math.min(
        currentCount + usersPerInterval,
        this.config.users
      );

      for (let i = currentCount; i < newCount; i++) {
        this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
      }

      const promises = this.users.map((user) =>
        this.executeRequest(user, `Ramp-up message from ${user.getId()}`)
      );

      await Promise.all(promises);

      if (Date.now() >= reportTime) {
        this.printProgressReport();
        reportTime = Date.now() + this.config.reportInterval * 1000;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return this.users;
  }

  async runMemoryLeakScenario(): Promise<VirtualUser[]> {
    console.log(`🎯 Scenario: MEMORY LEAK DETECTION (${this.config.duration}s)`);

    for (let i = 0; i < 100; i++) {
      this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
    }

    const endTime = Date.now() + this.config.duration * 1000;
    let iteration = 0;

    while (Date.now() < endTime) {
      iteration++;
      this.recordMemorySnapshot();

      const promises = this.users.map((user) =>
        this.executeRequest(user, `Memory test iteration ${iteration}`)
      );

      await Promise.all(promises);

      console.log(
        `📈 Iteration ${iteration}: Memory ${this.formatMemory(this.getCurrentMemory())}`
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return this.users;
  }
}
