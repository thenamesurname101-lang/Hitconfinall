import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();

  let selectQuery = supabase.from('reports').select('file_path, site_id').eq('id', id);
  if (session.role === 'site_manager') selectQuery = selectQuery.eq('site_id', session.siteId || '');
  const { data: report } = await selectQuery.maybeSingle();
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (report.file_path) await supabase.storage.from('reports').remove([report.file_path]);
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const supabase = createServerClient();

  let query = supabase.from('reports').select('*').eq('id', id);
  if (session.role === 'site_manager') query = query.eq('site_id', session.siteId || '');
  const { data: report } = await query.maybeSingle();
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: signedUrl } = await supabase.storage.from('reports').createSignedUrl(report.file_path, 60);
  return NextResponse.json({ ...report, download_url: signedUrl?.signedUrl });
}
