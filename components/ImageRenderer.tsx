"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type BlockNoteContent = {
    type: string;
    content?: {text: string}[];
    children?: BlockNoteContent[];
    id?: string;
    props?: {
        url?: string;
        alt?: string;
        name?: string;
        width?: number;
    };
}

interface ImageRendererProps {
  content: BlockNoteContent[];
  className?: string;
  onUpdateBlock?: (blockId: string, nextProps: Record<string, unknown>) => void;
}

export default function ImageRenderer({ content, className = "" }: ImageRendererProps) {
  const [processedContent, setProcessedContent] = useState<BlockNoteContent[]>([]);

  useEffect(() => {
    if (!content || !Array.isArray(content)) return;

    const processed = content.map((block: BlockNoteContent, index: number) => {
      if (block.type === 'image' && block.props?.url) {
        return {
          ...block,
          id: block.id || `image-${index}`,
          rendered: true,
          props: {
            ...block.props,
            width: typeof block.props.width === 'number' ? block.props.width : 60
          }
        };
      }
      return block;
    });

    setProcessedContent(processed);
  }, [content]);

  if (!processedContent.length) return null;

  return (
    <div className={`image-renderer ${className}`}>
      {processedContent.map((block: BlockNoteContent, index: number) => {
        if (block.type === 'image' && block.props?.url) {
          return (
            <div key={block.id || index} className="my-4">
              <Image
                src={block.props.url}
                alt={block.props.alt || block.props.name || 'Uploaded image'}
                width={800}
                height={600}
                className="max-w-full h-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                style={{ width: `${Math.min(Math.max(block.props.width ?? 100, 10), 100)}%` }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {}}
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
