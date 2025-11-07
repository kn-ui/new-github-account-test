
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { forwardRef, useImperativeHandle } from 'react';

interface RichTextEditorProps {
  content: string | object;
  onChange: (content: string) => void;
}

const RichTextEditor = forwardRef(({ content, onChange }: RichTextEditorProps, ref) => {
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
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  useImperativeHandle(ref, () => ({
    clearContent: () => {
      editor?.commands.clearContent();
    }
  }));

  return <EditorContent editor={editor} />;
});

export default RichTextEditor;
