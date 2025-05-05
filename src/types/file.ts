
// Define specific file categories
export type FileCategory = 'pdf' | 'image' | 'document' | 'audio' | 'video' | 'code' | 'other';

// Define the base structure for any item in the file system
export interface BaseItem {
  id: string; // Unique identifier
  name: string; // Name of the file or folder
  parentId: string | null; // ID of the parent folder, null for root items
  createdAt: string; // ISO string format for date created
  updatedAt: string; // ISO string format for date updated
  type: 'file' | 'folder'; // Type discriminator
}

// Extend BaseItem for Files
export interface FileItemData extends BaseItem {
  type: 'file';
  url: string; // URL to view/download the file (can be blob URL or future storage URL)
  size: number; // Size in bytes
  fileCategory: FileCategory; // Specific category of the file
  uploadProgress?: number; // Optional: 0-100 for upload progress
  isUploading?: boolean; // Optional: Flag during upload
  error?: string; // Optional: Upload error message
  previewContent?: string; // Optional: Holds text content for code/doc preview
}

// Extend BaseItem for Folders
export interface FolderItemData extends BaseItem {
  type: 'folder';
}

// Union type for any item in the file system
export type FileSystemItem = FileItemData | FolderItemData;

// Type guard to check if an item is a file
export function isFile(item: FileSystemItem): item is FileItemData {
  return item.type === 'file';
}

// Type guard to check if an item is a folder
export function isFolder(item: FileSystemItem): item is FolderItemData {
  return item.type === 'folder';
}

// Helper function to format bytes into KB, MB, GB
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes'; // Handle zero or undefined bytes

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  // Handle potential non-numeric or invalid input safely
  if (isNaN(bytes) || !isFinite(bytes)) return 'Invalid size';

   // Prevent log(0) or log of negative numbers
  if (bytes <= 0) return '0 Bytes';


  const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Ensure index is within bounds
    const sizeIndex = Math.min(i, sizes.length - 1);


  return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm)) + ' ' + sizes[sizeIndex];
}


// Helper function to get category from file name/type
export function determineFileCategory(file: File): FileCategory {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    // Broader check for documents
    if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation') || /\.(docx?|xlsx?|pptx?|txt|rtf|csv|odt|ods|odp|md)$/i.test(file.name)) return 'document';
     // Code files
    if (/\.(js|jsx|ts|tsx|py|html|php|css|json|java|c|cpp|cs|rb|go|swift|kt|sh|bash|sql|xml|yaml|yml|ipynb)$/i.test(file.name)) return 'code';
    // Archives
    if (/\.(zip|rar|tar|gz|7z)$/i.test(file.name)) return 'other'; // Consider 'archive' category

    return 'other';
}
