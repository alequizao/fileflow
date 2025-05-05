

'use client';

import React from 'react';
import {
  FileText, ImageIcon, FileAudio, FileVideo, FileCode2, FileArchive, FileQuestion, Folder, Download, Trash2, Eye, MoreVertical, Edit, Share2, Copy, UploadCloud, FileCode, FileJson, Database, Terminal, BrainCircuit, FileCog, FileSpreadsheet, FileImage, FileType, Star, RotateCcw, Trash // Added more specific icons
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FileSystemItem, FileItemData, FolderItemData } from '@/types/file';
import { isFile, isFolder, formatBytes, dataUrlToBlob } from '@/types/file';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileItemProps {
  item: FileSystemItem;
  onDelete: (itemId: string) => void; // Moves to trash
  onFolderClick: (folderId: string) => void;
  onRename: (item: FileSystemItem) => void;
  onShare: (item: FileSystemItem) => void;
  onPreview: (item: FileSystemItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FileSystemItem) => void; // Context menu
  onToggleFavorite: (itemId: string) => void; // Toggle favorite
  isSelected: boolean; // Is the item currently selected?
  onSelect: (itemId: string, isShiftKey: boolean, isCtrlKey: boolean) => void; // Selection handler
  isDropTarget: boolean; // Is this folder currently the drop target?
  isTrashView?: boolean; // Are we viewing the trash?
  onDeletePermanently?: (itemId: string) => void; // Delete permanently from trash
  onRestore?: (itemId: string) => void; // Restore from trash
}

// --- Icon and Color Logic ---
const getItemIcon = (item: FileSystemItem) => {
    const commonClasses = "h-8 w-8 mr-3 shrink-0";
    const favoriteClass = item.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-yellow-500"; // Style for favorite folders

    if (isFolder(item)) {
        return <Folder className={cn(commonClasses, favoriteClass)} />;
    }

    // File specific icons based on category and extension
    switch (item.fileCategory) {
        case 'pdf': return <FileText className={cn(commonClasses, "text-red-600")} />;
        case 'image': return <FileImage className={cn(commonClasses, "text-green-500")} />; // Changed to FileImage
        case 'document':
            if (/\.(docx?)$/i.test(item.name)) return <FileText className={cn(commonClasses, "text-blue-600")} />;
            if (/\.(xlsx?|csv)$/i.test(item.name)) return <FileSpreadsheet className={cn(commonClasses, "text-green-600")} />; // Spreadsheet icon
            if (/\.(pptx?)$/i.test(item.name)) return <FileText className={cn(commonClasses, "text-orange-500")} />; // Presentation-like color
            if (/\.(md)$/i.test(item.name)) return <FileCode className={cn(commonClasses, "text-gray-500")} />; // Markdown icon
            return <FileText className={cn(commonClasses, "text-gray-500")} />; // Generic document
        case 'audio': return <FileAudio className={cn(commonClasses, "text-orange-400")} />;
        case 'video': return <FileVideo className={cn(commonClasses, "text-purple-500")} />;
        case 'code':
             if (/\.(js|jsx|ts|tsx)$/i.test(item.name)) return <FileCode2 className={cn(commonClasses, "text-yellow-400")} />; // JS/TS
             if (/\.(py)$/i.test(item.name)) return <FileCode className={cn(commonClasses, "text-blue-400")} />; // Python
             if (/\.(html|htm)$/i.test(item.name)) return <FileCode className={cn(commonClasses, "text-orange-600")} />; // HTML
             if (/\.(css|scss|sass)$/i.test(item.name)) return <FileCode className={cn(commonClasses, "text-purple-400")} />; // CSS
             if (/\.(php)$/i.test(item.name)) return <FileCode className={cn(commonClasses, "text-indigo-400")} />; // PHP
             if (/\.(json)$/i.test(item.name)) return <FileJson className={cn(commonClasses, "text-green-400")} />; // JSON
             if (/\.(sql)$/i.test(item.name)) return <Database className={cn(commonClasses, "text-pink-500")} />; // SQL -> Database
             if (/\.(sh|bash|zsh)$/i.test(item.name)) return <Terminal className={cn(commonClasses, "text-gray-400")} />; // Shell -> Terminal
             if (/\.(ipynb)$/i.test(item.name)) return <BrainCircuit className={cn(commonClasses, "text-orange-500")} />; // Notebook -> Brain
             return <FileCode2 className={cn(commonClasses, "text-indigo-500")} />; // Generic code
        case 'other':
            if (/\.(zip|rar|tar|gz|7z)$/i.test(item.name)) return <FileArchive className={cn(commonClasses, "text-gray-600")} />;
            if (/\.(exe|app|dmg|msi)$/i.test(item.name)) return <FileCog className={cn(commonClasses, "text-gray-700")} />; // Executable -> Cog
            return <FileType className={cn(commonClasses, "text-gray-500")} />; // Generic FileType
        default: return <FileType className={cn(commonClasses, "text-gray-500")} />;
    }
};


