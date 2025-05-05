

"use client";

import React, { useRef, useState } from 'react';
import { Upload, Search, FolderPlus, Filter, X, Trash2, Star } from 'lucide-react'; // Added Trash2, Star
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileCategory } from '@/types/file';

interface HeaderProps {
  onUpload: (files: FileList | File[]) => void; // Accept FileList or File array
  onSearch: (query: string) => void;
  currentSearch: string;
  onFilterChange: (type: FileCategory | 'folder' | 'all' | 'favorites') => void; // Added 'favorites'
  currentFilter: FileCategory | 'folder' | 'all' | 'favorites';
  onCreateFolder: () => void;
  onLogoClick: () => void;
  onTrashClick: () => void; // Handler for navigating to trash
  selectedItemCount: number; // Number of selected items
  onBatchDelete: () => void; // Handler for deleting selected items
  isTrashView?: boolean; // Is the current view the trash?
  themeToggle?: React.ReactNode; // Prop to receive the theme toggle button
}

export function Header({
  onUpload,
  onSearch,
  currentSearch,
  onFilterChange,
  currentFilter,
  onCreateFolder,
  onLogoClick,
  onTrashClick,
  selectedItemCount,
  onBatchDelete,
  isTrashView = false,
  themeToggle, // Receive theme toggle component
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUpload(files); // Pass the FileList directly
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input after selection
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
        onSearch(''); // Clear search when hiding
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  const filterOptions: { value: FileCategory | 'folder' | 'all' | 'favorites'; label: string; icon?: React.ElementType }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'favorites', label: 'Favoritos', icon: Star },
    { value: 'folder', label: 'Pastas', icon: FolderPlus },
    { value: 'image', label: 'Imagens' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'document', label: 'Documentos' },
    { value: 'audio', label: 'Áudios' },
    { value: 'video', label: 'Vídeos' },
    { value: 'code', label: 'Códigos' },
    { value: 'other', label: 'Outros' },
  ];

  const currentFilterOption = filterOptions.find(opt => opt.value === currentFilter);
  const currentFilterLabel = currentFilterOption?.label || 'Filtrar';
  const CurrentFilterIcon = currentFilterOption?.icon;


  return (
    <header className="bg-card shadow-sm sticky top-0 z-30 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap"> {/* Added flex-wrap */}
        {/* Logo/Title and Theme Toggle */}
         <div className="flex items-center gap-2">
             <button
                onClick={onLogoClick}
                className={`text-lg font-semibold text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm p-1 -ml-1 ${isSearchVisible ? 'hidden sm:block' : ''}`}
                aria-label="Ir para Início"
                disabled={isTrashView} // Disable logo click in trash view? Or make it go to root?
              >
                FileFlow
              </button>
              {themeToggle} {/* Render the theme toggle button */}
         </div>


        {/* Search Input (conditionally rendered) */}
        <div className={`flex-grow ${isSearchVisible ? 'block w-full mt-2 sm:mt-0 sm:w-auto' : 'hidden'} sm:block sm:relative sm:flex-grow-0 sm:w-64 md:w-80 order-last sm:order-none`}> {/* Order adjustments */}
           <div className="relative">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
                type="search"
                placeholder="Pesquisar arquivos..."
                className="pl-8 w-full"
                value={currentSearch}
                onChange={handleSearchChange}
                aria-label="Pesquisar arquivos"
             />
             {currentSearch && (
                 <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => onSearch('')} aria-label="Limpar pesquisa">
                    <X className="h-4 w-4"/>
                 </Button>
             )}
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Search Toggle Button (Mobile) */}
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={toggleSearch} aria-label={isSearchVisible ? "Fechar pesquisa" : "Abrir pesquisa"} aria-expanded={isSearchVisible}>
            {isSearchVisible ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="outline" size="sm">
                  {CurrentFilterIcon && <CurrentFilterIcon className="mr-1 h-4 w-4" />}
                   {currentFilterLabel}
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currentFilter} onValueChange={(value) => onFilterChange(value as FileCategory | 'folder' | 'all' | 'favorites')}>
                {filterOptions.map(option => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                     {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

           {/* Create Folder Button */}
           {!isTrashView && ( // Hide Create Folder in Trash
              <>
                 <Button onClick={onCreateFolder} variant="outline" size="sm" className="hidden sm:inline-flex">
                   <FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta
                 </Button>
                 <Button onClick={onCreateFolder} variant="ghost" size="icon" className="sm:hidden" aria-label="Nova Pasta">
                   <FolderPlus className="h-5 w-5" />
                 </Button>
              </>
           )}


          {/* Upload Button */}
          {!isTrashView && ( // Hide Upload in Trash
             <>
                <Button onClick={handleUploadClick} variant="default" size="sm" className="hidden sm:inline-flex">
                  <Upload className="mr-2 h-4 w-4" /> Enviar
                </Button>
                <Button onClick={handleUploadClick} variant="ghost" size="icon" className="sm:hidden" aria-label="Enviar Arquivo">
                  <Upload className="h-5 w-5" />
                </Button>
             </>
           )}

            {/* Batch Delete Button */}
            {selectedItemCount > 0 && !isTrashView && (
                 <Button onClick={onBatchDelete} variant="destructive" size="sm" className="hidden sm:inline-flex">
                     <Trash2 className="mr-2 h-4 w-4" /> Excluir ({selectedItemCount})
                 </Button>
            )}
             {selectedItemCount > 0 && !isTrashView && (
                 <Button onClick={onBatchDelete} variant="ghost" size="icon" className="sm:hidden text-destructive hover:bg-destructive/10" aria-label={`Excluir ${selectedItemCount} itens selecionados`}>
                     <Trash2 className="h-5 w-5" />
                 </Button>
             )}

            {/* Trash Button */}
           <Button onClick={onTrashClick} variant={isTrashView ? "secondary" : "ghost"} size="icon" aria-label="Ver Lixeira" title="Ver Lixeira">
                <Trash2 className="h-5 w-5" />
           </Button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple // Allow multiple file selection
        />
      </div>
    </header>
  );
}
