import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/google-auth";
import { getServerSession } from "@/lib/server-session";
import type { Readable } from "stream";

/**
 * BPlen HUB — Document Proxy API 🛡️
 * Serve arquivos do Google Drive com autenticação obrigatória do HUB.
 * Garante que somente membros ativos acessem documentos confidenciais.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // 1. Validação de Autenticação (Gating)
    if (!token) {
      return new NextResponse("Token de autenticação ausente.", { status: 401 });
    }

    const session = await getServerSession(token);
    if (!session) {
      return new NextResponse("Sessão inválida ou expirada.", { status: 403 });
    }

    // 2. Conectar ao Google Drive
    const drive = await getDriveClient();

    // 3. Buscar Metadados (Nome e MimeType)
    const fileMeta = await drive.files.get({
      fileId,
      fields: "name, mimeType",
      supportsAllDrives: true,
    });

    // 4. Buscar Conteúdo (Media Stream)
    const response = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    // 5. Converter Stream do Node para Web Stream (Next.js compatible)
    const stream = response.data as unknown as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err: Error) => controller.error(err));
      },
    });

    // 6. Retornar o arquivo com Headers apropriados
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": fileMeta.data.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileMeta.data.name}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });

  } catch (error: unknown) {
    console.error("❌ [Docs Proxy] Crítico:", error);
    return new NextResponse("Falha ao processar o documento.", { status: 500 });
  }
}
