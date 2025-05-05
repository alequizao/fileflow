

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
import { MarkdownPreviewModal } from '@/components/modals/markdown-preview-modal'; // Added Markdown Preview
import { ConfirmDialog } from '@/components/modals/confirm-dialog'; // Added Confirm Dialog
import { useTheme } from 'next-themes'; // Import useTheme
import { ThemeToggle } from '@/components/theme-toggle'; // Import ThemeToggle


const LOCAL_STORAGE_KEY = 'fileflow-items';
const TRASH_FOLDER_ID = '__trash__'; // Special ID for the trash folder

export default function Home() {
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null represents the root
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FileCategory | 'folder' | 'all' | 'favorites'>('all'); // Added 'favorites' filter
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetFolderId, setDragTargetFolderId] = useState<string | null>(null); // For dropping onto folders
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<FileSystemItem | null>(null);
  const [itemToShare, setItemToShare] = useState<FileSystemItem | null>(null);
  const [itemToPreview, setItemToPreview] = useState<FileItemData | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; description: string; onConfirm: () => void }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });
  const [showTrash, setShowTrash] = useState(false); // State to view trash items

  const { toast } = useToast();
  const { theme, setTheme } = useTheme(); // Get theme state and setter

  // --- Local Storage Persistence ---
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedItems) {
        try {
          const parsedItems: FileSystemItem[] = JSON.parse(storedItems);
          // Restore basic item data (without content)
          setItems(parsedItems);
        } catch (error) {
          console.error("Erro ao carregar itens do localStorage:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
       // Create the virtual trash folder if it doesn't exist (visual only, not stored directly)
       // We handle trash logic by checking parentId === TRASH_FOLDER_ID
    }
  }, []);


  // Save to localStorage whenever items change, excluding file content
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        // Filter out items in the trash before saving (unless showing trash)
        const itemsToStore = items
          .filter(item => showTrash || item.parentId !== TRASH_FOLDER_ID) // Exclude trash unless viewing it
          .map(item => {
          if (isFile(item)) {
            // Destructure to exclude content
            const { content, ...itemWithoutContent } = item;
            return itemWithoutContent;
          }
          return item;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(itemsToStore));
      } catch (error) {
         if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
            console.error("Erro: Limite de armazenamento local excedido.");
            toast({
                title: "Erro de Armazenamento",
                description: "Limite de armazenamento local excedido. Arquivos grandes podem não ser salvos corretamente.",
                variant: "destructive",
                duration: 7000,
            });
         } else {
             console.error("Erro ao salvar itens no localStorage:", error);
             toast({
                 title: "Erro Inesperado",
                 description: "Não foi possível salvar o estado atual no armazenamento local.",
                 variant: "destructive",
                  duration: 5000,
             });
         }
      }
    }
  }, [items, isMounted, showTrash, toast]); // Added showTrash dependency


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
        setSelectedItems(new Set()); // Clear selection on navigation
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

        if (existingItem && !showTrash) { // Don't check for duplicates in trash view
             setConfirmDialog({
                isOpen: true,
                title: "Substituir Arquivo?",
                description: `Um arquivo chamado "${file.name}" já existe nesta pasta. Deseja substituí-lo?`,
                onConfirm: () => {
                    // Delete existing item silently before uploading new one
                    setItems(prev => prev.filter(i => i.id !== existingItem.id));
                    processFileUpload(file, targetFolderId);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            });
        } else {
            processFileUpload(file, targetFolderId);
        }
    });
  }, [currentFolderId, items, toast, confirmDialog, showTrash]); // Added dependencies


   // --- Item Selection Logic ---
   const handleItemSelectToggle = (itemId: string, isShiftKey: boolean, isCtrlKey: boolean) => {
       setSelectedItems(prevSelected => {
           const newSelected = new Set(prevSelected);
           if (isCtrlKey || isShiftKey) { // Allow multi-select with Ctrl/Shift
               if (newSelected.has(itemId)) {
                   newSelected.delete(itemId);
               } else {
                   newSelected.add(itemId);
               }
               // TODO: Implement Shift key range selection if needed
           } else {
               // Single select (clear others if not already selected)
               if (newSelected.has(itemId) && newSelected.size === 1) {
                   newSelected.clear(); // Deselect if clicking the only selected item
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

        const updatedItems = items.map(item => {
            if (itemIds.has(item.id)) {
                // Find all descendants if it's a folder
                const descendants = new Set<string>();
                if (isFolder(item)) {
                    const findDescendants = (folderId: string) => {
                        items.forEach(child => {
                            if (child.parentId === folderId) {
                                descendants.add(child.id);
                                if (isFolder(child)) {
                                    findDescendants(child.id);
                                }
                            }
                        });
                    };
                    findDescendants(item.id);
                }
                // Move the item and its descendants (if any) to trash
                 if (descendants.size > 0) {
                     return items.map(i => {
                         if (itemIds.has(i.id) || descendants.has(i.id)) {
                             return { ...i, parentId: TRASH_FOLDER_ID, updatedAt: new Date().toISOString() };
                         }
                         return i;
                     });
                 } else {
                      return { ...item, parentId: TRASH_FOLDER_ID, updatedAt: new Date().toISOString() };
                 }

            }
            return item;
        }).flat(); // Flatten in case map returned an array

         // Remove duplicates that might arise from mapping descendants multiple times
        const uniqueItems = Array.from(new Map(updatedItems.map(item => [item.id, item])).values());


        setItems(uniqueItems);
        setSelectedItems(new Set()); // Clear selection

        toast({
            title: "Itens Movidos para a Lixeira",
            description: `${itemIds.size} item(ns) movido(s) para a lixeira.`,
            // Add an action to view trash?
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
                 // If it's a folder in trash, find all its descendants *also in trash*
                 if (isFolder(itemToDelete)) {
                   const findDescendantsInTrash = (folderId: string) => {
                     const children = items.filter(item => item.parentId === folderId && item.parentId === TRASH_FOLDER_ID); // Ensure descendant is also in trash
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
                 setSelectedItems(new Set()); // Clear selection
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

         // TODO: Need logic to determine the original parent or restore to root if parent doesn't exist
         // For now, restore to root (parentId: null)
         const originalParentId = null; // Placeholder

        setItems(prevItems => prevItems.map(item =>
            item.id === itemId ? { ...item, parentId: originalParentId, updatedAt: new Date().toISOString() } : item
        ));
         setSelectedItems(new Set()); // Clear selection
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
    // Basic validation for invalid characters (adjust regex as needed)
    if (/[\\/:*?"<>|]/.test(trimmedName)) {
         toast({ title: "Nome Inválido", description: "O nome da pasta contém caracteres inválidos.", variant: "destructive" });
         return;
    }
    // Check for existing folder with the same name in the current directory
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
     // Basic validation for invalid characters
     if (/[\\/:*?"<>|]/.test(trimmedName)) {
          toast({ title: "Nome Inválido", description: `O nome "${trimmedName}" contém caracteres inválidos.`, variant: "destructive" });
          return;
     }
     // Check for existing item with the same name in the same directory
     const exists = items.some(item =>
         item.id !== itemId &&
         item.parentId === itemToRename.parentId &&
         item.name === trimmedName &&
         item.type === itemToRename.type // Ensure type matches (file vs folder)
     );
     if (exists) {
         toast({ title: "Nome Já Existe", description: `Um ${itemToRename.type === 'folder' ? 'pasta' : 'arquivo'} chamado "${trimmedName}" já existe aqui.`, variant: "destructive" });
         return;
     }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, name: trimmedName, updatedAt: new Date().toISOString() } : item
      )
    );
    setItemToRename(null); // Close modal
    toast({ title: "Sucesso", description: `Item renomeado para "${trimmedName}".` });
  }, [toast, items]);

  // --- Sharing Logic (Mock) ---
  const handleShare = useCallback((item: FileSystemItem) => {
    const shareLink = `${window.location.origin}/share/${item.id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      toast({ title: "Link Copiado!", description: `Link para "${item.name}" copiado.` });
    }).catch(err => {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
      console.error("Failed to copy link:", err);
    });
    setItemToShare(null);
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
    console.log("Tentando visualizar:", item);
    if (isFile(item)) {
      if (item.isUploading) {
        toast({ title: "Aguarde", description: "O upload ainda está em andamento." });
        return;
      }

      // Retrieve full item data including content from state
      const currentItemData = items.find(i => i.id === item.id && isFile(i)) as FileItemData | undefined;

      if (!currentItemData || typeof currentItemData.content === 'undefined') {
        toast({ title: "Conteúdo Indisponível", description: "O conteúdo do arquivo não está carregado para visualização.", variant: "destructive" });
        console.error("Conteúdo inválido ou ausente para visualização:", item);
        return;
      }

      const content = currentItemData.content;
      const mimeType = currentItemData.mimeType || 'application/octet-stream'; // Default MIME type

      try {
          if (item.fileCategory === 'image' && typeof content === 'string' && content.startsWith('data:image')) {
              console.log("Definindo visualização de imagem para:", item.name);
              setItemToPreview({ ...currentItemData }); // Pass the full item data
          } else if (item.fileCategory === 'code' || (item.fileCategory === 'document' && mimeType.startsWith('text/'))) {
              if (typeof content === 'string') {
                   if (content.startsWith('data:')) {
                       // If content is a data URL (e.g., for large text files), decode it
                       try {
                           const blob = dataUrlToBlob(content);
                           blob.text().then(text => {
                               console.log("Definindo visualização de texto (decodificado de Data URL) para:", item.name);
                               setItemToPreview({ ...currentItemData, content: text });
                           }).catch(decodeError => {
                                throw new Error(`Erro ao decodificar Data URL para texto: ${decodeError}`);
                           });
                       } catch (blobError) {
                            throw new Error(`Erro ao criar blob a partir de Data URL: ${blobError}`);
                       }
                   } else {
                       // Content is already plain text
                       console.log("Definindo visualização de texto para:", item.name);
                       setItemToPreview({ ...currentItemData });
                   }
              } else {
                   throw new Error("Conteúdo do arquivo de texto inválido.");
              }
          } else if (item.fileCategory === 'pdf' && typeof content === 'string' && content.startsWith('data:application/pdf')) {
               const blob = dataUrlToBlob(content);
               const pdfUrl = URL.createObjectURL(blob);
               const pdfWindow = window.open(pdfUrl, '_blank');
                if (pdfWindow) {
                    const timer = setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
                    pdfWindow.addEventListener('beforeunload', () => {
                        clearTimeout(timer);
                        URL.revokeObjectURL(pdfUrl);
                    });
                } else {
                    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000); // Fallback cleanup
                }
          } else if (item.fileCategory === 'document' && currentItemData.name.toLowerCase().endsWith('.md') && typeof content === 'string') {
                // Handle Markdown preview specifically
                if (content.startsWith('data:')) {
                     // Decode if it's a data URL
                     const blob = dataUrlToBlob(content);
                     blob.text().then(text => {
                        console.log("Definindo visualização de Markdown (decodificado) para:", item.name);
                        setItemToPreview({ ...currentItemData, content: text });
                     }).catch(err => { throw new Error(`Erro ao decodificar Markdown: ${err}`) });
                } else {
                    console.log("Definindo visualização de Markdown para:", item.name);
                    setItemToPreview({ ...currentItemData }); // Use text content directly
                }

          } else if (typeof content === 'string' && content.startsWith('data:')) { // Audio, Video, Other - attempt direct open using Data URL
            window.open(content, '_blank');
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
           // Fallback: Offer download if possible
           if (isFile(currentItemData) && currentItemData.content?.startsWith('data:')) {
               // Offer download maybe?
           }
      }
    } else if (isFolder(item)) {
        handleFolderClick(item.id);
    } else {
        console.warn("Tentativa de visualização em tipo de item desconhecido:", item);
    }
}, [toast, handleFolderClick, items]);


    // --- Context Menu ---
    // Placeholder for context menu logic - integrate with a library or build custom
    const handleContextMenu = (event: React.MouseEvent, item: FileSystemItem) => {
        event.preventDefault();
        console.log("Context menu triggered for:", item.name);
        // TODO: Implement context menu display and actions here
        // Example: Set state to show a custom context menu component at event.clientX, event.clientY
    };


  // --- Drag and Drop Logic ---
   const handleDragOver = useCallback((event: React.DragEvent) => {
       event.preventDefault();
       event.stopPropagation();
       // Basic visual feedback for the entire drop zone
       if (!isDragging) setIsDragging(true);

       // Identify potential folder target
       const targetElement = event.target as HTMLElement;
       const folderElement = targetElement.closest('[data-folder-id]') as HTMLElement | null;
       const folderId = folderElement?.dataset.folderId || null;

        // Update target folder ID state only if it changes
        if (folderId !== dragTargetFolderId) {
             setDragTargetFolderId(folderId);
        }

   }, [isDragging, dragTargetFolderId]);


  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if leaving the window or the main drop area
    const dropZone = (event.currentTarget as HTMLElement);
    if (!dropZone.contains(event.relatedTarget as Node)) {
       setIsDragging(false);
       setDragTargetFolderId(null); // Reset target folder when leaving the zone
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    const targetFolderElement = (event.target as HTMLElement).closest('[data-folder-id]') as HTMLElement | null;
    const dropTargetFolderId = targetFolderElement?.dataset.folderId || currentFolderId; // Drop in current folder if not on a specific folder


    if (files && files.length > 0) {
      handleUpload(files, dropTargetFolderId); // Pass target folder ID
      event.dataTransfer.clearData();
    }
      setDragTargetFolderId(null); // Reset target folder visual state
  }, [handleUpload, currentFolderId]);


  // --- Filtering and Searching Logic ---
  const filteredItems = useMemo(() => {
    let displayItems = items;

     // Determine the parent folder ID to display (root, specific folder, or trash)
     let parentIdToShow: string | null;
     if (showTrash) {
         parentIdToShow = TRASH_FOLDER_ID;
     } else {
         parentIdToShow = currentFolderId;
     }


    return displayItems
      .filter(item => item.parentId === parentIdToShow) // Filter by current view (folder or trash)
      .filter(item => { // Filter by search query (name)
        if (!searchQuery) return true;
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter(item => { // Filter by type or favorites
        if (filterType === 'all') return true;
        if (filterType === 'favorites') return !!item.isFavorite; // Check favorite status
        if (filterType === 'folder') return isFolder(item);
        return isFile(item) && item.fileCategory === filterType;
      })
      // Sort: Folders first, then by name alphabetically (adjust as needed, e.g., favorites first)
      .sort((a, b) => {
         // Optional: Sort favorites to the top
         // if (a.isFavorite && !b.isFavorite) return -1;
         // if (!a.isFavorite && b.isFavorite) return 1;

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
    const checkedIds = new Set<string | null>(); // Prevent infinite loops

    while (currentId && !checkedIds.has(currentId)) {
        checkedIds.add(currentId);
        const folder = items.find(item => item.id === currentId && isFolder(item));
        if (folder) {
            // Check if folder is in trash - if so, stop breadcrumb build
             if (folder.parentId === TRASH_FOLDER_ID && !showTrash) break;

            path.push({ id: folder.id, name: folder.name });
            currentId = folder.parentId;
        } else {
            console.warn(`Breadcrumb couldn't find folder with ID: ${currentId}`);
            // Attempt to recover or break
            // Maybe reset to root if path is broken?
            // setCurrentFolderId(null);
            break;
        }
         if (checkedIds.size > items.length) { // Safety break for deep recursion potential
             console.error("Breadcrumb path too deep or contains cycle.");
             break;
         }
    }
     // If the loop terminated because a parent was in trash (and we are not showing trash)
     // it means the current folder is technically in trash, so show the Trash breadcrumb
     const currentFolder = items.find(item => item.id === currentFolderId);
     if (currentFolder?.parentId === TRASH_FOLDER_ID && !showTrash) {
         return [{ id: null, name: 'Início' }, { id: TRASH_FOLDER_ID, name: 'Lixeira' }, { id: currentFolderId, name: currentFolder.name }];
     }


    return path.reverse();
  }, [items, currentFolderId, showTrash]);


  // --- Close Modals on Escape Key ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCreateFolderModalOpen) setIsCreateFolderModalOpen(false);
        if (itemToRename) setItemToRename(null);
        if (itemToShare) setItemToShare(null);
        if (itemToPreview) setItemToPreview(null);
        if (confirmDialog.isOpen) setConfirmDialog({ ...confirmDialog, isOpen: false });
        if (selectedItems.size > 0) setSelectedItems(new Set()); // Clear selection on Esc
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateFolderModalOpen, itemToRename, itemToShare, itemToPreview, confirmDialog, selectedItems]); // Added selectedItems

   // --- Click outside to clear selection ---
   const fileListRef = useRef<HTMLDivElement>(null);
   useEffect(() => {
       const handleClickOutside = (event: MouseEvent) => {
           if (fileListRef.current && !fileListRef.current.contains(event.target as Node)) {
                // Check if click was outside the file list area AND not on an action button/menu
                const clickedOnAction = (event.target as HTMLElement).closest('button, [role="menu"], [data-radix-dropdown-menu-trigger]');
                 if (!clickedOnAction) {
                    setSelectedItems(new Set());
                 }
           }
       };
       document.addEventListener('mousedown', handleClickOutside);
       return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []); // Empty dependency array means this runs once on mount


  return (
    <div
      className={`flex flex-col min-h-screen bg-background transition-colors duration-200 ${isDragging ? 'outline outline-2 outline-primary outline-dashed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <Header
        onUpload={(files) => handleUpload(files)} // Pass FileList directly
        onSearch={setSearchQuery}
        currentSearch={searchQuery}
        onFilterChange={setFilterType}
        currentFilter={filterType}
        onCreateFolder={() => setIsCreateFolderModalOpen(true)}
        onLogoClick={navigateToRoot}
        onTrashClick={() => handleFolderClick(TRASH_FOLDER_ID)} // Add trash navigation
        selectedItemCount={selectedItems.size}
        onBatchDelete={handleBatchMoveToTrash} // Use move to trash for batch delete
        isTrashView={showTrash}
        // Pass theme toggle handler
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

        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} onNavigate={handleFolderClick} />


        {/* File List */}
        {isMounted ? (
          <FileList
            items={filteredItems}
            onDelete={handleMoveToTrash} // Changed to move to trash
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
            dragTargetFolderId={dragTargetFolderId} // Pass target folder ID for styling drop target
            isTrashView={showTrash} // Indicate if viewing trash
            onDeletePermanently={handleDeletePermanently} // Pass permanent delete handler
            onRestore={handleRestoreFromTrash} // Pass restore handler
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
                 imageUrl={itemToPreview.content} // Use content directly
                 altText={itemToPreview.name}
             />
         )}

          {/* Code/Text Document Preview */}
          {itemToPreview && isFile(itemToPreview) && (itemToPreview.fileCategory === 'code' || (itemToPreview.fileCategory === 'document' && itemToPreview.mimeType?.startsWith('text/'))) && typeof itemToPreview.content === 'string' && !itemToPreview.content.startsWith('data:') && !itemToPreview.name.toLowerCase().endsWith('.md') && (
              <CodePreviewModal
                  isOpen={!!itemToPreview}
                  onClose={() => setItemToPreview(null)}
                  fileName={itemToPreview.name}
                  code={itemToPreview.content} // Use text content
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


        {/* Confirmation Dialog */}
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

