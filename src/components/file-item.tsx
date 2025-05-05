
'use client';

import React from 'react';
import {
  FileText, ImageIcon, FileAudio, FileVideo, FileCode2, FileArchive, FileQuestion, Folder, Download, Trash2, Eye, MoreVertical, Edit, Share2, Copy, UploadCloud // Added icons
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Import Progress
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FileSystemItem, FileItemData, FolderItemData, FileCategory } from '@/types/file';
import { isFile, isFolder, formatBytes } from '@/types/file';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface FileItemProps {
  item: FileSystemItem;
  onDelete: (itemId: string) => void;
  onFolderClick: (folderId: string) => void;
  onRename: (item: FileSystemItem) => void;
  onShare: (item: FileSystemItem) => void;
  onPreview: (item: FileSystemItem) => void;
}

// --- Icon and Color Logic ---
const getItemIcon = (item: FileSystemItem, colorClass: string) => {
  const commonClasses = cn("h-8 w-8 mr-3 shrink-0", colorClass);
  if (isFolder(item)) {
    return <Folder className={cn(commonClasses, "text-yellow-500")} />; // Consistent folder color
  }
  // File specific icons
  switch (item.fileCategory) {
    case 'pdf': return <FileText className={commonClasses} />;
    case 'image': return <ImageIcon className={commonClasses} />;
    case 'document': return <FileText className={commonClasses} />;
    case 'audio': return <FileAudio className={commonClasses} />;
    case 'video': return <FileVideo className={commonClasses} />;
    case 'code': return <FileCode2 className={commonClasses} />;
    case 'other':
      if (/\.(zip|rar|tar|gz|7z)$/i.test(item.name)) return <FileArchive className={commonClasses} />;
      return <FileQuestion className={commonClasses} />;
    default: return <FileQuestion className={commonClasses} />;
  }
};

const getCategoryColorClass = (item: FileSystemItem): string => {
  if (isFolder(item)) return 'text-yellow-500'; // Folder color
  if (isFile(item)) {
    switch (item.fileCategory) {
      case 'pdf': return 'text-red-500'; // Use direct Tailwind colors for simplicity now
      case 'image': return 'text-green-500';
      case 'document': return 'text-blue-500';
      case 'audio': return 'text-orange-500';
      case 'video': return 'text-purple-500';
      case 'code': return 'text-indigo-500';
      default: return 'text-gray-500';
    }
  }
  return 'text-gray-500'; // Fallback
};

