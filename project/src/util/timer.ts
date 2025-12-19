// project/src/utils/timer.ts
export type DelayType = "fast" | "slow" | number;

export type TimerOptions = {
  onSave: () => Promise<void> | void;
  fastDelay?: number;
  slowDelay?: number;
};

export class Timer {
  private timer: NodeJS.Timeout | null = null;
  private onSave: () => Promise<void> | void;
  private fastDelay: number;
  private slowDelay: number;

  constructor({
    onSave,
    fastDelay = 200,
    slowDelay = 2000,
  }: TimerOptions) {
    this.onSave = onSave;
    this.fastDelay = fastDelay;
    this.slowDelay = slowDelay;
  }

  private getDelay(delay: DelayType) {
    if (typeof delay === "number") return delay;
    return delay === "fast" ? this.fastDelay : this.slowDelay;
  }

  start(delay: DelayType) {
    this.cancel();

    this.timer = setTimeout(async () => {
      this.timer = null;
      await this.onSave();
    }, this.getDelay(delay));
  }

  reset(delay: DelayType) {
    this.start(delay);
  }

  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  flush() {
    this.cancel();
    return Promise.resolve().then(() => this.onSave());
  }
}