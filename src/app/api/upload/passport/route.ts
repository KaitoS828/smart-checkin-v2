import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/upload/passport
 * Upload passport image and return the public URL
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const reservationId = formData.get('reservationId') as string | null;

    if (!file || !reservationId) {
      return NextResponse.json(
        { error: 'File and reservation ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG, PNG, WebP, HEIC形式の画像をアップロードしてください' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${reservationId}/passport.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('passports')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'ファイルのアップロードに失敗しました' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('passports')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update reservation with passport image URL
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ passport_image_url: publicUrl })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
