
import React from 'react';
import { FileItem } from './file-item'; // FileItem now handles both files and folders
import type { FileSystemItem } from '@/types/file';
import { FolderOpen, Search } from 'lucide-react'; // Import Search icon

interface FileListProps {
  items: FileSystemItem[];
  onDelete: (itemId: string) => void;
  onFolderClick: (folderId: string) => void; // Handler for clicking on a folder
  onRename: (item: FileSystemItem) => void; // Handler to initiate rename
  onShare: (item: FileSystemItem) => void; // Handler to initiate sharing
  onPreview: (item: FileSystemItem) => void; // Handler to initiate preview
  // Optional: Pass search/filter status for more specific empty states
  isSearching?: boolean;
  isFiltering?: boolean;
}

export function FileList({
    items,
    onDelete,
    onFolderClick,
    onRename,
    onShare,
    onPreview,
    isSearching = false, // Default values
    isFiltering = false
}: FileListProps) {

  if (items.length === 0) {
    let message = "Nenhum item encontrado.";
    let subMessage = "Use o botão 'Enviar' ou 'Nova Pasta' para adicionar itens.";
    let Icon = FolderOpen;

    if (isSearching || isFiltering) {
      message = "Nenhum item corresponde à sua busca ou filtro.";
      subMessage = "Tente ajustar seus termos de busca ou o filtro selecionado.";
      Icon = Search; // Use search icon for no results state
    }

    return (
      <div className="text-center text-muted-foreground mt-10 flex flex-col items-center p-6 border border-dashed rounded-lg">
        <Icon className="h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
        <p className="text-lg font-medium mb-1">{message}</p>
        <p className="text-sm">{subMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <FileItem
          key={item.id}
          item={item}
          onDelete={onDelete}
          onFolderClick={onFolderClick}
          onRename={onRename}
          onShare={onShare}
          onPreview={onPreview}
        />
      ))}
    </ul>
  );
}
