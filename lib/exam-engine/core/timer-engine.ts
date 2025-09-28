// Timer Engine - Universal timing functionality for all exam types

// Define a proper type for callback functions
type TimerCallback = (data?: unknown) => void;

export interface TimerSettings {
  showTimer: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  warnings: {
    timeRemaining: number; // minutes
    message: string;
  }[];
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number; // seconds
  duration: number; // original duration in seconds
  warnings: { time: number; triggered: boolean; message: string }[];
}

export class TimerEngine {
  private state: TimerState;
  private interval: NodeJS.Timeout | null = null;
  private callbacks: Map<string, TimerCallback[]> = new Map();
  private settings: TimerSettings;

  constructor(settings: TimerSettings) {
    this.settings = settings;
    this.state = {
      isRunning: false,
      isPaused: false,
      timeRemaining: 0,
      duration: 0,
      warnings: settings.warnings.map((w) => ({
        time: w.timeRemaining * 60, // convert to seconds
        triggered: false,
        message: w.message,
      })),
    };
  }

  /**
   * Start exam timer
   */
  startTimer(
    _sessionId: string,
    timeLimit: number,
    onTimeUpdate: (remaining: number) => void,
    onTimeExpired: () => void
  ): void {
    // Implementation would go here
    console.log(`Starting timer for session ${_sessionId} with limit ${timeLimit}`);
    console.log(`onTimeUpdate: ${typeof onTimeUpdate}, onTimeExpired: ${typeof onTimeExpired}`);
  }

  pause(): void {
    if (this.state.isRunning && !this.state.isPaused) {
      this.state.isPaused = true;
      this.emit("paused", this.state);
    }
  }

  /**
   * Pause exam timer
   */
  pauseTimer(_sessionId: string): void {
    // Implementation would go here
    console.log(`Pausing timer for session ${_sessionId}`);
  }

  resume(): void {
    if (this.state.isRunning && this.state.isPaused) {
      this.state.isPaused = false;
      this.emit("resumed", this.state);
    }
  }

  /**
   * Resume exam timer
   */
  resumeTimer(_sessionId: string): void {
    // Implementation would go here
    console.log(`Resuming timer for session ${_sessionId}`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.state.isRunning = false;
    this.state.isPaused = false;
    this.emit("stopped", this.state);
  }

  /**
   * Stop exam timer
   */
  stopTimer(_sessionId: string): number {
    // Implementation would go here
    console.log(`Stopping timer for session ${_sessionId}`);
    return 0;
  }

  addTime(seconds: number): void {
    this.state.timeRemaining += seconds;
    this.emit("timeAdded", { seconds, newTime: this.state.timeRemaining });
  }

  getTimeRemaining(): number {
    return this.state.timeRemaining;
  }

  /**
   * Get remaining time
   */
  getRemainingTime(_sessionId: string): number {
    // Implementation would go here
    console.log(`Getting remaining time for session ${_sessionId}`);
    return 0;
  }

  getTimeElapsed(): number {
    return this.state.duration - this.state.timeRemaining;
  }

  getProgress(): number {
    if (this.state.duration === 0) return 0;
    return (
      (this.state.duration - this.state.timeRemaining) / this.state.duration
    );
  }

  formatTime(seconds?: number): string {
    const time = seconds !== undefined ? seconds : this.state.timeRemaining;
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const secs = time % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  private checkWarnings(): void {
    this.state.warnings.forEach((warning) => {
      if (!warning.triggered && this.state.timeRemaining <= warning.time) {
        warning.triggered = true;
        this.emit("warning", Math.ceil(warning.time / 60)); // emit minutes remaining
      }
    });
  }

  // Event system
  on(event: string, callback: TimerCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // State getter
  getState(): TimerState {
    return { ...this.state };
  }
}