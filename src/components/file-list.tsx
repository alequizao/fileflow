

import React from 'react';
import { FileItem } from './file-item'; // FileItem now handles both files and folders
import type { FileSystemItem } from '@/types/file';
import { FolderOpen, Search, Star, Trash2 } from 'lucide-react'; // Import additional icons

interface FileListProps {
  items: FileSystemItem[];
  onDelete: (itemId: string) => void; // Will now move to trash
  onFolderClick: (folderId: string) => void;
  onRename: (item: FileSystemItem) => void;
  onShare: (item: FileSystemItem) => void;
  onPreview: (item: FileSystemItem) => void;
  onContextMenu: (event: React.MouseEvent, item: FileSystemItem) => void; // Context menu handler
  onToggleFavorite: (itemId: string) => void; // Favorite toggle handler
  selectedItems: Set<string>; // Set of selected item IDs
  onItemSelect: (itemId: string, isShiftKey: boolean, isCtrlKey: boolean) => void; // Selection handler
  dragTargetFolderId?: string | null; // ID of the folder being dragged over
  isSearching?: boolean;
  isFiltering?: boolean;
  isTrashView?: boolean; // Indicates if currently viewing the trash
  onDeletePermanently?: (itemId: string) => void; // Handler for permanent deletion from trash
  onRestore?: (itemId: string) => void; // Handler for restoring from trash
}

export function FileList({
    items,
    onDelete,
    onFolderClick,
    onRename,
    onShare,
    onPreview,
    onContextMenu,
    onToggleFavorite,
    selectedItems,
    onItemSelect,
    dragTargetFolderId,
    isSearching = false,
    isFiltering = false,
    isTrashView = false,
    onDeletePermanently,
    onRestore,
}: FileListProps) {

  if (items.length === 0) {
    let message = "Nenhum item encontrado.";
    let subMessage = "Use o botão 'Enviar' ou 'Nova Pasta' para adicionar itens.";
    let Icon = FolderOpen;

    if (isTrashView) {
        message = "A lixeira está vazia.";
        subMessage = "Itens excluídos aparecerão aqui.";
        Icon = Trash2;
    } else if (isFiltering && items.length === 0) { // Check items length specifically for filtering message
        message = "Nenhum item corresponde ao seu filtro.";
        subMessage = "Tente um filtro diferente ou remova-o.";
         // Determine icon based on filter type
         if (isFiltering && typeof isFiltering === 'string' && isFiltering === 'favorites') {
              Icon = Star; // Specific icon for empty favorites
              message = "Nenhum favorito encontrado.";
              subMessage = "Clique na estrela para adicionar itens aos favoritos.";
         } else {
             Icon = Search; // General search/filter icon
         }

    } else if (isSearching && items.length === 0) { // Check items length specifically for search message
        message = "Nenhum item corresponde à sua busca.";
        subMessage = "Tente ajustar seus termos de busca.";
        Icon = Search;
    } else if (items.length === 0 && !isSearching && !isFiltering && !isTrashView) {
         // Default empty state for a folder
         message = "Esta pasta está vazia.";
         subMessage = "Envie arquivos ou crie uma nova pasta aqui.";
         Icon = FolderOpen;
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
          onContextMenu={onContextMenu}
          onToggleFavorite={onToggleFavorite}
          isSelected={selectedItems.has(item.id)}
          onSelect={onItemSelect}
          isDropTarget={item.type === 'folder' && dragTargetFolderId === item.id}
          isTrashView={isTrashView}
          onDeletePermanently={onDeletePermanently}
          onRestore={onRestore}
        />
      ))}
    </ul>
  );
}
