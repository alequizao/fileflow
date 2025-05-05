
'use client';

import React from 'react';
// Removed import for next/image as we'll use a standard img tag for Data URLs
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Maximize, X } from 'lucide-react'; // Icons
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string; // Expecting a Data URL here
  altText: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, altText }: ImagePreviewModalProps) {
  const { toast } = useToast();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const failedUrl = (e.target as HTMLImageElement)?.src; // Get the src that failed
      console.error(`Error loading image for preview. URL: ${failedUrl}`, e);
      toast({
          title: "Erro ao Carregar Imagem",
          description: "Não foi possível exibir a visualização da imagem.",
          variant: "destructive",
      });
      // Consider closing the modal or showing a placeholder
      // onClose(); // Example: Close modal on error
  };


  // Validate if imageUrl is a valid data URL (basic check)
  const isValidDataUrl = typeof imageUrl === 'string' && imageUrl.startsWith('data:image/');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Increased max-width slightly and ensured flex container for centering */}
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] p-0 border-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg">
            <span className="truncate flex items-center">
              <Maximize className="mr-2 h-5 w-5" /> Visualizar Imagem
            </span>
            <DialogClose asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-5 w-5"/>
                    <span className="sr-only">Fechar</span>
                 </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        {/* Use a div container for centering and overflow handling */}
        <div className="p-4 flex justify-center items-center flex-grow overflow-auto">
          {isValidDataUrl ? (
            // Use standard <img> tag for Data URLs
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={altText}
              style={{
                  maxWidth: '100%', // Ensure image doesn't exceed container width
                  maxHeight: 'calc(90vh - 100px)', // Ensure image doesn't exceed modal height minus padding/header
                  objectFit: 'contain', // Scale image while preserving aspect ratio
                  display: 'block', // Prevent extra space below image
                  margin: 'auto' // Center image if smaller than container
              }}
              className="rounded-md shadow-md"
              data-ai-hint="image display" // Updated AI hint
              onError={handleImageError} // Use the specific handler
            />
          ) : (
            <p className="text-muted-foreground">URL da imagem inválida ou ausente.</p>
          )}
        </div>
         {/* Footer can be added if needed for actions like download */}
         {/* <DialogFooter className="p-4 border-t">
             <Button onClick={() => window.open(imageUrl, '_blank')}>Download</Button>
         </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}

