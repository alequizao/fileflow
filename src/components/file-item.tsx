
'use client';

import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileAudio,
  FileVideo,
  FileCode2, // Import code icon
  FileArchive,
  FileQuestion,
  Download,
  Trash2,
  Eye,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button'; // Keep buttonVariants import
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { UploadedFile, FileType } from '@/types/file';
import { cn } from '@/lib/utils';

interface FileItemProps {
  file: UploadedFile;
  onDelete: (fileId: string) => void;
}

const getFileIcon = (file: UploadedFile, colorClass: string) => { // Pass the whole file object
  const commonClasses = cn("h-8 w-8 mr-3 shrink-0", colorClass);
  switch (file.type) {
    case 'pdf':
      return <FileText className={commonClasses} />;
    case 'image':
      return <ImageIcon className={commonClasses} />;
    case 'document':
      return <FileText className={commonClasses} />; // Keep using FileText for documents
    case 'audio':
      return <FileAudio className={commonClasses} />;
    case 'video':
      return <FileVideo className={commonClasses} />;
    case 'code': // Add case for code
      return <FileCode2 className={commonClasses} />;
    case 'other':
        // Basic heuristic for archives based on common extensions
      if (/\.(zip|rar|tar|gz|7z)$/i.test(file.name)) {
         return <FileArchive className={commonClasses} />;
      }
      return <FileQuestion className={commonClasses} />;
    default:
      return <FileQuestion className={commonClasses} />;
  }
};

const getCategoryColorClass = (type: FileType): string => {
  switch (type) {
    case 'pdf':
      return 'text-category-pdf';
    case 'image':
      return 'text-category-image';
    case 'document':
      return 'text-category-document';
    case 'audio':
      return 'text-category-audio';
    case 'video':
      return 'text-category-video';
    case 'code': // Add case for code
      return 'text-category-code'; // Use code category color
    default:
      return 'text-category-other';
  }
};

export function FileItem({ file, onDelete }: FileItemProps) {
  const colorClass = getCategoryColorClass(file.type);

  // Function to handle download click
  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // For non-Blob URLs or URLs pointing to an API endpoint:
    if (!file.url.startsWith('blob:')) {
        e.preventDefault(); // Prevent default link navigation only if not a blob URL
        // Attempt to trigger download via temporary link
        const link = document.createElement('a');
        link.href = file.url;
        link.setAttribute('download', file.name);
        // Append to body, click, and remove is a common pattern
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    // For blob URLs, the default anchor behavior is usually sufficient.
    // If issues arise, you might need specific handling, but often works directly.
  };

  // Function to handle view/open click
  const handleView = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // For specific types like code or PDF, directly opening in a new tab is often desired.
    if (file.type === 'code' || file.type === 'pdf' || file.type === 'image' || file.url.startsWith('blob:')) {
      // Let the default anchor behavior handle opening in a new tab
      return;
    }

    // For other types (like documents, audio, video), downloading might be the default action,
    // so we might want to force download instead of trying to open.
    e.preventDefault(); // Prevent opening directly if not handled above
    handleDownload(e); // Trigger download instead
  };

  return (
    <li className="bg-card rounded-lg shadow-sm border p-3 flex items-center transition-colors hover:bg-muted/50">
      {/* Pass the file object to getFileIcon */}
      {getFileIcon(file, colorClass)}
      <div className="flex-grow min-w-0 mr-4">
        <p className="font-medium text-sm truncate text-foreground" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {file.size} &bull; {file.date}
        </p>
      </div>
      <div className="flex gap-1 ml-auto">
         {/* View/Open Link - Opens in new tab or triggers download based on type */}
         <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" asChild>
          {/* Use handleView to decide action, target="_blank" attempts new tab */}
          <a href={file.url} target="_blank" rel="noopener noreferrer" onClick={handleView} aria-label={`Abrir ou baixar ${file.name}`}>
            <Eye className="h-4 w-4" />
          </a>
        </Button>
        {/* Download Link - Always triggers download via handleDownload */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:text-accent/80" asChild>
           {/* Use file.url for the href, onClick handles the download logic */}
           <a href={file.url} onClick={handleDownload} download={file.name} aria-label={`Baixar ${file.name}`}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
        {/* Delete Button with Confirmation Dialog */}
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" aria-label={`Excluir ${file.name}`}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir o arquivo "{file.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                {/* Apply destructive variant style to the action button */}
                <AlertDialogAction onClick={() => onDelete(file.id)} className={buttonVariants({ variant: "destructive" })}>
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    </li>
  );
}

// Removed unused setFileContext function and related code
