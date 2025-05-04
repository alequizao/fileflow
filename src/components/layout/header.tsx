"use client";

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onUpload: (file: File) => void; // Callback function for when a file is selected
}

export function Header({ onUpload }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
      // Reset the input value to allow uploading the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-card shadow-sm sticky top-0 z-10 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          FileFlow
        </h1>
        <Button onClick={handleUploadClick} variant="default" size="sm">
          <Upload className="mr-2 h-4 w-4" /> Enviar
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          // Add accept attribute if you want to limit file types client-side
          // accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.mp3,.mp4"
        />
      </div>
    </header>
  );
}
