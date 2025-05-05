

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit } from 'lucide-react';
import type { FileSystemItem } from '@/types/file';
import { isFolder } from '@/types/file';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface RenameItemModalProps {
  item: FileSystemItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (itemId: string, newName: string) => void;
  existingNames?: string[]; // Names of other items in the same directory
  itemType?: 'file' | 'folder'; // Type of item being renamed
}

export function RenameItemModal({ item, isOpen, onClose, onRename, existingNames = [], itemType }: RenameItemModalProps) {
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && item) {
       // Separate name and extension for files
       if (itemType === 'file' && item.name.includes('.')) {
           const lastDotIndex = item.name.lastIndexOf('.');
           setNewName(item.name.substring(0, lastDotIndex));
       } else {
           setNewName(item.name);
       }
      // Focus and select the input text shortly after opening
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, item, itemType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const trimmedName = newName.trim();
    let finalName = trimmedName;

     // Re-add extension for files if it was present
     if (itemType === 'file' && item.name.includes('.')) {
         const extension = item.name.substring(item.name.lastIndexOf('.'));
         finalName = trimmedName + extension;
     }


    if (!trimmedName) {
      toast({ title: "Erro", description: "O nome não pode estar vazio.", variant: "destructive" });
      return;
    }

     // Validation for invalid characters (allow extension dots for files)
     const invalidCharRegex = itemType === 'file' ? /[\\/:*?"<>|]/ : /[\\/:*?"<>|.]/; // Disallow dots in folder names
     if (invalidCharRegex.test(trimmedName)) { // Test the name part without extension for files
         toast({ title: "Nome Inválido", description: `O nome contém caracteres inválidos ${itemType === 'folder' ? '(incluindo ".")' : ''}.`, variant: "destructive" });
         return;
     }


    // Check if the final name already exists (case-insensitive check)
    if (existingNames.some(name => name.toLowerCase() === finalName.toLowerCase())) {
        toast({ title: "Nome Já Existe", description: `Um ${itemType === 'folder' ? 'pasta' : 'arquivo'} com este nome já existe aqui.`, variant: "destructive" });
        return;
    }


    onRename(item.id, finalName);
    // onClose will be called by onRename in the parent component or here if needed
    // onClose();
  };

  if (!item) return null; // Don't render if no item is provided

  const itemTypeLabel = isFolder(item) ? 'pasta' : 'arquivo';
  const originalExtension = itemType === 'file' && item.name.includes('.') ? item.name.substring(item.name.lastIndexOf('.')) : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <Edit className="mr-2 h-5 w-5" /> Renomear {itemTypeLabel}
          </DialogTitle>
          <DialogDescription>
             Digite um novo nome para "{item.name}".
             {itemType === 'file' && originalExtension && (
                <span className="block text-xs text-muted-foreground mt-1">Extensão: {originalExtension} (não será alterada)</span>
             )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-new-name" className="text-right">
                Novo Nome
              </Label>
               <div className="col-span-3 flex items-center gap-1">
                 <Input
                    id="item-new-name"
                    ref={inputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-grow"
                    required
                    aria-describedby={itemType === 'file' && originalExtension ? 'file-extension-label' : undefined}
                 />
                  {itemType === 'file' && originalExtension && (
                     <span id="file-extension-label" className="text-sm text-muted-foreground">{originalExtension}</span>
                  )}
               </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Renomear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
