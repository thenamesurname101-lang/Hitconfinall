import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const supabase = createServerClient();
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });

  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  if (search) query = query.or(`title.ilike.%${search}%,file_name.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string;

  if (!file || !title) return NextResponse.json({ error: 'File and title are required' }, { status: 400 });

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/msword', 'application/vnd.ms-excel'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|xlsx|csv|doc|xls)$/i)) return NextResponse.json({ error: 'Unsupported file type. Allowed: PDF, DOCX, XLSX, CSV' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });

  const supabase = createServerClient();
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `uploads/${timestamp}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const { error: uploadError } = await supabase.storage.from('reports').upload(filePath, uint8Array, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });

  const siteId = session.role === 'site_manager' ? session.siteId || null : null;
  const { data, error: dbError } = await supabase.from('reports').insert({
    title: title.trim(), file_name: file.name, file_path: filePath,
    file_size: file.size, uploaded_by: session.username, site_id: siteId,
  }).select().single();

  if (dbError) { await supabase.storage.from('reports').remove([filePath]); return NextResponse.json({ error: dbError.message }, { status: 500 }); }
  return NextResponse.json(data, { status: 201 });
}
