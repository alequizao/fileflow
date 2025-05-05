

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
  isFavorite?: boolean; // Optional: Flag for favorite items
}

// Extend BaseItem for Files
export interface FileItemData extends BaseItem {
  type: 'file';
  // url: string; // Data URL (or potentially other URL in the future)
  content?: string; // Store content as base64 string or text directly
  size: number; // Size in bytes
  mimeType?: string; // Store the MIME type
  fileCategory: FileCategory; // Specific category of the file
  uploadProgress?: number; // Optional: 0-100 for upload progress
  isUploading?: boolean; // Optional: Flag during upload
  error?: string; // Optional: Upload error message
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

    // Code files by extension (more reliable for code)
    if (/\.(js|jsx|ts|tsx|py|java|c|cpp|cs|rb|go|swift|kt|rs|php|html|htm|css|scss|sass|less|json|xml|yaml|yml|toml|md|sh|bash|zsh|ps1|bat|sql|r|pl|lua|groovy|dart|ipynb)$/i.test(file.name)) {
        return 'code';
    }

    // Broader check for documents based on MIME type or common extensions
    if (mimeType.startsWith('text/') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation') || /\.(docx?|xlsx?|pptx?|txt|rtf|csv|odt|ods|odp)$/i.test(file.name)) {
         // Exclude markdown from documents if it was already caught by 'code'
         if (extension === 'md' && mimeType !== 'text/markdown') return 'code'; // Keep md as code if not specifically text/markdown
        return 'document';
    }

    // Archives
    if (/\.(zip|rar|tar|gz|7z|iso|img)$/i.test(file.name) || mimeType.includes('zip') || mimeType.includes('compressed')) return 'other'; // Could be 'archive' category later

    // Executables / Installers
     if (/\.(exe|app|dmg|msi|deb|rpm)$/i.test(file.name) || mimeType.includes('executable') || mimeType.includes('installer')) return 'other'; // Could be 'executable'

    // Fallback
    return 'other';
}

// Function to convert Data URL to Blob (remains client-side only)
export const dataUrlToBlob = (dataUrl: string): Blob => {
    if (!dataUrl.startsWith('data:')) {
        throw new Error('Invalid Data URL');
    }
    const parts = dataUrl.split(','); // Split at the first comma
    if (parts.length !== 2) {
        throw new Error('Invalid Data URL format');
    }
    const metaPart = parts[0]; // e.g., "data:image/png;base64"
    const base64Data = parts[1];

    const metaParts = metaPart.split(';');
    if (metaParts.length < 1) {
        throw new Error('Invalid Data URL metadata');
    }
    const contentType = metaParts[0].split(':')[1];
    if (!contentType) {
        throw new Error('Could not determine content type from Data URL');
    }

    // Check if base64 encoded
    const isBase64 = metaParts.includes('base64');
    let byteCharacters: string;

    if (isBase64) {
        try {
            byteCharacters = atob(base64Data);
        } catch (e) {
            console.error("Failed to decode base64 string:", e);
            throw new Error('Invalid base64 data in Data URL');
        }
    } else {
        // Handle URL-encoded data
        byteCharacters = decodeURIComponent(base64Data);
    }


    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
};

// Function to read file content (handles text and base64 data URLs)
export const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                resolve(event.target.result as string); // Returns Data URL (includes base64) or text content
            } else {
                reject(new Error('Erro ao ler o conteúdo do arquivo.'));
            }
        };
        reader.onerror = (error) => {
            console.error("Erro no FileReader:", error);
            reject(error);
        };

        // Read as Data URL for non-text files, read as text for likely text files
        if (file.type.startsWith('text/') || determineFileCategory(file) === 'code' || determineFileCategory(file) === 'document') {
             // Heuristic: Read potentially large text files carefully
             if (file.size > 10 * 1024 * 1024) { // Example limit: 10MB for direct text reading
                console.warn(`Arquivo "${file.name}" (${formatBytes(file.size)}) é grande para leitura direta como texto. Lendo como Data URL.`);
                reader.readAsDataURL(file); // Fallback to Data URL for large text files
             } else {
                 reader.readAsText(file);
             }
        } else {
            reader.readAsDataURL(file); // Read images, audio, video, etc. as Data URL
        }
    });
};
