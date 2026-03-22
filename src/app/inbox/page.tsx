"use client";

import { useState, useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { EmailList } from "@/features/inbox/components/EmailList";
import { ReadingPane } from "@/features/inbox/components/ReadingPane";
import { LinkedTasks } from "@/features/editor/components/LinkedTasks";
import { Email } from "@/shared/types/email";

// Empty emails - will be fetched from API in future
const emptyEmails: Email[] = [];

export default function InboxPage() {
    const [emails, setEmails] = useState<Email[]>(emptyEmails);
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
        <div className="h-[calc(100vh-2rem)] overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <Group orientation="horizontal">
                <Panel defaultSize={30} minSize={20} className="flex flex-col min-w-[280px]">
                    <div className="h-full overflow-hidden border-r border-slate-200">
                        <EmailList
                            emails={emails}
                            selectedEmailId={selectedEmailId}
                            onSelectEmail={handleSelectEmail}
                        />
                    </div>
                </Panel>

                <Separator className="w-1 bg-slate-100 hover:bg-indigo-400 transition-colors cursor-col-resize active:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 z-10" />

                <Panel defaultSize={50} className="bg-slate-50 flex">
                    <div className="flex-1 overflow-hidden">
                        <ReadingPane email={selectedEmail} />
                    </div>
                </Panel>

                <Separator className="w-1 bg-slate-100 hover:bg-indigo-400 transition-colors cursor-col-resize active:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 z-10" />

                {/* Linked Tasks Panel */}
                <Panel defaultSize={20} minSize={15} className="hidden xl:block">
                    <LinkedTasks sourceType="email" sourceId={selectedEmailId} />
                </Panel>
            </Group>
        </div>
    );
}
