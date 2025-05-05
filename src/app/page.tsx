
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from "@/components/layout/header";
import { FileList } from "@/components/file-list";
import { Footer } from "@/components/layout/footer";
import type { FileSystemItem, FileItemData, FolderItemData, FileCategory } from "@/types/file";
import { isFile, isFolder, formatBytes, determineFileCategory } from "@/types/file";
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from '@/components/breadcrumb';
import { CreateFolderModal } from '@/components/modals/create-folder-modal';
import { RenameItemModal } from '@/components/modals/rename-item-modal';
import { ShareItemModal } from '@/components/modals/share-item-modal';
import { ImagePreviewModal } from '@/components/modals/image-preview-modal';
import { CodePreviewModal } from '@/components/modals/code-preview-modal';

const LOCAL_STORAGE_KEY = 'fileflow-items';

export default function Home() {
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null represents the root
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FileCategory | 'folder' | 'all'>('all');
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileSystemItem | null>(null);
  const [itemToShare, setItemToShare] = useState<FileSystemItem | null>(null);
  const [itemToPreview, setItemToPreview] = useState<FileItemData | null>(null); // For image/code preview
  const { toast } = useToast();

  // --- Local Storage Persistence ---
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedItems) {
        try {
          const parsedItems: FileSystemItem[] = JSON.parse(storedItems);
          // Basic validation could be added here
          setItems(parsedItems);
        } catch (error) {
          console.error("Erro ao carregar itens do localStorage:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isMounted]);

  // --- Upload Logic ---
  const handleUpload = useCallback((files: FileList | File[]) => {
    const filesArray = Array.from(files);
    if (!filesArray.length) return;

    filesArray.forEach(file => {
      const tempId = `uploading-${Date.now()}-${Math.random()}`;
      const reader = new FileReader();

      // Read file content as Data URL for preview/storage simulation
      reader.onload = (event) => {
          const dataUrl = event.target?.result as string;

          const newItem: FileItemData = {
            id: tempId,
            name: file.name,
            parentId: currentFolderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: 'file',
            url: dataUrl, // Use Data URL directly
            size: file.size,
            fileCategory: determineFileCategory(file),
            uploadProgress: 0, // Reset progress
            isUploading: true,
          };

          setItems(prevItems => [...prevItems, newItem]);

          // --- Mock Upload Progress (no longer needs blob URL) ---
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20; // Simulate progress increase
            if (progress >= 100) {
              clearInterval(interval);
              setItems(prevItems => prevItems.map(item =>
                item.id === tempId ? {
                  ...item,
                  id: String(Date.now() + Math.random()), // Assign final ID
                  uploadProgress: 100,
                  isUploading: false,
                  // URL remains the Data URL
                } : item
              ));
              toast({
                title: "Upload Concluído",
                description: `Arquivo "${file.name}" adicionado.`,
              });
            } else {
              setItems(prevItems => prevItems.map(item =>
                item.id === tempId ? { ...item, uploadProgress: Math.min(progress, 100) } : item
              ));
            }
          }, 100 + Math.random() * 200); // Simulate varying upload speed
           // --- End Mock Upload Progress ---
      };

       reader.onerror = (error) => {
         console.error("Erro ao ler arquivo:", error);
         toast({
           title: "Erro de Upload",
           description: `Não foi possível ler o arquivo "${file.name}".`,
           variant: "destructive",
         });
          // Remove the temporary item if reading fails
          setItems(prevItems => prevItems.filter(item => item.id !== tempId));
       };

      reader.readAsDataURL(file); // Read the file
    });
  }, [currentFolderId, toast]);


  // --- Deletion Logic ---
  const handleDelete = useCallback((itemId: string) => {
    const itemToDelete = items.find(item => item.id === itemId);
    if (!itemToDelete) {
        console.warn("Item not found for deletion:", itemId);
        return;
    }

    let itemsToRemoveIds = new Set<string>([itemId]);

    // If it's a folder, find all descendant items recursively
    if (isFolder(itemToDelete)) {
      const findDescendants = (folderId: string) => {
        const children = items.filter(item => item.parentId === folderId);
        children.forEach(child => {
          itemsToRemoveIds.add(child.id);
          if (isFolder(child)) {
            findDescendants(child.id);
          }
        });
      };
      findDescendants(itemId);
    }

     // Update state by filtering out the items to be removed
    setItems(prevItems => prevItems.filter(item => !itemsToRemoveIds.has(item.id)));

    toast({
      title: "Exclusão Concluída",
      description: `"${itemToDelete.name}" ${isFolder(itemToDelete) ? 'e seu conteúdo foram excluídos' : 'foi excluído'}.`,
      variant: "default",
    });
  }, [items, toast]);


  // --- Folder Creation Logic ---
  const handleCreateFolder = useCallback((folderName: string) => {
    if (!folderName.trim()) {
      toast({ title: "Erro", description: "O nome da pasta não pode estar vazio.", variant: "destructive" });
      return;
    }
    const newFolder: FolderItemData = {
      id: String(Date.now() + Math.random()),
      name: folderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'folder',
    };
    setItems(prevItems => [...prevItems, newFolder]);
    setIsCreateFolderModalOpen(false);
    toast({ title: "Sucesso", description: `Pasta "${newFolder.name}" criada.` });
  }, [currentFolderId, toast]);

   // --- Renaming Logic ---
   const handleRename = useCallback((itemId: string, newName: string) => {
    if (!newName.trim()) {
        toast({ title: "Erro", description: "O nome não pode estar vazio.", variant: "destructive" });
        return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, name: newName.trim(), updatedAt: new Date().toISOString() } : item
      )
    );
    setItemToRename(null); // Close modal
    toast({ title: "Sucesso", description: `Item renomeado para "${newName.trim()}".` });
  }, [toast]);

  // --- Sharing Logic (Mock) ---
  const handleShare = useCallback((item: FileSystemItem) => {
    // In a real app, generate a shareable link/token and potentially set permissions
    const shareLink = `${window.location.origin}/share/${item.id}`; // Example link
    navigator.clipboard.writeText(shareLink).then(() => {
      toast({ title: "Link Copiado!", description: `Link para "${item.name}" copiado para a área de transferência.` });
    }).catch(err => {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
      console.error("Failed to copy link:", err);
    });
    setItemToShare(null); // Close modal
  }, [toast]);

  // --- Preview Logic ---
   const handlePreview = useCallback(async (item: FileSystemItem) => {
    if (isFile(item)) {
      if (item.isUploading) {
        toast({ title: "Aguarde", description: "O upload ainda está em andamento."});
        return;
      }
      if (!item.url) {
        toast({ title: "Erro", description: "URL do arquivo não encontrada.", variant: "destructive" });
        return;
      }

      if (item.fileCategory === 'image') {
        setItemToPreview(item); // Opens ImagePreviewModal
      } else if (item.fileCategory === 'code' || item.fileCategory === 'document' || item.fileCategory === 'pdf') {
         // Data URLs are handled differently
         if (item.url.startsWith('data:')) {
           const mimeType = item.url.substring(item.url.indexOf(':') + 1, item.url.indexOf(';'));
           const base64Data = item.url.substring(item.url.indexOf(',') + 1);

           try {
             const byteCharacters = atob(base64Data);
             const byteNumbers = new Array(byteCharacters.length);
             for (let i = 0; i < byteCharacters.length; i++) {
               byteNumbers[i] = byteCharacters.charCodeAt(i);
             }
             const byteArray = new Uint8Array(byteNumbers);
             const blob = new Blob([byteArray], { type: mimeType });

             if (item.fileCategory === 'pdf') {
               const pdfUrl = URL.createObjectURL(blob);
               window.open(pdfUrl, '_blank');
               // Consider revoking the object URL later if needed
               // setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
               return; // Exit early for PDF
             } else {
               // For code/document, read blob as text
               const text = await blob.text();
               setItemToPreview({ ...item, previewContent: text } as FileItemData & { previewContent: string }); // Opens CodePreviewModal
             }

           } catch (error) {
             console.error("Error processing data URL content:", error);
             toast({ title: "Erro de Visualização", description: "Não foi possível carregar o conteúdo do arquivo.", variant: "destructive"});
             // If direct processing fails, maybe still try opening the data URL directly
             window.open(item.url, '_blank');
           }

         } else {
           // If it's not a data URL (e.g., a direct link - unlikely with current setup), try opening directly
           window.open(item.url, '_blank');
         }
      } else {
        // For other types (audio, video, other), attempt to open/download
        window.open(item.url, '_blank');
      }
    } else {
      // Handle folder click (navigation)
      handleFolderClick(item.id);
    }
  }, [toast]); // Added handleFolderClick dependency implicitly

  // --- Navigation Logic ---
  const handleFolderClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery(''); // Reset search when changing folders
    setFilterType('all'); // Reset filter
  };

  const navigateToRoot = () => {
    handleFolderClick(null); // Navigate to root
  };


  // --- Drag and Drop Logic ---
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the leave target is outside the drop zone
    if (event.relatedTarget && !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    } else if (!event.relatedTarget) {
        // Handle case where drag leaves the window
        setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
      event.dataTransfer.clearData();
    }
  }, [handleUpload]);


  // --- Filtering and Searching Logic ---
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.parentId === currentFolderId) // Filter by current folder
      .filter(item => { // Filter by search query (name)
        if (!searchQuery) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter(item => { // Filter by type
        if (filterType === 'all') return true;
        if (filterType === 'folder') return isFolder(item);
        return isFile(item) && item.fileCategory === filterType;
      })
      // Sort: Folders first, then by name alphabetically
      .sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [items, currentFolderId, searchQuery, filterType]);


  // --- Breadcrumb Data ---
  const breadcrumbItems = useMemo(() => {
    const path: { id: string | null; name: string }[] = [{ id: null, name: 'Início' }];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = items.find(item => item.id === currentId && isFolder(item));
      if (folder) {
        path.push({ id: folder.id, name: folder.name });
        currentId = folder.parentId;
      } else {
        break; // Should not happen in consistent data
      }
    }
    return path.reverse();
  }, [items, currentFolderId]);

  return (
    <div
      className={`flex flex-col min-h-screen bg-background transition-colors duration-200 ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header with Upload, Search, Filter, Create Folder */}
      <Header
        onUpload={(file) => handleUpload([file])}
        onSearch={setSearchQuery}
        currentSearch={searchQuery}
        onFilterChange={setFilterType}
        currentFilter={filterType}
        onCreateFolder={() => setIsCreateFolderModalOpen(true)}
        onLogoClick={navigateToRoot} // Pass navigateToRoot handler
      />

      <main className="flex-grow p-4 container mx-auto space-y-4">
        {isDragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <p className="text-white text-2xl font-semibold">Arraste arquivos aqui para enviar</p>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} onNavigate={handleFolderClick} />


        {/* File List */}
        {isMounted ? (
          <FileList
            items={filteredItems}
            onDelete={handleDelete}
            onFolderClick={handleFolderClick}
            onRename={setItemToRename} // Pass setter to open rename modal
            onShare={setItemToShare}     // Pass setter to open share modal
            onPreview={handlePreview}   // Pass preview handler
            isSearching={searchQuery.length > 0}
            isFiltering={filterType !== 'all'}
          />
        ) : (
          <div className="text-center text-muted-foreground mt-10">Carregando...</div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />
       {itemToRename && (
        <RenameItemModal
            item={itemToRename}
            isOpen={!!itemToRename}
            onClose={() => setItemToRename(null)}
            onRename={handleRename}
        />
      )}
      {itemToShare && (
          <ShareItemModal
              item={itemToShare}
              isOpen={!!itemToShare}
              onClose={() => setItemToShare(null)}
              onConfirmShare={handleShare} // Use the simplified mock share handler
          />
       )}
       {itemToPreview && isFile(itemToPreview) && itemToPreview.fileCategory === 'image' && (
          <ImagePreviewModal
            isOpen={!!itemToPreview}
            onClose={() => setItemToPreview(null)}
            imageUrl={itemToPreview.url}
            altText={itemToPreview.name}
          />
       )}
       {itemToPreview && isFile(itemToPreview) && (itemToPreview.fileCategory === 'code' || itemToPreview.fileCategory === 'document') && typeof itemToPreview.previewContent === 'string' && (
            <CodePreviewModal
                isOpen={!!itemToPreview}
                onClose={() => setItemToPreview(null)}
                fileName={itemToPreview.name}
                code={itemToPreview.previewContent} // Use the fetched content
                language={itemToPreview.fileCategory === 'code' ? (itemToPreview.name.split('.').pop() || 'plaintext') : 'plaintext'} // Basic language detection
            />
        )}


    </div>
  );
}
