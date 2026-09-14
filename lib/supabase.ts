import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase (anon key bilan)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase (service role key bilan — faqat server komponentlarida ishlatamiz)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Supabase Storage bucket nomlari
export const STORAGE_BUCKETS = {
  CONTENT_IMAGES: 'content-images',
  RECEIPT_IMAGES: 'receipt-images',
  PROFILE_PHOTOS: 'profile-photos',
} as const;

/**
 * Faylni Supabase Storage ga yuklash
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType || 'image/jpeg',
        upsert: options?.upsert ?? true,
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrl.publicUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

/**
 * Faylni Supabase Storage dan o'chirish
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}
