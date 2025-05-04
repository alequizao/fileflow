import { Header } from "@/components/layout/header";
import { FileList } from "@/components/file-list";
import { Footer } from "@/components/layout/footer";
import type { UploadedFile } from "@/types/file";

// Mock data for demonstration purposes
const mockFiles: UploadedFile[] = [
  {
    id: '1',
    name: 'report.pdf',
    url: '/api/download/report.pdf', // Example URL, replace with actual endpoint
    size: '1.2 MB',
    date: '01/07/2024 10:30',
    type: 'pdf',
  },
  {
    id: '2',
    name: 'logo.png',
    url: '/api/download/logo.png',
    size: '50 KB',
    date: '02/07/2024 11:00',
    type: 'image',
  },
   {
    id: '3',
    name: 'meeting_notes.docx',
    url: '/api/download/meeting_notes.docx',
    size: '250 KB',
    date: '03/07/2024 09:15',
    type: 'document',
  },
  {
    id: '4',
    name: 'background_music.mp3',
    url: '/api/download/background_music.mp3',
    size: '3.5 MB',
    date: '04/07/2024 14:00',
    type: 'audio',
  },
  {
    id: '5',
    name: 'tutorial.mp4',
    url: '/api/download/tutorial.mp4',
    size: '55.8 MB',
    date: '05/07/2024 16:45',
    type: 'video',
  },
   {
    id: '6',
    name: 'archive.zip',
    url: '/api/download/archive.zip',
    size: '10.2 MB',
    date: '06/07/2024 08:00',
    type: 'other',
  },
];


export default function Home() {
  // In a real app, you would fetch the file list from an API or server-side logic
  const files = mockFiles; // Replace with actual data fetching

  const handleUpload = async (file: File) => {
    // Implement file upload logic here
    console.log("Uploading file:", file.name);
    // Example: You would typically send the file to an API endpoint
    // const formData = new FormData();
    // formData.append('file', file);
    // await fetch('/api/upload', { method: 'POST', body: formData });
    // After upload, refresh the file list
  };

  const handleDelete = async (fileId: string) => {
    // Implement file deletion logic here
    console.log("Deleting file:", fileId);
    // Example: Send delete request to API
    // await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    // After deletion, refresh the file list
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onUpload={handleUpload} />
      <main className="flex-grow p-4 space-y-4 container mx-auto">
        <FileList files={files} onDelete={handleDelete} />
      </main>
      <Footer />
    </div>
  );
}
