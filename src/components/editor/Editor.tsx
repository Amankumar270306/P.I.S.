import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function Editor() {
    const [isMounted, setIsMounted] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder: 'Write something amazing...',
            }),
        ],
        content: `
      <h2>Project Overview</h2>
      <p>This is a living document for the new initiative. We need to align on the core goals and deliverables.</p>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="true">Define scope</li>
        <li data-type="taskItem" data-checked="false">Assign resources</li>
        <li data-type="taskItem" data-checked="false">Kickoff meeting</li>
      </ul>
      <p>Start typing to add more...</p>
    `,
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[300px]',
            },
        },
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="relative border border-slate-200 rounded-lg shadow-sm bg-white">
            {/* Fixed Toolbar */}
            {editor && (
                <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50 rounded-t-lg">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn(
                            "p-1.5 rounded hover:bg-white hover:shadow-sm transition-all",
                            editor.isActive('bold') ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500'
                        )}
                    >
                        <Bold className="size-4" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn(
                            "p-1.5 rounded hover:bg-white hover:shadow-sm transition-all",
                            editor.isActive('italic') ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500'
                        )}
                    >
                        <Italic className="size-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1" />
                    <button
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        className={cn(
                            "p-1.5 rounded hover:bg-white hover:shadow-sm transition-all",
                            editor.isActive('taskList') ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500'
                        )}
                    >
                        <ListTodo className="size-4" />
                    </button>
                </div>
            )}

            <div className="p-8">
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
        /* Minimal Tiptap Styles */
        ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        ul[data-type="taskList"] li > label {
          margin-top: 0.25rem;
          user-select: none;
        }
        ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
        </div>
    );
}
