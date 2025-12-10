import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const BUCKET_NAME = 'coach-profiles';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Validates an image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
    };
  }

  return { valid: true };
};

/**
 * Uploads a profile picture to Supabase Storage
 * Returns the storage path on success
 */
export const uploadProfilePicture = async (
  file: File,
  coachId: string
): Promise<{ data: string | null; error: string | null }> => {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { data: null, error: validation.error || 'Invalid file' };
    }

    // Generate unique filename: coachId-timestamp.extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${coachId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Upload error:', error);
      return { data: null, error: error.message };
    }

    return { data: data.path, error: null };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return { data: null, error: 'Failed to upload image. Please try again.' };
  }
};

/**
 * Gets the public URL for a profile picture
 */
export const getProfilePictureUrl = (path: string): string => {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Deletes a profile picture from storage
 */
export const deleteProfilePicture = async (
  path: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Unexpected delete error:', error);
    return { error: 'Failed to delete image' };
  }
};

/**
 * Replaces an existing profile picture
 * Uploads new image and deletes old one
 */
export const replaceProfilePicture = async (
  file: File,
  coachId: string,
  oldPath: string | null
): Promise<{ data: string | null; error: string | null }> => {
  try {
    // Upload new image first
    const uploadResult = await uploadProfilePicture(file, coachId);

    if (uploadResult.error || !uploadResult.data) {
      return uploadResult;
    }

    // Delete old image if it exists
    if (oldPath) {
      await deleteProfilePicture(oldPath);
      // Don't fail the operation if deletion fails
    }

    return uploadResult;
  } catch (error) {
    console.error('Replace error:', error);
    return { data: null, error: 'Failed to replace image' };
  }
};

// ========================================
// Club Logo Storage
// ========================================

const CLUB_BUCKET_NAME = 'club-logos';

/**
 * Uploads a club logo to Supabase Storage
 * Returns the full public URL on success
 */
export const uploadClubLogo = async (
  file: File,
  identifier: string
): Promise<{ data: string | null; error: string | null }> => {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { data: null, error: validation.error || 'Invalid file' };
    }

    // Generate unique filename: identifier-timestamp.extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${identifier}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(CLUB_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Club logo upload error:', error);
      return { data: null, error: error.message };
    }

    // Return the public URL
    const { data: urlData } = supabase.storage.from(CLUB_BUCKET_NAME).getPublicUrl(data.path);
    return { data: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Unexpected club logo upload error:', error);
    return { data: null, error: 'Failed to upload logo. Please try again.' };
  }
};
