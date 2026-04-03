import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { verifySessionToken } from '@/lib/auth/session';
import { z } from 'zod';

const PropertySchema = z.object({
  name: z.string().min(1, '宿名は必須です'),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  check_in_time: z.string().nullable().optional(),
  check_out_time: z.string().nullable().optional(),
  wifi_ssid: z.string().nullable().optional(),
  wifi_password: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  switchbot_keypad_device_id: z.string().nullable().optional(),
});

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_session')?.value;
  return !!token && (await verifySessionToken(token));
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ properties: data });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const validation = PropertySchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .insert(validation.data)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ property: data }, { status: 201 });
}
