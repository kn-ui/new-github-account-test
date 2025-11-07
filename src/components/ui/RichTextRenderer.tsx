
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextRendererProps {
  content: string | object;
}

const RichTextRenderer = ({ content }: RichTextRendererProps) => {
  let parsedContent;
  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      parsedContent = content;
    }
  } else {
    parsedContent = content;
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: parsedContent,
    editable: false,
  });

  return <EditorContent editor={editor} />;
};

export default RichTextRenderer;
