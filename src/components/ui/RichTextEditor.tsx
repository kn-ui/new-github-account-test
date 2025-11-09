import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Code, Image as ImageIcon, ChevronDown } from 'lucide-react';
import UnderlineExtension from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { uploadToHygraph } from '@/lib/hygraphUpload';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  content: string | object;
  onChange: (content: string) => void;
}

const RichTextEditor = forwardRef(({ content, onChange }: RichTextEditorProps, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  let parsedContent;
  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      parsedContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          },
        ],
      };
    }
  } else {
    parsedContent = content;
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Image,
    ],
    content: parsedContent,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    }
  });

  useImperativeHandle(ref, () => ({
    clearContent: () => {
      editor?.commands.clearContent();
    }
  }));

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const toastId = toast.loading('Uploading image...');
      try {
        const result = await uploadToHygraph(file);
        if (result.success && result.url) {
          editor.chain().focus().setImage({ src: result.url }).run();
          toast.success('Image uploaded and inserted!', { id: toastId });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image.', { id: toastId });
      }
    }
  };

  if (!editor) {
    return null;
  }

  const getTextStyleLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Paragraph';
  };

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-gray-300">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-32 justify-between">
              {getTextStyleLabel()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
          type="button"
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded"
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
          accept="image/*"
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextEditor;
