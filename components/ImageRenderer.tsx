"use client";

import { useEffect, useState } from "react";

interface ImageRendererProps {
  content: any[];
  className?: string;
}

export default function ImageRenderer({ content, className = "" }: ImageRendererProps) {
  const [processedContent, setProcessedContent] = useState<any[]>([]);

  useEffect(() => {
    if (!content || !Array.isArray(content)) return;

    const processed = content.map((block: any, index: number) => {
      if (block.type === 'image' && block.props?.url) {
        return {
          ...block,
          id: block.id || `image-${index}`,
          rendered: true
        };
      }
      return block;
    });

    setProcessedContent(processed);
  }, [content]);

  if (!processedContent.length) return null;

  return (
    <div className={`image-renderer ${className}`}>
      {processedContent.map((block: any, index: number) => {
        if (block.type === 'image' && block.props?.url) {
          return (
            <div key={block.id || index} className="my-4">
              <img
                src={block.props.url}
                alt={block.props.alt || block.props.name || 'Uploaded image'}
                className="max-w-full h-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                onError={(e) => {
                  console.error('Image failed to load:', block.props.url);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', block.props.url);
                }}
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
