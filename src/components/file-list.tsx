import React from 'react';
import { FileItem } from './file-item';
import type { UploadedFile } from '@/types/file';
import { FolderOpen } from 'lucide-react';

interface FileListProps {
  files: UploadedFile[];
  onDelete: (fileId: string) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-10 flex flex-col items-center">
        <FolderOpen className="h-16 w-16 mb-3 text-gray-300" />
        <p className="text-sm">Nenhum arquivo encontrado.</p>
        <p className="text-xs mt-1">Use o botão "Enviar" para adicionar arquivos.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {files.map((file) => (
        <FileItem key={file.id} file={file} onDelete={onDelete} />
      ))}
    </ul>
  );
}
