import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { accountRequest } from "@/lib/auth/account-request";
export async function PATCH(request: NextRequest) {
  try {
    const access = await accountRequest(request); if (access.error) return access.error;
    const body = await request.json(); const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 100) return NextResponse.json({ error: "Enter a name between 1 and 100 characters." }, { status: 400 });
    const fields: { name: string; avatar?: string | null } = { name };
    if (body.avatar !== undefined) {
      if (body.avatar === null) fields.avatar = null;
      else if (typeof body.avatar === "string" && body.avatar.length < 700000 && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(body.avatar)) {
        const bytes = Buffer.from(body.avatar.split(",")[1], "base64");
        const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
        const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
        const webp = bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP";
        if (!png && !jpeg && !webp) return NextResponse.json({ error: "Choose a PNG, JPEG, or WebP image." }, { status: 400 });
        fields.avatar = body.avatar;
      } else return NextResponse.json({ error: "Choose a PNG, JPEG, or WebP image smaller than 500 KB." }, { status: 400 });
    }
    await access.db.orm.status_page.StaffAccount.where({ id: access.staff.id }).update(fields);
    revalidatePath("/admin", "layout"); return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to update your profile." }, { status: 503 }); }
}
