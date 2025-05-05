
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

interface RenameItemModalProps {
  item: FileSystemItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (itemId: string, newName: string) => void;
}

export function RenameItemModal({ item, isOpen, onClose, onRename }: RenameItemModalProps) {
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && item) {
      setNewName(item.name);
      // Focus and select the input text shortly after opening
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item && newName.trim()) {
      onRename(item.id, newName.trim());
    }
    // onClose will be called by onRename in the parent component
  };

  if (!item) return null; // Don't render if no item is provided

  const itemTypeLabel = isFolder(item) ? 'pasta' : 'arquivo';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <Edit className="mr-2 h-5 w-5" /> Renomear {itemTypeLabel}
          </DialogTitle>
          <DialogDescription>
             Digite um novo nome para "{item.name}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-new-name" className="text-right">
                Novo Nome
              </Label>
              <Input
                id="item-new-name"
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                required
              />
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
