"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

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

  const editor = useCreateBlockNote({ initialContent: validContent });

  useEditorChange((ed) => onChange?.(ed.document), editor);

  if (!editor) return null;

  return <BlockNoteView editor={editor} editable={!readOnly} />;
}
