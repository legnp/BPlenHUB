import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/google-auth";

/**
 * BPlen HUB — Media Proxy API 📸
 * Serve imagens públicas (como capas de produtos e avatares) contornando restrições de CORS e Hotlinking do Google Drive.
 * O processamento ocorre no servidor e a imagem é retornada com headers corretos.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params;

    // 1. Conectar ao Google Drive
    const drive = await getDriveClient();

    // 2. Buscar Metadados da Mídia (MimeType)
    const fileMeta = await drive.files.get({
      fileId,
      fields: "name, mimeType",
      supportsAllDrives: true,
    });

    // 3. Buscar Conteúdo Binário (Media Stream)
    const response = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    // 4. Converter Stream do Node para Web Stream (Next.js compatible)
    const stream = response.data as any;
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: any) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err: any) => controller.error(err));
      },
    });

    // 5. Retornar a imagem com Headers de Cache para performance
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": fileMeta.data.mimeType || "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache agressivo no client/CDN
      },
    });

  } catch (error: any) {
    console.error("❌ [Media Proxy] Falha ao carregar mídia:", error);
    return new NextResponse("Falha ao carregar mídia.", { status: 500 });
  }
}
