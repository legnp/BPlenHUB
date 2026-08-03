import { headers } from "next/headers";
import { deviceTypeFromUserAgent } from "@/lib/consent/consent";

/**
 * BPlen HUB — Prova de contexto da requisicao (IP, geo aproximada, dispositivo).
 *
 * O mesmo bloco de captura estava copiado em `consent.ts` e `legal.ts`, e cada
 * novo registro com valor probatorio (cookies, acessos) copiaria de novo. Aqui a
 * leitura dos headers de edge fica numa fonte unica.
 *
 * Nao-invasiva por construcao: usa apenas headers que a borda ja anexa a
 * requisicao. Nao consulta servico de geolocalizacao, nao le GPS e nao cria
 * identificador novo — e o mesmo nivel de dado que o carimbo de contrato ja
 * registrava antes desta extracao.
 */

export interface RequestGeo {
  country: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
}

export interface RequestProof {
  ip: string;
  userAgent: string;
  deviceType: string;
  geo: RequestGeo;
  /** Geo achatada em texto ("Sao Paulo/SP, BR") para celula de planilha. */
  location: string;
  capturedAt: Date;
}

/** Headers de edge chegam percent-encoded; decodifica sem quebrar valor cru. */
function decodeHeader(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function formatGeoLocation(geo: RequestGeo): string {
  const cityRegion = [geo.city, geo.region].filter(Boolean).join("/");
  return [cityRegion, geo.country].filter(Boolean).join(", ");
}

export async function captureRequestProof(): Promise<RequestProof> {
  const hdrs = await headers();

  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "desconhecido";
  const userAgent = hdrs.get("user-agent") || "desconhecido";

  const geo: RequestGeo = {
    country: hdrs.get("x-vercel-ip-country") || "",
    region: decodeHeader(hdrs.get("x-vercel-ip-country-region")),
    city: decodeHeader(hdrs.get("x-vercel-ip-city")),
    latitude: hdrs.get("x-vercel-ip-latitude") || "",
    longitude: hdrs.get("x-vercel-ip-longitude") || "",
  };

  return {
    ip,
    userAgent,
    deviceType: deviceTypeFromUserAgent(userAgent),
    geo,
    location: formatGeoLocation(geo),
    capturedAt: new Date(),
  };
}
