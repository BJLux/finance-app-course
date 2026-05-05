import { db } from '@/lib/db';

export async function GET() {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((row) => (row as { name: string }).name);
  return Response.json({ status: 'ok', tables });
}
