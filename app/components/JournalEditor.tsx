"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import "./JournalEditor.css";

import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import ImageRenderer from "../../components/ImageRenderer";

type Props = {
  initialContent?: any;
  onChange?:       (json: any) => void;
  readOnly?: boolean;
};

export default function JournalEditor({
  initialContent,
  onChange,
  readOnly = false,
}: Props) {
  const validContent =
    Array.isArray(initialContent) && initialContent.length > 0
      ? initialContent
      : undefined;

  const editor = useCreateBlockNote({ 
    initialContent: validContent,
    uploadFile: async (file: File) => {
      console.log('Uploading file:', file.name, file.type, file.size);
      
      // Custom file upload handler for BlockNote
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Upload failed:', data);
        throw new Error(data.error || 'Upload failed');
      }

      console.log('Upload successful:', data.url);
      return data.url;
    }
  });

  useEditorChange((ed) => {
    console.log('Editor content changed:', ed.document);
    
    // Debug: Log image blocks specifically
    const imageBlocks = ed.document.filter(block => block.type === 'image');
    if (imageBlocks.length > 0) {
      console.log('Image blocks found:', imageBlocks);
      imageBlocks.forEach((block, index) => {
        console.log(`Image block ${index}:`, {
          type: block.type,
          props: block.props,
          content: block.content
        });
      });
    }
    
    onChange?.(ed.document);
  }, editor);

  if (!editor) return null;

  return (
    <div className="journal-editor-wrapper">
      <BlockNoteView editor={editor} editable={!readOnly} />
      {/* Custom image renderer for all content */}
      <ImageRenderer 
        content={validContent || []} 
        className="mt-4"
      />
    </div>
  );
}
