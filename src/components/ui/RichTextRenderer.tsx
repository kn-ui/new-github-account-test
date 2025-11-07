
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState, useRef, useEffect } from 'react';

interface RichTextRendererProps {
  content: string | object;
  truncate?: boolean;
}

const RichTextRenderer = ({ content, truncate = false }: RichTextRendererProps) => {
  const [isTruncated, setIsTruncated] = useState(truncate);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight > clientHeight) {
        setIsOverflowing(true);
      } else {
        setIsOverflowing(false);
      }
    }
  }, [editor, content]);

  const toggleTruncate = () => {
    setIsTruncated(!isTruncated);
  };

  return (
    <div className="prose max-w-none">
      <div ref={contentRef} className={isTruncated ? 'max-h-24 overflow-hidden' : ''}>
        <EditorContent editor={editor} />
      </div>
      {truncate && isOverflowing && <button onClick={toggleTruncate} className="text-blue-500 hover:underline">{isTruncated ? 'Read more' : 'Read less'}</button>}
    </div>
  );
};

export default RichTextRenderer;
