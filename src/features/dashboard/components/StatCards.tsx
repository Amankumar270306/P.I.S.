import { Lock, Mail, Coffee } from "lucide-react";

const cards = [
    {
        label: "Context Mode",
        value: "Start Session", // Placeholder for actual state
        icon: Lock,
        iconColor: "text-slate-400",
        bgColor: "bg-slate-50",
    },
    {
        label: "Inbox Zero",
        value: "Sync Email", // Placeholder
        icon: Mail,
        iconColor: "text-slate-400",
        bgColor: "bg-slate-50",
    },
    {
        label: "Next Break",
        value: "Not Scheduled",
        icon: Coffee,
        iconColor: "text-slate-400",
        bgColor: "bg-slate-50",
    },
];

export function StatCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
                        <h3 className="text-xl font-bold text-slate-900">{card.value}</h3>
                    </div>
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                        <card.icon className={`size-6 ${card.iconColor}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
