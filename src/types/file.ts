
export type FileType = 'pdf' | 'image' | 'document' | 'audio' | 'video' | 'code' | 'other';

export interface UploadedFile {
  id: string;
  name: string;
  url: string; // URL to view/download the file
  size: string; // Formatted size (e.g., "1.2 MB")
  date: string; // Formatted date (e.g., "01/07/2024 10:30")
  type: FileType;
}

