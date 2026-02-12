export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    energyCost: number; // 0.5-90 (1 point = 10 min)
    taskId?: string; // Link back to original task
}
