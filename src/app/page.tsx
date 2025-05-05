
'use client'; // Add this directive to make the component a Client Component

import { useState, useEffect } from 'react'; // Import useState and useEffect
import { Header } from "@/components/layout/header";
import { FileList } from "@/components/file-list";
import { Footer } from "@/components/layout/footer";
import type { UploadedFile, FileType } from "@/types/file"; // Import FileType
import { useToast } from '@/hooks/use-toast'; // Import useToast for notifications

const LOCAL_STORAGE_KEY = 'fileflow-files';

export default function Home() {
  // State to hold the list of files, initialized lazily from localStorage or empty array
  const [files, setFiles] = useState<UploadedFile[]>(() => {
    // This function runs only on initial render on the client
    if (typeof window !== 'undefined') {
      const storedFiles = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedFiles) {
        try {
          return JSON.parse(storedFiles);
        } catch (error) {
          console.error("Error parsing files from local storage:", error);
          localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
        }
      }
    }
    return []; // Default to empty array if no localStorage or if server-rendering initially
  });

  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Effect to mark component as mounted (for client-side execution)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Effect to save files to localStorage whenever the files state changes, only run on client after mount
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
    }
  }, [files, isMounted]);

  // Define handlers within the Client Component
  const handleUpload = async (file: File) => {
    console.log("Uploading file:", file.name);
    // --- Mock Upload Logic ---
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay

    // Determine file type including 'code'
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let fileType: FileType = 'other';

    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type === 'application/pdf') {
      fileType = 'pdf';
    } else if (file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.type.startsWith('video/')) {
      fileType = 'video';
    } else if (/\.(docx?|xlsx?|pptx?|txt|rtf|csv)$/i.test(file.name)) { // Expanded doc types
       fileType = 'document';
    } else if (/\.(js|jsx|ts|tsx|py|html|php|css|json|md|java|c|cpp|cs|rb|go|swift|kt)$/i.test(file.name)) { // Expanded code types
       fileType = 'code';
    }
    // Keep 'other' for archives etc. (or specific types if needed)
    else if (/\.(zip|rar|tar|gz|7z)$/i.test(file.name)) {
        fileType = 'other';
    }

    // Create a new file entry
    const newFile: UploadedFile = {
      id: String(Date.now()), // Simple unique ID generation
      name: file.name,
      // Create a Blob URL for preview/download in this mock setup
      // In a real app, this would likely be a URL from your storage service
      url: URL.createObjectURL(file),
      size: `${(file.size / (file.size > 1024 * 1024 ? 1024 * 1024 : 1024)).toFixed(file.size > 1024 * 1024 ? 2 : 0)} ${file.size > 1024 * 1024 ? 'MB' : 'KB'}`, // Dynamic KB/MB
      date: new Date().toLocaleString('pt-BR'),
      type: fileType, // Assign determined type
    };

    // Add the new file to the list
    setFiles(prevFiles => [newFile, ...prevFiles]);

    toast({
      title: "Upload Concluído",
      description: `Arquivo "${file.name}" adicionado.`,
      variant: "default",
    });
    // --- End Mock Upload Logic ---

    // In a real app (example):
    // 1. Upload file to storage (e.g., Firebase Storage, S3)
    // 2. Get the download URL.
    // 3. Save file metadata (including URL) to a database (e.g., Firestore).
    // 4. Update the local state `files` with data from the database.
  };

  const handleDelete = async (fileId: string) => {
    console.log("Deleting file:", fileId);
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    // --- Mock Deletion Logic ---
    const fileName = fileToDelete.name;

    // Revoke the Blob URL if it exists to free memory
    if (fileToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToDelete.url);
    }

    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    toast({
      title: "Exclusão Concluída",
      description: `"${fileName}" excluído com sucesso.`,
      variant: "default", // Or maybe "destructive" look? Default is fine.
    });
    // --- End Mock Deletion Logic ---

    // In a real app (example):
    // 1. Delete file from storage.
    // 2. Delete file metadata from database.
    // 3. Update local state `files`.
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Pass handlers down to Client Components */}
      <Header onUpload={handleUpload} />
      <main className="flex-grow p-4 space-y-4 container mx-auto">
        {/* Only render FileList on the client after mount to ensure localStorage is read */}
        {isMounted ? (
          <FileList files={files} onDelete={handleDelete} />
        ) : (
          // Optional: Add a loading indicator while waiting for client mount
          <div className="text-center text-muted-foreground mt-10">Carregando arquivos...</div>
        )}
      </main>
      <Footer />
    </div>
  );
}

