"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import "./JournalEditor.css";

import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
// Removed custom ImageRenderer to avoid duplicate rendering of images

type BlockNoteContent = {
    type: string;
    content?: {text: string}[];
    children?: BlockNoteContent[];
    props?: {
        url?: string;
        alt?: string;
        name?: string;
        mime?: string;
        type?: string;
    };
}

type Props = {
  initialContent?: BlockNoteContent[];
  onChange?:       (json: BlockNoteContent[]) => void;
  readOnly?: boolean;
};

export default function JournalEditor({
  initialContent,
  onChange,
  readOnly = false,
}: Props) {
  // Removed unused liveContent variable

  const validContent =
    Array.isArray(initialContent) && initialContent.length > 0
      ? initialContent
      : undefined;

  const editor = useCreateBlockNote({ 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialContent: validContent as any,
    uploadFile: async (file: File) => {
      
      // Convert HEIC/HEIF to JPEG in-browser before upload
      let fileToUpload: File = file;
      try {
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          const heic2any = (await import('heic2any')).default as (options: { blob: File; toType: string; quality: number }) => Promise<BlobPart>;
          const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
          fileToUpload = new File([blob as BlobPart], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        }
      } catch (convErr: unknown) {
        console.warn('HEIC conversion failed:', convErr);
      }

      // Custom file upload handler for BlockNote
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Show user-friendly error message
        const errorMessage = data.error || 'Upload failed';
        console.error('Upload error:', errorMessage);
        alert(`Upload failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return data.url;
    }
  });

  function isImageUrl(url: string | undefined): boolean {
    if (!url) return false;
    const lowered = url.split('?')[0].toLowerCase();
    return (
      lowered.endsWith('.jpg') ||
      lowered.endsWith('.jpeg') ||
      lowered.endsWith('.png') ||
      lowered.endsWith('.gif') ||
      lowered.endsWith('.webp') ||
      lowered.endsWith('.heic') ||
      lowered.endsWith('.heif')
    );
  }

  function normalizeBlocksToImages(blocks: BlockNoteContent[]): BlockNoteContent[] {
    return blocks.map((block) => {
      if (block?.type === 'file') {
        const mime: string | undefined = block?.props?.mime || block?.props?.type;
        const url: string | undefined = block?.props?.url;
        const name: string | undefined = block?.props?.name;
        const looksLikeImage =
          (mime && typeof mime === 'string' && mime.startsWith('image/')) ||
          isImageUrl(url) ||
          (typeof name === 'string' && /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(name));
        if (looksLikeImage) {
          return {
            ...block,
            type: 'image',
            props: {
              url,
              alt: block?.props?.alt || block?.props?.name || 'image',
              name: block?.props?.name,
            },
          };
        }
      }
      return block;
    });
  }

  useEditorChange((ed) => {
    const normalized = normalizeBlocksToImages(ed.document as unknown as BlockNoteContent[]);
    onChange?.(normalized);
  }, editor);

  if (!editor) return null;

  return (
    <div className="journal-editor-wrapper">
      <BlockNoteView editor={editor} editable={!readOnly} />
    </div>
  );
}
