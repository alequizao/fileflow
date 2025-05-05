

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
import { FileCode2, X, Copy, Check, AlertTriangle } from 'lucide-react'; // Icons
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Basic Syntax Highlighting (Placeholder - use a library like Prism.js or highlight.js)
const basicHighlight = (code: string, language: string): React.ReactNode => {
    // Return plain code for now, implement proper highlighting later
    return code;
};


interface CodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  code: string | unknown; // Accept unknown type for content initially
  language?: string;
}

export function CodePreviewModal({ isOpen, onClose, fileName, code, language = 'plaintext' }: CodePreviewModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const codeAsString = typeof code === 'string' ? code : ''; // Ensure code is a string
  const isValidContent = typeof code === 'string';

  const handleCopyCode = () => {
      if (!isValidContent) {
           toast({ title: "Erro", description: "Conteúdo inválido para cópia.", variant: "destructive" });
           return;
      }
    navigator.clipboard.writeText(codeAsString).then(() => {
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
               <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-8 px-2" disabled={!isValidContent}>
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
         {isValidContent ? (
             <pre className="text-sm p-4 bg-muted/40 dark:bg-muted/20 overflow-x-auto">
                {/* Apply basic highlighting */}
                <code>{basicHighlight(codeAsString, language)}</code>
             </pre>
          ) : (
               <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                    <AlertTriangle className="h-10 w-10 mb-2 text-destructive" />
                    <p>Não foi possível exibir o conteúdo deste arquivo como texto.</p>
               </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
