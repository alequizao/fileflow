
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from "@/components/layout/header";
import { FileList } from "@/components/file-list";
import { Footer } from "@/components/layout/footer";
import type { FileSystemItem, FileItemData, FolderItemData, FileCategory } from "@/types/file";
import { isFile, isFolder, formatBytes, determineFileCategory, dataUrlToBlob, readFileContent } from "@/types/file";
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from '@/components/breadcrumb';
import { CreateFolderModal } from '@/components/modals/create-folder-modal';
import { RenameItemModal } from '@/components/modals/rename-item-modal';
import { ShareItemModal } from '@/components/modals/share-item-modal';
import { ImagePreviewModal } from '@/components/modals/image-preview-modal';
import { CodePreviewModal } from '@/components/modals/code-preview-modal';
import { MarkdownPreviewModal } from '@/components/modals/markdown-preview-modal';
import { ConfirmDialog } from '@/components/modals/confirm-dialog';
import { ThemeToggle } from '@/components/theme-toggle';


// NOTE: localStorage has been removed. File state is now temporary per session.
// A true shared drive requires a backend database/storage solution.
const TRASH_FOLDER_ID = '__trash__'; // Special ID for the trash folder

export default function Home() {
  // Initialize state directly, removed localStorage loading
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null represents the root
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FileCategory | 'folder' | 'all' | 'favorites'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetFolderId, setDragTargetFolderId] = useState<string | null>(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileSystemItem | null>(null);
  const [itemToShare, setItemToShare] = useState<FileSystemItem | null>(null);
  const [itemToPreview, setItemToPreview] = useState<FileItemData | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; description: string; onConfirm: () => void }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });
  const [showTrash, setShowTrash] = useState(false);

  const { toast } = useToast();

  // --- Removed Local Storage Persistence ---
  // useEffect for loading from localStorage removed.
  // useEffect for saving to localStorage removed.

  // --- Navigation Logic ---
  const handleFolderClick = useCallback((folderId: string | null) => {
      if (folderId === TRASH_FOLDER_ID) {
        setShowTrash(true);
      } else {
        setShowTrash(false);
        setCurrentFolderId(folderId);
      }
      setSearchQuery('');
      setFilterType('all');
      setSelectedItems(new Set());
    }, []);

    const navigateToRoot = useCallback(() => {
      handleFolderClick(null);
    }, [handleFolderClick]);


  // --- Upload Logic ---
  const processFileUpload = async (file: File, targetFolderId: string | null) => {
      const tempId = `uploading-${Date.now()}-${Math.random()}`;
      const newItemBase: Omit<FileItemData, 'content' | 'id'> = {
          name: file.name,
          parentId: targetFolderId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: 'file',
          size: file.size,
          mimeType: file.type,
          fileCategory: determineFileCategory(file),
          uploadProgress: 0,
          isUploading: true,
      };

       // Add temporary item for visual feedback
       setItems(prevItems => [...prevItems, { ...newItemBase, id: tempId }]);

       // Simulate progress update (replace with actual progress logic if available)
      const updateProgress = (progress: number) => {
           setItems(prevItems => prevItems.map(item =>
               item.id === tempId ? { ...item, uploadProgress: Math.min(progress, 100) } : item
           ));
       };

      let currentProgress = 0;
      const progressInterval = setInterval(() => {
           currentProgress += Math.random() * 15 + 5; // Simulate progress increase
           updateProgress(currentProgress);
           if (currentProgress >= 100) {
               clearInterval(progressInterval);
           }
      }, 150); // Simulate upload speed


      try {
        const content = await readFileContent(file); // Read content (Data URL or text)

        clearInterval(progressInterval); // Stop simulation if reading finishes early

        const finalId = String(Date.now() + Math.random());
        const finalItem: FileItemData = {
            ...newItemBase,
            id: finalId,
            content: content, // Store the content
            uploadProgress: 100,
            isUploading: false,
        };

        // Replace temp item with final item
        setItems(prevItems => prevItems.map(item =>
            item.id === tempId ? finalItem : item
        ));

         toast({
           title: "Upload Concluído",
           description: `Arquivo "${file.name}" adicionado${targetFolderId ? ` a ${items.find(i => i.id === targetFolderId)?.name}` : ''}.`,
         });

      } catch (error) {
           clearInterval(progressInterval); // Stop simulation on error
           console.error("Erro ao processar upload:", error);
           const errorMessage = error instanceof Error ? error.message : "Falha no upload.";
           setItems(prevItems => prevItems.map(item =>
               item.id === tempId ? { ...item, isUploading: false, error: errorMessage, uploadProgress: undefined } : item
           ));
           toast({
             title: "Erro de Upload",
             description: `Não foi possível fazer upload de "${file.name}": ${errorMessage}`,
             variant: "destructive",
           });
      }
  };

  const handleUpload = useCallback((files: FileList | File[], targetFolderId: string | null = currentFolderId) => {
    const filesArray = Array.from(files);
    if (!filesArray.length) return;

    filesArray.forEach(file => {
        const existingItem = items.find(item => item.parentId === targetFolderId && item.name === file.name && isFile(item));

        if (existingItem && !showTrash) {
             setConfirmDialog({
                isOpen: true,
                title: "Substituir Arquivo?",
                description: `Um arquivo chamado "${file.name}" já existe nesta pasta. Deseja substituí-lo?`,
                onConfirm: () => {
                    setItems(prev => prev.filter(i => i.id !== existingItem.id));
                    processFileUpload(file, targetFolderId);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            });
        } else {
            processFileUpload(file, targetFolderId);
        }
    });
  }, [currentFolderId, items, toast, confirmDialog, showTrash]);


   // --- Item Selection Logic ---
   const handleItemSelectToggle = (itemId: string, isShiftKey: boolean, isCtrlKey: boolean) => {
       setSelectedItems(prevSelected => {
           const newSelected = new Set(prevSelected);
           if (isCtrlKey || isShiftKey) {
               if (newSelected.has(itemId)) {
                   newSelected.delete(itemId);
               } else {
                   newSelected.add(itemId);
               }
           } else {
               if (newSelected.has(itemId) && newSelected.size === 1) {
                   newSelected.clear();
               } else {
                   newSelected.clear();
                   newSelected.add(itemId);
               }
           }
           return newSelected;
       });
   };

    // --- Deletion Logic (Move to Trash) ---
    const moveItemsToTrash = (itemIds: Set<string>) => {
        const itemsToMove = items.filter(item => itemIds.has(item.id));
        if (!itemsToMove.length) return;

        const getAllDescendantIds = (folderId: string): Set<string> => {
            const descendants = new Set<string>();
            const children = items.filter(i => i.parentId === folderId);
            children.forEach(child => {
                descendants.add(child.id);
                if (isFolder(child)) {
                    getAllDescendantIds(child.id).forEach(id => descendants.add(id));
                }
            });
            return descendants;
        };

        const allItemsToMoveIds = new Set<string>(itemIds);
        itemIds.forEach(id => {
            const item = items.find(i => i.id === id);
            if (item && isFolder(item)) {
                getAllDescendantIds(id).forEach(descId => allItemsToMoveIds.add(descId));
            }
        });


        const updatedItems = items.map(item => {
            if (allItemsToMoveIds.has(item.id)) {
                 return { ...item, parentId: TRASH_FOLDER_ID, updatedAt: new Date().toISOString() };
            }
            return item;
        });

        setItems(updatedItems);
        setSelectedItems(new Set());

        toast({
            title: "Itens Movidos para a Lixeira",
            description: `${itemIds.size} item(ns) movido(s) para a lixeira.`,
        });
    };

    const handleMoveToTrash = (itemId: string) => {
        moveItemsToTrash(new Set([itemId]));
    };

    const handleBatchMoveToTrash = () => {
         if (selectedItems.size === 0) {
             toast({ title: "Nenhum Item Selecionado", description: "Selecione um ou mais itens para mover para a lixeira.", variant: "destructive" });
             return;
         }
          setConfirmDialog({
             isOpen: true,
             title: `Mover ${selectedItems.size} Itens para a Lixeira?`,
             description: `Tem certeza que deseja mover os itens selecionados para a lixeira?`,
             onConfirm: () => {
                 moveItemsToTrash(selectedItems);
                 setConfirmDialog({ ...confirmDialog, isOpen: false });
             }
         });
     };

    // --- Permanent Deletion Logic (From Trash) ---
    const handleDeletePermanently = (itemId: string) => {
        const itemToDelete = items.find(item => item.id === itemId);
        if (!itemToDelete || itemToDelete.parentId !== TRASH_FOLDER_ID) {
            console.warn("Item não encontrado na lixeira para exclusão permanente:", itemId);
            return;
        }

         setConfirmDialog({
            isOpen: true,
            title: "Excluir Permanentemente?",
            description: `Tem certeza que deseja excluir "${itemToDelete.name}" permanentemente? Esta ação não pode ser desfeita.`,
            onConfirm: () => {
                 let itemsToRemoveIds = new Set<string>([itemId]);
                 if (isFolder(itemToDelete)) {
                   const findDescendantsInTrash = (folderId: string) => {
                     const children = items.filter(item => item.parentId === folderId); // Descendants are inherently moved with parent
                     children.forEach(child => {
                       itemsToRemoveIds.add(child.id);
                       if (isFolder(child)) {
                         findDescendantsInTrash(child.id);
                       }
                     });
                   };
                   findDescendantsInTrash(itemId);
                 }
                 setItems(prevItems => prevItems.filter(item => !itemsToRemoveIds.has(item.id)));
                 setSelectedItems(new Set());
                 setConfirmDialog({ ...confirmDialog, isOpen: false });
                 toast({
                   title: "Exclusão Permanente Concluída",
                   description: `"${itemToDelete.name}" ${isFolder(itemToDelete) ? 'e seu conteúdo foram excluídos permanentemente' : 'foi excluído permanentemente'}.`,
                   variant: "default",
                 });
             }
        });
    };

    // --- Restore From Trash ---
    const handleRestoreFromTrash = (itemId: string) => {
        const itemToRestore = items.find(item => item.id === itemId);
        if (!itemToRestore || itemToRestore.parentId !== TRASH_FOLDER_ID) {
            console.warn("Item não encontrado na lixeira para restauração:", itemId);
            return;
        }

         // Restore to root (parentId: null)
         const originalParentId = null;

         // TODO: Need to handle restoring descendants as well if a folder is restored.
         // This currently only restores the selected item. Need recursive logic similar to delete.

        setItems(prevItems => prevItems.map(item =>
            item.id === itemId ? { ...item, parentId: originalParentId, updatedAt: new Date().toISOString() } : item
        ));
         setSelectedItems(new Set());
        toast({
            title: "Item Restaurado",
            description: `"${itemToRestore.name}" foi restaurado da lixeira.`,
        });
    };


  // --- Folder Creation Logic ---
  const handleCreateFolder = useCallback((folderName: string) => {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      toast({ title: "Erro", description: "O nome da pasta não pode estar vazio.", variant: "destructive" });
      return;
    }
    if (/[\\/:*?"<>|]/.test(trimmedName)) {
         toast({ title: "Nome Inválido", description: "O nome da pasta contém caracteres inválidos.", variant: "destructive" });
         return;
    }
    const exists = items.some(item => item.parentId === currentFolderId && item.name === trimmedName && isFolder(item));
    if (exists) {
        toast({ title: "Pasta Já Existe", description: `Uma pasta chamada "${trimmedName}" já existe aqui.`, variant: "destructive" });
        return;
    }


    const newFolder: FolderItemData = {
      id: String(Date.now() + Math.random()),
      name: trimmedName,
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'folder',
    };
    setItems(prevItems => [...prevItems, newFolder]);
    setIsCreateFolderModalOpen(false);
    toast({ title: "Sucesso", description: `Pasta "${newFolder.name}" criada.` });
  }, [currentFolderId, toast, items]);

   // --- Renaming Logic ---
   const handleRename = useCallback((itemId: string, newName: string) => {
    const trimmedName = newName.trim();
    const itemToRename = items.find(item => item.id === itemId);

    if (!itemToRename) return;

    if (!trimmedName) {
        toast({ title: "Erro", description: "O nome não pode estar vazio.", variant: "destructive" });
        return;
    }
     const invalidCharRegex = isFile(itemToRename) ? /[\\/:*?"<>|]/ : /[\\/:*?"<>|.]/;
     if (invalidCharRegex.test(trimmedName)) {
          toast({ title: "Nome Inválido", description: `O nome "${trimmedName}" contém caracteres inválidos ${isFile(itemToRename) ? '' : '(incluindo ".")'}.`, variant: "destructive" });
          return;
     }

     const originalExtension = isFile(itemToRename) && itemToRename.name.includes('.') ? itemToRename.name.substring(itemToRename.name.lastIndexOf('.')) : '';
     const finalName = isFile(itemToRename) ? trimmedName + originalExtension : trimmedName;


     const exists = items.some(item =>
         item.id !== itemId &&
         item.parentId === itemToRename.parentId &&
         item.name.toLowerCase() === finalName.toLowerCase() && // Case-insensitive check
         item.type === itemToRename.type
     );
     if (exists) {
         toast({ title: "Nome Já Existe", description: `Um ${itemToRename.type === 'folder' ? 'pasta' : 'arquivo'} chamado "${finalName}" já existe aqui.`, variant: "destructive" });
         return;
     }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, name: finalName, updatedAt: new Date().toISOString() } : item
      )
    );
    setItemToRename(null);
    toast({ title: "Sucesso", description: `Item renomeado para "${finalName}".` });
  }, [toast, items]);

  // --- Sharing Logic (Mock) ---
  const handleShare = useCallback((item: FileSystemItem) => {
    // Mock implementation - copies a fake link
    const shareLink = `${window.location.origin}/share/${item.id}`; // Example link
    navigator.clipboard.writeText(shareLink).then(() => {
      toast({ title: "Link Copiado!", description: `Link simulado para "${item.name}" copiado.` });
    }).catch(err => {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
      console.error("Failed to copy link:", err);
    });
    setItemToShare(null); // Close modal after confirming
  }, [toast]);

    // --- Toggle Favorite Logic ---
    const handleToggleFavorite = useCallback((itemId: string) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, isFavorite: !item.isFavorite, updatedAt: new Date().toISOString() } : item
            )
        );
         const item = items.find(i => i.id === itemId);
         if (item) {
             toast({
                 title: item.isFavorite ? "Removido dos Favoritos" : "Adicionado aos Favoritos",
                 description: `"${item.name}" foi ${item.isFavorite ? 'removido dos' : 'adicionado aos'} favoritos.`,
             });
         }
    }, [items, toast]);

  // --- Preview Logic ---
  const handlePreview = useCallback((item: FileSystemItem) => {
    if (isFile(item)) {
      if (item.isUploading) {
        toast({ title: "Aguarde", description: "O upload ainda está em andamento." });
        return;
      }

      const currentItemData = items.find(i => i.id === item.id && isFile(i)) as FileItemData | undefined;

      if (!currentItemData || typeof currentItemData.content === 'undefined') {
        toast({ title: "Conteúdo Indisponível", description: "O conteúdo do arquivo não está carregado para visualização.", variant: "destructive" });
        return;
      }

      const content = currentItemData.content;
      const mimeType = currentItemData.mimeType || 'application/octet-stream';

      try {
          if (item.fileCategory === 'image' && typeof content === 'string' && content.startsWith('data:image')) {
              setItemToPreview({ ...currentItemData });
          } else if (item.fileCategory === 'code' || (item.fileCategory === 'document' && mimeType.startsWith('text/'))) {
              if (typeof content === 'string') {
                   if (content.startsWith('data:')) {
                       try {
                           const blob = dataUrlToBlob(content);
                           blob.text().then(text => {
                               setItemToPreview({ ...currentItemData, content: text });
                           }).catch(decodeError => {
                                throw new Error(`Erro ao decodificar Data URL para texto: ${decodeError}`);
                           });
                       } catch (blobError) {
                            throw new Error(`Erro ao criar blob a partir de Data URL: ${blobError}`);
                       }
                   } else {
                       setItemToPreview({ ...currentItemData });
                   }
              } else {
                   throw new Error("Conteúdo do arquivo de texto inválido.");
              }
          } else if (item.fileCategory === 'pdf' && typeof content === 'string' && content.startsWith('data:application/pdf')) {
               const blob = dataUrlToBlob(content);
               const pdfUrl = URL.createObjectURL(blob);
               // Open in new tab and revoke URL after a delay or on close
               const pdfWindow = window.open(pdfUrl, '_blank');
               if (pdfWindow) {
                    pdfWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(pdfUrl));
               }
               // Fallback cleanup if window fails to open or close event doesn't fire
               setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
          } else if (item.fileCategory === 'document' && currentItemData.name.toLowerCase().endsWith('.md') && typeof content === 'string') {
                if (content.startsWith('data:')) {
                     const blob = dataUrlToBlob(content);
                     blob.text().then(text => {
                        setItemToPreview({ ...currentItemData, content: text });
                     }).catch(err => { throw new Error(`Erro ao decodificar Markdown: ${err}`) });
                } else {
                    setItemToPreview({ ...currentItemData });
                }
          } else if (typeof content === 'string' && content.startsWith('data:')) {
            // Attempt to open other Data URLs directly (e.g., audio, video)
             try {
                 const blob = dataUrlToBlob(content);
                 const blobUrl = URL.createObjectURL(blob);
                 const newWindow = window.open(blobUrl, '_blank');
                 if (newWindow) {
                     newWindow.addEventListener('beforeunload', () => URL.revokeObjectURL(blobUrl));
                 }
                 setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); // Fallback cleanup
             } catch (blobError) {
                  console.error("Erro ao abrir Data URL:", blobError);
                  toast({ title: "Erro", description: `Não foi possível abrir o arquivo "${item.name}".`, variant: "destructive"});
             }
          } else {
             toast({ title: "Visualização Não Suportada", description: `A visualização direta para "${item.name}" (${item.fileCategory}) não é suportada.`, variant: "default" });
          }
      } catch (error) {
          console.error("Erro ao processar visualização:", error);
          toast({
              title: "Erro de Visualização",
              description: `Não foi possível carregar o conteúdo do arquivo "${item.name}". ${error instanceof Error ? error.message : ''}`,
              variant: "destructive"
          });
      }
    } else if (isFolder(item)) {
        handleFolderClick(item.id);
    } else {
        console.warn("Tentativa de visualização em tipo de item desconhecido:", item);
    }
}, [toast, handleFolderClick, items]);


    // --- Context Menu ---
    const handleContextMenu = (event: React.MouseEvent, item: FileSystemItem) => {
        event.preventDefault();
        console.log("Context menu triggered for:", item.name);
        // Placeholder for actual context menu implementation
        // Consider using a library like Radix UI's DropdownMenu for this
    };


  // --- Drag and Drop Logic ---
   const handleDragOver = useCallback((event: React.DragEvent) => {
       event.preventDefault();
       event.stopPropagation();
       if (!isDragging) setIsDragging(true);

       const targetElement = event.target as HTMLElement;
       const folderElement = targetElement.closest('[data-folder-id]') as HTMLElement | null;
       const folderId = folderElement?.dataset.folderId || null;

        if (folderId !== dragTargetFolderId) {
             setDragTargetFolderId(folderId);
        }

   }, [isDragging, dragTargetFolderId]);


  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = (event.currentTarget as HTMLElement);
    if (!dropZone.contains(event.relatedTarget as Node)) {
       setIsDragging(false);
       setDragTargetFolderId(null);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    const targetFolderElement = (event.target as HTMLElement).closest('[data-folder-id]') as HTMLElement | null;
    const dropTargetFolderId = targetFolderElement?.dataset.folderId || currentFolderId;


    if (files && files.length > 0) {
      handleUpload(files, dropTargetFolderId);
      event.dataTransfer.clearData();
    }
      setDragTargetFolderId(null);
  }, [handleUpload, currentFolderId]);


  // --- Filtering and Searching Logic ---
  const filteredItems = useMemo(() => {
    let displayItems = items;

     let parentIdToShow: string | null;
     if (showTrash) {
         parentIdToShow = TRASH_FOLDER_ID;
     } else {
         parentIdToShow = currentFolderId;
     }


    return displayItems
      .filter(item => item.parentId === parentIdToShow)
      .filter(item => {
        if (!searchQuery) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter(item => {
        if (filterType === 'all') return true;
        if (filterType === 'favorites') return !!item.isFavorite;
        if (filterType === 'folder') return isFolder(item);
        return isFile(item) && item.fileCategory === filterType;
      })
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        if (isFolder(a) && isFile(b)) return -1;
        if (isFile(a) && isFolder(b)) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [items, currentFolderId, searchQuery, filterType, showTrash]);


  // --- Breadcrumb Data ---
  const breadcrumbItems = useMemo(() => {
      if (showTrash) {
         return [{ id: null, name: 'Início' }, { id: TRASH_FOLDER_ID, name: 'Lixeira' }];
     }

    const path: { id: string | null; name: string }[] = [{ id: null, name: 'Início' }];
    let currentId = currentFolderId;
    const checkedIds = new Set<string | null>();

    while (currentId && !checkedIds.has(currentId)) {
        checkedIds.add(currentId);
        const folder = items.find(item => item.id === currentId && isFolder(item));
        if (folder) {
             if (folder.parentId === TRASH_FOLDER_ID && !showTrash) break;

            path.push({ id: folder.id, name: folder.name });
            currentId = folder.parentId;
        } else {
            // Folder not found, likely an invalid state, reset to root
            console.warn(`Breadcrumb couldn't find folder with ID: ${currentId}. Resetting to root.`);
            handleFolderClick(null); // Reset navigation
            return [{ id: null, name: 'Início' }]; // Return only root
        }
         if (checkedIds.size > items.length + 5) { // Safety break increased slightly
             console.error("Breadcrumb path too deep or contains cycle. Resetting to root.");
             handleFolderClick(null); // Reset navigation
             return [{ id: null, name: 'Início' }]; // Return only root
         }
    }
     const currentFolder = items.find(item => item.id === currentFolderId);
     if (currentFolder?.parentId === TRASH_FOLDER_ID && !showTrash) {
         return [{ id: null, name: 'Início' }, { id: TRASH_FOLDER_ID, name: 'Lixeira' }, { id: currentFolderId, name: currentFolder.name }];
     }


    return path.reverse();
  }, [items, currentFolderId, showTrash, handleFolderClick]);


  // --- Close Modals on Escape Key ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCreateFolderModalOpen) setIsCreateFolderModalOpen(false);
        if (itemToRename) setItemToRename(null);
        if (itemToShare) setItemToShare(null);
        if (itemToPreview) setItemToPreview(null);
        if (confirmDialog.isOpen) setConfirmDialog({ ...confirmDialog, isOpen: false });
        if (selectedItems.size > 0) setSelectedItems(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateFolderModalOpen, itemToRename, itemToShare, itemToPreview, confirmDialog, selectedItems]);

   // --- Click outside to clear selection ---
   const fileListRef = useRef<HTMLDivElement>(null);
   useEffect(() => {
       const handleClickOutside = (event: MouseEvent) => {
           if (fileListRef.current && !fileListRef.current.contains(event.target as Node)) {
                const clickedOnAction = (event.target as HTMLElement).closest('button, [role="menu"], [data-radix-dropdown-menu-trigger], [data-radix-alert-dialog-trigger]');
                 if (!clickedOnAction) {
                    setSelectedItems(new Set());
                 }
           }
       };
       document.addEventListener('mousedown', handleClickOutside);
       return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);


  return (
    <div
      className={`flex flex-col min-h-screen bg-background transition-colors duration-200 ${isDragging ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header
        onUpload={(files) => handleUpload(files)}
        onSearch={setSearchQuery}
        currentSearch={searchQuery}
        onFilterChange={setFilterType}
        currentFilter={filterType}
        onCreateFolder={() => setIsCreateFolderModalOpen(true)}
        onLogoClick={navigateToRoot}
        onTrashClick={() => handleFolderClick(TRASH_FOLDER_ID)}
        selectedItemCount={selectedItems.size}
        onBatchDelete={handleBatchMoveToTrash}
        isTrashView={showTrash}
        themeToggle={<ThemeToggle />}
      />

      <main className="flex-grow p-4 container mx-auto space-y-4" ref={fileListRef}>
        {isDragging && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 rounded-lg backdrop-blur-sm">
            <p className="text-white text-2xl font-semibold drop-shadow-md">
               {dragTargetFolderId
                   ? `Soltar em "${items.find(i => i.id === dragTargetFolderId)?.name || 'pasta'}"`
                   : "Solte arquivos aqui para enviar"}
            </p>
          </div>
        )}

        <Breadcrumb items={breadcrumbItems} onNavigate={handleFolderClick} />


         {/* File List - Removed isMounted check as state initializes directly */}
         <FileList
           items={filteredItems}
           onDelete={handleMoveToTrash}
           onFolderClick={handleFolderClick}
           onRename={setItemToRename}
           onShare={setItemToShare}
           onPreview={handlePreview}
           onContextMenu={handleContextMenu}
           onToggleFavorite={handleToggleFavorite}
           isSearching={searchQuery.length > 0}
           isFiltering={filterType !== 'all'}
           selectedItems={selectedItems}
           onItemSelect={handleItemSelectToggle}
           dragTargetFolderId={dragTargetFolderId}
           isTrashView={showTrash}
           onDeletePermanently={handleDeletePermanently}
           onRestore={handleRestoreFromTrash}
         />

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
            existingNames={items.filter(i => i.parentId === itemToRename.parentId && i.id !== itemToRename.id).map(i => i.name)}
            itemType={itemToRename.type}
        />
      )}
      {itemToShare && (
          <ShareItemModal
              item={itemToShare}
              isOpen={!!itemToShare}
              onClose={() => setItemToShare(null)}
              onConfirmShare={handleShare}
          />
       )}

         {/* Image Preview */}
         {itemToPreview && isFile(itemToPreview) && itemToPreview.fileCategory === 'image' && typeof itemToPreview.content === 'string' && itemToPreview.content.startsWith('data:image') && (
             <ImagePreviewModal
                 isOpen={!!itemToPreview}
                 onClose={() => setItemToPreview(null)}
                 imageUrl={itemToPreview.content}
                 altText={itemToPreview.name}
             />
         )}

          {/* Code/Text Document Preview */}
          {itemToPreview && isFile(itemToPreview) && (itemToPreview.fileCategory === 'code' || (itemToPreview.fileCategory === 'document' && itemToPreview.mimeType?.startsWith('text/'))) && typeof itemToPreview.content === 'string' && !itemToPreview.content.startsWith('data:') && !itemToPreview.name.toLowerCase().endsWith('.md') && (
              <CodePreviewModal
                  isOpen={!!itemToPreview}
                  onClose={() => setItemToPreview(null)}
                  fileName={itemToPreview.name}
                  code={itemToPreview.content}
                  language={itemToPreview.fileCategory === 'code' ? (itemToPreview.name.split('.').pop() || 'plaintext') : 'plaintext'}
              />
          )}

           {/* Markdown Preview */}
           {itemToPreview && isFile(itemToPreview) && itemToPreview.fileCategory === 'document' && itemToPreview.name.toLowerCase().endsWith('.md') && typeof itemToPreview.content === 'string' && !itemToPreview.content.startsWith('data:') && (
               <MarkdownPreviewModal
                   isOpen={!!itemToPreview}
                   onClose={() => setItemToPreview(null)}
                   fileName={itemToPreview.name}
                   markdownContent={itemToPreview.content}
               />
           )}


        <ConfirmDialog
             isOpen={confirmDialog.isOpen}
             onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
             title={confirmDialog.title}
             description={confirmDialog.description}
             onConfirm={confirmDialog.onConfirm}
         />


    </div>
  );
}

    