import { cn } from "@/lib/utils";

interface EnergyMeterProps {
    currentEnergy: number;
    maxEnergy?: number;
}

export function EnergyMeter({ currentEnergy, maxEnergy = 90 }: EnergyMeterProps) {
    const remaining = maxEnergy - currentEnergy;
    const percentage = Math.min(100, Math.max(0, (currentEnergy / maxEnergy) * 100));

    // Convert points to time (1 point = 10 min)
    const usedMinutes = currentEnergy * 10;
    const remainingMinutes = remaining * 10;
    const formatTime = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const minutes = Math.round(mins % 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    let colorClass = "bg-emerald-500";
    if (percentage > 80) {
        colorClass = "bg-rose-500";
    } else if (percentage >= 50) {
        colorClass = "bg-amber-500";
    }

    return (
        <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center h-full">
            <div className="flex justify-between items-end mb-1.5">
                <h2 className="text-sm font-semibold text-slate-900">Energy Bar</h2>
                <span className="text-xs font-medium text-slate-500">
                    {formatTime(usedMinutes)} used • {formatTime(remainingMinutes)} left
                </span>
            </div>

            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-500 ease-in-out", colorClass)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 pts</span>
                <span>{currentEnergy.toFixed(1)} / {maxEnergy} pts</span>
                <span>{maxEnergy} pts</span>
            </div>
        </div>
    );
}
