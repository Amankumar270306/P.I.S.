import { CalendarEvent as ICalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface CalendarEventProps {
    event: ICalendarEvent;
}

export function CalendarEvent({ event }: CalendarEventProps) {
    // 60 minutes = ? height pixels. Let's assume the grid row is 60px height for 1 hour.
    const pixelsPerMinute = 1; // 1px per minute implies 60px per hour
    const height = event.durationMinutes * pixelsPerMinute;

    // Calculate relative top position based on start time minutes from the start of the hour
    // The grid cell will position it, assuming the grid cell is the "hour" container.
    // Actually, for a true grid view, we usually position relative to day start (6 AM).
    // 6 AM = 0px.

    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const minutesFromStart = startHour * 60 + startMinute; // Midnight Start
    const top = Math.max(0, minutesFromStart * pixelsPerMinute);

    let bgClass = "bg-blue-100 border-blue-200 text-blue-800";
    let pulse = false;

    if (event.energyCost < 0) {
        bgClass = "bg-emerald-500 text-white border-none"; // Recovery / Green block
    } else if (event.energyCost >= 8) {
        bgClass = "bg-rose-500 text-white border-none"; // High energy / Red block
    } else if (event.energyCost >= 4) {
        bgClass = "bg-blue-500 text-white border-none"; // Medium / Blue block
    } else {
        bgClass = "bg-indigo-500 text-white border-none"; // Default
    }

    return (
        <div
            className={cn(
                "absolute left-1 right-1 rounded-lg border p-2 text-xs shadow-sm overflow-hidden flex flex-col gap-0.5 transition-all hover:z-10 hover:shadow-md",
                bgClass,
                pulse && "animate-pulse"
            )}
            style={{
                top: `${top}px`,
                height: `${height}px`,
            }}
        >
            <div className="font-semibold leading-tight text-white mb-0.5">
                <span className="line-clamp-2">{event.title}</span>
            </div>
            <div className="text-[10px] text-white/80">
                {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                {' - '}
                {new Date(event.startTime.getTime() + event.durationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>

            {/* Avatars placeholder (optional, can add real ones later) */}
            {event.energyCost > 6 && (
                <div className="flex -space-x-1.5 mt-auto pt-1">
                    <div className="size-4 rounded-full bg-white/20 border border-white/10" />
                    <div className="size-4 rounded-full bg-white/20 border border-white/10" />
                </div>
            )}
        </div>
    );
}
