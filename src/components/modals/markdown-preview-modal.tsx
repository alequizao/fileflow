
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Basic Markdown rendering (replace with a library like 'react-markdown' for production)
// This is a VERY rudimentary example.
const renderMarkdown = (markdown: string): React.ReactNode => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLang = '';
    let currentCode = '';

    lines.forEach((line, index) => {
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                 elements.push(
                    <pre key={`cb-${index}`} className="text-sm p-3 my-2 bg-muted/40 dark:bg-muted/20 overflow-x-auto rounded">
                        <code>{currentCode.trim()}</code>
                    </pre>
                );
                inCodeBlock = false;
                currentCode = '';
            } else {
                // Start code block
                inCodeBlock = true;
                codeLang = line.substring(3).trim();
            }
            return;
        }

        if (inCodeBlock) {
            currentCode += line + '\n';
            return;
        }

        if (line.startsWith('# ')) {
            elements.push(<h1 key={index} className="text-2xl font-bold mt-4 mb-2 border-b pb-1">{line.substring(2)}</h1>);
        } else if (line.startsWith('## ')) {
            elements.push(<h2 key={index} className="text-xl font-semibold mt-3 mb-1 border-b pb-1">{line.substring(3)}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={index} className="text-lg font-semibold mt-2 mb-1">{line.substring(4)}</h3>);
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            // Basic list item handling (needs improvement for nested lists)
             elements.push(<li key={index} className="ml-4 list-disc">{line.substring(2)}</li>);
        } else if (line.trim() === '') {
            // Treat consecutive blank lines as paragraph breaks (simple approach)
             if (elements.length > 0 && typeof elements[elements.length - 1] !== 'string') {
                 elements.push(<br key={`br-${index}`} />);
             }
        }
        else if (line.match(/!\[(.*?)\]\((.*?)\)/)) { // Basic image: ![alt](src)
            const match = line.match(/!\[(.*?)\]\((.*?)\)/);
            if (match) {
                 elements.push(<img key={index} src={match[2]} alt={match[1]} className="max-w-full my-2 rounded" />);
            }
        } else if (line.match(/\[(.*?)\]\((.*?)\)/)) { // Basic link: [text](url)
             const parts = line.split(/(\[.*?\]\(.*?\))/);
             elements.push(
                 <p key={index} className="my-1 leading-relaxed">
                     {parts.map((part, i) => {
                         const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                         if (linkMatch) {
                             return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{linkMatch[1]}</a>;
                         }
                         return part;
                     })}
                 </p>
             );
        }
        else {
             // Treat other lines as paragraphs
             // Group consecutive non-empty, non-list, non-header lines into paragraphs
              if (elements.length > 0 && typeof elements[elements.length - 1] === 'string') {
                  // Append to the last paragraph
                  elements[elements.length - 1] += '\n' + line;
              } else {
                   elements.push(line); // Start a new potential paragraph
              }
        }
    });

     // Wrap remaining string elements in <p> tags
     return elements.map((el, index) => {
         if (typeof el === 'string') {
             return <p key={`p-${index}`} className="my-1 leading-relaxed">{el}</p>;
         }
         // Wrap list items in a <ul>
         if (React.isValidElement(el) && el.type === 'li' && (index === 0 || !React.isValidElement(elements[index-1]) || elements[index-1].type !== 'li')) {
              const listItems = [];
              let j = index;
              while(j < elements.length && React.isValidElement(elements[j]) && elements[j].type === 'li') {
                  listItems.push(elements[j]);
                  j++;
              }
              // Skip rendering individual li's already grouped
              if (listItems.length > 0) {
                  elements.splice(index + 1, listItems.length - 1); // Adjust elements array
                   return <ul key={`ul-${index}`} className="my-2 pl-4">{listItems}</ul>;
              }
         }
         // Render other elements directly
         return el;
     });
};

interface MarkdownPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  markdownContent: string;
}

export function MarkdownPreviewModal({ isOpen, onClose, fileName, markdownContent }: MarkdownPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[900px] p-0 border-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span className="truncate flex items-center" title={fileName}>
              <FileCode className="mr-2 h-5 w-5" /> {fileName}
            </span>
            <DialogClose asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                     <X className="h-5 w-5"/>
                     <span className="sr-only">Fechar</span>
                 </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow overflow-auto">
           {/* Apply basic prose styling for readability */}
          <div className={cn(
              "prose prose-sm sm:prose lg:prose-lg dark:prose-invert", // Basic prose styling
              "max-w-none", // Remove max-width constraint from prose
              "p-4 sm:p-6" // Add padding
           )}>
                {renderMarkdown(markdownContent)}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
