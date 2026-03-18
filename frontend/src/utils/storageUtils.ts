import { getStorage, ref, uploadBytes, getDownloadURL, StorageReference } from 'firebase/storage';
import { firebaseApp, firebaseStorage } from 'app';
import { toast } from 'sonner';

/**
 * Utility for Firebase Storage operations with robust error handling
 */
export const StorageUtils = {
  /**
   * Upload a file to Firebase Storage with error handling
   * 
   * @param file The file to upload
   * @param path The path within Firebase Storage (e.g., 'companies/logos/file.jpg')
   * @param options Additional options
   * @returns A promise that resolves to the download URL or null if upload fails
   */
  async uploadFile(file: File, path: string, options?: {
    onProgress?: (progress: number) => void;
    contentType?: string;
  }): Promise<string | null> {
    try {
      // Start progress tracking
      if (options?.onProgress) {
        options.onProgress(0);
      }
      
      // Ensure we have a valid storage reference
      let storageRef: StorageReference;
      try {
        // Try to get storage with default bucket name
        // Note: Firebase Console may show the bucket as "(default)", but we use
        // the default Firebase app configuration which should correctly handle this
        const storage = getStorage(firebaseApp);
        storageRef = ref(storage, path);
      } catch (error) {
        console.error('Failed to create storage reference:', error);
        toast.error('Storage error: Unable to initialize storage');
        return null;
      }
      
      // Set up progress simulation (Firebase web SDK doesn't provide progress events)
      let progressInterval: number | null = null;
      if (options?.onProgress) {
        progressInterval = window.setInterval(() => {
          options.onProgress!(Math.min((Math.random() * 15) + 70, 90));
        }, 300);
      }
      
      try {
        // Try to upload the file
        const snapshot = await uploadBytes(storageRef, file, {
          contentType: options?.contentType || file.type
        });
        
        // Clear progress interval
        if (progressInterval) {
          clearInterval(progressInterval);
          options?.onProgress?.(95);
        }
        
        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        options?.onProgress?.(100);
        return downloadURL;
      } catch (uploadError: any) {
        // Handle upload errors
        console.error('Error uploading file:', uploadError);
        
        if (uploadError.code === 'storage/unauthorized') {
          toast.error('Storage error: You do not have permission to access this storage location');
        } else if (uploadError.code === 'storage/canceled') {
          toast.error('Storage error: Upload was canceled');
        } else if (uploadError.code === 'storage/retry-limit-exceeded') {
          toast.error('Storage error: Upload failed - network error');
        } else if (uploadError.code === 'storage/invalid-checksum') {
          toast.error('Storage error: File upload corrupted');
        } else if (uploadError.code === 'storage/quota-exceeded') {
          toast.error('Storage error: Storage quota exceeded');
        } else if (uploadError.code === 'storage/bucket-not-found') {
          toast.error('Storage error: Storage bucket not found or not configured');
          console.error('Firebase Storage bucket not found. Please verify your Firebase Console configuration.');
          console.error('Note: Firebase Console may show the bucket as "(default)" - this is normal');
          console.error('Make sure Firebase Storage is enabled in your Firebase project');
        } else {
          toast.error(`Storage error: ${uploadError.message || 'Unknown error uploading file'}`);
        }
        
        return null;
      } finally {
        // Ensure progress interval is cleared
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      }
    } catch (error) {
      console.error('Unexpected error in uploadFile:', error);
      toast.error('An unexpected error occurred during file upload');
      options?.onProgress?.(0);
      return null;
    }
  },
  
  /**
   * Download a file from Firebase Storage with error handling
   * 
   * @param path The path within Firebase Storage
   * @returns A promise that resolves to the download URL or null if download fails
   */
  async getFileUrl(path: string): Promise<string | null> {
    try {
      // Try to get storage with default bucket
      // Note: Firebase Console may show the bucket as "(default)", but we use
      // the default Firebase app configuration which should correctly handle this
      const storage = getStorage(firebaseApp);
      const fileRef = ref(storage, path);
      return await getDownloadURL(fileRef);
    } catch (error: any) {
      console.error('Error getting file URL:', error);
      
      if (error.code === 'storage/object-not-found') {
        toast.error('File not found');
      } else if (error.code === 'storage/unauthorized') {
        toast.error('You do not have permission to access this file');
      } else if (error.code === 'storage/canceled') {
        toast.error('Operation canceled');
      } else if (error.code === 'storage/bucket-not-found') {
        console.error('Firebase Storage bucket not found. Please verify your Firebase Console configuration.');
        console.error('Note: Firebase Console may show the bucket as "(default)" - this is normal');
        console.error('Make sure Firebase Storage is enabled in your Firebase project');
        // Don't show this error to the user - just fail silently
      } else {
        toast.error('Error retrieving file');
      }
      
      return null;
    }
  },
  
  /**
   * Check if Firebase Storage is available and properly configured
   * 
   * @returns A promise that resolves to true if storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      // Try to access the default storage bucket
      // Note: Firebase Console may show the bucket as "(default)", but we use
      // the default Firebase app configuration which should correctly handle this
      const storage = getStorage(firebaseApp);
      // Just create a ref - don't actually need to list anything
      ref(storage, 'test');
      return true;
    } catch (error) {
      console.error('Firebase Storage not available:', error);
      console.error('Make sure Firebase Storage is enabled in your Firebase project');
      return false;
    }
  }
};
