
'use client';

import React from 'react';
import {
  FileText, ImageIcon, FileAudio, FileVideo, FileCode2, FileArchive, FileQuestion, Folder, Download, Trash2, Eye, MoreVertical, Edit, Share2, Copy, UploadCloud, FileCode, FileJson, Database, Terminal, BrainCircuit, FileCog, FileSpreadsheet, FileImage, FileType // Added more specific icons
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
import { isFile, isFolder, formatBytes } from '@/types/file';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileItemProps {
  item: FileSystemItem;
  onDelete: (itemId: string) => void;
  onFolderClick: (folderId: string | null) => void; // Allow null for root navigation
  onRename: (item: FileSystemItem) => void;
  onShare: (item: FileSystemItem) => void;
  onPreview: (item: FileSystemItem) => void;
}

// --- Icon and Color Logic ---
const getItemIcon = (item: FileSystemItem) => {
    const commonClasses = "h-8 w-8 mr-3 shrink-0";
    if (isFolder(item)) {
        return <Folder className={cn(commonClasses, "text-yellow-500")} />;
    }

    // File specific icons based on category and extension
    switch (item.fileCategory) {
        case 'pdf': return <FileText className={cn(commonClasses, "text-red-600")} />;
        case 'image': return <FileImage className={cn(commonClasses, "text-green-500")} />; // Changed to FileImage
        case 'document':
            if (/\.(docx?)$/i.test(item.name)) return <FileText className={cn(commonClasses, "text-blue-600")} />;
            if (/\.(xlsx?|csv)$/i.test(item.name)) return <FileSpreadsheet className={cn(commonClasses, "text-green-600")} />; // Spreadsheet icon
            if (/\.(pptx?)$/i.test(item.name)) return <FileText className={cn(commonClasses, "text-orange-500")} />; // Presentation-like color
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
export function FileItem({ item, onDelete, onFolderClick, onRename, onShare, onPreview }: FileItemProps) {
  const { toast } = useToast();

  const handleItemClick = (e: React.MouseEvent) => {
    // Prevent triggering folder navigation or preview when clicking buttons/menu inside
    if ((e.target as HTMLElement).closest('button, [role="menuitem"], [role="menu"], [data-radix-dropdown-menu-trigger]')) {
        e.stopPropagation(); // Stop propagation if click is on interactive elements
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
    e?.stopPropagation();
    onPreview(item);
  };

  const handleDownloadAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFile(item)) {
      if (item.isUploading || !item.url) {
         toast({ title: "Indisponível", description: "O download não está disponível para este arquivo.", variant: "destructive"});
         return;
      }

       // If it's a data URL, create a blob and download link
       if (item.url.startsWith('data:')) {
           try {
               const mimeType = item.url.substring(item.url.indexOf(':') + 1, item.url.indexOf(';'));
               const base64Data = item.url.substring(item.url.indexOf(',') + 1);
               const byteCharacters = atob(base64Data);
               const byteNumbers = new Array(byteCharacters.length);
               for (let i = 0; i < byteCharacters.length; i++) {
                   byteNumbers[i] = byteCharacters.charCodeAt(i);
               }
               const byteArray = new Uint8Array(byteNumbers);
               const blob = new Blob([byteArray], { type: mimeType });
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
               console.error("Error creating download link from data URL:", error);
               toast({ title: "Erro de Download", description: "Não foi possível iniciar o download.", variant: "destructive"});
           }
       } else {
           // If it's a regular URL (less likely now, but handle anyway)
           const link = document.createElement('a');
           link.href = item.url;
           link.setAttribute('download', item.name);
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
           toast({ title: "Download Iniciado", description: `"${item.name}" está sendo baixado.` });
       }

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
        // In a real app, this would be a persistent shareable link, not a data URL
        const linkToCopy = item.url.startsWith('data:') ? `(Link de dados para ${item.name})` : item.url;
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


  // handleDeleteAction is implicitly handled by AlertDialog confirmation below

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
        "bg-card rounded-lg shadow-sm border p-3 flex items-center transition-all duration-150 hover:shadow-md hover:border-primary/50 relative group",
        isFolder(item) ? 'cursor-pointer' : '',
        isUploadingFile ? 'opacity-70 pointer-events-none' : '' // Disable interactions while uploading
      )}
      onClick={handleItemClick}
    >
      {/* Item Icon */}
      {getItemIcon(item)}

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
               {/* Optional: Show error inline */}
               {/* {item.error && <span className="text-destructive ml-2">Erro: {item.error}</span>} */}
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

          {/* Alert Dialog for Delete Confirmation */}
          <AlertDialog>
            {withTooltip(
                 <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                 </AlertDialogTrigger>,
                  "Excluir"
             )}
             <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                {/* Delete option within the dropdown triggers the same AlertDialog */}
                <AlertDialog>
                     <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()} // Prevent closing dropdown immediately
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                           >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                          </DropdownMenuItem>
                     </AlertDialogTrigger>
                     <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
