
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

// Helper function to convert Data URL to Blob
const dataUrlToBlob = (dataUrl: string): Blob => {
    if (!dataUrl.startsWith('data:')) {
        throw new Error('Invalid Data URL');
    }
    const parts = dataUrl.split(';base64,');
    if (parts.length !== 2) {
        throw new Error('Invalid Data URL format');
    }
    const contentType = parts[0].split(':')[1];
    const byteCharacters = atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
};


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
  // Ensure itemToPreview state can hold the extra previewContent property
  const [itemToPreview, setItemToPreview] = useState<(FileItemData & { previewContent?: string }) | null>(null);
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

    // --- Navigation Logic ---
    const handleFolderClick = useCallback((folderId: string | null) => {
        setCurrentFolderId(folderId);
        setSearchQuery(''); // Reset search when changing folders
        setFilterType('all'); // Reset filter
      }, []); // No dependencies needed here as it only sets state

      const navigateToRoot = useCallback(() => {
        handleFolderClick(null); // Navigate to root
      }, [handleFolderClick]); // Depends on handleFolderClick


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
            url: dataUrl, // Store the Data URL
            size: file.size,
            fileCategory: determineFileCategory(file),
            uploadProgress: 0, // Reset progress
            isUploading: true,
          };

          setItems(prevItems => [...prevItems, newItem]);

          // --- Mock Upload Progress ---
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
        console.warn("Item não encontrado para exclusão:", itemId);
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
      console.log("Tentando visualizar:", item); // Debug log 1
      if (isFile(item)) {
          if (item.isUploading) {
              toast({ title: "Aguarde", description: "O upload ainda está em andamento." });
              return;
          }
           // Ensure the URL is a data URL before proceeding
           if (!item.url || !item.url.startsWith('data:')) {
              toast({ title: "Erro", description: "URL do arquivo inválida ou não encontrada para visualização.", variant: "destructive" });
              console.error("URL inválida ou ausente:", item.url); // Debug log
              return;
           }

          try {
              if (item.fileCategory === 'image') {
                  console.log("Definindo visualização de imagem para:", item.name); // Debug log
                  setItemToPreview(item); // Opens ImagePreviewModal with data URL
              } else if (['code', 'document', 'pdf'].includes(item.fileCategory)) {
                  const blob = dataUrlToBlob(item.url); // Convert data URL to Blob

                  if (item.fileCategory === 'pdf') {
                      const pdfUrl = URL.createObjectURL(blob); // Create temporary blob URL
                      const pdfWindow = window.open(pdfUrl, '_blank');
                      // Clean up the blob URL after the window is closed or after a timeout
                       if (pdfWindow) {
                           pdfWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(pdfUrl));
                       } else {
                           // Fallback cleanup if window opening fails
                           setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
                       }
                  } else { // Code or Document
                      const text = await blob.text();
                      console.log("Definindo visualização de texto para:", item.name); // Debug log
                      setItemToPreview({ ...item, previewContent: text }); // Add content and open CodePreviewModal
                  }
              } else { // Audio, Video, Other - attempt direct open/download using the data URL
                  window.open(item.url, '_blank');
              }
          } catch (error) {
              console.error("Erro ao processar visualização:", error);
              toast({
                  title: "Erro de Visualização",
                  description: "Não foi possível carregar o conteúdo do arquivo.",
                  variant: "destructive"
              });
              // Fallback: Try opening the data URL directly, though it might not work well for all types
              try {
                window.open(item.url, '_blank');
              } catch (openError) {
                console.error("Erro ao abrir URL de dados diretamente:", openError);
              }
          }
      } else if (isFolder(item)) {
          // Handle folder click (navigation)
          handleFolderClick(item.id);
      } else {
          console.warn("Tentativa de visualização em tipo de item desconhecido:", item); // Debug log
      }
  }, [toast, handleFolderClick]); // Added handleFolderClick dependency


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

  // Debug log to check itemToPreview state changes
   useEffect(() => {
     console.log("Estado itemToPreview atualizado:", itemToPreview);
   }, [itemToPreview]);


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

       {/* Conditional rendering for Image Preview Modal */}
        {itemToPreview && isFile(itemToPreview) && itemToPreview.fileCategory === 'image' && (
            <ImagePreviewModal
                isOpen={!!itemToPreview}
                onClose={() => setItemToPreview(null)}
                imageUrl={itemToPreview.url} // Pass the data URL
                altText={itemToPreview.name}
            />
        )}

        {/* Conditional rendering for Code/Document Preview Modal */}
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

