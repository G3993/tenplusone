import { GERMANY_PIXELS } from './germany.ts';
import { FRANCE_PIXELS } from './france.ts';
import { NETHERLANDS_PIXELS } from './netherlands.ts';
import { MEXICO_PIXELS } from './mexico.ts';
import { SOUTH_AFRICA_PIXELS } from './south-africa.ts';
import { SOUTH_KOREA_PIXELS } from './south-korea.ts';
import { CANADA_PIXELS } from './canada.ts';
import { SWITZERLAND_PIXELS } from './switzerland.ts';
import { QATAR_PIXELS } from './qatar.ts';
import { BELGIUM_PIXELS } from './belgium.ts';
import { EGYPT_PIXELS } from './egypt.ts';
import { IRAN_PIXELS } from './iran.ts';
import { NEW_ZEALAND_PIXELS } from './new-zealand.ts';
import { SPAIN_PIXELS } from './spain.ts';
import { CABO_VERDE_PIXELS } from './cabo-verde.ts';
import { SAUDI_ARABIA_PIXELS } from './saudi-arabia.ts';
import { URUGUAY_PIXELS } from './uruguay.ts';
import { PORTUGAL_PIXELS } from './portugal.ts';
import { COLOMBIA_PIXELS } from './colombia.ts';
import { UZBEKISTAN_PIXELS } from './uzbekistan.ts';
import { ENGLAND_PIXELS } from './england.ts';
import { CROATIA_PIXELS } from './croatia.ts';
import { GHANA_PIXELS } from './ghana.ts';
import { PANAMA_PIXELS } from './panama.ts';
import { CURACAO_PIXELS } from './curacao.ts';
import { COTE_D_IVOIRE_PIXELS } from './cote-d-ivoire.ts';
import { ECUADOR_PIXELS } from './ecuador.ts';
import { JAPAN_PIXELS } from './japan.ts';
import { TUNISIA_PIXELS } from './tunisia.ts';
import { SENEGAL_PIXELS } from './senegal.ts';
import { NORWAY_PIXELS } from './norway.ts';
import { ARGENTINA_PIXELS } from './argentina.ts';
import { ALGERIA_PIXELS } from './algeria.ts';
import { AUSTRIA_PIXELS } from './austria.ts';
import { JORDAN_PIXELS } from './jordan.ts';
import { BRAZIL_PIXELS } from './brazil.ts';
import { MOROCCO_PIXELS } from './morocco.ts';
import { HAITI_PIXELS } from './haiti.ts';
import { SCOTLAND_PIXELS } from './scotland.ts';
import { UNITED_STATES_PIXELS } from './united-states.ts';
import { PARAGUAY_PIXELS } from './paraguay.ts';
import { AUSTRALIA_PIXELS } from './australia.ts';
import { ITALY_PIXELS } from './italy.ts';
import { VENEZUELA_PIXELS } from './venezuela.ts';
import { CZECHIA_PIXELS } from './czechia.ts';
import { BOSNIA_HERZEGOVINA_PIXELS } from './bosnia-herzegovina.ts';
import { TURKIYE_PIXELS } from './turkiye.ts';
import { SWEDEN_PIXELS } from './sweden.ts';
import { IRAQ_PIXELS } from './iraq.ts';
import { DR_CONGO_PIXELS } from './dr-congo.ts';
import { getPlaceholderPixels } from './placeholder.ts';

