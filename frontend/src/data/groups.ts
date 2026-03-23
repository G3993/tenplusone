export interface Group {
  id: string;
  teams: string[];
  flags: string[];
}

export const GROUPS: Group[] = [
  { id:"A", teams:["Mexico","South Africa","South Korea","TBD (UEFA Path D)"], flags:["\ud83c\uddf2\ud83c\uddfd","\ud83c\uddff\ud83c\udde6","\ud83c\uddf0\ud83c\uddf7","\u2753"] },
  { id:"B", teams:["Canada","Switzerland","Qatar","TBD (UEFA Path A)"], flags:["\ud83c\udde8\ud83c\udde6","\ud83c\udde8\ud83c\udded","\ud83c\uddf6\ud83c\udde6","\u2753"] },
  { id:"C", teams:["Brazil","Morocco","Haiti","Scotland"], flags:["\ud83c\udde7\ud83c\uddf7","\ud83c\uddf2\ud83c\udde6","\ud83c\udded\ud83c\uddf9","\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc73\udb40\udc63\udb40\udc74\udb40\udc7f"] },
  { id:"D", teams:["United States","Paraguay","Australia","TBD (UEFA Path C)"], flags:["\ud83c\uddfa\ud83c\uddf8","\ud83c\uddf5\ud83c\uddfe","\ud83c\udde6\ud83c\uddfa","\u2753"] },
  { id:"E", teams:["Germany","Cura\u00e7ao","C\u00f4te d'Ivoire","Ecuador"], flags:["\ud83c\udde9\ud83c\uddea","\ud83c\udde8\ud83c\uddfc","\ud83c\udde8\ud83c\uddee","\ud83c\uddea\ud83c\udde8"] },
  { id:"F", teams:["Netherlands","Japan","Tunisia","TBD (UEFA Path B)"], flags:["\ud83c\uddf3\ud83c\uddf1","\ud83c\uddef\ud83c\uddf5","\ud83c\uddf9\ud83c\uddf3","\u2753"] },
  { id:"G", teams:["Belgium","Egypt","Iran","New Zealand"], flags:["\ud83c\udde7\ud83c\uddea","\ud83c\uddea\ud83c\uddec","\ud83c\uddee\ud83c\uddf7","\ud83c\uddf3\ud83c\uddff"] },
  { id:"H", teams:["Spain","Cabo Verde","Saudi Arabia","Uruguay"], flags:["\ud83c\uddea\ud83c\uddf8","\ud83c\udde8\ud83c\uddfb","\ud83c\uddf8\ud83c\udde6","\ud83c\uddfa\ud83c\uddfe"] },
  { id:"I", teams:["France","Senegal","Norway","TBD (IC Playoff 2)"], flags:["\ud83c\uddeb\ud83c\uddf7","\ud83c\uddf8\ud83c\uddf3","\ud83c\uddf3\ud83c\uddf4","\u2753"] },
  { id:"J", teams:["Argentina","Algeria","Austria","Jordan"], flags:["\ud83c\udde6\ud83c\uddf7","\ud83c\udde9\ud83c\uddff","\ud83c\udde6\ud83c\uddf9","\ud83c\uddef\ud83c\uddf4"] },
  { id:"K", teams:["Portugal","Colombia","Uzbekistan","TBD (IC Playoff 1)"], flags:["\ud83c\uddf5\ud83c\uddf9","\ud83c\udde8\ud83c\uddf4","\ud83c\uddfa\ud83c\uddff","\u2753"] },
  { id:"L", teams:["England","Croatia","Ghana","Panama"], flags:["\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f","\ud83c\udded\ud83c\uddf7","\ud83c\uddec\ud83c\udded","\ud83c\uddf5\ud83c\udde6"] },
];
