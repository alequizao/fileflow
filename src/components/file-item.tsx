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
import { Button } from '@/components/ui/button';
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

const getFileIcon = (type: FileType, colorClass: string) => {
  const commonClasses = cn("h-8 w-8 mr-3 shrink-0", colorClass);
  switch (type) {
    case 'pdf':
      return <FileText className={commonClasses} />;
    case 'image':
      return <ImageIcon className={commonClasses} />;
    case 'document':
      return <FileText className={commonClasses} />;
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
  // It assumes the `file.url` points to an endpoint that serves the file with correct headers
  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevent default link navigation
    const link = document.createElement('a');
    link.href = file.url;
    link.setAttribute('download', file.name); // This attribute prompts download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <li className="bg-card rounded-lg shadow-sm border p-3 flex items-center transition-colors hover:bg-muted/50">
      {getFileIcon(file.type, colorClass)}
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
          <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${file.name}`}>
            <Eye className="h-4 w-4" />
          </a>
        </Button>
        {/* Download Link - Triggers download via handleDownload */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:text-accent/80" asChild>
           <a href={file.url} onClick={handleDownload} aria-label={`Baixar ${file.name}`}>
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

// Need buttonVariants for Alert Dialog Action styling
import { buttonVariants } from "@/components/ui/button";

// Need file variable access inside getFileIcon for archive check
let file: UploadedFile;
export function setFileContext(f: UploadedFile) {
  file = f;
}
