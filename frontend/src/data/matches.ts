export interface Match {
  id: string;
  d: string;
  grp: string;
  h: string;
  a: string;
  t: string;
  v: string;
  odds: [number, number, number];
}

export const MATCHES: Match[] = [
  { id:"m1", d:"Jun 11", grp:"A", h:"Mexico", a:"South Africa", t:"17:00 ET", v:"Estadio Azteca, Mexico City", odds:[1.45,4.20,7.50] },
  { id:"m2", d:"Jun 12", grp:"B", h:"Canada", a:"Türkiye", t:"12:00 ET", v:"BMO Field, Toronto", odds:[2.80,3.10,2.60] },
  { id:"m3", d:"Jun 12", grp:"D", h:"United States", a:"Paraguay", t:"18:00 ET", v:"SoFi Stadium, Los Angeles", odds:[1.55,3.80,6.00] },
  { id:"m4", d:"Jun 12", grp:"C", h:"Brazil", a:"Morocco", t:"21:00 ET", v:"AT&T Stadium, Dallas", odds:[1.90,3.30,4.20] },
  { id:"m5", d:"Jun 13", grp:"E", h:"Germany", a:"Cura\u00e7ao", t:"12:00 ET", v:"Gillette Stadium, Boston", odds:[1.10,9.00,25.0] },
  { id:"m6", d:"Jun 13", grp:"H", h:"Spain", a:"Cabo Verde", t:"15:00 ET", v:"MetLife Stadium, NJ", odds:[1.08,10.0,28.0] },
  { id:"m7", d:"Jun 13", grp:"F", h:"Netherlands", a:"Japan", t:"18:00 ET", v:"Arrowhead Stadium, KC", odds:[2.10,3.30,3.50] },
  { id:"m8", d:"Jun 13", grp:"A", h:"South Korea", a:"Bosnia and Herzegovina", t:"21:00 ET", v:"Estadio BBVA, Monterrey", odds:[2.40,3.20,3.00] },
  { id:"m9", d:"Jun 14", grp:"G", h:"Belgium", a:"Egypt", t:"12:00 ET", v:"NRG Stadium, Houston", odds:[1.70,3.60,5.00] },
  { id:"m10", d:"Jun 14", grp:"J", h:"Argentina", a:"Algeria", t:"15:00 ET", v:"Hard Rock Stadium, Miami", odds:[1.30,5.50,10.0] },
  { id:"m11", d:"Jun 14", grp:"I", h:"France", a:"Senegal", t:"18:00 ET", v:"Lumen Field, Seattle", odds:[1.60,3.80,5.50] },
  { id:"m12", d:"Jun 14", grp:"L", h:"England", a:"Croatia", t:"21:00 ET", v:"MetLife Stadium, NJ", odds:[1.85,3.40,4.40] },
  { id:"m13", d:"Jun 15", grp:"K", h:"Portugal", a:"Colombia", t:"15:00 ET", v:"AT&T Stadium, Dallas", odds:[2.00,3.30,3.80] },
  { id:"m14", d:"Jun 15", grp:"B", h:"Switzerland", a:"Qatar", t:"18:00 ET", v:"BMO Field, Toronto", odds:[1.65,3.70,5.50] },
  { id:"m15", d:"Jun 15", grp:"D", h:"Australia", a:"Czechia", t:"21:00 ET", v:"Levi's Stadium, SF", odds:[3.20,3.20,2.30] },
  { id:"m16", d:"Jun 16", grp:"C", h:"Haiti", a:"Scotland", t:"12:00 ET", v:"NRG Stadium, Houston", odds:[4.50,3.50,1.80] },
  { id:"m17", d:"Jun 16", grp:"E", h:"C\u00f4te d'Ivoire", a:"Ecuador", t:"15:00 ET", v:"Lincoln Financial, Philly", odds:[2.50,3.20,2.90] },
  { id:"m18", d:"Jun 16", grp:"H", h:"Saudi Arabia", a:"Uruguay", t:"18:00 ET", v:"Hard Rock Stadium, Miami", odds:[4.50,3.50,1.80] },
  { id:"m19", d:"Jun 16", grp:"F", h:"Tunisia", a:"Sweden", t:"21:00 ET", v:"AT&T Stadium, Dallas", odds:[3.50,3.20,2.10] },
  { id:"m20", d:"Jun 17", grp:"G", h:"Iran", a:"New Zealand", t:"12:00 ET", v:"Mercedes-Benz, Atlanta", odds:[1.70,3.50,5.20] },
  { id:"m21", d:"Jun 17", grp:"I", h:"Norway", a:"DR Congo", t:"15:00 ET", v:"Levi's Stadium, SF", odds:[1.35,5.00,9.00] },
  { id:"m22", d:"Jun 17", grp:"J", h:"Austria", a:"Jordan", t:"18:00 ET", v:"Mercedes-Benz, Atlanta", odds:[1.50,4.00,7.00] },
  { id:"m23", d:"Jun 17", grp:"K", h:"Uzbekistan", a:"Iraq", t:"21:00 ET", v:"Arrowhead Stadium, KC", odds:[2.20,3.30,3.30] },
  { id:"m24", d:"Jun 17", grp:"L", h:"Ghana", a:"Panama", t:"18:00 ET", v:"Lincoln Financial, Philly", odds:[2.00,3.40,3.80] },
];

export interface Outright {
  team: string;
  flag: string;
  odds: string;
}

export const OUTRIGHTS: Outright[] = [
  { team:"Spain", flag:"\ud83c\uddea\ud83c\uddf8", odds:"+450" },
  { team:"England", flag:"\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f", odds:"+550" },
  { team:"France", flag:"\ud83c\uddeb\ud83c\uddf7", odds:"+750" },
  { team:"Brazil", flag:"\ud83c\udde7\ud83c\uddf7", odds:"+750" },
  { team:"Argentina", flag:"\ud83c\udde6\ud83c\uddf7", odds:"+800" },
  { team:"Germany", flag:"\ud83c\udde9\ud83c\uddea", odds:"+1200" },
  { team:"Portugal", flag:"\ud83c\uddf5\ud83c\uddf9", odds:"+1400" },
  { team:"Netherlands", flag:"\ud83c\uddf3\ud83c\uddf1", odds:"+1800" },
  { team:"Belgium", flag:"\ud83c\udde7\ud83c\uddea", odds:"+2500" },
  { team:"Uruguay", flag:"\ud83c\uddfa\ud83c\uddfe", odds:"+4000" },
  { team:"Colombia", flag:"\ud83c\udde8\ud83c\uddf4", odds:"+5000" },
  { team:"United States", flag:"\ud83c\uddfa\ud83c\uddf8", odds:"+6600" },
];

export interface MerchItem {
  id: string;
  name: string;
  desc: string;
  price: number;
}

export const MERCH: MerchItem[] = [
  { id:"p1", name:"World Cup Mug", desc:"32oz ceramic, all 48 crests", price:1800 },
  { id:"p2", name:"Terminal Tee", desc:"100% cotton, runs true", price:2800 },
  { id:"p3", name:"Team Scarf", desc:"knit scarf, pick your nation", price:2400 },
  { id:"p4", name:"Team Cap", desc:"adjustable, embroidered crest", price:2200 },
  { id:"p5", name:"Sticker Pack", desc:"48 crests, holographic", price:800 },
  { id:"p6", name:"Team Jersey", desc:"replica kit, all sizes", price:4500 },
];