// --- Main Component ---
export function FileItem({ item, onDelete, onFolderClick, onRename, onShare, onPreview }: FileItemProps) {
  const colorClass = getCategoryColorClass(item);
  const { toast } = useToast();

  const handleItemClick = (e: React.MouseEvent) => {
    // Prevent triggering folder navigation when clicking buttons/menu inside
    if ((e.target as HTMLElement).closest('button, [role="menuitem"], [role="menu"]')) {
      return;
    }
    if (isFolder(item)) {
      onFolderClick(item.id);
    } else {
      handlePreviewAction(e); // Default click on file triggers preview
    }
  };

  // --- Action Handlers ---
   const handlePreviewAction = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent folder navigation if clicked within a folder item
    onPreview(item);
  };

  const handleDownloadAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFile(item)) {
      if (item.isUploading || !item.url) {
         toast({ title: "Indisponível", description: "O download não está disponível para este arquivo.", variant: "destructive"});
         return;
      }

      // Use the download attribute and create an anchor element
      const link = document.createElement('a');
      link.href = item.url;
      link.setAttribute('download', item.name); // Ensure the browser uses the correct filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
       toast({ title: "Download Iniciado", description: `"${item.name}" está sendo baixado.` });
    } else {
      toast({ title: "Ação Inválida", description: "Não é possível baixar uma pasta.", variant: "destructive" });
    }
  };

   const handleRenameAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename(item);
  };

  const handleShareAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(item);
  };

  const handleCopyLinkAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFile(item) && item.url && !item.isUploading) {
        // In a real app, this would be a persistent shareable link, not a blob URL
        const linkToCopy = item.url.startsWith('blob:') ? `(Link temporário para ${item.name})` : item.url;
         navigator.clipboard.writeText(linkToCopy).then(() => {
             toast({ title: "Link Copiado!", description: `Link para "${item.name}" copiado.` });
         }).catch(err => {
             toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
             console.error("Failed to copy link:", err);
         });
    } else {
        toast({ title: "Indisponível", description: "Não há link para copiar para este item.", variant: "destructive"});
    }
  };


  const handleDeleteAction = () => {
    // The actual deletion is handled by the AlertDialog confirmation
  };

  const isUploadingFile = isFile(item) && item.isUploading;
  const uploadProgress = isUploadingFile ? item.uploadProgress ?? 0 : 100;

  // Tooltip wrapper function
  const withTooltip = (content: React.ReactNode, tooltipText: string) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <li
      className={cn(
        "bg-card rounded-lg shadow-sm border p-3 flex items-center transition-all duration-150 hover:shadow-md hover:border-primary/50 relative group", // Added group for hover effects
        isFolder(item) ? 'cursor-pointer' : '', // Cursor pointer for folders
        isUploadingFile ? 'opacity-70' : '' // Dim uploading items
      )}
      onClick={handleItemClick}
    >
      {/* Item Icon */}
      {getItemIcon(item, colorClass)}

       {/* Item Info & Progress */}
       <div className="flex-grow min-w-0 mr-4">
         <p className="font-medium text-sm truncate text-foreground" title={item.name}>
           {item.name}
         </p>
         {isFile(item) && !isUploadingFile && (
           <p className="text-xs text-muted-foreground">
             {formatBytes(item.size)} &bull; {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
           </p>
         )}
          {isFolder(item) && (
             <p className="text-xs text-muted-foreground">
               Pasta &bull; {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
             </p>
           )}
         {isUploadingFile && (
           <div className="mt-1">
             <Progress value={uploadProgress} className="h-1 w-full" />
             <p className="text-xs text-muted-foreground mt-0.5">
               Enviando... {uploadProgress.toFixed(0)}%
               {item.error && <span className="text-destructive ml-2">Erro: {item.error}</span>}
            </p>
           </div>
         )}
       </div>


      {/* Action Buttons & Menu (only show if not uploading) */}
       {!isUploadingFile && (
        <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">

          {/* Individual Action Buttons (visible on hover) */}
          {isFile(item) && withTooltip(
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handlePreviewAction}>
                  <Eye className="h-4 w-4" />
              </Button>,
              "Visualizar"
          )}
          {isFile(item) && withTooltip(
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={handleDownloadAction}>
                  <Download className="h-4 w-4" />
              </Button>,
               "Baixar"
          )}
         {withTooltip(
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); document.getElementById(`delete-trigger-${item.id}`)?.click(); }}>
                {/* This button doesn't directly trigger delete, but clicks the hidden AlertDialog trigger */}
                <Trash2 className="h-4 w-4" />
            </Button>,
            "Excluir"
         )}


          {/* More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               {withTooltip(
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={e => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>,
                  "Mais opções"
               )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleRenameAction}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Renomear</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareAction}>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Compartilhar</span>
              </DropdownMenuItem>
               {isFile(item) && (
                 <DropdownMenuItem onClick={handleCopyLinkAction}>
                   <Copy className="mr-2 h-4 w-4" />
                   <span>Copiar Link</span>
                 </DropdownMenuItem>
               )}
              <DropdownMenuSeparator />
              <AlertDialog>
                  {/* Hidden Trigger for Delete, activated by visible Trash icon click */}
                  <AlertDialogTrigger asChild id={`delete-trigger-${item.id}`}>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                           <Trash2 className="mr-2 h-4 w-4" />
                           <span>Excluir</span>
                       </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                              Tem certeza que deseja excluir "{item.name}"? {isFolder(item) ? 'Todo o conteúdo dentro desta pasta também será excluído.' : ''} Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(item.id)} className={buttonVariants({ variant: "destructive" })}>
                              Excluir
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
       {isUploadingFile && (
            <div className="ml-auto p-2">
                <UploadCloud className="h-5 w-5 text-muted-foreground animate-pulse" />
            </div>
       )}
    </li>
  );
}
