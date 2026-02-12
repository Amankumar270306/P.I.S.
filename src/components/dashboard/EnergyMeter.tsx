import { cn } from "@/lib/utils";

interface EnergyMeterProps {
    plannedEnergy: number;
    completedEnergy: number;
    maxEnergy?: number;
}

export function EnergyMeter({ plannedEnergy, completedEnergy, maxEnergy = 90 }: EnergyMeterProps) {
    const plannedPercentage = Math.min(100, Math.max(0, (plannedEnergy / maxEnergy) * 100));
    const completedPercentage = Math.min(100, Math.max(0, (completedEnergy / maxEnergy) * 100));

    // Convert points to time (1 point = 10 min)
    const formatTime = (points: number) => {
        const mins = points * 10;
        const hours = Math.floor(mins / 60);
        const minutes = Math.round(mins % 60);
        if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h`;
        return `${minutes}m`;
    };

    return (
        <div className="w-full bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-center h-full">
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-sm font-bold text-slate-800">Energy Bar</h2>
                <div className="flex bg-slate-100 rounded-lg p-1 gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] text-slate-400 font-medium">Planned</span>
                            <span className="text-xs font-bold text-slate-700">{Math.round(plannedEnergy)} pts</span>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] text-slate-400 font-medium">Done</span>
                            <span className="text-xs font-bold text-slate-700">{Math.round(completedEnergy)} pts</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative h-6 w-full bg-slate-100 rounded-full overflow-hidden">
                {/* Planned Energy Bar (Yellow) */}
                <div
                    className="absolute top-0 left-0 h-full bg-amber-400 transition-all duration-500 ease-out rounded-r-full opacity-80 z-10"
                    style={{ width: `${plannedPercentage}%` }}
                />

                {/* Completed Energy Bar (Green) - Overlays Planned */}
                <div
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ease-out rounded-r-full z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)]"
                    style={{ width: `${completedPercentage}%` }}
                />

                {/* Capacity Markers */}
                <div className="absolute inset-0 w-full h-full z-30 flex justify-between px-1">
                    {[25, 50, 75].map((mark) => (
                        <div key={mark} className="h-full w-px bg-white/30" style={{ left: `${mark}%`, position: 'absolute' }} />
                    ))}
                </div>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                <span>0</span>
                <span>Capacity: {maxEnergy} pts (~{formatTime(maxEnergy)})</span>
            </div>
        </div>
    );
}
