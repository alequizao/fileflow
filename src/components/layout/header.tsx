
"use client";

import React, { useRef, useState } from 'react';
import { Upload, Search, FolderPlus, Filter, X } from 'lucide-react';
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
import type { FileCategory } from '@/types/file'; // Import FileCategory

interface HeaderProps {
  onUpload: (file: File) => void;
  onSearch: (query: string) => void;
  currentSearch: string;
  onFilterChange: (type: FileCategory | 'folder' | 'all') => void;
  currentFilter: FileCategory | 'folder' | 'all';
  onCreateFolder: () => void; // Callback to open create folder modal
}

export function Header({
  onUpload,
  onSearch,
  currentSearch,
  onFilterChange,
  currentFilter,
  onCreateFolder
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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

  const filterOptions: { value: FileCategory | 'folder' | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'folder', label: 'Pastas' },
    { value: 'image', label: 'Imagens' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'document', label: 'Documentos' },
    { value: 'audio', label: 'Áudios' },
    { value: 'video', label: 'Vídeos' },
    { value: 'code', label: 'Códigos' },
    { value: 'other', label: 'Outros' },
  ];

  const currentFilterLabel = filterOptions.find(opt => opt.value === currentFilter)?.label || 'Filtrar';

  return (
    <header className="bg-card shadow-sm sticky top-0 z-10 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Logo/Title */}
        <h1 className={`text-lg font-semibold text-foreground ${isSearchVisible ? 'hidden sm:block' : ''}`}>
          FileFlow
        </h1>

        {/* Search Input (conditionally rendered) */}
        <div className={`flex-grow ${isSearchVisible ? 'block' : 'hidden'} sm:block sm:relative sm:flex-grow-0 sm:w-64 md:w-80`}>
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
                 <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => onSearch('')}>
                    <X className="h-4 w-4"/>
                 </Button>
             )}
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Search Toggle Button (Mobile) */}
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={toggleSearch}>
            {isSearchVisible ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-1 h-4 w-4" /> {currentFilterLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currentFilter} onValueChange={(value) => onFilterChange(value as FileCategory | 'folder' | 'all')}>
                {filterOptions.map(option => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

           {/* Create Folder Button */}
          <Button onClick={onCreateFolder} variant="outline" size="sm" className="hidden sm:inline-flex">
            <FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta
          </Button>
          <Button onClick={onCreateFolder} variant="ghost" size="icon" className="sm:hidden">
            <FolderPlus className="h-5 w-5" />
             <span className="sr-only">Nova Pasta</span>
          </Button>


          {/* Upload Button */}
          <Button onClick={handleUploadClick} variant="default" size="sm" className="hidden sm:inline-flex">
            <Upload className="mr-2 h-4 w-4" /> Enviar
          </Button>
           <Button onClick={handleUploadClick} variant="ghost" size="icon" className="sm:hidden">
            <Upload className="h-5 w-5" />
             <span className="sr-only">Enviar</span>
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
