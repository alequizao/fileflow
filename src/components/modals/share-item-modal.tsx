
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Link as LinkIcon, Copy, Eye, Download, Edit } from 'lucide-react'; // Import icons
import type { FileSystemItem } from '@/types/file';
import { isFolder } from '@/types/file';
import { useToast } from '@/hooks/use-toast';

interface ShareItemModalProps {
  item: FileSystemItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmShare: (item: FileSystemItem) => void; // Simplified: just confirms the share action
}

export function ShareItemModal({ item, isOpen, onClose, onConfirmShare }: ShareItemModalProps) {
  const [shareLink, setShareLink] = useState('');
  const [allowView, setAllowView] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowEdit, setAllowEdit] = useState(false); // Default to false for safety
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && item) {
      // Mock link generation
      const mockLink = `${window.location.origin}/share/${item.id}?type=${item.type}`;
      setShareLink(mockLink);
      // Reset permissions on open
      setAllowView(true);
      setAllowDownload(true);
      setAllowEdit(false);
    } else {
      setShareLink(''); // Clear link when closed or no item
    }
  }, [isOpen, item]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      toast({ title: "Link Copiado!", description: "Link de compartilhamento copiado para a área de transferência." });
    }).catch(err => {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
      console.error("Failed to copy link:", err);
    });
  };

  const handleConfirm = () => {
      if(item) {
          // In a real app, you'd save the permissions along with the share link/token
          console.log(`Sharing ${item.name} with permissions: View=${allowView}, Download=${allowDownload}, Edit=${allowEdit}`);
          onConfirmShare(item); // Trigger the parent's share confirmation logic (e.g., show toast)
      }
  };

  if (!item) return null;

  const itemTypeLabel = isFolder(item) ? 'pasta' : 'arquivo';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <Share2 className="mr-2 h-5 w-5" /> Compartilhar {itemTypeLabel}
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{item.name}" com outras pessoas gerando um link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           {/* Share Link */}
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                value={shareLink}
                readOnly
              />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopyLink}>
              <span className="sr-only">Copiar</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

           {/* Permissions (Mock UI) - In real app, these would affect link behavior */}
           <div className="space-y-3 pt-2">
               <h4 className="text-sm font-medium">Permissões (Simulação)</h4>
               <div className="flex items-center justify-between">
                   <Label htmlFor="allow-view" className="flex items-center gap-2 text-sm font-normal">
                       <Eye className="h-4 w-4 text-muted-foreground"/> Permitir Visualização
                   </Label>
                   <Switch
                       id="allow-view"
                       checked={allowView}
                       onCheckedChange={setAllowView}
                       disabled // In this mock, view is always allowed
                       aria-readonly
                   />
               </div>
                <div className="flex items-center justify-between">
                   <Label htmlFor="allow-download" className="flex items-center gap-2 text-sm font-normal">
                       <Download className="h-4 w-4 text-muted-foreground"/> Permitir Download
                   </Label>
                   <Switch
                       id="allow-download"
                       checked={allowDownload}
                       onCheckedChange={setAllowDownload}
                   />
               </div>
                {/* Edit might only make sense for certain file types */}
                {isFile(item) && ['document', 'code', 'other'].includes(item.fileCategory) && (
                   <div className="flex items-center justify-between">
                       <Label htmlFor="allow-edit" className="flex items-center gap-2 text-sm font-normal">
                           <Edit className="h-4 w-4 text-muted-foreground"/> Permitir Edição (se aplicável)
                       </Label>
                       <Switch
                           id="allow-edit"
                           checked={allowEdit}
                           onCheckedChange={setAllowEdit}
                       />
                   </div>
                )}
           </div>

        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
          {/* In this simplified version, "Confirmar" just closes the modal */}
          <Button type="button" onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
