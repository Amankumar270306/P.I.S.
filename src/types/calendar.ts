export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    durationMinutes: number;
    energyCost: number; // -10 to 10
    taskId?: string; // Link back to original task
}
