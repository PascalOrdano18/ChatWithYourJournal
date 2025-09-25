import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    // Create server-side Supabase client with user session
    const supabase = await createServerSupabaseClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: "You must be logged in to upload files." 
      }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "File type not supported. Please upload images (JPEG, PNG, GIF, WebP, HEIC) or videos (MP4, WebM, QuickTime)." 
      }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 10MB." 
      }, { status: 400 });
    }

    // Generate unique filename (we may change extension if converting)
    const originalExt = file.name.split('.').pop()?.toLowerCase();
    let targetExt = originalExt || 'bin';
    let targetMime = file.type;

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
    if (isHeic) {
      targetExt = 'jpg';
      targetMime = 'image/jpeg';
    }
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${targetExt}`;

    // Prepare data for upload (convert HEIC/HEIF to JPEG server-side)
    let uploadBuffer: Buffer | File = file;
    try {
      if (isHeic) {
        const arrayBuffer = await file.arrayBuffer();
        const input = Buffer.from(arrayBuffer);
        const converted = await sharp(input).toFormat('jpeg', { quality: 82 }).toBuffer();
        uploadBuffer = converted;
      }
    } catch (convErr) {
      console.warn('HEIC server conversion failed, uploading original file:', convErr);
      // Keep uploadBuffer as original file
      targetMime = file.type; // keep
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('journal-media')
      .upload(fileName, uploadBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: targetMime
      });

    if (error) {
      console.error('Upload error:', error);
      console.error('User ID:', user.id);
      console.error('File name:', fileName);
      console.error('File size:', file.size);
      console.error('File type:', file.type);
      
      return NextResponse.json({ 
        error: `Failed to upload file: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    // Prefer a signed URL (works for private buckets). Fallback to public URL if signing fails.
    let signedUrl: string | null = null;
    const signed = await supabase.storage
      .from('journal-media')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days
    if (!signed.error && signed.data?.signedUrl) {
      signedUrl = signed.data.signedUrl;
    } else {
      const { data: pub } = supabase.storage
        .from('journal-media')
        .getPublicUrl(fileName);
      signedUrl = pub.publicUrl;
    }

    return NextResponse.json({
      url: signedUrl,
      fileName: data.path,
      type: targetMime,
      size: isHeic && uploadBuffer instanceof Buffer ? uploadBuffer.byteLength : file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
