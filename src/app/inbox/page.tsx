"use client";

import { useState } from "react";
import { EmailList } from "@/components/inbox/EmailList";
import { ReadingPane } from "@/components/inbox/ReadingPane";
import { Email } from "@/types/email";

const mockEmails: Email[] = [
    {
        id: "1",
        sender: "Project Manager",
        subject: "Q4 Roadmap Review",
        body: "Hi team, please review the attached roadmap for Q4. We need to finalize the features by Friday. Focus on the new dashboard and mobile app performance improvements.\n\nLet me know if you have any questions.",
        time: "10:30 AM",
        read: false,
    },
    {
        id: "2",
        sender: "GitLab",
        subject: "Pipeline #12435 failed",
        body: "Pipeline #12435 for branch feature/auth-flow failed in stage 'test'.\n\nError: Timeout waiting for database connection.",
        time: "9:15 AM",
        read: true,
    },
    {
        id: "3",
        sender: "HR Department",
        subject: "Open Enrollment Started",
        body: "It's that time of year again! Open enrollment for health benefits has started. Please log in to the portal to make your elections.",
        time: "Yesterday",
        read: true,
    },
    {
        id: "4",
        sender: "Newsletter",
        subject: "Weekly Tech Trends",
        body: "Top stories this week: 1. AI in healthcare 2. The future of React 3. WebAssembly updates...",
        time: "Yesterday",
        read: true,
    },
];

export default function InboxPage() {
    const [emails, setEmails] = useState<Email[]>(mockEmails);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

    const selectedEmail = emails.find(e => e.id === selectedEmailId) || null;

    const handleSelectEmail = (id: string) => {
        setSelectedEmailId(id);
        // Mark as read logic could go here
        setEmails(prev => prev.map(email =>
            email.id === id ? { ...email, read: true } : email
        ));
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <div className="w-[30%] min-w-[300px] border-r border-slate-200">
                <EmailList
                    emails={emails}
                    selectedEmailId={selectedEmailId}
                    onSelectEmail={handleSelectEmail}
                />
            </div>
            <div className="w-[70%] bg-slate-50">
                <ReadingPane email={selectedEmail} />
            </div>
        </div>
    );
}
