import type { authDb } from "@/lib/auth/server";
type Database = Awaited<ReturnType<typeof authDb>>;
export async function readDailyHistory(db: Pick<Database, "query" | "raw">) {
  const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - 89);
  return await db.query(db.raw.sql`
    SELECT r."componentId", to_char(r."checkedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
           r.status, count(*)::int AS checks
    FROM status_page."MonitorResult" r
    JOIN status_page."ServiceComponent" c ON c.id = r."componentId"
    WHERE c."showUptime" = true AND r."checkedAt" >= ${since.toISOString()}::timestamptz
    GROUP BY r."componentId", day, r.status
  `.returnsRow({ componentId: { codecId: "pg/text@1", nullable: false }, day: { codecId: "pg/text@1", nullable: false }, status: { codecId: "pg/text@1", nullable: false }, checks: { codecId: "pg/int4@1", nullable: false } }).build());
}
