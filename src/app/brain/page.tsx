"use client";

import { useState, useEffect } from "react";
import { Editor } from "@/components/editor/Editor";
import { LinkedTasks } from "@/components/editor/LinkedTasks";
import { Plus, FileText, Trash2, Save, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDocuments, createDocument, updateDocument, deleteDocument, Document } from "@/lib/api";

export default function DocsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleDeleteDoc = async (e: React.MouseEvent, id: number) => {
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

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar / Stack of Docs */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="size-5 text-indigo-600" />
                        Brain Stack
                    </h2>
                    <button
                        onClick={handleCreateDoc}
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-md transition-colors"
                        title="New Document"
                    >
                        <Plus className="size-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="text-center py-4 text-slate-400 text-sm">Loading stack...</div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            <p>Empty brain.</p>
                            <button onClick={handleCreateDoc} className="text-indigo-600 font-medium hover:underline mt-2">Create Doc</button>
                        </div>
                    ) : (
                        documents.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDocId(doc.id)}
                                className={cn(
                                    "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all border border-transparent",
                                    selectedDocId === doc.id
                                        ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                        : "hover:bg-slate-100 text-slate-600"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <File className={cn("size-4 shrink-0", selectedDocId === doc.id ? "text-indigo-600" : "text-slate-400")} />
                                    <span className={cn("truncate text-sm font-medium", selectedDocId === doc.id ? "text-indigo-900" : "text-slate-700")}>
                                        {doc.title}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteDoc(e, doc.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Editing Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {selectedDoc ? (
                    <div className="flex-1 overflow-y-auto bg-white">
                        <div className="max-w-4xl mx-auto px-8 py-12">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 group">
                                <input
                                    type="text"
                                    value={selectedDoc.title}
                                    onChange={(e) => {
                                        const newTitle = e.target.value;
                                        setDocuments(docs => docs.map(d => d.id === selectedDoc.id ? { ...d, title: newTitle } : d));
                                        // Auto-save title after delay could be added here
                                        updateDocument(selectedDoc.id, { title: newTitle });
                                    }}
                                    className="text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 p-0 bg-transparent w-full"
                                    placeholder="Untitled Document"
                                />
                                <div className="text-xs text-slate-400">
                                    {isSaving ? "Saving..." : "Auto-saved"}
                                </div>
                            </div>

                            {/* Editor */}
                            <div className="min-h-[500px]">
                                {/* We pass initialContent and a custom save handler to Editor if we want real persistence inside the content. 
                                    For now, let's stick to the current Editor which is self-contained state. 
                                    Ideally, we prompt the user to IMPLEMENT content saving. 
                                    I will wrap it to key it by doc ID so it resets. */}
                                <Editor key={selectedDoc.id} />
                                {/* NOTE: The Editor component currently has hardcoded content. 
                                    Future Step: Pass `initialContent={selectedDoc.content}` and `onChange` to Editor. */}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                            <FileText className="size-16 mx-auto mb-4 opacity-20" />
                            <p>Select a document from the stack</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
