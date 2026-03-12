import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

/**
 * GET /api/reservations/export
 * Export reservations as CSV
 * Query Params:
 * - ids: string (optional) - Comma-separated list of reservation IDs to export
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    const supabase = await createClient();

    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by IDs if provided
    if (idsParam) {
      const ids = idsParam.split(',');
      query = query.in('id', ids);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error('Error fetching reservations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservations' },
        { status: 500 }
      );
    }

    // BOM for Excel compatibility
    const BOM = '\uFEFF';

    // CSV headers
    const headers = [
      '予約ID',
      '宿泊者氏名',
      'ふりがな',
      '住所',
      '職業',
      '連絡先',
      '性別',
      '外国人',
      '国籍',
      '旅券番号',
      'Secret Code',
      'Door PIN',
      'チェックイン',
      '作成日時',
    ];

    // CSV rows
    const rows = (reservations || []).map((r) => [
      r.id,
      r.guest_name || '',
      r.guest_name_kana || '',
      r.guest_address || '',
      r.guest_occupation || '',
      r.guest_contact || '',
      r.guest_gender || '',
      r.is_foreign_national ? 'はい' : 'いいえ',
      r.nationality || '',
      r.passport_number || '',
      r.secret_code,
      r.door_pin,
      r.is_checked_in ? '済' : '未',
      new Date(r.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    ]);

    // Build CSV string
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const now = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservations_${now}.csv"`,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
