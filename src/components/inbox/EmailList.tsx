import { Email } from "@/types/email";
import { cn } from "@/lib/utils";

interface EmailListProps {
    emails: Email[];
    selectedEmailId: string | null;
    onSelectEmail: (id: string) => void;
}

export function EmailList({ emails, selectedEmailId, onSelectEmail }: EmailListProps) {
    return (
        <div className="w-full h-full overflow-y-auto bg-white border-r border-slate-200">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Inbox</h2>
                <p className="text-sm text-slate-500">{emails.length} messages</p>
            </div>
            <div className="divide-y divide-slate-100">
                {emails.map((email) => (
                    <div
                        key={email.id}
                        onClick={() => onSelectEmail(email.id)}
                        className={cn(
                            "p-4 cursor-pointer hover:bg-slate-50 transition-colors",
                            selectedEmailId === email.id ? "bg-indigo-50 hover:bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent",
                            !email.read && "bg-slate-50"
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={cn("text-sm font-medium", !email.read ? "text-slate-900 font-bold" : "text-slate-700")}>
                                {email.sender}
                            </span>
                            <span className="text-xs text-slate-400">{email.time}</span>
                        </div>
                        <h3 className={cn("text-sm mb-1 truncate", !email.read ? "font-bold text-slate-900" : "text-slate-600")}>
                            {email.subject}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                            {email.body}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
