"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

export default function JournalEditor() {
  const editor = useCreateBlockNote({
    initialContent: [], 
  });

  useEditorChange((ed) => {
    console.log("JSON →", ed.document);
  }, editor);

  if (!editor) return null;

  return (
    <BlockNoteView
      editor={editor}
      // onChange={(ed) => console.log("JSON →", ed.document)} // <— one-liner version
    />
  );
}
