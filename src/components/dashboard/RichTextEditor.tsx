'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold, Italic, List, ListOrdered,
    Quote, Undo, Redo, Code, Heading1, Heading2
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-white/5 bg-zinc-950/50">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('bold') ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Bold"
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('italic') ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Italic"
            >
                <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 my-auto" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Heading 1"
            >
                <Heading1 className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Heading 2"
            >
                <Heading2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 my-auto" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('bulletList') ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Bullet List"
            >
                <List className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('orderedList') ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Ordered List"
            >
                <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 my-auto" />
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('blockquote') ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Blockquote"
            >
                <Quote className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${editor.isActive('codeBlock') ? 'text-indigo-400 bg-white/5' : 'text-zinc-500'}`}
                title="Code Block"
            >
                <Code className="w-4 h-4" />
            </button>
            <div className="flex-1" />
            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 disabled:opacity-20"
                title="Undo"
            >
                <Undo className="w-4 h-4" />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 disabled:opacity-20"
                title="Redo"
            >
                <Redo className="w-4 h-4" />
            </button>
        </div>
    );
};

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] p-6 text-zinc-300 font-medium',
            },
        },
    });

    return (
        <div className="w-full border border-white/5 rounded-2xl overflow-hidden bg-zinc-950 focus-within:border-indigo-500/40 transition-all">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
