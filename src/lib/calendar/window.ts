import { formatInTimeZone } from "date-fns-tz";

/**
 * Fronteiras de consulta a `Calendar_Events`, no formato exato da chave `start`.
 *
 * `Calendar_Events.start` e uma string vinda do Google: "2026-07-21T17:30:00-03:00".
 * A comparacao no Firestore (`where("start", ">=", X)`) e LEXICOGRAFICA, entao a
 * fronteira precisa sair no MESMO formato e no MESMO fuso — senao "...Z" (UTC) e
 * "...-03:00" comparam como strings diferentes e a janela erra por horas. Foi a
 * mesma armadilha do `BUG-093`.
 *
 * O Brasil nao tem horario de verao desde 2019, entao o offset e sempre -03:00 e
 * a ordenacao lexicografica das chaves e valida.
 */
const TIMEZONE = "America/Sao_Paulo";
const KEY_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";

/** Instante `now` como chave de consulta — o piso de "eventos a partir de agora". */
export function eventStartKey(instant: Date): string {
  return formatInTimeZone(instant, TIMEZONE, KEY_FORMAT);
}
