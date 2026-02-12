"use client";

import { useState, useEffect } from "react";
import { Editor } from "@/components/editor/Editor";
import { LinkedTasks } from "@/components/editor/LinkedTasks";
import {
    Plus, FileText, Trash2, File, ChevronLeft,
    PanelLeftOpen, PanelLeftClose,
    Lightbulb, Undo2, BookOpen, Search, Compass,
    Home, StickyNote, PenSquare, Settings2, MessageCircle,
    PanelRightClose, PanelRightOpen, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocuments, createDocument, updateDocument, deleteDocument, Document } from "@/lib/api";

type SidebarTab = "outline" | "notes" | "chat";

export default function DocsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Sidebar states
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<SidebarTab>("outline");

    // Initial Fetch
    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setIsLoading(true);
        try {
            const docs = await getDocuments();
            setDocuments(docs);
            if (docs.length > 0 && !selectedDocId) {
                setSelectedDocId(docs[0].id);
            }
        } catch (error) {
            console.error("Failed to load documents", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDoc = async () => {
        const title = `Untitled ${documents.length + 1}`;
        try {
            const newDoc = await createDocument(title);
            setDocuments([newDoc, ...documents]);
            setSelectedDocId(newDoc.id);
        } catch (error) {
            console.error("Failed to create doc", error);
        }
    };

    const handleDeleteDoc = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Delete this document?")) return;

        try {
            await deleteDocument(id);
            setDocuments(documents.filter(d => d.id !== id));
            if (selectedDocId === id) {
                setSelectedDocId(null);
            }
        } catch (error) {
            console.error("Failed to delete doc", error);
        }
    };

    const selectedDoc = documents.find(d => d.id === selectedDocId);

    const tabs: { key: SidebarTab; label: string; icon: React.ElementType }[] = [
        { key: "outline", label: "Outline", icon: FileText },
        { key: "chat", label: "Chat", icon: MessageCircle },
        { key: "notes", label: "Notes", icon: StickyNote },
    ];

    const templateTypes = [
        { label: "Essay", icon: PenSquare },
        { label: "Notes", icon: StickyNote },
        { label: "Report", icon: FileText },
        { label: "Blog Post", icon: BookOpen },
        { label: "Custom", icon: Settings2 },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* ═══════════════════════════════════════════ */}
            {/* LEFT SIDEBAR                                */}
            {/* ═══════════════════════════════════════════ */}
            <div
                className={cn(
                    "relative bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
                    isLeftCollapsed ? "w-0 border-r-0" : "w-72"
                )}
            >
                <div className="min-w-[288px] flex flex-col h-full">
                    {/* Tabs */}
                    <div className="flex items-center border-b border-slate-200 px-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative",
                                    activeTab === tab.key
                                        ? "text-blue-600"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <tab.icon className="size-4" />
                                {tab.label}
                                {activeTab === tab.key && (
                                    <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}

                        {/* Collapse button */}
                        <button
                            onClick={() => setIsLeftCollapsed(true)}
                            className="ml-auto p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mr-1"
                            title="Collapse sidebar"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === "outline" && (
                            <div className="p-2 space-y-0.5">
                                {isLoading ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">Loading documents...</div>
                                ) : documents.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm px-4">
                                        <FileText className="size-10 mx-auto mb-3 opacity-20" />
                                        <p>No documents yet.</p>
                                        <p className="mt-1 text-xs">Click &quot;+ Add section&quot; below.</p>
                                    </div>
                                ) : (
                                    documents.map((doc, index) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => setSelectedDocId(doc.id)}
                                            className={cn(
                                                "group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all",
                                                selectedDocId === doc.id
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "hover:bg-slate-50 text-slate-600"
                                            )}
                                        >
                                            {/* Section icon */}
                                            <div className={cn(
                                                "shrink-0 flex items-center justify-center size-5 rounded",
                                                selectedDocId === doc.id ? "text-blue-600" : "text-slate-400"
                                            )}>
                                                {index === 0 ? (
                                                    <ChevronDown className="size-4" />
                                                ) : (
                                                    <File className="size-4" />
                                                )}
                                            </div>

                                            <span className={cn(
                                                "truncate text-sm font-medium flex-1",
                                                selectedDocId === doc.id ? "text-blue-800" : "text-slate-700"
                                            )}>
                                                {doc.title}
                                            </span>

                                            {/* Delete button on hover */}
                                            <button
                                                onClick={(e) => handleDeleteDoc(e, doc.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all shrink-0"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}


                        {activeTab === "notes" && (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                <StickyNote className="size-10 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-slate-500">Quick Notes</p>
                                <p className="mt-1 text-xs">Jot down side notes and ideas.</p>
                            </div>
                        )}

                        {activeTab === "chat" && (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                <MessageCircle className="size-10 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-slate-500">Document Chat</p>
                                <p className="mt-1 text-xs">Chat about this document with AI.</p>
                            </div>
                        )}
                    </div>

                    {/* Add Section button (bottom) */}
                    {activeTab === "outline" && (
                        <div className="p-3 border-t border-slate-100">
                            <button
                                onClick={handleCreateDoc}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Plus className="size-4" />
                                Add section
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* ═══════════════════════════════════════════ */}
            {/* MAIN EDITING AREA                           */}
            {/* ═══════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-slate-200 shrink-0">
                    {/* Left: Sidebar toggle + Document title */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title={isLeftCollapsed ? "Show Document List" : "Hide Document List"}
                        >
                            {isLeftCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
                        </button>
                        <div className="w-px h-5 bg-slate-200" />
                        <div className="flex items-center justify-center size-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                            <FileText className="size-3" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">
                            {selectedDoc ? selectedDoc.title : "Untitled Document"}
                        </span>
                    </div>

                    {/* Center: Tools */}
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors" title="Generate">
                            <Lightbulb className="size-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors" title="Undo">
                            <Undo2 className="size-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors" title="Browse">
                            <BookOpen className="size-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors" title="Search">
                            <Search className="size-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors" title="Explore">
                            <Compass className="size-4" />
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors" title="Home">
                            <Home className="size-4" />
                        </button>
                        {selectedDoc && (
                            <button
                                onClick={() => setIsRightCollapsed(!isRightCollapsed)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                                title={isRightCollapsed ? "Show Linked Tasks" : "Hide Linked Tasks"}
                            >
                                {isRightCollapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Editor Content */}
                {selectedDoc ? (
                    <div className="flex-1 overflow-y-auto bg-white">
                        <div className="max-w-3xl mx-auto px-8 py-10">
                            {/* Document Title Input */}
                            <div className="mb-6">
                                <input
                                    type="text"
                                    value={selectedDoc.title}
                                    onChange={(e) => {
                                        const newTitle = e.target.value;
                                        setDocuments(docs => docs.map(d => d.id === selectedDoc.id ? { ...d, title: newTitle } : d));
                                        updateDocument(selectedDoc.id, { title: newTitle });
                                    }}
                                    className="text-3xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 focus:outline-none p-0 bg-transparent w-full"
                                    placeholder="Untitled Document"
                                />
                            </div>

                            {/* Template Type Buttons */}
                            {(!selectedDoc.content || selectedDoc.content === '' || selectedDoc.content === '<p></p>') && (
                                <div className="mb-8">
                                    <p className="text-lg text-slate-600 mb-4 font-medium">What are you writing today?</p>
                                    <div className="flex flex-wrap gap-2">
                                        {templateTypes.map((type) => (
                                            <button
                                                key={type.label}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                            >
                                                <type.icon className="size-4" />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Editor */}
                            <div className="min-h-[400px]">
                                <Editor
                                    key={selectedDoc.id}
                                    initialContent={selectedDoc.content}
                                    onChange={(content) => {
                                        updateDocument(selectedDoc.id, { content });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50/30">
                        <div className="text-center">
                            <FileText className="size-16 mx-auto mb-4 opacity-15" />
                            <p className="text-lg font-medium text-slate-500">Select a document</p>
                            <p className="text-sm text-slate-400 mt-1">Choose from the outline or add a new section</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* RIGHT SIDEBAR - Linked Tasks (UNTOUCHED)    */}
            {/* ═══════════════════════════════════════════ */}
            {selectedDoc && (
                <div
                    className={cn(
                        "bg-white border-l border-slate-200 shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
                        isRightCollapsed ? "w-0 border-l-0" : "w-80"
                    )}
                >
                    <div className="min-w-[320px]">
                        <LinkedTasks sourceType="document" sourceId={selectedDoc.id.toString()} />
                    </div>
                </div>
            )}
        </div>
    );
}
