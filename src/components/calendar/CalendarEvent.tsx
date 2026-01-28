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
    const minutesFrom6AM = (startHour - 6) * 60 + startMinute;
    const top = Math.max(0, minutesFrom6AM * pixelsPerMinute);

    let bgClass = "bg-blue-100 border-blue-200 text-blue-800";
    let pulse = false;

    if (event.energyCost < 0) {
        bgClass = "bg-green-100 border-green-200 text-green-800"; // Recovery
    } else if (event.energyCost >= 8) {
        bgClass = "bg-red-100 border-red-200 text-red-800";
        pulse = true;
    } else if (event.energyCost >= 4) {
        bgClass = "bg-orange-100 border-orange-200 text-orange-800";
    }

    return (
        <div
            className={cn(
                "absolute left-1 right-1 rounded-md border p-1 text-xs shadow-sm overflow-hidden flex flex-col gap-1 transition-all hover:z-10 hover:shadow-md",
                bgClass,
                pulse && "animate-pulse"
            )}
            style={{
                top: `${top}px`,
                height: `${height}px`,
            }}
        >
            <div className="flex items-center justify-between font-semibold leading-tight">
                <span className="truncate">{event.title}</span>
                {event.energyCost !== 0 && (
                    <div className="flex items-center gap-0.5 shrink-0 bg-white/50 px-1 rounded-full">
                        <Zap className="size-3 filling-current" fill="currentColor" />
                        <span>{event.energyCost}</span>
                    </div>
                )}
            </div>
            <div className="text-[10px] opacity-75">
                {event.startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
        </div>
    );
}