// --- Main Component ---
export function FileItem({
    item,
    onDelete,
    onFolderClick,
    onRename,
    onShare,
    onPreview,
    onContextMenu,
    onToggleFavorite,
    isSelected,
    onSelect,
    isDropTarget,
    isTrashView = false,
    onDeletePermanently,
    onRestore,
 }: FileItemProps) {
  const { toast } = useToast();

  const handleItemClick = (e: React.MouseEvent) => {
      const isActionButton = (e.target as HTMLElement).closest('button, [role="menuitem"], [role="menu"], [data-radix-dropdown-menu-trigger], [data-alert-dialog-trigger]');

      // Always handle selection first
       if (!isActionButton) { // Don't trigger selection change when clicking actions
          onSelect(item.id, e.shiftKey, e.ctrlKey || e.metaKey); // Pass modifier keys
       }

      // Prevent default actions if clicking on buttons/menus
      if (isActionButton) {
          e.stopPropagation();
          return;
      }

      // If not clicking an action button, proceed with default behavior (open folder/preview file)
      // Only trigger folder navigation or preview on single click if it's NOT a selection action
       if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            if (isFolder(item)) {
                onFolderClick(item.id);
            } else if (!isTrashView) { // Don't preview items in trash by default click
                 handlePreviewAction(e);
            }
       }
  };

    const handleDoubleClick = (e: React.MouseEvent) => {
         e.stopPropagation(); // Prevent single click behavior
         if (isFolder(item)) {
             onFolderClick(item.id);
         } else if (!isTrashView) { // Don't preview items in trash on double click either
             handlePreviewAction(e);
         }
     };


  // --- Action Handlers ---
   const handlePreviewAction = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (isTrashView) {
        toast({ title: "Ação Indisponível", description: "Não é possível visualizar itens na lixeira.", variant:"default" });
        return;
    }
    onPreview(item);
  };

  const handleDownloadAction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
     if (isTrashView) {
         toast({ title: "Ação Indisponível", description: "Não é possível baixar itens da lixeira.", variant:"default" });
         return;
     }
    if (isFile(item)) {
       if (item.isUploading || typeof item.content === 'undefined') {
           toast({ title: "Indisponível", description: "O download não está disponível para este arquivo.", variant: "destructive"});
           return;
       }

        try {
             let blob: Blob;
             if (typeof item.content === 'string' && item.content.startsWith('data:')) {
                 // Content is Data URL
                  blob = dataUrlToBlob(item.content);
             } else if (typeof item.content === 'string') {
                  // Content is plain text
                  blob = new Blob([item.content], { type: item.mimeType || 'text/plain' });
             } else {
                  throw new Error("Formato de conteúdo inválido para download.");
             }

             const blobUrl = URL.createObjectURL(blob);
             const link = document.createElement('a');
             link.href = blobUrl;
             link.setAttribute('download', item.name);
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             URL.revokeObjectURL(blobUrl); // Clean up blob URL
             toast({ title: "Download Iniciado", description: `"${item.name}" está sendo baixado.` });

         } catch (error) {
             console.error("Erro ao criar link de download:", error);
             toast({ title: "Erro de Download", description: `Não foi possível iniciar o download. ${error instanceof Error ? error.message : ''}`, variant: "destructive"});
         }

    } else {
      toast({ title: "Ação Inválida", description: "Não é possível baixar uma pasta.", variant: "destructive" });
    }
  };

   const handleRenameAction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
     if (isTrashView) {
         toast({ title: "Ação Indisponível", description: "Não é possível renomear itens na lixeira.", variant:"default" });
         return;
     }
    onRename(item);
  };

  const handleShareAction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
     if (isTrashView) {
         toast({ title: "Ação Indisponível", description: "Não é possível compartilhar itens da lixeira.", variant:"default" });
         return;
     }
    onShare(item);
  };

   const handleToggleFavoriteAction = (e: React.MouseEvent | React.KeyboardEvent) => {
       e.stopPropagation();
        if (isTrashView) {
            toast({ title: "Ação Indisponível", description: "Não é possível favoritar itens na lixeira.", variant:"default" });
            return;
        }
       onToggleFavorite(item.id);
   };


  const handleCopyLinkAction = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
     if (isTrashView) {
         toast({ title: "Ação Indisponível", description: "Não é possível copiar link de itens na lixeira.", variant:"default" });
         return;
     }
    if (isFile(item) && typeof item.content !== 'undefined' && !item.isUploading) {
        // Mock link - In real app, generate a persistent shareable link
        const linkToCopy = `${window.location.origin}/shared/${item.id}`; // Example
         navigator.clipboard.writeText(linkToCopy).then(() => {
             toast({ title: "Link Copiado!", description: `Link simulado para "${item.name}" copiado.` });
         }).catch(err => {
             toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
             console.error("Failed to copy link:", err);
         });
    } else {
        toast({ title: "Indisponível", description: "Não há link para copiar para este item.", variant: "destructive"});
    }
  };

  const handleDeleteTrigger = (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation(); // Prevent item click/selection
      // The AlertDialog component handles the rest
  };

  const handleConfirmDelete = () => {
       if (isTrashView && onDeletePermanently) {
           onDeletePermanently(item.id);
       } else {
           onDelete(item.id); // Move to trash
       }
   };

    const handleRestoreAction = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (isTrashView && onRestore) {
            onRestore(item.id);
        }
    };


  const isUploadingFile = isFile(item) && item.isUploading;
  const uploadProgress = isUploadingFile ? item.uploadProgress ?? 0 : 100;
  const hasError = isFile(item) && !!item.error;

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
        "bg-card rounded-lg shadow-sm border p-3 flex items-center transition-all duration-150 relative group",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-transparent outline-none", // Focus styling
        isFolder(item) ? 'cursor-pointer' : '', // Make folders explicitly clickable
        isUploadingFile ? 'opacity-70 pointer-events-none' : '', // Disable interactions while uploading
        hasError ? 'border-destructive/50 bg-destructive/5' : 'hover:shadow-md hover:border-primary/50', // Error state styling
        // Selection styling
         isSelected ? 'bg-primary/10 border-primary shadow-md' : '',
         // Drop target styling
         isDropTarget ? 'border-dashed border-2 border-primary bg-primary/5 scale-[1.01]' : ''
      )}
      onClick={handleItemClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => onContextMenu(e, item)}
      tabIndex={0} // Make list item focusable
      aria-selected={isSelected}
      data-item-id={item.id}
      data-folder-id={isFolder(item) ? item.id : undefined} // Add data attribute for drop target identification
      data-selected={isSelected} // Data attribute for easier CSS targeting if needed
      data-drop-target={isDropTarget}
      onKeyDown={(e) => {
           if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault(); // Prevent default space scroll
               handleItemClick(e as any); // Treat Enter/Space as a click for selection/action
           }
            // Add keyboard shortcuts for actions? e.g., Delete key
            if (e.key === 'Delete' && !isUploadingFile) {
                 e.stopPropagation();
                 handleDeleteTrigger(e);
                 // Find and click the AlertDialogTrigger programmatically? Or open the dialog directly.
                 // This requires a ref or more complex logic. For simplicity, maybe just log for now.
                  console.log("Delete key pressed for:", item.name);
            }
      }}
    >
      {/* Item Icon */}
      {getItemIcon(item)}
       {/* Favorite Star (Absolute position top-right) */}
        {!isTrashView && !isUploadingFile && (
             <TooltipProvider delayDuration={100}>
                 <Tooltip>
                     <TooltipTrigger asChild>
                         <Button
                             variant="ghost"
                             size="icon"
                             className={cn(
                                 "absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity hover:text-yellow-500",
                                 item.isFavorite ? "opacity-100 text-yellow-400 fill-yellow-400 hover:text-yellow-500" : ""
                             )}
                             onClick={handleToggleFavoriteAction}
                             aria-label={item.isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                         >
                             <Star className="h-4 w-4" />
                         </Button>
                     </TooltipTrigger>
                     <TooltipContent side="top">
                         <p>{item.isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</p>
                     </TooltipContent>
                 </Tooltip>
             </TooltipProvider>
        )}


       {/* Item Info & Progress */}
       <div className="flex-grow min-w-0 mr-4">
         <p className="font-medium text-sm truncate text-foreground" title={item.name}>
           {item.name}
         </p>
         {isFile(item) && !isUploadingFile && !hasError && (
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
             <Progress value={uploadProgress} className="h-1 w-full" aria-label={`Progresso do upload ${uploadProgress}%`} />
             <p className="text-xs text-muted-foreground mt-0.5">
               Enviando... {uploadProgress.toFixed(0)}%
            </p>
           </div>
         )}
          {hasError && isFile(item) && (
             <p className="text-xs text-destructive mt-1 truncate" title={item.error}>
               Falha no upload: {item.error}
             </p>
          )}
           {isTrashView && (
               <p className="text-xs text-muted-foreground italic mt-0.5">
                   Na lixeira - Atualizado em: {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
               </p>
           )}
       </div>


      {/* Action Buttons & Menu (only show if not uploading and no error) */}
       {!isUploadingFile && !hasError && (
        <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity duration-150">

            {/* Trash View Actions */}
             {isTrashView && onRestore && onDeletePermanently && (
                <>
                  {withTooltip(
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleRestoreAction}>
                           <RotateCcw className="h-4 w-4" />
                       </Button>,
                       "Restaurar"
                   )}
                  <AlertDialog>
                     {withTooltip(
                         <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDeleteTrigger} data-alert-dialog-trigger>
                                 <Trash className="h-4 w-4" />
                             </Button>
                         </AlertDialogTrigger>,
                         "Excluir Permanentemente"
                     )}
                     <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão Permanente</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja excluir "{item.name}" permanentemente? {isFolder(item) ? 'Todo o conteúdo dentro desta pasta também será excluído.' : ''} Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>
                                Excluir Permanentemente
                            </AlertDialogAction>
                        </AlertDialogFooter>
                     </AlertDialogContent>
                  </AlertDialog>
                </>
             )}

            {/* Regular View Actions */}
           {!isTrashView && (
               <>
                    {/* Individual Action Buttons (visible on hover/selection) */}
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

                    {/* Alert Dialog for Move to Trash Confirmation */}
                    <AlertDialog>
                        {withTooltip(
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDeleteTrigger} data-alert-dialog-trigger>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>,
                            "Mover para Lixeira"
                        )}
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Mover para Lixeira</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tem certeza que deseja mover "{item.name}" para a lixeira? {isFolder(item) ? 'Todo o conteúdo dentro desta pasta também será movido.' : ''}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>
                                    Mover para Lixeira
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* More Options Dropdown */}
                    <DropdownMenu>
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={e => e.stopPropagation()}>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Mais opções</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()} className="w-48">
                             {/* Add Favorite action */}
                             <DropdownMenuItem onClick={handleToggleFavoriteAction}>
                                 <Star className={cn("mr-2 h-4 w-4", item.isFavorite ? "text-yellow-500 fill-yellow-400" : "")} />
                                 <span>{item.isFavorite ? "Remover Favorito" : "Adicionar Favorito"}</span>
                             </DropdownMenuItem>
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
                             {isFile(item) && ( // Add Download to dropdown as well
                                 <DropdownMenuItem onClick={handleDownloadAction}>
                                     <Download className="mr-2 h-4 w-4" />
                                     <span>Baixar</span>
                                 </DropdownMenuItem>
                             )}
                            <DropdownMenuSeparator />
                            {/* Delete option within the dropdown triggers the same AlertDialog */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()} // Prevent closing dropdown immediately
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Mover para Lixeira</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                         <AlertDialogTitle>Mover para Lixeira</AlertDialogTitle>
                                         <AlertDialogDescription>
                                             Tem certeza que deseja mover "{item.name}" para a lixeira? {isFolder(item) ? 'Todo o conteúdo dentro desta pasta também será movido.' : ''}
                                         </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                         <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                         <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>
                                             Mover para Lixeira
                                         </AlertDialogAction>
                                     </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
               </>
           )}
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
