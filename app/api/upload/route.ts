import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase';
import { validateTelegramInitData } from '@/lib/telegram/validate';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string | null;
    const initData = formData.get('initData') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Auth tekshirish
    if (initData) {
      const validation = validateTelegramInitData(initData);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Fayl validatsiyasi
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, GIF allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5MB allowed' },
        { status: 400 }
      );
    }

    // Bucket aniqlash
    const targetBucket = bucket || STORAGE_BUCKETS.CONTENT_IMAGES;
    const validBuckets = Object.values(STORAGE_BUCKETS);
    if (!validBuckets.includes(targetBucket as typeof validBuckets[0])) {
      return NextResponse.json(
        { success: false, error: 'Invalid bucket' },
        { status: 400 }
      );
    }

    // Fayl nomi yaratish
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`;

    // Supabase Storage ga yuklash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Public URL olish
    const { data: publicUrl } = supabaseAdmin.storage
      .from(targetBucket)
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrl.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
