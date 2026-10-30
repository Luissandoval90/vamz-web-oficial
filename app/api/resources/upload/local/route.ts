import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnv, getLocalStorageRoot } from "@/lib/env";
import { writeLocalUpload } from "@/lib/local-storage";
import { getRequestUser } from "@/lib/request-auth";
import { getUserStorageQuotaBytes, isAdminEmail } from "@/lib/admin";
import { getStorageQuotaBytes, isLocalStorage, StorageError, verifyLocalUploadToken } from "@/lib/uploads";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  if (!isLocalStorage()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const token = request.nextUrl.searchParams.get("token");
  if (!token || !request.body) return NextResponse.json({ error: "Subida no válida." }, { status: 400 });
  let upload: { key: string; size: number };
  try {
    upload = await verifyLocalUploadToken(token, user.id);
  } catch {
    return NextResponse.json({ error: "La autorización de subida venció o no es válida. Inténtalo de nuevo." }, { status: 403 });
  }
  const length = request.headers.get("content-length");
  if (length && Number(length) !== upload.size) return NextResponse.json({ error: "El tamaño del archivo no coincide." }, { status: 400 });
  try {
    await writeLocalUpload({ root: getLocalStorageRoot(), key: upload.key, body: request.body, expectedSize: upload.size, quotaBytes: getStorageQuotaBytes(), ownerQuotaBytes: isAdminEmail(user.email) ? undefined : getUserStorageQuotaBytes(user.email), minimumFreeBytes: getEnv().MIN_FREE_SPACE_MB * 1024 * 1024, signal: request.signal });
    return NextResponse.json({ uploaded: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof StorageError ? error.message : "No se pudo guardar el archivo. Inténtalo de nuevo." }, { status: error instanceof StorageError ? error.status : 500 });
  }
}
