// @ts-nocheck
/* Ported verbatim from the iFC generator (Downloads/teams 2/index.html) — the
   2D-canvas motif render engine. Keep in sync with the generator so the live
   site matches the print exports. Re-extract on any generator change. */
import { ROSTERS } from '../../data/rosters';

    const GRID = 32, MARGIN = 2;

    // ----- Fill-mode pattern engine (adapted from IFC Pixel Logo Generator) -----
    const PATTERN_COLORS = ['#e10600', '#23599a', '#11864a', '#f5bd19', '#050505'];
    const SPECTRUM_COLORS = ['#ff003c', '#ff7a00', '#ffe600', '#00d084', '#00e5ff', '#0057ff', '#050505'];
    const INTERNET_COLORS = ['#050505', '#23599a', '#11864a', '#e10600'];
    // Two flag-accurate colors per nation, keyed by team SLUG (must match
    // teams.ts slugs exactly). Monochrome (single color) where the country's
    // identity is one color — e.g. Japan/Switzerland/Canada (red+white flags),
    // Saudi Arabia (green). No black: the engine strips it anyway.
    const TEAM_PALETTES = {
        mexico:['#006847','#ce1126'], 'south-africa':['#007a4d','#ffb915'], 'south-korea':['#cd2e3a','#0047a0'],
        czechia:['#11457e','#d7141a'], canada:['#d80621'], 'bosnia-herzegovina':['#002395','#fecb00'],
        qatar:['#8a1538'], switzerland:['#d52b1e'], brazil:['#009b3a','#ffdf00'],
        morocco:['#c1272d','#006233'], haiti:['#00209f','#d21034'], scotland:['#005eb8'],
        'united-states':['#0a3161','#b31942'], paraguay:['#0038a8','#d52b1e'], australia:['#ffcd00','#00843d'],
        turkiye:['#e30a17'], germany:['#dd0000','#ffce00'], curacao:['#002b7f','#f9e814'],
        ecuador:['#ffdd00','#034ea2'], netherlands:['#ff4f00','#21468b'], japan:['#bc002d'],
        sweden:['#006aa7','#fecc00'], tunisia:['#e70013'], belgium:['#fae042','#ed2939'],
        egypt:['#ce1126','#c09300'], iran:['#239f40','#da0000'], 'new-zealand':['#00247d','#cc142b'],
        spain:['#aa151b','#f1bf00'], 'cabo-verde':['#003893','#cf2027'], 'saudi-arabia':['#006c35'],
        uruguay:['#0038a8','#fcd116'], france:['#0055a4','#ef4135'], senegal:['#00853f','#fdef42'],
        iraq:['#ce1126','#007a3d'], norway:['#ba0c2f','#00205b'], argentina:['#75aadb','#f6b40e'],
        algeria:['#006233','#d21034'], austria:['#ed2939'], jordan:['#ce1126','#007a3d'],
        portugal:['#006600','#ff0000'], 'dr-congo':['#007fff','#ce1021'], uzbekistan:['#0099b5','#1eb53a'],
        colombia:['#fcd116','#003893'], england:['#ce1124','#00247d'], croatia:['#ff0000','#171796'],
        ghana:['#ce1126','#fcd116'], panama:['#072357','#da121a'], 'cote-d-ivoire':['#f77f00','#009e60'],
    };
    let activeFill = 'solid';
    const DEFAULT_STATS = { passes:486, possession:58, goals:2, shots:6, corners:5, cards:2, offsides:3, fouls:11, saves:4, var:2 };
    let matchStats = { ...DEFAULT_STATS };
    let scorers = []; // shirt numbers of goal scorers -> number tiles in the Stats grass-minesweeper

    // Latest generator: match stats -> normalized 0..1 design params. Drives the
    // Solid, Team 3D and Stats treatments so they respond to the actual game.
    function statParams() {
        const s = matchStats;
        const c = (v) => Math.max(0, Math.min(1, v));
        return {
            colorAmount: c(s.possession / 100),
            density: c(s.passes / 700),
            thickness: c(s.shots / 20),
            complexity: c(s.goals / 6),
            variety: c(s.corners / 12),
            warmAccent: c(s.cards / 8),
            scatter: c(s.offsides / 10),
            contrast: c(s.fouls / 25),
            speed: c((s.shots + s.goals * 3 + s.fouls / 3) / 25),
            raw: s,
        };
    }
    let fillSeed = 1;
    let fluidTime = 0;
    let frameAnimate = false;
    let fillBgDark = false;
    let shapeMode = 'square'; // 'square' | 'circle' | 'outline' | 'pixels' // toggle black/white background on FILL diagram

    function pseed(idx, seed) {
        const x = idx % GRID, y = Math.floor(idx / GRID);
        return Math.abs((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791));
    }
    function teamSeed(id) { return Array.from(id).reduce((t, c) => t + c.charCodeAt(0), 0); }
    function teamPaletteFor(id) {
        // Team colors must not use black — strip it from every palette.
        const BLACK = new Set(['#050505', '#000000', '#111111']);
        if (TEAM_PALETTES[id]) {
            const p = TEAM_PALETTES[id].filter(c => !BLACK.has(c));
            return p.length ? p : TEAM_PALETTES[id];
        }
        const base = PATTERN_COLORS.filter(c => c !== '#050505');
        const off = teamSeed(id) % base.length;
        return [base[off], base[(off + 2) % base.length]];
    }
    function matchStatForPixel(idx, seed) {
        const w = [
            ['passes', Math.max(1, Math.round(matchStats.passes / 28))],
            ['possession', Math.max(1, Math.round(matchStats.possession / 8))],
            ['goals', Math.max(0, matchStats.goals * 8)],
            ['shots', Math.max(1, matchStats.shots * 3)],
            ['corners', Math.max(1, matchStats.corners * 2)],
            ['cards', Math.max(0, matchStats.cards * 4)],
            ['offsides', Math.max(0, matchStats.offsides * 3)],
            ['fouls', Math.max(1, matchStats.fouls * 2)],
            ['saves', Math.max(0, (matchStats.saves||0) * 4)],
            ['var', Math.max(0, (matchStats.var||0) * 5)],
        ];
        const total = w.reduce((s, [, v]) => s + v, 0);
        let cur = pseed(idx, seed) % Math.max(1, total);
        for (const [k, v] of w) { cur -= v; if (cur < 0) return k; }
        return 'passes';
    }
    const MATCH_STAT_COLOR = { passes:'#23599a', possession:'#11864a', goals:'#e10600', shots:'#f5bd19', corners:'#00d084', cards:'#f5bd19', offsides:'#0057ff', fouls:'#050505', saves:'#9333ea', var:'#111827' };
    // Random contiguous COLOR PATCHES for Team Colors (not per-pixel speckle, not checker).
    // Voronoi-style: scatter seed points, each pixel takes the nearest seed's color index.
    let _patchSeeds = null, _patchSeedKey = '';
    function teamPatchIndex(idx, nColors) {
        const key = fillSeed + ':' + nColors;
        if (_patchSeedKey !== key) {
            _patchSeedKey = key;
            _patchSeeds = [];
            const n = Math.max(nColors * 3, 9); // several patches per color
            for (let i = 0; i < n; i++) {
                _patchSeeds.push({
                    c: pseed(i * 7 + 1, fillSeed) % GRID,
                    r: pseed(i * 7 + 3, fillSeed) % GRID,
                    col: pseed(i * 13 + 5, fillSeed) % nColors,
                });
            }
        }
        const c = idx % GRID, r = Math.floor(idx / GRID);
        let best = 0, bestD = Infinity;
        for (const s of _patchSeeds) {
            const dc = c - s.c, dr = r - s.r;
            const d = dc*dc + dr*dr;
            if (d < bestD) { bestD = d; best = s.col; }
        }
        return best;
    }
    // Per-pixel color for the active fill mode. idx is 0-based.
    function fillColor(idx, teamId) {
        switch (activeFill) {
            case 'solid': return fillBgDark ? '#eeeeee' : '#111111';
            case 'teamColors': { const p = teamPaletteFor(teamId); return p[teamPatchIndex(idx, p.length)]; }
            
            case 'stats': return '#16a34a';
            case 'sweep': return '#c0c0c0';
            case 'pattern': return '#4338ca';
            case 'abstract': return '#3cb878';
            case 'bauhaus': return '#e8552d';
            case 'chrome': return '#8899aa';
            case 'spectrum': return SPECTRUM_COLORS[pseed(idx, fillSeed) % SPECTRUM_COLORS.length];
            case 'patchwork': return PATTERN_COLORS[pseed(idx, fillSeed) % PATTERN_COLORS.length];
            case 'sweep': return 'plain';
            case 'pattern': return 'plain';
            case 'abstract': return 'plain';
            case 'bauhaus': return 'plain';
            case 'chrome': return 'plain';
            case 'sweep': return '#c0c0c0';
            case 'pattern': return '#4338ca';
            case 'abstract': return '#3cb878';
            case 'bauhaus': return '#e8552d';
            case 'chrome': return '#8899aa';
            case 'internet': return INTERNET_COLORS[pseed(idx, fillSeed) % INTERNET_COLORS.length];
            case 'lines': {
                // Approximate: map row position through sunset palette
                const row = Math.floor(idx / GRID);
                const t = row / GRID;
                const palette = [[10,10,30],[20,60,180],[60,140,255],[220,140,220],[255,255,255],[255,200,60],[255,140,20],[220,50,10],[10,10,30]];
                const pos = t * (palette.length - 1), i = Math.floor(pos), f = pos - i;
                const a = palette[i], b = palette[Math.min(i+1, palette.length-1)];
                return `rgb(${Math.round(a[0]+(b[0]-a[0])*f)},${Math.round(a[1]+(b[1]-a[1])*f)},${Math.round(a[2]+(b[2]-a[2])*f)})`;
            }
            default: return '#111111';
        }
    }

    // Player surnames used by the Abstract motif's name-label layer.
    const PLAYER_NAMES = ['MESSI','RONALDO','MBAPPÉ','HAALAND','NEYMAR','MODRIĆ','DE BRUYNE','KANE','BENZEMA','SALAH','SON','VINICIUS','BELLINGHAM','GRIEZMANN','LEWANDOWSKI','PEDRI','RICE','SAKA','FODEN','MARTÍNEZ','DI MARÍA','RÜDIGER','KIMMICH','ØDEGAARD'];

    // ----- Motif layer: a tiny glyph drawn inside each filled pixel -----
    const SYMBOL_MOTIFS = ['plus','ring','slash','spark'];
    const INTERNET_MOTIFS = ['0','1','2','3','4','5','6','7','8','9','10','11','12','23','42','99','\u2192','\u2190','\u2191','\u2193','#','@','//','*','\u00A7','\u221E','\u2261','+','=','~','^','|','\u03BB','\u03C0','\u03A3','!','?','&'];
    // Internet ('ascii') fill: source the glyphs from the team's real squad \u2014
    // jersey numbers plus the letters of each player's surname \u2014 so the matrix
    // spells out that nation's roster instead of random symbols. Falls back to
    // the generic glyph set for any team without roster data.
    const _rosterTokenCache = {};
    function rosterTokens(teamId) {
        if (_rosterTokenCache[teamId]) return _rosterTokenCache[teamId];
        const roster = (teamId && ROSTERS[teamId]) || null;
        if (!roster || !roster.length) return (_rosterTokenCache[teamId] = INTERNET_MOTIFS);
        const toks = [];
        for (const p of roster) {
            if (p.n != null) toks.push(String(p.n));
            const surname = (p.name || '').trim().split(/\s+/).pop() || '';
            for (const ch of surname.toUpperCase()) {
                if (/[0-9A-Z\u00C0-\u00D6\u00D8-\u00DE]/.test(ch)) toks.push(ch);
            }
        }
        return (_rosterTokenCache[teamId] = toks.length ? toks : INTERNET_MOTIFS);
    }
    const MATCH_STAT_MOTIF = { passes:'pass', possession:'possession', goals:'goal', shots:'shot', corners:'corner', cards:'card', offsides:'offside', fouls:'foul' };
    function motifForPixel(idx, teamId) {
        switch (activeFill) {
            case 'solid':
            case 'teamColors': return 'plain';
            case 'spectrum': return pseed(idx, fillSeed) % 4 === 0 ? 'slash' : 'plain';
            case 'patchwork': return pseed(idx, fillSeed) % 3 === 0 ? 'checker' : 'plain';
            case 'internet': { const toks = rosterTokens(teamId); return toks[pseed(idx, fillSeed) % toks.length]; }
            case 'lines': return 'plain';
            default: return 'plain';
        }
    }
    // Draw a glyph in cell at (x,y) of given size. Color = base pixel color; ink chosen for contrast.
    function drawMotif(ctx, x, y, s, motif, baseColor) {
        if (motif === 'plain') return;
        const light = ['#f5bd19','#ffcd00','#ffce00','#f1bf00','#ffe600','#fae042','#fcd116','#ffdf00','#ffd400'];
        const ink = light.includes(baseColor) ? '#050505' : '#ffffff';

        // Internet glyphs: render as text characters. Anything that isn't a
        // known vector-shape motif is treated as a text token (covers the
        // generic glyph set and the per-team roster names/numbers).
        const SHAPE_MOTIFS = ['plus','ring','slash','spark','checker','pass','possession','goal','shot','corner','card','offside','foul'];
        if (!SHAPE_MOTIFS.includes(motif)) {
            ctx.save();
            ctx.fillStyle = ink;
            ctx.font = `bold ${Math.round(s * 0.55)}px "JetBrains Mono", "SF Mono", "Fira Code", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.88;
            ctx.fillText(motif, x + s / 2, y + s / 2 + s * 0.02);
            ctx.restore();
            return;
        }

        ctx.fillStyle = ink;
        const r = (a,b,w,h) => ctx.fillRect(x+s*a, y+s*b, s*w, s*h);
        switch (motif) {
            case 'plus': r(0.42,0.18,0.18,0.64); r(0.18,0.42,0.64,0.18); break;
            case 'ring': r(0.18,0.18,0.64,0.14); r(0.18,0.68,0.64,0.14); r(0.18,0.18,0.14,0.64); r(0.68,0.18,0.14,0.64); break;
            case 'slash': for(let o=-1;o<2;o+=0.34){ ctx.fillRect(x+s*o, y, s*0.16, s); } break;
            case 'spark': r(0.42,0.12,0.16,0.76); r(0.12,0.42,0.76,0.16); break;
            case 'pass': {
                // Chevrons >>
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.1); ctx.lineCap = 'round';
                for (let i = 0; i < 3; i++) {
                    const ox = s * (0.18 + i * 0.22);
                    ctx.beginPath(); ctx.moveTo(x + ox, y + s * 0.22); ctx.lineTo(x + ox + s * 0.16, y + s * 0.5); ctx.lineTo(x + ox, y + s * 0.78); ctx.stroke();
                } break;
            }
            case 'possession': {
                // Concentric circles
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.08);
                for (let r = s * 0.14; r <= s * 0.42; r += s * 0.14) {
                    ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, r, 0, Math.PI * 2); ctx.stroke();
                }
                ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.05, 0, Math.PI * 2); ctx.fill();
                break;
            }
            case 'goal': {
                // Net grid
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.06);
                const step = s / 5;
                for (let i = 1; i < 5; i++) {
                    ctx.beginPath(); ctx.moveTo(x + s * 0.12, y + s * 0.12 + i * step * 0.76); ctx.lineTo(x + s * 0.88, y + s * 0.12 + i * step * 0.76); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x + s * 0.12 + i * step * 0.76, y + s * 0.12); ctx.lineTo(x + s * 0.12 + i * step * 0.76, y + s * 0.88); ctx.stroke();
                }
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.08);
                ctx.strokeRect(x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.76);
                break;
            }
            case 'shot': {
                // Crosshair
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.08);
                ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.32, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x + s / 2, y + s * 0.08); ctx.lineTo(x + s / 2, y + s * 0.92); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x + s * 0.08, y + s / 2); ctx.lineTo(x + s * 0.92, y + s / 2); ctx.stroke();
                ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * 0.06, 0, Math.PI * 2); ctx.fill();
                break;
            }
            case 'corner': {
                // Quarter arcs from top-left corner
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.08); ctx.lineCap = 'round';
                for (let r = s * 0.2; r <= s * 0.7; r += s * 0.16) {
                    ctx.beginPath(); ctx.arc(x + s * 0.1, y + s * 0.1, r, 0, Math.PI / 2); ctx.stroke();
                }
                break;
            }
            case 'card': {
                // Solid upright card rectangle
                r(0.32, 0.12, 0.36, 0.76);
                break;
            }
            case 'offside': {
                // Dashed vertical line + two offset dots
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.06);
                ctx.setLineDash([s * 0.08, s * 0.06]);
                ctx.beginPath(); ctx.moveTo(x + s / 2, y + s * 0.08); ctx.lineTo(x + s / 2, y + s * 0.92); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = ink;
                ctx.beginPath(); ctx.arc(x + s * 0.28, y + s * 0.42, s * 0.08, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(x + s * 0.72, y + s * 0.58, s * 0.08, 0, Math.PI * 2); ctx.fill();
                break;
            }
            case 'foul': {
                // Bold X mark
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.14); ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(x + s * 0.18, y + s * 0.18); ctx.lineTo(x + s * 0.82, y + s * 0.82); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x + s * 0.82, y + s * 0.18); ctx.lineTo(x + s * 0.18, y + s * 0.82); ctx.stroke();
                break;
            }
        }
    }

    // ----- B+W renderer -----
    // Monochromatic radial: each filled cell is a 3D-shaded sphere/disc.
    // Shade maps radially from logo center (darkest) to edges (lightest).
    // Each disc has a subtle highlight for a glossy spherical feel.
    function renderFluid(canvas, pixels, opts = {}) {
        const cell = opts.cell || 10;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;

        ctx.fillStyle = opts.bg || '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // Find the bounding box center of filled pixels for the radial origin
        let minC = GRID, maxC = 0, minR = GRID, maxR = 0;
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1, col = idx % GRID, row = Math.floor(idx / GRID);
            minC = Math.min(minC, col); maxC = Math.max(maxC, col);
            minR = Math.min(minR, row); maxR = Math.max(maxR, row);
        }
        const centerCol = (minC + maxC) / 2, centerRow = (minR + maxR) / 2;
        const maxDist = Math.sqrt((maxC - minC) ** 2 + (maxR - minR) ** 2) / 2 || 1;

        const dark = (opts.bg || '#ffffff') === '#111111';

        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1, col = idx % GRID, row = Math.floor(idx / GRID);

            const dist = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2) / maxDist;
            const breathe = animate ? Math.sin(t * 1.2 + idx * 0.15) * 0.08 : 0;
            const d = Math.min(1, Math.max(0, dist + breathe));

            // On white bg: center=dark, edge=light. On dark bg: center=bright, edge=dim.
            const baseShade = dark ? (240 - d * 180) : (20 + d * 190);
            const opacity = 1.0 - d * 0.55;

            const cx = col * cell + cell / 2;
            const cy = row * cell + cell / 2;
            const r = cell * 0.48;

            // Disc body — radial gradient for 3D spherical shading
            const gray = Math.round(baseShade);
            const darkGray = Math.max(0, gray - 40);
            const lightGray = Math.min(255, gray + 50);
            const grad = ctx.createRadialGradient(
                cx - r * 0.25, cy - r * 0.3, r * 0.05,  // highlight offset (upper-left)
                cx, cy, r
            );
            grad.addColorStop(0, `rgba(${lightGray},${lightGray},${lightGray},${opacity.toFixed(2)})`);
            grad.addColorStop(0.6, `rgba(${gray},${gray},${gray},${opacity.toFixed(2)})`);
            grad.addColorStop(1, `rgba(${darkGray},${darkGray},${darkGray},${opacity.toFixed(2)})`);

            if (shapeMode === 'outline' || shapeMode === 'pixels') {
                // Outlined circle with radial shade as stroke color
                ctx.strokeStyle = `rgba(${gray},${gray},${gray},${opacity.toFixed(2)})`;
                ctx.lineWidth = Math.max(1, cell * 0.08);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Render a team's flat logo onto a canvas.
    // ----- Lines renderer -----
    // Each column of filled pixels becomes a vertical gradient stripe with
    // sunset/aurora palette. Center columns darker, edges lighter. Animated: gradient scrolls.
    function renderLines(canvas, pixels, opts = {}) {
        const cell = opts.cell || 10;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;

        ctx.fillStyle = opts.bg || '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // Aurora/sunset palette stops
        const palette = [
            [10, 10, 30],     // deep navy
            [20, 60, 180],    // blue
            [60, 140, 255],   // bright blue
            [220, 140, 220],  // pink
            [255, 255, 255],  // white
            [255, 200, 60],   // gold
            [255, 140, 20],   // orange
            [220, 50, 10],    // red-orange
            [10, 10, 30],     // deep navy again (loop)
        ];
        function lerpColor(t) {
            const ct = ((t % 1) + 1) % 1;
            const pos = ct * (palette.length - 1);
            const i = Math.floor(pos), f = pos - i;
            const a = palette[i], b = palette[Math.min(i + 1, palette.length - 1)];
            return [
                Math.round(a[0] + (b[0] - a[0]) * f),
                Math.round(a[1] + (b[1] - a[1]) * f),
                Math.round(a[2] + (b[2] - a[2]) * f),
            ];
        }

        // Find bounding box for column spread
        let minC = GRID, maxC = 0;
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const col = (pid - 1) % GRID;
            minC = Math.min(minC, col); maxC = Math.max(maxC, col);
        }
        const spanC = maxC - minC || 1;

        // Draw each column as a vertical gradient stripe through its filled cells
        for (let col = 0; col < GRID; col++) {
            // Collect filled rows in this column
            const rows = [];
            for (let row = 0; row < GRID; row++) {
                if (set.has(row * GRID + col + 1)) rows.push(row);
            }
            if (rows.length === 0) continue;

            // Column phase: center columns offset from edge columns
            const colT = (col - minC) / spanC; // 0..1 across logo width
            const mirror = 1 - Math.abs(colT * 2 - 1); // 0 at edges, 1 at center
            const phase = mirror * 0.35 + (animate ? t * 0.08 : 0);

            const x = col * cell;
            const barW = cell;

            // Build a vertical gradient spanning the full column height
            const topRow = rows[0], botRow = rows[rows.length - 1];
            const y0 = topRow * cell, y1 = (botRow + 1) * cell;
            const grad = ctx.createLinearGradient(x, y0, x, y1);
            const _lsp = statParams();
            const steps = Math.round(5 + _lsp.density * 16); // more passes → more color bands
            for (let s = 0; s <= steps; s++) {
                const st = s / steps;
                const ct = phase + st * (0.7 + mirror * 0.3);
                const [r, g, b] = lerpColor(ct);
                grad.addColorStop(st, `rgb(${r},${g},${b})`);
            }
            ctx.fillStyle = grad;

            // Draw only filled cells in this column (so gaps in the logo stay empty)
            for (const row of rows) {
                if (shapeMode === 'circle') {
                    ctx.beginPath();
                    ctx.arc(x + cell / 2, row * cell + cell / 2, cell * 0.46, 0, Math.PI * 2);
                    ctx.fill();
                } else if (shapeMode === 'pixels' || shapeMode === 'outline') {
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.lineWidth = Math.max(1, cell * (0.04 + _lsp.thickness * 0.08));
                    ctx.strokeRect(x + 0.5, row * cell + 0.5, cell - 1, cell - 1);
                } else {
                    ctx.fillRect(x, row * cell, barW, cell);
                }
            }
        }
    }

    // ----- Mesh renderer: 3D wireframe grid warping around the logo -----
    // ----- Net renderer: woven soccer net clipped to logo -----
    function renderMesh(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const dark = fillBgDark;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);

        // No background — only logo area

        // 3D extrusion offset (depth scales with goals like the other 3D modes)
        const depth = cell * (0.35 + statParams().complexity * 0.35);
        const dx = depth * 0.6, dy = -depth; // toward upper-right

        const _nsp = statParams();
        const sp = cell * (1.15 - _nsp.density * 0.55);  // more passes → tighter weave
        const wob = cell * 0.12;
        const lineW = Math.max(0.8, cell * 0.05);

        function sag(a, b, seed) {
            const wave = animate ? t * 1.2 : 0;
            return Math.sin(a * 0.05 + b * 0.04 + seed + wave) * wob +
                   Math.sin(a * 0.11 - b * 0.07 + seed * 1.7 + wave * 0.6) * wob * 0.5;
        }

        // Build the logo clip path (optionally offset for the back layer)
        function clipLogo(offX, offY) {
            ctx.beginPath();
            for (let pid = 1; pid <= GRID * GRID; pid++) {
                if (!set.has(pid)) continue;
                const idx = pid - 1, col = idx % GRID, row = Math.floor(idx / GRID);
                ctx.rect(col * cell + offX, row * cell + offY, cell, cell);
            }
            ctx.clip();
        }

        // Draw the woven net (two diagonal sets + knots) at a given offset & style
        function drawNet(offX, offY, stroke, knotCol, lw) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lw;
            ctx.lineCap = 'round';
            // diagonal set 1
            for (let d = -H; d < W + sp; d += sp) {
                ctx.beginPath(); let started = false;
                for (let s = 0; s <= W + H; s += sp * 0.22) {
                    const x = d + s * 0.7071, y = s * 0.7071;
                    const off = sag(x, y, 0);
                    started ? ctx.lineTo(x + offX, y + off + offY) : ctx.moveTo(x + offX, y + off + offY);
                    started = true;
                }
                ctx.stroke();
            }
            // diagonal set 2
            for (let d = 0; d < W + H + sp; d += sp) {
                ctx.beginPath(); let started = false;
                for (let s = 0; s <= W + H; s += sp * 0.22) {
                    const x = d - s * 0.7071, y = s * 0.7071;
                    const off = sag(x + 400, y + 400, 3.3);
                    started ? ctx.lineTo(x + offX, y + off + offY) : ctx.moveTo(x + offX, y + off + offY);
                    started = true;
                }
                ctx.stroke();
            }
            // knots
            ctx.fillStyle = knotCol;
            const knotR = Math.max(0.6, cell * 0.045);
            for (let gx = -H; gx < W + sp; gx += sp) {
                for (let s = 0; s <= W + H; s += sp) {
                    const x = gx + s * 0.7071, y = s * 0.7071;
                    const off = sag(x, y, 0);
                    ctx.beginPath(); ctx.arc(x + offX, y + off + offY, knotR, 0, Math.PI * 2); ctx.fill();
                }
            }
        }

        // ---- PASS 1: green back FACE of the extrusion + faint back net on top ----
        ctx.save();
        clipLogo(dx, dy);
        // grass-green back plane (slightly darker than the top walls for depth)
        ctx.fillStyle = dark ? 'rgba(28,120,58,0.95)' : 'rgba(40,135,62,0.95)';
        ctx.fillRect(0, 0, W, H);
        const backStroke = dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.4)';
        drawNet(dx, dy, backStroke, backStroke, lineW * 0.8);
        ctx.restore();

        // ---- PASS 2: extruded side walls connecting back to front at the boundary ----
        // Fill the "tube" between front face and back face along the silhouette.
        ctx.save();
        const wallEdge = dark ? 'rgba(255,255,255,0.7)' : 'rgba(180,180,180,0.7)';
        ctx.strokeStyle = wallEdge;
        ctx.lineWidth = 0.5;
        const faceTop = dark ? 'rgba(74,222,128,0.95)' : 'rgba(86,200,110,0.98)';
        const faceSide = dark ? 'rgba(40,160,80,0.92)' : 'rgba(52,150,72,0.95)';
        const faceBottom = dark ? 'rgba(22,110,52,0.9)' : 'rgba(30,110,50,0.92)';
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                // top edge wall (brightest — catches light)
                if (!has(col, row - 1)) {
                    ctx.fillStyle = faceTop;
                    ctx.beginPath();
                    ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy);
                    ctx.lineTo(x + cell + dx, y + dy); ctx.lineTo(x + cell, y);
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                }
                // right edge wall (side tone)
                if (!has(col + 1, row)) {
                    ctx.fillStyle = faceSide;
                    ctx.beginPath();
                    ctx.moveTo(x + cell, y); ctx.lineTo(x + cell + dx, y + dy);
                    ctx.lineTo(x + cell + dx, y + cell + dy); ctx.lineTo(x + cell, y + cell);
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                }
                // bottom edge wall (shadow tone)
                if (!has(col, row + 1)) {
                    ctx.fillStyle = faceBottom;
                    ctx.beginPath();
                    ctx.moveTo(x, y + cell); ctx.lineTo(x + dx, y + cell + dy);
                    ctx.lineTo(x + cell + dx, y + cell + dy); ctx.lineTo(x + cell, y + cell);
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                }
                // left edge wall (side tone)
                if (!has(col - 1, row)) {
                    ctx.fillStyle = faceSide;
                    ctx.beginPath();
                    ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy);
                    ctx.lineTo(x + dx, y + cell + dy); ctx.lineTo(x, y + cell);
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                }
            }
        }
        ctx.restore();

        // ---- PASS 3: bright FRONT layer of the net (on the base plane) ----
        ctx.save();
        clipLogo(0, 0);
        // On a light background, lay a faint dark halo so the white net stays visible
        if (!dark) drawNet(0, 0, 'rgba(120,120,120,0.35)', 'rgba(120,120,120,0.35)', lineW * 1.8);
        const frontStroke = dark ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.98)';
        drawNet(0, 0, frontStroke, frontStroke, lineW);
        ctx.restore();

        // ---- Boundary outlines: back silhouette (faint) + front (bold) ----
        function outline(offX, offY, stroke, lw) {
            ctx.strokeStyle = stroke; ctx.lineWidth = lw;
            for (let row = 0; row < GRID; row++) {
                for (let col = 0; col < GRID; col++) {
                    if (!has(col, row)) continue;
                    const x = col * cell + offX, y = row * cell + offY;
                    if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                    if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                    if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                    if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                }
            }
        }
        outline(dx, dy, dark ? 'rgba(220,220,220,0.6)' : 'rgba(210,210,210,0.85)', Math.max(0.8, cell * 0.06));
        outline(0, 0, dark ? '#ffffff' : '#f0f0f0', Math.max(1.4, cell * 0.1));
    }

    // ----- 3D isometric renderer: connected blocks form one shape -----
    function renderCube(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const dark = fillBgDark;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);
        const wire = shapeMode === 'outline' || shapeMode === 'pixels';

        // No background — only logo pixels

        // Neon color palette
        const neonPalette = [
            [0, 255, 100],    // green
            [0, 200, 255],    // cyan
            [255, 50, 100],   // pink
            [255, 180, 0],    // orange
            [180, 0, 255],    // purple
            [255, 255, 0],    // yellow
            [0, 255, 220],    // teal
            [255, 80, 200],   // magenta
        ];

        // Flood-fill connected groups (Tetris pieces)
        const groupMap = new Int16Array(GRID * GRID).fill(-1);
        let groupCount = 0;
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid) || groupMap[pid - 1] !== -1) continue;
            const gid = groupCount++;
            const stack = [pid - 1];
            while (stack.length) {
                const i = stack.pop();
                if (i < 0 || i >= GRID * GRID || groupMap[i] !== -1 || !set.has(i + 1)) continue;
                groupMap[i] = gid;
                const c = i % GRID, r = Math.floor(i / GRID);
                if (c > 0) stack.push(i - 1);
                if (c < GRID - 1) stack.push(i + 1);
                if (r > 0) stack.push(i - GRID);
                if (r < GRID - 1) stack.push(i + GRID);
            }
        }

        // Per-group color (cycles when animated)
        const groupColor = [];
        for (let g = 0; g < groupCount; g++) {
            const baseIdx = pseed(g, fillSeed + 7) % neonPalette.length;
            if (animate) {
                const speed = 0.4 + (g % 5) * 0.15;
                const shift = Math.floor(t * speed + g * 1.3) % neonPalette.length;
                groupColor.push(neonPalette[(baseIdx + shift) % neonPalette.length]);
            } else {
                groupColor.push(neonPalette[baseIdx]);
            }
        }

        // SINGLE shared extrusion — every piece sits on the same plane / same depth
        const depth = cell * (0.28 + statParams().complexity * 0.45); // more goals → deeper 3D
        const ox = depth * 0.62;
        const oy = -depth;

        function rgba(rgb, a) { return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")"; }
        function rgbDark(rgb, f) { return "rgb(" + Math.round(rgb[0]*f) + "," + Math.round(rgb[1]*f) + "," + Math.round(rgb[2]*f) + ")"; }
        const wireC = dark ? '#ffffff' : '#111111';

        // PASS 1 — extrusion side walls at the OUTER boundary of each piece (shared depth)
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const gid = groupMap[row * GRID + col];
                const nc = groupColor[gid];
                const x = col * cell, y = row * cell;

                // Right wall (no same-piece neighbor to the right)
                if (!has(col + 1, row)) {
                    ctx.beginPath();
                    ctx.moveTo(x + cell, y);
                    ctx.lineTo(x + cell + ox, y + oy);
                    ctx.lineTo(x + cell + ox, y + cell + oy);
                    ctx.lineTo(x + cell, y + cell);
                    ctx.closePath();
                    if (!wire) { ctx.fillStyle = rgbDark(nc, 0.32); ctx.fill(); }
                    ctx.strokeStyle = wire ? wireC : rgba(nc, 0.5); ctx.lineWidth = wire ? 0.8 : 0.5; ctx.stroke();
                }
                // Top wall
                if (!has(col, row - 1)) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + ox, y + oy);
                    ctx.lineTo(x + cell + ox, y + oy);
                    ctx.lineTo(x + cell, y);
                    ctx.closePath();
                    if (!wire) { ctx.fillStyle = rgbDark(nc, 0.5); ctx.fill(); }
                    ctx.strokeStyle = wire ? wireC : rgba(nc, 0.5); ctx.lineWidth = wire ? 0.8 : 0.5; ctx.stroke();
                }
            }
        }

        // PASS 2 — flat top faces (all on the same plane), dark fill + neon scan lines
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const gid = groupMap[row * GRID + col];
                const nc = groupColor[gid];
                const x = col * cell, y = row * cell;

                if (!wire) {
                    ctx.fillStyle = rgbDark(nc, 0.14);
                    ctx.fillRect(x, y, cell, cell);

                    // Neon scan lines clipped to cell
                    ctx.save();
                    ctx.beginPath(); ctx.rect(x, y, cell, cell); ctx.clip();
                    const lineGap = Math.max(2, cell * 0.2);
                    const scroll = animate ? (t * 26 + gid * 7) % lineGap : 0;
                    ctx.strokeStyle = rgba(nc, 0.7);
                    ctx.lineWidth = Math.max(0.5, cell * 0.06);
                    for (let ly = y - lineGap + scroll; ly < y + cell + lineGap; ly += lineGap) {
                        ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + cell, ly); ctx.stroke();
                    }
                    ctx.restore();
                }

                // Neon edges only at the piece boundary (so a piece reads as ONE block)
                ctx.strokeStyle = wire ? wireC : rgba(nc, 0.85);
                ctx.lineWidth = wire ? 0.8 : Math.max(0.8, cell * 0.05);
                if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }

                // faint interior grid line so cells read inside a piece
                if (!wire) {
                    ctx.strokeStyle = rgba(nc, 0.18);
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x + 0.25, y + 0.25, cell - 0.5, cell - 0.5);
                }
            }
        }
    }


    // ----- Stats renderer: merged shape mosaic + match-stat symbols -----
    function renderStats(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);

        // No background — only logo pixels
        const aSeed = fillSeed + (animate ? Math.floor(t * 0.25) : 0);

        // Grass mowing stripes — two greens with random per-cell shade variation
        const grassA = [58,157,78], grassB = [50,144,68];
        // raised-cell bevel like Minesweeper but green
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1, col = idx % GRID, row = Math.floor(idx / GRID);
            const x = col * cell, y = row * cell;
            // mowing stripe pattern (alternating bands)
            const band = (Math.floor(col / 2) % 2) === 0;
            const g = band ? grassA : grassB;
            // random subtle lighten/darken per cell → some tiles "pop" more 3D than others
            const gv = pseed(idx, aSeed + 31) % 100;
            const lift = (gv / 100 - 0.5) * 0.34; // -0.17..+0.17
            const gr = Math.max(0, Math.min(255, g[0] * (1 + lift)));
            const gg = Math.max(0, Math.min(255, g[1] * (1 + lift)));
            const gb = Math.max(0, Math.min(255, g[2] * (1 + lift)));
            ctx.fillStyle = `rgb(${Math.round(gr)},${Math.round(gg)},${Math.round(gb)})`;
            ctx.fillRect(x, y, cell, cell);
            // 3D raised bevel: stronger on "lifted" cells so they look more raised
            const bevel = 0.18 + (gv / 100) * 0.22; // 0.18..0.4
            ctx.fillStyle = `rgba(255,255,255,${bevel.toFixed(2)})`;
            ctx.fillRect(x, y, cell, Math.max(1, cell * 0.1));
            ctx.fillRect(x, y, Math.max(1, cell * 0.1), cell);
            ctx.fillStyle = `rgba(0,0,0,${(bevel + 0.06).toFixed(2)})`;
            ctx.fillRect(x, y + cell - Math.max(1, cell * 0.1), cell, Math.max(1, cell * 0.1));
            ctx.fillRect(x + cell - Math.max(1, cell * 0.1), y, Math.max(1, cell * 0.1), cell);
        }

        // Match element per cell (like Sweep's mines/numbers/flags but soccer)
        const ink = '#0f3d1c';

        // --- Scorer number tiles: shirt numbers of players who scored ---
        // Placed deterministically; double-digit numbers occupy two adjacent cells.
        const sp2 = statParams();
        const numberCells = new Set(); // cells consumed by a multi-cell number
        const scorerList = (scorers && scorers.length) ? scorers : [];
        let placed = 0;
        for (let pid = 1; pid <= GRID * GRID && placed < scorerList.length; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1, col = idx % GRID, row = Math.floor(idx / GRID);
            if (numberCells.has(idx)) continue;
            // host on cells the stat picker flags as 'goals'
            if (matchStatForPixel(idx, aSeed) !== 'goals') continue;
            const num = scorerList[placed];
            const digits = String(num);
            const double = digits.length > 1;
            // need a right neighbor for double digit
            if (double && !has(col + 1, row)) continue;
            const x = col * cell, y = row * cell;
            const wCells = double ? 2 : 1;
            const bw = wCells * cell;
            // recessed number tile (darker grass, inset) spanning the cells
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.fillRect(x, y, bw, cell);
            ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.5;
            ctx.strokeRect(x + 0.5, y + 0.5, bw - 1, cell - 1);
            // number in scoreboard white — each digit centered within its OWN pixel
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(cell * 0.7)}px "Arial", sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let di = 0; di < digits.length; di++) {
                ctx.fillText(digits[di], x + di * cell + cell/2, y + cell/2 + cell*0.04);
            }
            numberCells.add(idx);
            if (double) numberCells.add(idx + 1);
            placed++;
        }

        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1, col = idx % GRID, row = Math.floor(idx / GRID);
            if (numberCells.has(idx)) continue; // skip cells taken by scorer numbers
            const x = col * cell, y = row * cell, cx = x + cell/2, cy = y + cell/2;
            const stat = matchStatForPixel(idx, aSeed);
            const sd = pseed(idx, aSeed);
            const wob = animate ? Math.sin(t*2 + idx*0.2) : 0;
            // shots stat → bolder white lines across the board
            const lw = Math.max(1, cell * (0.06 + sp2.thickness * 0.06));

            ctx.save();
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';

            if (stat === 'corners') {
                // Corner flag — pole + triangular flag on grass
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = lw;
                ctx.beginPath(); ctx.moveTo(cx - cell*0.18, y + cell*0.78); ctx.lineTo(cx - cell*0.18, y + cell*0.22); ctx.stroke();
                ctx.fillStyle = '#e10600';
                ctx.beginPath();
                ctx.moveTo(cx - cell*0.18, y + cell*0.22);
                ctx.lineTo(cx + cell*0.2 + wob*cell*0.03, y + cell*0.32);
                ctx.lineTo(cx - cell*0.18, y + cell*0.42);
                ctx.closePath(); ctx.fill();
            } else if (stat === 'shots') {
                // Shot on target — crosshair / target reticle
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cell*0.07);
                ctx.beginPath(); ctx.arc(cx, cy, cell*0.26, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx - cell*0.34, cy); ctx.lineTo(cx + cell*0.34, cy); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - cell*0.34); ctx.lineTo(cx, cy + cell*0.34); ctx.stroke();
                ctx.fillStyle = '#e10600';
                ctx.beginPath(); ctx.arc(cx, cy, cell*0.08, 0, Math.PI*2); ctx.fill();
            } else if (stat === 'passes') {
                // Passes — mini soccer shoe (cleat) silhouette
                ctx.save();
                ctx.translate(cx, cy);
                // gentle bob when animated
                ctx.translate(0, wob * cell * 0.04);
                const s = cell;
                ctx.fillStyle = '#ffffff';
                // boot body: heel (right) → arch → toe (left), curved sole
                ctx.beginPath();
                ctx.moveTo(-s*0.34, s*0.06);          // toe tip
                ctx.quadraticCurveTo(-s*0.36, -s*0.14, -s*0.16, -s*0.16); // toe upper
                ctx.lineTo(s*0.06, -s*0.18);          // instep
                ctx.quadraticCurveTo(s*0.2, -s*0.18, s*0.24, -s*0.04);    // ankle front
                ctx.lineTo(s*0.3, s*0.02);            // heel top
                ctx.quadraticCurveTo(s*0.34, s*0.16, s*0.18, s*0.18);     // heel back
                ctx.lineTo(-s*0.28, s*0.18);          // sole
                ctx.quadraticCurveTo(-s*0.36, s*0.18, -s*0.34, s*0.06);   // toe curve
                ctx.closePath();
                ctx.fill();
                // sole + studs (dark)
                ctx.fillStyle = ink;
                ctx.fillRect(-s*0.3, s*0.16, s*0.5, s*0.05);
                for (let k = 0; k < 4; k++) {
                    ctx.beginPath();
                    ctx.arc(-s*0.24 + k*s*0.14, s*0.24, s*0.03, 0, Math.PI*2);
                    ctx.fill();
                }
                // lace stripes
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(0.6, s*0.03);
                for (let k = 0; k < 3; k++) {
                    ctx.beginPath();
                    ctx.moveTo(-s*0.04 + k*s*0.07, -s*0.16);
                    ctx.lineTo(-s*0.08 + k*s*0.07, -s*0.04);
                    ctx.stroke();
                }
                ctx.restore();
            } else if (stat === 'goals') {
                // Goal — small soccer ball (white with black pentagon + seams)
                const br = cell * 0.28;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(cx, cy, br, 0, Math.PI*2); ctx.fill();
                // central black pentagon
                ctx.fillStyle = ink;
                ctx.beginPath();
                for (let k = 0; k < 5; k++) {
                    const a = k * Math.PI*2/5 - Math.PI/2;
                    const px = cx + Math.cos(a)*br*0.42, py = cy + Math.sin(a)*br*0.42;
                    k===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
                }
                ctx.closePath(); ctx.fill();
                // seams radiating from pentagon vertices to the rim
                ctx.strokeStyle = ink; ctx.lineWidth = Math.max(0.6, cell*0.035);
                for (let k = 0; k < 5; k++) {
                    const a = k * Math.PI*2/5 - Math.PI/2;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a)*br*0.42, cy + Math.sin(a)*br*0.42);
                    ctx.lineTo(cx + Math.cos(a)*br, cy + Math.sin(a)*br);
                    ctx.stroke();
                }
                // outer rim
                ctx.beginPath(); ctx.arc(cx, cy, br, 0, Math.PI*2); ctx.stroke();
            } else if (stat === 'cards') {
                // Card — yellow/red rectangle
                ctx.fillStyle = (sd % 3 === 0) ? '#e10600' : '#f5d800';
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.18);
                ctx.fillRect(-cell*0.16, -cell*0.26, cell*0.32, cell*0.52);
                ctx.restore();
            } else if (stat === 'possession') {
                // Possession — pitch center-circle motif
                ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, cell*0.06);
                ctx.beginPath(); ctx.arc(cx, cy, cell*0.28, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + cell, cy); ctx.stroke();
                ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, cell*0.05, 0, Math.PI*2); ctx.fill();
            } else if (stat === 'offsides') {
                // Offside — dashed line + flag dot
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cell*0.06);
                ctx.setLineDash([cell*0.12, cell*0.1]);
                ctx.beginPath(); ctx.moveTo(x + cell*0.15, y + cell*0.2); ctx.lineTo(x + cell*0.85, y + cell*0.8); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#f5d800'; ctx.beginPath(); ctx.arc(x + cell*0.78, y + cell*0.28, cell*0.08, 0, Math.PI*2); ctx.fill();
            } else if (stat === 'saves') {
                // Save — goalkeeper glove (rounded mitt with fingers)
                ctx.fillStyle = '#c084fc';
                ctx.beginPath(); ctx.arc(cx, cy + cell*0.05, cell*0.2, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#9333ea';
                for (let k = -1; k <= 1; k++) {
                    ctx.beginPath(); ctx.roundRect(cx + k*cell*0.12 - cell*0.04, cy - cell*0.24, cell*0.08, cell*0.16, cell*0.04); ctx.fill();
                }
            } else if (stat === 'var') {
                // VAR → robotic VR goggles / visor headset
                ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                // head strap going around
                ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, cell*0.06);
                ctx.beginPath(); ctx.moveTo(cx - cell*0.28, cy); ctx.lineTo(cx + cell*0.28, cy); ctx.stroke();
                // goggles body (rounded visor)
                ctx.fillStyle = '#1f2937';
                ctx.beginPath(); ctx.roundRect(cx - cell*0.26, cy - cell*0.16, cell*0.52, cell*0.3, cell*0.1); ctx.fill();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cell*0.05);
                ctx.beginPath(); ctx.roundRect(cx - cell*0.26, cy - cell*0.16, cell*0.52, cell*0.3, cell*0.1); ctx.stroke();
                // two glowing robot eyes/lenses
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath(); ctx.arc(cx - cell*0.11, cy, cell*0.075, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + cell*0.11, cy, cell*0.075, 0, Math.PI*2); ctx.fill();
                // bright eye highlights
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(cx - cell*0.13, cy - cell*0.02, cell*0.025, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + cell*0.09, cy - cell*0.02, cell*0.025, 0, Math.PI*2); ctx.fill();
                // little antenna nub on top (robot)
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.8, cell*0.04);
                ctx.beginPath(); ctx.moveTo(cx, cy - cell*0.16); ctx.lineTo(cx, cy - cell*0.26); ctx.stroke();
                ctx.fillStyle = '#e10600'; ctx.beginPath(); ctx.arc(cx, cy - cell*0.28, cell*0.035, 0, Math.PI*2); ctx.fill();
            } else { // fouls
                // Foul — whistle X
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.2, cell*0.1);
                ctx.beginPath(); ctx.moveTo(cx - cell*0.2, cy - cell*0.2); ctx.lineTo(cx + cell*0.2, cy + cell*0.2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx + cell*0.2, cy - cell*0.2); ctx.lineTo(cx - cell*0.2, cy + cell*0.2); ctx.stroke();
            }
            ctx.restore();
        }

        // Pitch boundary line around the whole logo
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(1, cell * 0.08);
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
            }
        }
    }

    // ----- Sweep renderer: Minesweeper style -----
    function renderSweep(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);

        // background intentionally not filled — only logo pixels drawn

        // Determine mines (~25% of filled pixels)
        const mines = new Set();
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1;
            const seed = pseed(idx, fillSeed + (animate ? Math.floor(t * 0.25) : 0));
            if (seed % 3 === 0) mines.add(pid);
        }

        // Count adjacent mines for each filled non-mine cell
        function countMines(col, row) {
            let n = 0;
            for (let dy = -1; dy <= 1; dy++)
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const c = col + dx, r = row + dy;
                    if (c >= 0 && c < GRID && r >= 0 && r < GRID && mines.has(r * GRID + c + 1)) n++;
                }
            return n;
        }

        // Minesweeper number colors
        const numColors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];

        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1, col = idx % GRID, row = Math.floor(idx / GRID);
            const x = col * cell, y = row * cell;
            const seed = pseed(idx, fillSeed);
            const isMine = mines.has(pid);
            const revealed = (seed >> 3) % 10 > 1; // ~85% revealed

            if (!revealed) {
                // Unrevealed cell — raised 3D button
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(x, y, cell, cell);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y, cell, Math.max(1, cell * 0.12));
                ctx.fillRect(x, y, Math.max(1, cell * 0.12), cell);
                ctx.fillStyle = '#808080';
                ctx.fillRect(x, y + cell - Math.max(1, cell * 0.12), cell, Math.max(1, cell * 0.12));
                ctx.fillRect(x + cell - Math.max(1, cell * 0.12), y, Math.max(1, cell * 0.12), cell);
                const cx = x + cell / 2, cy = y + cell / 2;
                const marker = (seed >> 5) % 5; // mostly flags/questions, rarely blank
                if (marker === 0 || marker === 1 || marker === 2) {
                    // Red flag (most common)
                    ctx.strokeStyle = '#000000'; ctx.lineWidth = Math.max(1, cell * 0.06);
                    ctx.beginPath(); ctx.moveTo(cx, y + cell * 0.28); ctx.lineTo(cx, y + cell * 0.72); ctx.stroke();
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(cx - cell * 0.18, y + cell * 0.7, cell * 0.36, cell * 0.08);
                    ctx.fillStyle = '#dc2626';
                    ctx.beginPath();
                    ctx.moveTo(cx, y + cell * 0.28);
                    ctx.lineTo(cx - cell * 0.22, y + cell * 0.4);
                    ctx.lineTo(cx, y + cell * 0.5);
                    ctx.closePath(); ctx.fill();
                } else if (marker === 3) {
                    // Question mark
                    ctx.fillStyle = '#000080';
                    ctx.font = `bold ${Math.round(cell * 0.62)}px "Arial", sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('?', cx, cy + cell * 0.04);
                }
                // marker === 4: blank button (rare)
            } else if (isMine) {
                // Mine cell — revealed
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(x, y, cell, cell);
                ctx.strokeStyle = '#808080';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, cell, cell);
                // Draw mine
                const cx = x + cell / 2, cy = y + cell / 2;
                const mr = cell * 0.28;
                ctx.fillStyle = '#000000';
                ctx.beginPath(); ctx.arc(cx, cy, mr, 0, Math.PI * 2); ctx.fill();
                // Spikes
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = Math.max(1, cell * 0.08);
                ctx.lineCap = 'round';
                for (let i = 0; i < 4; i++) {
                    const a = i * Math.PI / 4 + Math.PI / 8;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * mr * 0.6, cy + Math.sin(a) * mr * 0.6);
                    ctx.lineTo(cx + Math.cos(a) * mr * 1.6, cy + Math.sin(a) * mr * 1.6);
                    ctx.stroke();
                }
                // Glint
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(cx - mr * 0.25, cy - mr * 0.25, mr * 0.2, 0, Math.PI * 2); ctx.fill();
            } else {
                // Number cell
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(x, y, cell, cell);
                ctx.strokeStyle = '#808080';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, cell, cell);
                const n = countMines(col, row);
                const shown = n > 0 ? n : (1 + (seed >> 6) % 3); // fallback digit so cells aren't blank
                ctx.fillStyle = numColors[shown] || '#000000';
                ctx.font = `bold ${Math.round(cell * 0.65)}px "Arial", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(shown.toString(), x + cell / 2, y + cell / 2 + cell * 0.04);
            }
        }

        // (empty-cell borders removed — only logo pixels are drawn)
    }

    // ----- Pattern renderer: connected sections filled with op-art stripes -----
    function renderPattern(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const dark = fillBgDark;

        if (opts.bg && opts.bg !== 'transparent' && opts.bg !== 'rgba(0,0,0,0)') { ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, W, H); }

        // Op-art color palettes (Cruz-Diez inspired)
        const palettes = [
            ['#1e3a8a', '#fbbf24', '#1e3a8a', '#f97316'],
            ['#16a34a', '#a3e635', '#7c3aed', '#f97316', '#000000'],
            ['#1e3a8a', '#e89fc4', '#1e3a8a', '#f97316'],
            ['#000000', '#84cc16', '#7c3aed', '#f97316'],
            ['#dc2626', '#fbbf24', '#1e3a8a', '#16a34a'],
        ];
        const sp = statParams();
        const tt = animate ? t : 0;

        // Like SOLID: partition the logo into ~4x4 patches, each gets its OWN op-art
        // treatment + palette, so many patterns coexist in one mark instead of uniform stripes.
        const NUM_STYLES = 8;
        const patch = 4;
        const styleFor = (col, row) => {
            const pc = Math.floor(col/patch), pr = Math.floor(row/patch);
            return pseed(pr*GRID+pc, fillSeed*7 + 13) % NUM_STYLES;
        };
        const palFor = (col, row) => {
            const pc = Math.floor(col/patch), pr = Math.floor(row/patch);
            return palettes[pseed(pr*GRID+pc, fillSeed*5 + 3) % palettes.length];
        };

        const sw = cell * (0.5 + (1 - sp.density*0.5) * 0.5); // stripe/element scale

        for (let pid = 1; pid <= GRID*GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid-1, col = idx%GRID, row = Math.floor(idx/GRID);
            const x = col*cell, y = row*cell, cx = x+cell/2, cy = y+cell/2;
            const style = styleFor(col, row);
            const pal = palFor(col, row);
            const scroll = animate ? tt*12 : 0;

            ctx.save();
            ctx.beginPath(); ctx.rect(x, y, cell, cell); ctx.clip();

            if (style === 0 || style === 1) {
                // vertical (0) / horizontal (1) stripes
                let ci = 0;
                for (let s = -sw*pal.length + (scroll % (sw*pal.length)); s < cell + sw; s += sw) {
                    ctx.fillStyle = pal[ci % pal.length];
                    if (style === 0) ctx.fillRect(x + s, y, sw+0.5, cell);
                    else ctx.fillRect(x, y + s, cell, sw+0.5);
                    ci++;
                }
            } else if (style === 2) {
                // diagonal stripes
                ctx.translate(cx, cy); ctx.rotate(Math.PI/4); ctx.translate(-cx, -cy);
                let ci = 0;
                for (let s = -sw*pal.length*2 + (scroll % (sw*pal.length)); s < cell*2; s += sw) {
                    ctx.fillStyle = pal[ci % pal.length];
                    ctx.fillRect(x - cell + s, y - cell, sw+0.5, cell*3);
                    ci++;
                }
            } else if (style === 3) {
                // concentric rings
                const maxR = cell * 0.75;
                let ci = 0;
                for (let rr = maxR; rr > 0; rr -= sw*0.7) {
                    ctx.fillStyle = pal[ci % pal.length];
                    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI*2); ctx.fill();
                    ci++;
                }
            } else if (style === 4) {
                // checkerboard of two palette colors
                const n = 2, sub = cell/n;
                for (let sy=0; sy<n; sy++) for (let sx=0; sx<n; sx++){
                    ctx.fillStyle = pal[((sx+sy) % 2) ? 1 : 0];
                    ctx.fillRect(x+sx*sub, y+sy*sub, Math.ceil(sub), Math.ceil(sub));
                }
            } else if (style === 5) {
                // dot grid on a solid ground
                ctx.fillStyle = pal[0]; ctx.fillRect(x, y, cell, cell);
                ctx.fillStyle = pal[1 % pal.length];
                ctx.beginPath(); ctx.arc(cx, cy, cell*0.3, 0, Math.PI*2); ctx.fill();
            } else if (style === 6) {
                // half-split block
                ctx.fillStyle = pal[0]; ctx.fillRect(x, y, cell, cell);
                ctx.fillStyle = pal[1 % pal.length];
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+cell, y); ctx.lineTo(x, y+cell); ctx.closePath(); ctx.fill();
            } else {
                // solid color block
                ctx.fillStyle = pal[pseed(idx, fillSeed) % pal.length];
                ctx.fillRect(x, y, cell, cell);
            }
            ctx.restore();
        }
    }

    // ----- Abstract renderer: editorial data-art composition -----
    function renderAbstract(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const dark = fillBgDark;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);

        // No background — only logo pixels
        const aSeed = fillSeed;
        const tt = animate ? t : 0;

        // Bayer 4x4 ordered-dither threshold matrix (0..15)/16
        const bayer = [
            [0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]
        ];

        // Logo bounds for smooth field
        let minX = W, minY = H, maxX = 0, maxY = 0, any=false;
        for (let pid = 1; pid <= GRID*GRID; pid++){ if(!set.has(pid))continue; const i=pid-1,c=i%GRID,r=Math.floor(i/GRID); minX=Math.min(minX,c);maxX=Math.max(maxX,c);minY=Math.min(minY,r);maxY=Math.max(maxY,r); any=true; }
        if(!any){minX=0;minY=0;maxX=GRID-1;maxY=GRID-1;}
        const cxg=(minX+maxX)/2, cyg=(minY+maxY)/2, spanr=Math.max(4,(maxX-minX+maxY-minY)/2);

        // neon green ink tones
        const g0 = dark ? [20,120,60] : [60,200,110];    // faint neon
        const g1 = dark ? [40,220,110] : [30,210,120];   // mid neon
        const g2 = dark ? [80,255,150] : [0,230,120];    // bright neon
        function mix(a,b,k){return [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k];}
        function rgb(c){return "rgb("+Math.round(c[0])+","+Math.round(c[1])+","+Math.round(c[2])+")";}

        // Stat drivers: possession → blob coverage, passes → busier field, offsides → scatter
        const _asp = statParams();
        const cover = 0.4 + _asp.colorAmount * 0.45;
        const busy = 0.5 + _asp.density * 1.2;
        // Smooth value field — layered sines making soft blobs
        function field(c, r){
            const dx=(c-cxg)/spanr, dy=(r-cyg)/spanr;
            const dist=Math.sqrt(dx*dx+dy*dy);
            let v = cover - dist*0.5;
            v += 0.28*busy*Math.sin(c*0.45 + tt*0.7) * Math.cos(r*0.4 - tt*0.5);
            v += 0.18*busy*Math.sin((c+r)*0.3 - tt*0.9);
            v += 0.14*Math.sin(c*0.9 + r*0.7 + tt);
            return v;
        }

        // Per-pixel dithered green field — the threshold/blob look
        for (let pid = 1; pid <= GRID*GRID; pid++){
            if(!set.has(pid))continue;
            const idx=pid-1, col=idx%GRID, row=Math.floor(idx/GRID);
            const x=col*cell, y=row*cell;
            const v = field(col,row);                     // ~0..1
            const thr = bayer[row&3][col&3]/16;           // ordered dither threshold
            // density of sub-dots based on field strength
            const level = Math.max(0, Math.min(1, v));

            // Subtle base wash: low-opacity green that blends into bg
            const baseTone = mix(g0, g1, level);
            ctx.fillStyle = "rgba("+Math.round(baseTone[0])+","+Math.round(baseTone[1])+","+Math.round(baseTone[2])+","+(0.12+level*0.25).toFixed(3)+")";
            ctx.fillRect(x,y,cell,cell);

            // Dithered dots: render a small NxN matrix inside the cell, turning on dots where field>threshold
            const n = 3; // 3x3 sub-grid dithering
            const sub = cell/n;
            for(let sy=0; sy<n; sy++){
                for(let sx=0; sx<n; sx++){
                    const subThr = bayer[(row*n+sy)&3][(col*n+sx)&3]/16;
                    if(level > subThr*0.92 + 0.06){
                        const dotTone = mix(g1,g2, Math.min(1, level + (subThr-0.5)*0.3));
                        ctx.fillStyle = "rgba("+Math.round(dotTone[0])+","+Math.round(dotTone[1])+","+Math.round(dotTone[2])+","+(0.35+level*0.5).toFixed(3)+")";
                        const r = sub*0.42 * (0.7+level*0.5);
                        ctx.beginPath();
                        ctx.arc(x+sx*sub+sub/2, y+sy*sub+sub/2, r, 0, Math.PI*2);
                        ctx.fill();
                    }
                }
            }
        }

        // --- SQUIGGLE LAYER: loose hand-drawn curves scattered inside the logo ---
        // clip to the logo so squiggles stay inside the mark, then draw wandering
        // multi-segment curves seeded deterministically (animated drift when playing).
        ctx.save();
        ctx.beginPath();
        for (let pid = 1; pid <= GRID*GRID; pid++) {
            if (!set.has(pid)) continue;
            const i = pid-1; ctx.rect((i%GRID)*cell, Math.floor(i/GRID)*cell, cell, cell);
        }
        ctx.clip();
        const squiggleCount = 5 + Math.round(_asp.density * 8); // more passes → more squiggles
        const sqInk = dark ? 'rgba(255,40,70,0.85)' : 'rgba(255,20,55,0.8)';   // neon red
        const sqInk2 = dark ? 'rgba(255,90,120,0.7)' : 'rgba(230,0,50,0.7)';   // brighter/deeper red
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let q = 0; q < squiggleCount; q++) {
            const s0 = pseed(q*13+1, aSeed+777);
            const s1 = pseed(q*13+5, aSeed+777);
            let px = minX*cell + (s0 % Math.max(1,(maxX-minX)*cell));
            let py = minY*cell + (s1 % Math.max(1,(maxY-minY)*cell));
            const segs = 5 + (pseed(q, aSeed+9) % 6);
            const step = cell * (1.2 + (pseed(q, aSeed+11)%3)*0.6);
            let ang = (pseed(q, aSeed+13) % 628) / 100;
            ctx.strokeStyle = (q % 4 === 0) ? sqInk2 : sqInk;
            ctx.lineWidth = Math.max(1.2, cell * (0.12 + (pseed(q,aSeed+17)%3)*0.05));
            ctx.beginPath(); ctx.moveTo(px, py);
            for (let sgi = 0; sgi < segs; sgi++) {
                // wander the angle; add gentle animated drift
                ang += ((pseed(q*31+sgi, aSeed+19) % 200)/100 - 1) * 1.1 + Math.sin(tt*0.6 + q + sgi)*0.25;
                const nx = px + Math.cos(ang) * step;
                const ny = py + Math.sin(ang) * step;
                const mxp = (px+nx)/2 + Math.cos(ang+1.57)*step*0.4;
                const myp = (py+ny)/2 + Math.sin(ang+1.57)*step*0.4;
                ctx.quadraticCurveTo(mxp, myp, nx, ny);
                px = nx; py = ny;
            }
            ctx.stroke();
            // occasional little loop/curl at the end
            if (pseed(q, aSeed+23) % 3 === 0) {
                ctx.beginPath(); ctx.arc(px, py, cell*0.3, 0, Math.PI*1.6); ctx.stroke();
            }
        }
        ctx.restore();


        const _isp = statParams();
        const glyphChance = 13 - Math.round(_isp.density * 8); // more passes → more glyphs
        const ink = dark ? 'rgba(230,230,225,0.7)' : 'rgba(20,20,20,0.7)';
        const orange = 'rgba(232,85,45,0.8)';
        for (let pid = 1; pid <= GRID*GRID; pid++){
            if(!set.has(pid))continue;
            const idx=pid-1, col=idx%GRID, row=Math.floor(idx/GRID);
            const sd = pseed(idx, aSeed + 5 + (animate?Math.floor(t*0.2):0));
            if (sd % Math.max(4, glyphChance) !== 0) continue; // sparse, density-driven
            const x=col*cell, y=row*cell, mx=x+cell/2, my=y+cell/2;
            const glyph = INTERNET_MOTIFS[(sd >> 5) % INTERNET_MOTIFS.length];
            // occasional orange accent glyph (tied to cards / warm accent)
            const warm = ((sd >> 9) % 10) < (1 + Math.round(_isp.warmAccent * 4));
            ctx.fillStyle = warm ? orange : ink;
            ctx.font = `700 ${Math.round(cell * (0.7 + ((sd>>3)%3)*0.12))}px "Geist Mono", ui-monospace, monospace`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(glyph, mx, my + cell*0.04);
        }

        // --- PLAYER NAME LABELS: surnames on neon-blue backgrounds scattered in the mark ---
        const neonBlue = dark ? 'rgba(0,90,255,0.95)' : 'rgba(0,70,235,0.95)';
        const neonBlueGlow = 'rgba(40,140,255,0.5)';
        const nameChance = 19 - Math.round(_isp.density * 6);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let pid = 1; pid <= GRID*GRID; pid++){
            if(!set.has(pid))continue;
            const idx=pid-1, col=idx%GRID, row=Math.floor(idx/GRID);
            const sd = pseed(idx, aSeed + 333 + (animate?Math.floor(t*0.12):0));
            if (sd % Math.max(8, nameChance) !== 0) continue;
            const name = PLAYER_NAMES[(sd >> 6) % PLAYER_NAMES.length];
            // fit across consecutive logo cells to the right
            let span = 1;
            while (span < Math.ceil(name.length*0.5) && has(col+span, row)) span++;
            const x=col*cell, y=row*cell, boxW = span*cell, my=y+cell/2;
            const padY = cell*0.18;
            // neon-blue glow + solid blue background bar behind the name
            ctx.fillStyle = neonBlueGlow;
            ctx.fillRect(x-1, y+padY-1.5, boxW+2, cell-padY*2+3);
            ctx.fillStyle = neonBlue;
            ctx.fillRect(x+1, y+padY, boxW-2, cell-padY*2);
            // white player name text
            ctx.fillStyle = '#ffffff';
            const fs = Math.min(cell*0.5, (boxW*1.6)/Math.max(1,name.length));
            ctx.font = `800 ${Math.round(fs)}px "Geist Mono", ui-monospace, monospace`;
            ctx.fillText(name, x + boxW/2, my + cell*0.02);
        }

        // --- PARODY LAYER: trolls/comments the match outcome (drives tone from stats) ---
        // Build a pool of taunts weighted by the actual stats so the "vibe" reflects the game.
        const s = matchStats;
        const taunts = [];
        if (s.goals === 0) { taunts.push('0-0','BORING','SNOOZE','PARK THE BUS','ZZZ'); }
        if (s.goals >= 4) { taunts.push('GOAL FEST','SCENES','LIMBS','GG EZ'); }
        if (s.fouls >= 14) { taunts.push('DIRTY','RIGGED','VAR?','SOFT','CHEAT'); }
        if (s.cards >= 4) { taunts.push('SENT OFF','RED!','OFF!','11 v 9'); }
        if (s.offsides >= 5) { taunts.push('OFFSIDE','LINESMAN!','BY A HAIR','CHALK'); }
        if (s.possession >= 65) { taunts.push('TIKI TAKA','ALL DAY','SIDEWAYS'); }
        if (s.possession <= 40) { taunts.push('SMASH & GRAB','PARKED','LUCKY'); }
        if (s.shots >= 12) { taunts.push('WASTEFUL','FINISH!','HOW?!'); }
        // always-available trolls
        taunts.push('L','GG','RATIO','MID','COPE','SEETHE','ABSOLUTE','SCENES','OOF','NPC','MEH','???','SKILL ISSUE','CLOWN');
        const faces = ['\\u263A','\\u2639','\\u2620','\\u00BF','x_x','T_T','>:('];

        const parodyChance = 17 - Math.round(_isp.contrast * 6); // more fouls(contrast) → more trolling
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let pid = 1; pid <= GRID*GRID; pid++){
            if(!set.has(pid))continue;
            const idx=pid-1, col=idx%GRID, row=Math.floor(idx/GRID);
            // only roomy interior cells so words fit; need a few cells to the right
            const sd = pseed(idx, aSeed + 99 + (animate?Math.floor(t*0.15):0));
            if (sd % Math.max(6, parodyChance) !== 0) continue;
            const word = taunts[(sd >> 4) % taunts.length];
            const x=col*cell, y=row*cell, my=y+cell/2;
            // fit the word across available consecutive logo cells to the right
            let span = 1;
            while (span < word.length && has(col+span, row)) span++;
            const boxW = span * cell;
            // red-card accent words get red, faces/troll get bright ink
            const isRed = /RED|SENT|OFF|RIGGED|CHEAT|DIRTY/.test(word);
            // draw a little sticker bg so it pops out of the dither (parody "stamp")
            ctx.fillStyle = isRed ? 'rgba(220,40,30,0.92)' : (dark ? 'rgba(245,200,30,0.9)' : 'rgba(20,20,20,0.88)');
            const padY = cell*0.16;
            ctx.fillRect(x+1, y+padY, boxW-2, cell - padY*2);
            // text
            ctx.fillStyle = isRed ? '#ffffff' : (dark ? '#111111' : '#f5f0e6');
            const fs = Math.min(cell*0.62, (boxW*1.5)/Math.max(1,word.length));
            ctx.font = `800 ${Math.round(fs)}px "Geist Mono", ui-monospace, monospace`;
            ctx.fillText(word, x + boxW/2, my + cell*0.02);
        }
        // a couple of sad/troll faces sprinkled (emoji-ish), tied to a losing/dull game
        if (s.goals <= 1 || s.fouls >= 12) {
            for (let pid = 1; pid <= GRID*GRID; pid++){
                if(!set.has(pid))continue;
                const idx=pid-1, col=idx%GRID, row=Math.floor(idx/GRID);
                const sd = pseed(idx, aSeed + 222);
                if (sd % 41 !== 0) continue;
                const x=col*cell, y=row*cell;
                ctx.fillStyle = dark ? 'rgba(245,200,30,0.95)' : 'rgba(20,20,20,0.9)';
                ctx.font = `700 ${Math.round(cell*0.8)}px "Geist Mono", ui-monospace, monospace`;
                ctx.fillText(faces[(sd>>5)%faces.length], x+cell/2, y+cell/2+cell*0.04);
            }
        }

        for (let row=0; row<GRID; row++){
            for(let col=0; col<GRID; col++){
                if(!has(col,row))continue;
                const x=col*cell,y=row*cell;
                if(!has(col,row-1)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cell,y);ctx.stroke();}
                if(!has(col,row+1)){ctx.beginPath();ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y+cell);ctx.stroke();}
                if(!has(col-1,row)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+cell);ctx.stroke();}
                if(!has(col+1,row)){ctx.beginPath();ctx.moveTo(x+cell,y);ctx.lineTo(x+cell,y+cell);ctx.stroke();}
            }
        }
    }

    // ----- Bauhaus renderer: merged rectangular blocks & shapes -----
    function renderBauhaus(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const dark = fillBgDark;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);

        const cream = dark ? '#1a1a1a' : '#ece6d6';
        const ink = dark ? '#ece6d6' : '#111111';
        const red = '#e2342a', blue = '#3a5fcd', yellow = '#f5c518';
        const colors = [red, blue, yellow];

        const aSeed = fillSeed + (animate ? Math.floor(t * 0.35) : 0);

        // Greedy rectangle decomposition — merge touching cells into blocks
        const assigned = new Uint8Array(GRID * GRID);
        const rects = [];
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                const idx = row * GRID + col;
                if (!has(col, row) || assigned[idx]) continue;
                const rseed = pseed(idx, aSeed);
                const maxW = 1 + (rseed % 4);          // up to 4 wide
                const maxH = 1 + ((rseed >> 3) % 4);   // up to 4 tall

                // Grow width
                let w = 1;
                while (w < maxW && has(col + w, row) && !assigned[row * GRID + col + w]) w++;
                // Grow height (all columns in width must be free)
                let h = 1;
                growH: while (h < maxH) {
                    for (let cc = 0; cc < w; cc++) {
                        if (!has(col + cc, row + h) || assigned[(row + h) * GRID + col + cc]) break growH;
                    }
                    h++;
                }
                // Mark assigned
                for (let rr = 0; rr < h; rr++)
                    for (let cc = 0; cc < w; cc++)
                        assigned[(row + rr) * GRID + col + cc] = 1;
                rects.push({ col, row, w, h, seed: rseed });
            }
        }

        // Clip everything to the logo motif so shapes stay within the silhouette
        ctx.save();
        ctx.beginPath();
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const i = pid - 1, c = i % GRID, r = Math.floor(i / GRID);
            ctx.rect(c * cell, r * cell, cell, cell);
        }
        ctx.clip();

        // Draw each rectangle as a Bauhaus block
        for (const rc of rects) {
            const x = rc.col * cell, y = rc.row * cell;
            const bw = rc.w * cell, bh = rc.h * cell;
            const sd = rc.seed;
            const variant = sd % 12;
            const colr = colors[(sd >> 4) % 3];
            const rot = (sd >> 6) % 4;

            // Base cream
            ctx.fillStyle = cream;
            ctx.fillRect(x, y, bw, bh);

            ctx.save();
            ctx.translate(x + bw / 2, y + bh / 2);
            ctx.rotate(rot * Math.PI / 2);
            ctx.translate(-bw / 2, -bh / 2);
            ctx.fillStyle = colr;
            const m = Math.min(bw, bh);

            if (variant < 3) {
                ctx.fillRect(0, 0, bw, bh);                       // solid block
            } else if (variant === 3) {
                ctx.beginPath(); ctx.arc(bw/2, bh/2, m*0.46, 0, Math.PI*2); ctx.fill(); // circle
            } else if (variant === 4) {
                ctx.beginPath(); ctx.moveTo(0, bh); ctx.lineTo(bw, bh); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); // triangle
            } else if (variant === 5) {
                ctx.beginPath(); ctx.moveTo(bw, 0); ctx.lineTo(bw, bh); ctx.lineTo(0, bh); ctx.closePath(); ctx.fill(); // diag half
            } else if (variant === 6) {
                ctx.fillRect(0, bh/2, bw, bh/2);                  // horizontal half
            } else if (variant === 7) {
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, m, 0, Math.PI/2, false); ctx.closePath(); ctx.fill(); // quarter circle
            } else if (variant === 8) {
                // Hexagon (soccer-ball cell)
                const hr = m * 0.46, hcx = bw/2, hcy = bh/2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = Math.PI / 6 + i * Math.PI / 3;
                    const px = hcx + Math.cos(a) * hr, py = hcy + Math.sin(a) * hr;
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.fill();
            }
            // 10,11 = empty cream

            // Secondary combined shape — frequency scales with goals (complexity)
            const _sp = statParams();
            if ((sd >> 8) % 10 < (2 + Math.round(_sp.complexity * 5))) {
                const subColor = colors[((sd >> 4) + 1) % 3];
                const subType = (sd >> 11) % 6;
                ctx.fillStyle = subColor;
                if (subType === 0) { ctx.beginPath(); ctx.arc(bw/2, bh/2, m*0.26, 0, Math.PI*2); ctx.fill(); }
                else if (subType === 1) { ctx.fillRect(bw/2 - m*0.22, bh/2 - m*0.22, m*0.44, m*0.44); }
                else if (subType === 2) { ctx.beginPath(); ctx.moveTo(bw/2, bh/2 - m*0.28); ctx.lineTo(bw/2 + m*0.24, bh/2 + m*0.24); ctx.lineTo(bw/2 - m*0.24, bh/2 + m*0.24); ctx.closePath(); ctx.fill(); }
                else if (subType === 3) { ctx.beginPath(); ctx.arc(bw/2, bh/2, m*0.32, Math.PI, 0, false); ctx.closePath(); ctx.fill(); }
                else if (subType === 4) { ctx.beginPath(); ctx.moveTo(bw, bh); ctx.arc(bw, bh, m*0.55, Math.PI, Math.PI*1.5, false); ctx.closePath(); ctx.fill(); }
                else {
                    // Inner hexagon
                    const hr = m * 0.28, hcx = bw/2, hcy = bh/2;
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const a = Math.PI / 6 + i * Math.PI / 3;
                        const px = hcx + Math.cos(a) * hr, py = hcy + Math.sin(a) * hr;
                        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                    }
                    ctx.closePath(); ctx.fill();
                }
            }
            ctx.restore();
        }

        ctx.restore(); // end logo clip

        // Thick black outline around each merged block
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(1, cell * 0.09);
        ctx.lineJoin = 'miter';
        for (const rc of rects) {
            ctx.strokeRect(rc.col * cell, rc.row * cell, rc.w * cell, rc.h * cell);
        }
        // Bolder outer boundary of the whole logo
        ctx.lineWidth = Math.max(1.5, cell * 0.13);
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
            }
        }
    }

    // ----- Chrome renderer: B&W reflective 3D metal (extruded like Tetris) -----
    function renderChrome(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);

        // Logo bounds
        let minY = H, maxY = 0, minX = W, maxX = 0, any = false;
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const i = pid - 1, c = i % GRID, r = Math.floor(i / GRID);
            minY = Math.min(minY, r * cell); maxY = Math.max(maxY, (r + 1) * cell);
            minX = Math.min(minX, c * cell); maxX = Math.max(maxX, (c + 1) * cell);
            any = true;
        }
        if (!any) { minY = 0; maxY = H; minX = 0; maxX = W; }
        const span = Math.max(1, maxY - minY);

        // Shared 3D extrusion (like the Tetris piece — single plane, consistent depth)
        const depth = cell * 0.5;
        const ox = depth * 0.6, oy = -depth;

        const anim = animate ? t : 0;

        // ---- PASS 1: extruded SIDE walls (dark polished steel) at logo boundary ----
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                // Right wall — vertical chrome gradient (dark steel with a moving glint)
                if (!has(col + 1, row)) {
                    const g = ctx.createLinearGradient(x + cell, y, x + cell + ox, y + oy);
                    g.addColorStop(0, '#2a2d31');
                    g.addColorStop(0.5, '#4a4e54');
                    g.addColorStop(1, '#15171a');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(x + cell, y); ctx.lineTo(x + cell + ox, y + oy);
                    ctx.lineTo(x + cell + ox, y + cell + oy); ctx.lineTo(x + cell, y + cell);
                    ctx.closePath(); ctx.fill();
                }
                // Top wall — lighter angled steel
                if (!has(col, row - 1)) {
                    const g = ctx.createLinearGradient(x, y, x + ox, y + oy);
                    g.addColorStop(0, '#6a6f76');
                    g.addColorStop(1, '#3a3d42');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(x, y); ctx.lineTo(x + ox, y + oy);
                    ctx.lineTo(x + cell + ox, y + oy); ctx.lineTo(x + cell, y);
                    ctx.closePath(); ctx.fill();
                }
            }
        }

        // ---- PASS 2: top face — reflective chrome, clipped to logo ----
        ctx.save();
        ctx.beginPath();
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid)) continue;
            const idx = pid - 1, c = idx % GRID, r = Math.floor(idx / GRID);
            ctx.rect(c * cell, r * cell, cell, cell);
        }
        ctx.clip();

        // Curved chrome reflection per cell — bright sky / dark horizon / bright ground
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                const u = (col / GRID) * 2 - 1;
                const v = (y - minY) / span;
                // surface bend makes it read as a rounded 3D body
                const bend = Math.sin(u * 1.8 + anim * 0.5) * 0.14 + Math.cos(v * 3.0 - anim * 0.3) * 0.05;
                const lv = Math.max(0, Math.min(1, v + bend));
                let lum = lv < 0.5 ? (1 - Math.pow(lv / 0.5, 0.85)) : Math.pow((lv - 0.5) / 0.5, 0.7);
                lum = lum * 0.5 + 0.18;
                const g = Math.round(18 + lum * 230);
                ctx.fillStyle = `rgb(${g},${g},${g})`;
                ctx.fillRect(x, y, cell, cell);
            }
        }

        // ---- Multiple animated lightning/specular streaks sweeping across ----
        const _csp = statParams();
        const allStreaks = [
            { pos: 0.20, w: 0.05, sp: 0.30, amp: 0.9 },
            { pos: 0.42, w: 0.03, sp: 0.55, amp: 1.0 },
            { pos: 0.66, w: 0.06, sp: 0.22, amp: 0.7 },
            { pos: 0.84, w: 0.025, sp: 0.70, amp: 0.85 },
            { pos: 0.32, w: 0.04, sp: 0.42, amp: 0.8 },
            { pos: 0.55, w: 0.035, sp: 0.62, amp: 0.95 },
            { pos: 0.75, w: 0.045, sp: 0.5, amp: 0.75 },
        ];
        // shots → more lightning streaks (2 baseline up to all 7)
        const nStreaks = Math.max(2, Math.min(allStreaks.length, 2 + Math.round(_csp.thickness * 5)));
        const streaks = allStreaks.slice(0, nStreaks);
        ctx.globalCompositeOperation = 'screen';
        for (const sk of streaks) {
            // diagonal sweeping position
            const phase = (anim * sk.sp + sk.pos) % 1.4 - 0.2; // travels across
            for (let row = 0; row < GRID; row++) {
                for (let col = 0; col < GRID; col++) {
                    if (!has(col, row)) continue;
                    const x = col * cell, y = row * cell;
                    // diagonal coordinate 0..1 across the logo
                    const dcoord = ((col * cell - minX) + (row * cell - minY)) / ((maxX - minX) + (maxY - minY) + 1);
                    const d = Math.abs(dcoord - phase);
                    if (d < sk.w * 2.2) {
                        const intensity = Math.exp(-Math.pow(d / sk.w, 2)) * sk.amp;
                        ctx.fillStyle = `rgba(255,255,255,${(intensity * 0.85).toFixed(3)})`;
                        ctx.fillRect(x, y, cell, cell);
                    }
                }
            }
        }
        ctx.globalCompositeOperation = 'source-over';

        // Sharp top-edge highlight glints (per-cell specular pop)
        ctx.globalCompositeOperation = 'screen';
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                const v = (y - minY) / span;
                const glint = Math.exp(-Math.pow((v - (0.30 + Math.sin((col) * 0.5 + anim) * 0.04)) * 8, 2));
                if (glint > 0.05) {
                    ctx.fillStyle = `rgba(255,255,255,${(glint * 0.6).toFixed(3)})`;
                    ctx.fillRect(x, y, cell, cell * 0.45);
                }
            }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();

        // ---- Beveled metallic top/left highlight, bottom/right shadow ----
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                ctx.lineWidth = Math.max(0.8, cell * 0.09);
                if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + cell, y + 0.5); ctx.stroke(); }
                if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + cell); ctx.stroke(); }
                ctx.strokeStyle = 'rgba(0,0,0,0.55)';
                if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell - 0.5); ctx.lineTo(x + cell, y + cell - 0.5); ctx.stroke(); }
                if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell - 0.5, y); ctx.lineTo(x + cell - 0.5, y + cell); ctx.stroke(); }
            }
        }

        // ---- Crisp dark outer outline ----
        ctx.strokeStyle = 'rgba(8,9,11,0.95)';
        ctx.lineWidth = Math.max(1, cell * 0.06);
        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const x = col * cell, y = row * cell;
                if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
            }
        }
    }

    // ===== LATEST treatment: Solid =====
    // Black & white "every treatment at once" — solid ink, smooth shaders,
    // halftone dots, ordered dither, hatching, checker, rings — partitioned into
    // deterministic patches so it reads as designed, not noise. Stat-driven.
    function renderSolid(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const dark = fillBgDark;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);
        const wire = shapeMode === 'outline' || shapeMode === 'pixels';

        const fg = dark ? 245 : 17;
        const bgL = dark ? 17 : 255;
        const inkRGB = `rgb(${fg},${fg},${fg})`;
        const sp = statParams();
        const tt = animate ? t : 0;

        let minX=GRID,minY=GRID,maxX=0,maxY=0,any=false;
        for (let pid=1; pid<=GRID*GRID; pid++){ if(!set.has(pid))continue; const i=pid-1,c=i%GRID,r=Math.floor(i/GRID); minX=Math.min(minX,c);maxX=Math.max(maxX,c);minY=Math.min(minY,r);maxY=Math.max(maxY,r); any=true; }
        if(!any){minX=0;minY=0;maxX=GRID-1;maxY=GRID-1;}
        const bw = Math.max(1, maxX-minX), bh = Math.max(1, maxY-minY);

        const bayer = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
        const NUM_STYLES = 12;
        const patch = 4;
        function styleFor(col,row){ const pc = Math.floor(col/patch), pr = Math.floor(row/patch); return pseed(pr*GRID+pc, fillSeed*7 + 13) % NUM_STYLES; }

        function fieldH(col){ return (col-minX)/bw; }
        function fieldV(col,row){ return (row-minY)/bh; }
        function fieldRadial(col,row){ const dx=(col-minX)/bw-0.5, dy=(row-minY)/bh-0.5; return 1 - Math.min(1, Math.sqrt(dx*dx+dy*dy)/0.707); }
        function fieldWave(col,row){ const u=(col-minX)/bw, v=(row-minY)/bh; return Math.max(0,Math.min(1,(u+v)/2 + 0.18*Math.sin(u*6 + tt))); }

        for (let pid=1; pid<=GRID*GRID; pid++){
            if(!set.has(pid))continue;
            const idx=pid-1, col=idx%GRID, row=Math.floor(idx/GRID);
            const x=col*cell, y=row*cell, cx=x+cell/2, cy=y+cell/2;

            if (wire) {
                ctx.strokeStyle = inkRGB; ctx.lineWidth = Math.max(1, cell*(0.06+sp.thickness*0.05));
                if (shapeMode === 'pixels') ctx.strokeRect(x+1,y+1,cell-2,cell-2);
                else ctx.strokeRect(x+0.5,y+0.5,cell-1,cell-1);
                continue;
            }

            const style = styleFor(col,row);

            if (style === 0) {
                ctx.fillStyle = inkRGB;
                ctx.fillRect(x, y, cell, cell);
            } else if (style === 1 || style === 2) {
                let f = style === 1 ? fieldH(col) : fieldWave(col,row);
                f = Math.max(0, Math.min(1, f));
                const g = Math.round(bgL + (fg - bgL) * f);
                ctx.fillStyle = `rgb(${g},${g},${g})`;
                ctx.fillRect(x, y, cell, cell);
            } else if (style === 3) {
                const f = Math.max(0, Math.min(1, 1 - fieldV(col,row) + 0.15));
                const rad = cell * 0.5 * (0.25 + f * 0.7);
                ctx.fillStyle = inkRGB;
                ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI*2); ctx.fill();
            } else if (style === 4) {
                const f = Math.max(0, Math.min(1, fieldRadial(col,row)));
                const n = 3, sub = cell/n;
                ctx.fillStyle = inkRGB;
                for (let sy=0; sy<n; sy++) for (let sx=0; sx<n; sx++){
                    const thr = bayer[(row*n+sy)&3][(col*n+sx)&3]/16;
                    if (f > thr) ctx.fillRect(x+sx*sub, y+sy*sub, Math.ceil(sub), Math.ceil(sub));
                }
            } else if (style === 5) {
                const f = Math.max(0, Math.min(1, fieldH(col)));
                const n = 4, sub = cell/n;
                ctx.fillStyle = inkRGB;
                for (let sy=0; sy<n; sy++) for (let sx=0; sx<n; sx++){
                    const thr = bayer[(sy)&3][(sx)&3]/16;
                    if (f*0.5+0.3 > thr) ctx.fillRect(x+sx*sub, y+sy*sub, Math.ceil(sub), Math.ceil(sub));
                }
            } else if (style === 6) {
                ctx.strokeStyle = inkRGB; ctx.lineWidth = Math.max(0.8, cell*0.08);
                for (let ly = y + cell*0.2; ly < y + cell; ly += cell*0.3) {
                    ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x+cell, ly); ctx.stroke();
                }
            } else if (style === 7) {
                ctx.strokeStyle = inkRGB; ctx.lineWidth = Math.max(0.8, cell*0.08);
                for (let lx = x + cell*0.2; lx < x + cell; lx += cell*0.3) {
                    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y+cell); ctx.stroke();
                }
            } else if (style === 8) {
                ctx.save(); ctx.beginPath(); ctx.rect(x,y,cell,cell); ctx.clip();
                ctx.strokeStyle = inkRGB; ctx.lineWidth = Math.max(0.8, cell*0.07);
                for (let d = -cell; d < cell*2; d += cell*0.32) {
                    ctx.beginPath(); ctx.moveTo(x+d, y); ctx.lineTo(x+d+cell, y+cell); ctx.stroke();
                }
                ctx.restore();
            } else if (style === 9) {
                ctx.save(); ctx.beginPath(); ctx.rect(x,y,cell,cell); ctx.clip();
                ctx.strokeStyle = inkRGB; ctx.lineWidth = Math.max(0.7, cell*0.06);
                for (let d = -cell; d < cell*2; d += cell*0.34) {
                    ctx.beginPath(); ctx.moveTo(x+d, y); ctx.lineTo(x+d+cell, y+cell); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x+d+cell, y); ctx.lineTo(x+d, y+cell); ctx.stroke();
                }
                ctx.restore();
            } else if (style === 10) {
                ctx.fillStyle = inkRGB;
                const h = cell/2;
                ctx.fillRect(x, y, h, h); ctx.fillRect(x+h, y+h, h, h);
            } else {
                ctx.strokeStyle = inkRGB; ctx.lineWidth = Math.max(0.7, cell*0.07);
                for (let rr = cell*0.12; rr < cell*0.55; rr += cell*0.16) {
                    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI*2); ctx.stroke();
                }
            }
        }

        ctx.strokeStyle = inkRGB;
        ctx.lineWidth = Math.max(1, cell*0.05);
        for (let row=0; row<GRID; row++){
            for(let col=0; col<GRID; col++){
                if(!has(col,row))continue;
                const x=col*cell,y=row*cell;
                if(!has(col,row-1)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cell,y);ctx.stroke();}
                if(!has(col,row+1)){ctx.beginPath();ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y+cell);ctx.stroke();}
                if(!has(col-1,row)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+cell);ctx.stroke();}
                if(!has(col+1,row)){ctx.beginPath();ctx.moveTo(x+cell,y);ctx.lineTo(x+cell,y+cell);ctx.stroke();}
            }
        }
    }

    // ===== LATEST treatment: Team 3D =====
    // Neon extruded lit-sign crest in the team's colors, with scanline texture
    // and faked glow. Extrusion depth scales with goals (statParams.complexity).
    function renderTeam3D(canvas, pixels, opts = {}) {
        const cell = opts.cell || 16;
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const t = opts.time || 0;
        const animate = !!opts.animate;
        const dark = fillBgDark;
        const teamId = opts.teamId;
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);
        const wire = shapeMode === 'outline' || shapeMode === 'pixels';

        let baseCols = teamPaletteFor(teamId).filter(c => c.toLowerCase() !== '#050505' && c.toLowerCase() !== '#000000');
        if (baseCols.length === 0) baseCols = ['#888888'];
        baseCols = baseCols.slice(0, 3);

        function hToRgb(h){ const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
        function neonize(rgb){
            const boost = rgb.map(v => {
                const avg = (rgb[0]+rgb[1]+rgb[2])/3;
                let nv = avg + (v - avg) * 1.9;
                return Math.max(0, Math.min(255, nv * 1.15));
            });
            return boost;
        }
        function css(c){ return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`; }
        function rgba(c, a){ return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`; }

        const palRgb = [];
        for (const hex of baseCols) {
            const neon = neonize(hToRgb(hex));
            palRgb.push(neon);
            palRgb.push(neon.map(v => Math.min(255, v * 0.55 + 30)));
        }

        const groupMap = new Int16Array(GRID * GRID).fill(-1);
        let groupCount = 0;
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            if (!set.has(pid) || groupMap[pid - 1] !== -1) continue;
            const gid = groupCount++;
            const stack = [pid - 1];
            while (stack.length) {
                const i = stack.pop();
                if (i < 0 || i >= GRID * GRID || groupMap[i] !== -1 || !set.has(i + 1)) continue;
                groupMap[i] = gid;
                const c = i % GRID, r = Math.floor(i / GRID);
                if (c > 0) stack.push(i - 1);
                if (c < GRID - 1) stack.push(i + 1);
                if (r > 0) stack.push(i - GRID);
                if (r < GRID - 1) stack.push(i + GRID);
            }
        }
        const groupColor = [];
        for (let g = 0; g < groupCount; g++) {
            const base = pseed(g, fillSeed) % palRgb.length;
            if (animate) {
                const shift = Math.floor(t * (0.35 + (g % 4) * 0.12) + g) % palRgb.length;
                groupColor.push(palRgb[(base + shift) % palRgb.length]);
            } else groupColor.push(palRgb[base]);
        }

        const depth = cell * (0.32 + statParams().complexity * 0.4);
        const ox = depth * 0.6, oy = -depth;

        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const nc = groupColor[groupMap[row * GRID + col]];
                const x = col * cell, y = row * cell;
                if (!has(col + 1, row)) {
                    ctx.beginPath();
                    ctx.moveTo(x + cell, y); ctx.lineTo(x + cell + ox, y + oy);
                    ctx.lineTo(x + cell + ox, y + cell + oy); ctx.lineTo(x + cell, y + cell);
                    ctx.closePath();
                    if (!wire) { ctx.fillStyle = rgba(nc.map(v=>v*0.18), 1); ctx.fill(); }
                    ctx.strokeStyle = wire ? (dark?'#fff':'#111') : rgba(nc, 0.4); ctx.lineWidth = wire?0.8:0.5; ctx.stroke();
                }
                if (!has(col, row - 1)) {
                    ctx.beginPath();
                    ctx.moveTo(x, y); ctx.lineTo(x + ox, y + oy);
                    ctx.lineTo(x + cell + ox, y + oy); ctx.lineTo(x + cell, y);
                    ctx.closePath();
                    if (!wire) { ctx.fillStyle = rgba(nc.map(v=>v*0.32), 1); ctx.fill(); }
                    ctx.strokeStyle = wire ? (dark?'#fff':'#111') : rgba(nc, 0.4); ctx.lineWidth = wire?0.8:0.5; ctx.stroke();
                }
            }
        }

        for (let row = 0; row < GRID; row++) {
            for (let col = 0; col < GRID; col++) {
                if (!has(col, row)) continue;
                const gid = groupMap[row * GRID + col];
                const nc = groupColor[gid];
                const x = col * cell, y = row * cell;

                if (!wire) {
                    ctx.fillStyle = rgba(nc.map(v=>v*0.22), 1);
                    ctx.fillRect(x, y, cell, cell);

                    ctx.save();
                    ctx.beginPath(); ctx.rect(x, y, cell, cell); ctx.clip();
                    const gap = Math.max(2, cell * 0.22);
                    const scroll = animate ? (t * 22 + gid * 9) % gap : 0;
                    ctx.strokeStyle = rgba(nc, 0.22);
                    ctx.lineWidth = Math.max(2, cell * 0.2);
                    for (let ly = y - gap + scroll; ly < y + cell + gap; ly += gap) {
                        ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + cell, ly); ctx.stroke();
                    }
                    ctx.strokeStyle = rgba(nc, 0.9);
                    ctx.lineWidth = Math.max(0.8, cell * 0.08);
                    for (let ly = y - gap + scroll; ly < y + cell + gap; ly += gap) {
                        ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + cell, ly); ctx.stroke();
                    }
                    ctx.strokeStyle = rgba(nc, 0.22);
                    ctx.lineWidth = 0.5;
                    for (let lx = x; lx <= x + cell; lx += cell * 0.33) {
                        ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y + cell); ctx.stroke();
                    }
                    ctx.restore();
                }

                if (!wire) {
                    ctx.strokeStyle = rgba(nc, 0.3);
                    ctx.lineWidth = Math.max(2, cell * 0.18);
                    if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                    if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                    if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                    if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                    ctx.strokeStyle = css(nc.map(v=>Math.min(255, v*1.1+30)));
                    ctx.lineWidth = Math.max(1, cell * 0.07);
                    if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                    if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                    if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                    if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                } else {
                    ctx.strokeStyle = dark?'#fff':'#111'; ctx.lineWidth = 0.8;
                    if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                    if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                    if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                    if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                }
            }
        }
    }

    function renderFlat(canvas, pixels, opts = {}) {
        const cell = opts.cell || 8;
        const off = opts.off || '#ffffff';
        // B+W mode
        if (opts.applyFill && activeFill === 'bw') { renderFluid(canvas, pixels, opts); return; }
        // Lines mode
        if (opts.applyFill && activeFill === 'lines') { renderLines(canvas, pixels, opts); return; }
        // Net mode
        if (opts.applyFill && activeFill === 'mesh') { renderMesh(canvas, pixels, opts); return; }
        // 3D mode
        if (opts.applyFill && activeFill === 'cube') { renderCube(canvas, pixels, opts); return; }
        // Shapes mode
        if (opts.applyFill && activeFill === 'stats') { renderStats(canvas, pixels, opts); return; }
        // Sweep mode
        if (opts.applyFill && activeFill === 'sweep') { renderSweep(canvas, pixels, opts); return; }
        // Pattern mode
        if (opts.applyFill && activeFill === 'pattern') { renderPattern(canvas, pixels, opts); return; }
        // Abstract mode
        if (opts.applyFill && activeFill === 'abstract') { renderAbstract(canvas, pixels, opts); return; }
        // Bauhaus mode
        if (opts.applyFill && activeFill === 'bauhaus') { renderBauhaus(canvas, pixels, opts); return; }
        // Chrome mode
        if (opts.applyFill && activeFill === 'chrome') { renderChrome(canvas, pixels, opts); return; }
        // Solid mode (latest — rich B&W treatment, not a flat fill)
        if (opts.applyFill && activeFill === 'solid') { renderSolid(canvas, pixels, opts); return; }
        // Team 3D mode (latest — neon extruded lit-sign crest)
        if (opts.applyFill && activeFill === 'team3d') { renderTeam3D(canvas, pixels, opts); return; }
        const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
        const W = GRID * cell, H = GRID * cell;
        canvas.width = W * dpr; canvas.height = H * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const set = new Set(pixels);
        const teamId = opts.teamId || '';
        ctx.fillStyle = opts.bg || '#ffffff';
        ctx.fillRect(0, 0, W, H);
        // Helper: draw a filled cell based on shape mode
        const has = (c, r) => c >= 0 && c < GRID && r >= 0 && r < GRID && set.has(r * GRID + c + 1);
        const drawCellShape = (cx, cy, color, idx) => {
            if (shapeMode === 'circle') {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(cx + cell / 2, cy + cell / 2, cell * 0.46, 0, Math.PI * 2);
                ctx.fill();
            } else if (shapeMode === 'pixels') {
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(1, cell * 0.08);
                ctx.strokeRect(cx + 1, cy + 1, cell - 2, cell - 2);
            } else if (shapeMode === 'outline') {
                // Outlined pixels — stroked individual squares with fill color
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(1, cell * 0.06);
                ctx.strokeRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1);
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(cx, cy, cell - (opts.gap || 0), cell - (opts.gap || 0));
            }
        };
        for (let pid = 1; pid <= GRID * GRID; pid++) {
            const idx = pid - 1, row = Math.floor(idx / GRID), col = idx % GRID;
            const px = col * cell, py = row * cell;
            if (set.has(pid)) {
                const isInternet = opts.applyFill && activeFill === 'internet';
                if (!isInternet) {
                    const base = opts.applyFill ? fillColor(idx, teamId) : (opts.on || '#111111');
                    drawCellShape(px, py, base, idx);
                    if (opts.applyFill && cell >= 3 && shapeMode !== 'pixels') {
                        const motif = motifForPixel(idx, teamId);
                        if (motif !== 'plain') {
                            // In outline mode, trick drawMotif into using black ink (light bg) or white ink (dark bg)
                            const motifBase = shapeMode === 'outline' ? (fillBgDark ? '#111111' : '#f5bd19') : base;
                            if (shapeMode === 'circle') {
                                ctx.save();
                                ctx.beginPath();
                                ctx.arc(px + cell / 2, py + cell / 2, cell * 0.46, 0, Math.PI * 2);
                                ctx.clip();
                                drawMotif(ctx, px, py, cell, motif, motifBase);
                                ctx.restore();
                            } else {
                                drawMotif(ctx, px, py, cell, motif, motifBase);
                            }
                        }
                    }
                } else {
                    // Internet: text glyphs
                    const textColor = fillBgDark ? '#cccccc' : '#222222';
                    let glyph;
                    if (shapeMode === 'outline' || shapeMode === 'pixels') {
                        // Binary mode — just 1s and 0s
                        glyph = pseed(idx, fillSeed) % 2 === 0 ? '1' : '0';
                    } else {
                        const motif = motifForPixel(idx, teamId);
                        const wrap = shapeMode === 'circle' ? ['(', ')'] : ['[', ']'];
                        glyph = wrap[0] + motif + wrap[1];
                        if (shapeMode === 'circle') {
                            ctx.strokeStyle = textColor;
                            ctx.lineWidth = Math.max(0.5, cell * 0.04);
                            ctx.globalAlpha = 0.25;
                            ctx.beginPath();
                            ctx.arc(px + cell / 2, py + cell / 2, cell * 0.46, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.globalAlpha = 1;
                        }
                    }
                    ctx.save();
                    ctx.fillStyle = textColor;
                    ctx.font = `900 ${Math.round(cell * 0.58)}px "JetBrains Mono", "SF Mono", "Fira Code", monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(glyph, px + cell / 2, py + cell / 2 + cell * 0.02);
                    ctx.restore();
                }
            }
        }
        // Outline mode: draw connected logo boundary after pixel loop
        if (shapeMode === 'outline') {
            const strokeColor = opts.applyFill ? (fillBgDark ? '#ffffff' : '#111111') : (opts.on || '#111111');
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = Math.max(1.5, cell * 0.1);
            ctx.lineJoin = 'miter';
            for (let row = 0; row < GRID; row++) {
                for (let col = 0; col < GRID; col++) {
                    if (!has(col, row)) continue;
                    const x = col * cell, y = row * cell;
                    if (!has(col, row - 1)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cell, y); ctx.stroke(); }
                    if (!has(col, row + 1)) { ctx.beginPath(); ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                    if (!has(col - 1, row)) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cell); ctx.stroke(); }
                    if (!has(col + 1, row)) { ctx.beginPath(); ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); ctx.stroke(); }
                }
            }
        }
        if (opts.showGrid) {
            ctx.strokeStyle = 'rgba(0,0,0,0.07)';
            ctx.lineWidth = 1;
            for (let k = 0; k <= GRID; k++) {
                ctx.beginPath(); ctx.moveTo(k * cell, 0); ctx.lineTo(k * cell, H); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, k * cell); ctx.lineTo(W, k * cell); ctx.stroke();
            }
        }
        if (opts.showMargin) {
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(MARGIN * cell, MARGIN * cell, (GRID - 2 * MARGIN) * cell, (GRID - 2 * MARGIN) * cell);
        }
        if (opts.showPitch) {
            const m = MARGIN * cell, pw = (GRID - 2 * MARGIN) * cell, pcx = W / 2, pcy = H / 2;
            ctx.strokeStyle = 'rgba(22,163,74,0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(pcx, m); ctx.lineTo(pcx, m + pw); ctx.stroke();
            ctx.beginPath(); ctx.arc(pcx, pcy, pw * 0.16, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(pcx, pcy, 2.5, 0, Math.PI * 2); ctx.fill();
            const boxH = pw * 0.42, boxW = pw * 0.16;
            ctx.strokeRect(m, pcy - boxH / 2, boxW, boxH);
            ctx.strokeRect(m + pw - boxW, pcy - boxH / 2, boxW, boxH);
        }
    }



export function setMotif(f){ activeFill = f; }
export function setMotifDark(d){ fillBgDark = d; }
export function setMotifShape(s){ shapeMode = s; }
export function setMotifSeed(n){ fillSeed = n; }
export function setMatchStats(s){ matchStats = { ...DEFAULT_STATS, ...(s || {}) }; }
export function setScorers(list){ scorers = Array.isArray(list) ? list.slice() : []; }
export function renderMotif(canvas, pixels, opts){ return renderFlat(canvas, pixels, opts); }
export const MOTIF_IDS = ["solid","lines","mesh","cube","teamColors","team3d","stats","pattern","abstract","internet","chrome","bauhaus"];
// The same flag palette the team3d / teamColors motifs use (black stripped),
// as 0–255 RGB triples — for the homepage Pixel Clash to match those colours.
export function teamClashColors(slug) {
  const BLACK = ['#050505', '#000000', '#111111'];
  return teamPaletteFor(slug)
    .filter((c) => !BLACK.includes(String(c).toLowerCase()))
    .map((h) => { const n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; });
}
