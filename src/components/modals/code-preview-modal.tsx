
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area"; // Use ScrollArea for long code
import { FileCode2, X, Copy, Check } from 'lucide-react'; // Icons
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Basic Syntax Highlighting (Replace with a proper library like Prism.js or highlight.js for production)
// This is a VERY rudimentary example and doesn't handle complex cases.
const basicHighlight = (code: string, language: string): React.ReactNode => {
    // Extremely simple keyword highlighting for demonstration
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'import', 'export', 'class', 'new', 'await', 'async', 'public', 'private', 'protected', 'static', 'void', 'int', 'string', 'bool'];
    const comments = code.match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || [];
    const strings = code.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g) || [];

    // Split by delimiters but keep them
    const parts = code.split(/(\s+|\(|\)|\{|\}|\[|\]|;|,|\.|=|\+|-|\*|\/|>|<|:|!|\?|&|\|)/);

    return parts.map((part, index) => {
        if (keywords.includes(part)) {
            return <span key={index} className="text-blue-500 dark:text-blue-400 font-medium">{part}</span>;
        }
        if (strings.includes(part)) {
             return <span key={index} className="text-green-600 dark:text-green-400">{part}</span>;
        }
         if (comments.some(comment => comment.includes(part))) {
             return <span key={index} className="text-gray-500 dark:text-gray-400 italic">{part}</span>;
         }
        // Simple number check
        if (!isNaN(Number(part)) && part.trim() !== '') {
             return <span key={index} className="text-purple-600 dark:text-purple-400">{part}</span>;
         }
        return part;
    });
};


interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  code: string;
  language?: string; // Optional: Language hint for syntax highlighting
}

export function CodePreviewModal({ isOpen, onClose, fileName, code, language = 'plaintext' }: CodePreviewModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast({ title: "Código Copiado!", description: "O conteúdo do arquivo foi copiado." });
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    }).catch(err => {
      toast({ title: "Erro", description: "Não foi possível copiar o código.", variant: "destructive" });
      console.error("Failed to copy code:", err);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[800px] p-0 border-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span className="truncate flex items-center" title={fileName}>
              <FileCode2 className="mr-2 h-5 w-5" /> {fileName}
            </span>
             <div className="flex items-center gap-2">
               <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-8 px-2">
                 {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                 <span className="ml-1">{copied ? 'Copiado' : 'Copiar'}</span>
               </Button>
                <DialogClose asChild>
                   <Button variant="ghost" size="icon" className="h-8 w-8">
                       <X className="h-5 w-5"/>
                       <span className="sr-only">Fechar</span>
                   </Button>
                </DialogClose>
             </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow overflow-auto">
          <pre className="text-sm p-4 bg-muted/40 dark:bg-muted/20 overflow-x-auto">
            {/* Apply basic highlighting */}
            <code>{basicHighlight(code, language)}</code>
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
