export interface Group {
  id: string;
  teams: string[];
  flags: string[];
}

// Real 2026 FIFA World Cup group draw (final draw, Washington D.C., Dec 5 2025;
// UEFA + inter-confederation playoff winners resolved Mar 2026).
// Team names match the display names in teams.ts exactly.
export const GROUPS: Group[] = [
  { id:"A", teams:["Mexico","South Africa","South Korea","Czechia"], flags:["🇲🇽","🇿🇦","🇰🇷","🇨🇿"] },
  { id:"B", teams:["Canada","Bosnia","Qatar","Switzerland"], flags:["🇨🇦","🇧🇦","🇶🇦","🇨🇭"] },
  { id:"C", teams:["Brazil","Morocco","Haiti","Scotland"], flags:["🇧🇷","🇲🇦","🇭🇹","🏴󠁧󠁢󠁳󠁣󠁴󠁿"] },
  { id:"D", teams:["USA","Paraguay","Australia","Turkey"], flags:["🇺🇸","🇵🇾","🇦🇺","🇹🇷"] },
  { id:"E", teams:["Germany","Curacao","Ivory Coast","Ecuador"], flags:["🇩🇪","🇨🇼","🇨🇮","🇪🇨"] },
  { id:"F", teams:["Netherlands","Japan","Sweden","Tunisia"], flags:["🇳🇱","🇯🇵","🇸🇪","🇹🇳"] },
  { id:"G", teams:["Belgium","Egypt","Iran","New Zealand"], flags:["🇧🇪","🇪🇬","🇮🇷","🇳🇿"] },
  { id:"H", teams:["Spain","Cabo Verde","Saudi Arabia","Uruguay"], flags:["🇪🇸","🇨🇻","🇸🇦","🇺🇾"] },
  { id:"I", teams:["France","Senegal","Iraq","Norway"], flags:["🇫🇷","🇸🇳","🇮🇶","🇳🇴"] },
  { id:"J", teams:["Argentina","Algeria","Austria","Jordan"], flags:["🇦🇷","🇩🇿","🇦🇹","🇯🇴"] },
  { id:"K", teams:["Portugal","Dr Congo","Uzbekistan","Colombia"], flags:["🇵🇹","🇨🇩","🇺🇿","🇨🇴"] },
  { id:"L", teams:["England","Croatia","Ghana","Panama"], flags:["🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇭🇷","🇬🇭","🇵🇦"] },
];
