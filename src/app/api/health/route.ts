import { db } from '@/lib/db';

export async function GET() {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as Array<{ name: string }>;
  const tables = rows.map((row) => row.name);
  return Response.json({ status: 'ok', tables });
}
