'use client';

import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileAudio,
  FileVideo,
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
    default:
      return 'text-category-other';
  }
};

export function FileItem({ file, onDelete }: FileItemProps) {
  const colorClass = getCategoryColorClass(file.type);

  // Function to handle download click
  // This uses a temporary anchor element to trigger the download
  // It assumes the `file.url` points to an endpoint that serves the file with correct headers OR is a Blob URL
  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // For non-Blob URLs or URLs pointing to an API endpoint:
    if (!file.url.startsWith('blob:')) {
        e.preventDefault(); // Prevent default link navigation only if not a blob URL
        const link = document.createElement('a');
        link.href = file.url; // This should point to the API endpoint or direct file link
        link.setAttribute('download', file.name); // This attribute prompts download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    // For blob URLs, the default anchor behavior is sufficient for download.
    // No e.preventDefault() needed.
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
         {/* View/Open Link - Opens in new tab */}
         <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" asChild>
          {/* Use file.url directly, target="_blank" opens in a new tab */}
          <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${file.name}`}>
            <Eye className="h-4 w-4" />
          </a>
        </Button>
        {/* Download Link - Triggers download via handleDownload */}
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