const REAL_LOGOS: Record<string, number[]> = {
  germany: GERMANY_PIXELS,
  france: FRANCE_PIXELS,
  netherlands: NETHERLANDS_PIXELS,
  mexico: MEXICO_PIXELS,
  'south-africa': SOUTH_AFRICA_PIXELS,
  'south-korea': SOUTH_KOREA_PIXELS,
  canada: CANADA_PIXELS,
  switzerland: SWITZERLAND_PIXELS,
  qatar: QATAR_PIXELS,
  belgium: BELGIUM_PIXELS,
  egypt: EGYPT_PIXELS,
  iran: IRAN_PIXELS,
  'new-zealand': NEW_ZEALAND_PIXELS,
  spain: SPAIN_PIXELS,
  'cabo-verde': CABO_VERDE_PIXELS,
  'saudi-arabia': SAUDI_ARABIA_PIXELS,
  uruguay: URUGUAY_PIXELS,
  portugal: PORTUGAL_PIXELS,
  colombia: COLOMBIA_PIXELS,
  uzbekistan: UZBEKISTAN_PIXELS,
  england: ENGLAND_PIXELS,
  croatia: CROATIA_PIXELS,
  ghana: GHANA_PIXELS,
  panama: PANAMA_PIXELS,
  curacao: CURACAO_PIXELS,
  'cote-d-ivoire': COTE_D_IVOIRE_PIXELS,
  ecuador: ECUADOR_PIXELS,
  japan: JAPAN_PIXELS,
  tunisia: TUNISIA_PIXELS,
  senegal: SENEGAL_PIXELS,
  norway: NORWAY_PIXELS,
  argentina: ARGENTINA_PIXELS,
  algeria: ALGERIA_PIXELS,
  austria: AUSTRIA_PIXELS,
  jordan: JORDAN_PIXELS,
  brazil: BRAZIL_PIXELS,
  morocco: MOROCCO_PIXELS,
  haiti: HAITI_PIXELS,
  scotland: SCOTLAND_PIXELS,
  'united-states': UNITED_STATES_PIXELS,
  paraguay: PARAGUAY_PIXELS,
  australia: AUSTRALIA_PIXELS,
  italy: ITALY_PIXELS,
  venezuela: VENEZUELA_PIXELS,
  czechia: CZECHIA_PIXELS,
  'bosnia-herzegovina': BOSNIA_HERZEGOVINA_PIXELS,
  turkiye: TURKIYE_PIXELS,
  sweden: SWEDEN_PIXELS,
  iraq: IRAQ_PIXELS,
  'dr-congo': DR_CONGO_PIXELS,
};

export function getLogoPixels(slug: string, fallbackLetter: string): number[] {
  return REAL_LOGOS[slug] || getPlaceholderPixels(fallbackLetter);
}

export {
  GERMANY_PIXELS,
  FRANCE_PIXELS,
  NETHERLANDS_PIXELS,
  MEXICO_PIXELS,
  SOUTH_AFRICA_PIXELS,
  SOUTH_KOREA_PIXELS,
  CANADA_PIXELS,
  SWITZERLAND_PIXELS,
  QATAR_PIXELS,
  BELGIUM_PIXELS,
  EGYPT_PIXELS,
  IRAN_PIXELS,
  NEW_ZEALAND_PIXELS,
  SPAIN_PIXELS,
  CABO_VERDE_PIXELS,
  SAUDI_ARABIA_PIXELS,
  URUGUAY_PIXELS,
  PORTUGAL_PIXELS,
  COLOMBIA_PIXELS,
  UZBEKISTAN_PIXELS,
  ENGLAND_PIXELS,
  CROATIA_PIXELS,
  GHANA_PIXELS,
  PANAMA_PIXELS,
  CURACAO_PIXELS,
  COTE_D_IVOIRE_PIXELS,
  ECUADOR_PIXELS,
  JAPAN_PIXELS,
  TUNISIA_PIXELS,
  SENEGAL_PIXELS,
  NORWAY_PIXELS,
  ARGENTINA_PIXELS,
  ALGERIA_PIXELS,
  AUSTRIA_PIXELS,
  JORDAN_PIXELS,
  BRAZIL_PIXELS,
  MOROCCO_PIXELS,
  HAITI_PIXELS,
  SCOTLAND_PIXELS,
  UNITED_STATES_PIXELS,
  PARAGUAY_PIXELS,
  AUSTRALIA_PIXELS,
  CZECHIA_PIXELS,
  BOSNIA_HERZEGOVINA_PIXELS,
  TURKIYE_PIXELS,
  SWEDEN_PIXELS,
  IRAQ_PIXELS,
  DR_CONGO_PIXELS,
  getPlaceholderPixels,
};
