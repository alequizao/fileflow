'use client'; // Add this directive to make the component a Client Component

import { useState } from 'react'; // Import useState for managing files state
import { Header } from "@/components/layout/header";
import { FileList } from "@/components/file-list";
import { Footer } from "@/components/layout/footer";
import type { UploadedFile } from "@/types/file";
import { useToast } from '@/hooks/use-toast'; // Import useToast for notifications

// Mock data for demonstration purposes - move inside the component or fetch
const initialMockFiles: UploadedFile[] = [
    {
    id: '1',
    name: 'report.pdf',
    url: '#', // Use placeholder URLs or implement download logic later
    size: '1.2 MB',
    date: '01/07/2024 10:30',
    type: 'pdf',
  },
  {
    id: '2',
    name: 'logo.png',
    url: '#',
    size: '50 KB',
    date: '02/07/2024 11:00',
    type: 'image',
  },
   {
    id: '3',
    name: 'meeting_notes.docx',
    url: '#',
    size: '250 KB',
    date: '03/07/2024 09:15',
    type: 'document',
  },
  {
    id: '4',
    name: 'background_music.mp3',
    url: '#',
    size: '3.5 MB',
    date: '04/07/2024 14:00',
    type: 'audio',
  },
  {
    id: '5',
    name: 'tutorial.mp4',
    url: '#',
    size: '55.8 MB',
    date: '05/07/2024 16:45',
    type: 'video',
  },
   {
    id: '6',
    name: 'archive.zip',
    url: '#',
    size: '10.2 MB',
    date: '06/07/2024 08:00',
    type: 'other',
  },
];


export default function Home() {
  // State to hold the list of files
  const [files, setFiles] = useState<UploadedFile[]>(initialMockFiles);
  const { toast } = useToast();

  // Define handlers within the Client Component
  const handleUpload = async (file: File) => {
    console.log("Uploading file:", file.name);
    // --- Mock Upload Logic ---
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a new file entry (replace with actual data from backend)
    const newFile: UploadedFile = {
      id: String(Date.now()), // Simple unique ID generation
      name: file.name,
      url: URL.createObjectURL(file), // Temporary URL for viewing/downloading mock
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      date: new Date().toLocaleString('pt-BR'),
      // Basic type detection based on extension (improve as needed)
      type: file.type.startsWith('image/') ? 'image' :
            file.type === 'application/pdf' ? 'pdf' :
            file.type.startsWith('audio/') ? 'audio' :
            file.type.startsWith('video/') ? 'video' :
            file.name.endsWith('.docx') || file.name.endsWith('.doc') ? 'document' :
            'other',
    };

    // Add the new file to the list
    setFiles(prevFiles => [newFile, ...prevFiles]);

    toast({
      title: "Upload Concluído",
      description: `Arquivo "${file.name}" enviado com sucesso.`,
      variant: "default", // Use 'default' or 'success' if you have it
    });
    // --- End Mock Upload Logic ---

    // In a real app:
    // const formData = new FormData();
    // formData.append('file', file);
    // try {
    //   const response = await fetch('/api/upload', { method: 'POST', body: formData });
    //   if (!response.ok) throw new Error('Upload failed');
    //   const uploadedFileData = await response.json(); // Assuming API returns new file details
    //   setFiles(prevFiles => [uploadedFileData, ...prevFiles]); // Add file from API response
    //   toast({ title: "Upload Concluído", description: `Arquivo "${file.name}" enviado.` });
    // } catch (error) {
    //   console.error("Upload error:", error);
    //   toast({ title: "Erro no Upload", description: `Falha ao enviar "${file.name}".`, variant: "destructive" });
    // }
  };

  const handleDelete = async (fileId: string) => {
    console.log("Deleting file:", fileId);
    // --- Mock Deletion Logic ---
    const fileName = files.find(f => f.id === fileId)?.name || 'Arquivo';
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    toast({
      title: "Exclusão Concluída",
      description: `"${fileName}" excluído com sucesso.`,
      variant: "default",
    });
    // --- End Mock Deletion Logic ---

    // In a real app:
    // const fileName = files.find(f => f.id === fileId)?.name || 'Arquivo';
    // try {
    //   const response = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    //   if (!response.ok) throw new Error('Deletion failed');
    //   setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    //   toast({ title: "Exclusão Concluída", description: `"${fileName}" excluído.` });
    // } catch (error) {
    //   console.error("Deletion error:", error);
    //   toast({ title: "Erro na Exclusão", description: `Falha ao excluir "${fileName}".`, variant: "destructive" });
    // }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Pass handlers down to Client Components */}
      <Header onUpload={handleUpload} />
      <main className="flex-grow p-4 space-y-4 container mx-auto">
        <FileList files={files} onDelete={handleDelete} />
      </main>
      <Footer />
    </div>
  );
}
