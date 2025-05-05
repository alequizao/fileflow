
'use client';

import React from 'react';
import Image from 'next/image'; // Use next/image for optimization
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose // Import DialogClose
} from "@/components/ui/dialog";
import { Maximize, X } from 'lucide-react'; // Icons

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, altText }: ImagePreviewModalProps) {


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw] p-0 border-0 max-h-[85vh]">
        <DialogHeader className="p-4 border-b">
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
          {/* Optional: Add description or controls here */}
        </DialogHeader>
        <div className="p-4 flex justify-center items-center overflow-auto max-h-[calc(85vh-80px)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={altText}
              width={1000} // Provide reasonable max width
              height={800} // Provide reasonable max height
              style={{ width: 'auto', height: 'auto', maxHeight: 'calc(85vh - 100px)', maxWidth: '100%' }} // Control display size
              className="rounded-md shadow-md"
              data-ai-hint="preview image" // AI hint
              onError={(e) => console.error("Error loading image:", e)} // Basic error handling
            />
          ) : (
            <p className="text-muted-foreground">Não foi possível carregar a imagem.</p>
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
