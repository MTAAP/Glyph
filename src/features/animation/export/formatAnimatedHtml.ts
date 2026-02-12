import type { CharacterGrid, AnimationSettings } from '@/shared/types';

interface AnimatedHtmlOptions {
  fontSize?: number;
  fontFamily?: string;
  background?: string;
  cellSpacingX?: number;
  cellSpacingY?: number;
}

/**
 * Generates a self-contained HTML file with embedded animation runtime.
 * The HTML includes serialized grid data, effect config, and JS that
 * recreates the animation using requestAnimationFrame.
 */
export function formatAnimatedHtml(
  baseGrid: CharacterGrid,
  animation: AnimationSettings,
  options: AnimatedHtmlOptions = {},
): string {
  const {
    fontSize = 12,
    fontFamily = "'Courier New', Courier, monospace",
    background = '#1a1a1a',
    cellSpacingX = 1,
    cellSpacingY = 1,
  } = options;

  // Serialize grid: each cell as [char, fg?, bg?] with trailing undefineds stripped
  const gridData = baseGrid.map((row) =>
    row.map((cell) => {
      if (cell.bg) return [cell.char, cell.fg ?? null, [...cell.bg]];
      if (cell.fg) return [cell.char, [...cell.fg]];
      return [cell.char];
    }),
  );

  const effectConfigs = animation.effects.map((e) => ({
    key: e.key,
    params: e.params,
  }));

  const runtimeJs = buildRuntime(animation);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Glyph Animation</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: ${background}; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
#canvas { font-family: ${fontFamily}; font-size: ${fontSize}px; line-height: ${1.2 * cellSpacingY}; letter-spacing: ${(fontSize * 0.6 * (cellSpacingX - 1)).toFixed(2)}px; white-space: pre; margin: 0; }
</style>
</head>
<body>
<pre id="canvas"></pre>
<script>
(function() {
  var BASE_GRID = ${JSON.stringify(gridData)};
  var EFFECTS = ${JSON.stringify(effectConfigs)};
  var FPS = ${animation.fps};
  var CYCLE_DURATION = ${animation.cycleDuration};
  var LOOP_MODE = "${animation.loopMode}";
  var ROWS = BASE_GRID.length;
  var COLS = ROWS > 0 ? BASE_GRID[0].length : 0;

${runtimeJs}

  var canvas = document.getElementById("canvas");
  var startTime = performance.now();
  var lastFrame = -1;
  var stopped = false;

  function decodeGrid(data) {
    return data.map(function(row) {
      return row.map(function(cell) {
        return { char: cell[0], fg: cell[1] || null, bg: cell[2] || null };
      });
    });
  }

  var baseGrid = decodeGrid(BASE_GRID);

  function renderToHtml(grid) {
    var lines = [];
    for (var y = 0; y < grid.length; y++) {
      var spans = [];
      for (var x = 0; x < grid[y].length; x++) {
        var cell = grid[y][x];
        var style = "";
        if (cell.fg) style += "color:rgb(" + cell.fg.join(",") + ");";
        if (cell.bg) style += "background:rgb(" + cell.bg.join(",") + ");";
        if (style) {
          spans.push('<span style="' + style + '">' + escapeHtml(cell.char) + '</span>');
        } else {
          spans.push(escapeHtml(cell.char));
        }
      }
      lines.push(spans.join(""));
    }
    return lines.join("\\n");
  }

  function escapeHtml(c) {
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === "&") return "&amp;";
    return c;
  }

  function tick(now) {
    if (stopped) return;
    var elapsed = (now - startTime) / 1000;
    var t;
    if (LOOP_MODE === "loop") {
      t = (elapsed / CYCLE_DURATION) % 1;
    } else if (LOOP_MODE === "pingpong") {
      var phase = (elapsed / CYCLE_DURATION) % 2;
      t = phase <= 1 ? phase : 2 - phase;
    } else {
      t = Math.min(elapsed / CYCLE_DURATION, 1);
      if (t >= 1) stopped = true;
    }
    var frameNum = Math.floor(elapsed * FPS);
    if (frameNum !== lastFrame) {
      lastFrame = frameNum;
      var ctx = { t: t, frame: Math.floor(t * FPS * CYCLE_DURATION), rows: ROWS, cols: COLS, cycleDuration: CYCLE_DURATION };
      var animated = applyPipeline(baseGrid, EFFECTS, ctx);
      canvas.innerHTML = renderToHtml(animated);
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
</script>
</body>
</html>`;
}

/**
 * Build standalone JS implementations of the active effects.
 * Only includes effects that are actually used to minimize file size.
 * The implementations mirror the engine effects in src/features/animation/engine/effects/.
 */
function buildRuntime(animation: AnimationSettings): string {
  const usedKeys = new Set(animation.effects.map((e) => e.key));

  // Shared utility functions (matches engine/utils.ts)
  let js = `
  function seededRandom(seed) {
    var x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function brightenRgb(c, amt) {
    return [
      Math.min(255, Math.round(c[0] + (255 - c[0]) * amt)),
      Math.min(255, Math.round(c[1] + (255 - c[1]) * amt)),
      Math.min(255, Math.round(c[2] + (255 - c[2]) * amt))
    ];
  }
  function dimRgb(c, amt) {
    return [
      Math.max(0, Math.round(c[0] * (1 - amt))),
      Math.max(0, Math.round(c[1] * (1 - amt))),
      Math.max(0, Math.round(c[2] * (1 - amt)))
    ];
  }
  function blendColor(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }
  function cloneGrid(g) {
    return g.map(function(r) {
      return r.map(function(c) {
        return { char: c.char, fg: c.fg ? c.fg.slice() : null, bg: c.bg ? c.bg.slice() : null };
      });
    });
  }
`;

  // Palettes — matches engine/palettes.ts
  if (usedKeys.has('colorPulse')) {
    js += `
  var PALETTES = [
    [[255,20,147],[0,255,255],[148,0,211],[0,100,255]],
    [[255,176,0],[0,128,128],[25,25,112],[255,222,173]],
    [[0,255,0],[0,200,0],[0,150,0],[0,100,0]],
    [[255,105,180],[186,85,211],[0,255,255],[255,0,255]],
    [[255,0,0],[255,140,0],[255,255,0],[139,0,0]]
  ];`;
  }

  // HSL conversion — matches shared/utils/color.ts rgbToHsl/hslToRgb
  if (usedKeys.has('colorWave')) {
    js += `
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    var d = max - min;
    var s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    var h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    if (s === 0) { var v = Math.round(l * 255); return [v, v, v]; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var hn = h / 360;
    function hue2rgb(pp, qq, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return pp + (qq - pp) * 6 * t;
      if (t < 1/2) return qq;
      if (t < 2/3) return pp + (qq - pp) * (2/3 - t) * 6;
      return pp;
    }
    return [Math.round(hue2rgb(p,q,hn+1/3)*255), Math.round(hue2rgb(p,q,hn)*255), Math.round(hue2rgb(p,q,hn-1/3)*255)];
  }`;
  }

  const effectFunctions: string[] = [];

  // Each effect mirrors the corresponding file in engine/effects/
  if (usedKeys.has('colorPulse')) {
    effectFunctions.push(`
  function fx_colorPulse(grid, ctx, p) {
    var intensity = p.intensity;
    var speed = p.speed;
    var pidx = Math.round(p.paletteIndex || 0);
    var palette = PALETTES[pidx] || PALETTES[0];
    var phase = (ctx.t * speed) % 1;
    var pos = phase * palette.length;
    var idx = Math.floor(pos);
    var frac = pos - idx;
    var c1 = palette[idx % palette.length];
    var c2 = palette[(idx + 1) % palette.length];
    var target = blendColor(c1, c2, frac);
    return grid.map(function(row) {
      return row.map(function(cell) {
        var fg = cell.fg || [200,200,200];
        return { char: cell.char, fg: blendColor(fg, target, intensity), bg: cell.bg ? cell.bg.slice() : null };
      });
    });
  }`);
  }

  if (usedKeys.has('scanline')) {
    effectFunctions.push(`
  function fx_scanline(grid, ctx, p) {
    var bandWidth = p.bandWidth;
    var dimAmount = p.dimAmount;
    var bandCenter = ctx.t * ctx.rows;
    return grid.map(function(row, y) {
      return row.map(function(cell) {
        var distance = Math.abs(y - bandCenter);
        var fg = cell.fg || [200,200,200];
        var bg = cell.bg ? cell.bg.slice() : null;
        if (distance < bandWidth / 2) {
          var strength = 1 - distance / (bandWidth / 2);
          return { char: cell.char, fg: brightenRgb(fg, strength * 0.5), bg: bg };
        }
        return { char: cell.char, fg: dimRgb(fg, dimAmount), bg: bg };
      });
    });
  }`);
  }

  if (usedKeys.has('glitch')) {
    effectFunctions.push(`
  function fx_glitch(grid, ctx, p) {
    var intensity = p.intensity;
    var charCorruption = p.charCorruption;
    var rowShift = p.rowShift;
    var colorSplit = Math.round(p.colorSplit);
    var glitchChars = "!@#$%^&*" + String.fromCharCode(0x2591,0x2592,0x2593,0x2588);
    var baseSeed = ctx.frame * 1000;
    var result = cloneGrid(grid);
    if (rowShift > 0) {
      for (var y = 0; y < result.length; y++) {
        if (seededRandom(baseSeed + y * 7) < intensity) {
          var shift = Math.round((seededRandom(baseSeed + y * 13) - 0.5) * 2 * rowShift);
          var row = result[y];
          var newRow = [];
          for (var x = 0; x < row.length; x++) {
            var sx = ((x - shift) % row.length + row.length) % row.length;
            newRow.push({ char: row[sx].char, fg: row[sx].fg ? row[sx].fg.slice() : null, bg: row[sx].bg ? row[sx].bg.slice() : null });
          }
          result[y] = newRow;
        }
      }
    }
    if (charCorruption > 0) {
      for (var y2 = 0; y2 < result.length; y2++) {
        for (var x2 = 0; x2 < result[y2].length; x2++) {
          if (seededRandom(baseSeed + y2 * 31 + x2 * 17) < charCorruption * intensity) {
            result[y2][x2].char = glitchChars[Math.floor(seededRandom(baseSeed + y2 * 41 + x2 * 23) * glitchChars.length)];
          }
        }
      }
    }
    if (colorSplit > 0) {
      for (var y3 = 0; y3 < result.length; y3++) {
        for (var x3 = 0; x3 < result[y3].length; x3++) {
          var cell = result[y3][x3];
          if (!cell.fg) continue;
          if (seededRandom(baseSeed + y3 * 53 + x3 * 37) < intensity) {
            var leftX = Math.max(0, x3 - colorSplit);
            var rightX = Math.min(result[y3].length - 1, x3 + colorSplit);
            var lc = grid[y3] && grid[y3][leftX];
            var rc = grid[y3] && grid[y3][rightX];
            var r = (lc && lc.fg) ? lc.fg[0] : cell.fg[0];
            var g = cell.fg[1];
            var b = (rc && rc.fg) ? rc.fg[2] : cell.fg[2];
            result[y3][x3].fg = [r, g, b];
          }
        }
      }
    }
    return result;
  }`);
  }

  if (usedKeys.has('rain')) {
    effectFunctions.push(`
  function fx_rain(grid, ctx, p) {
    var density = p.density;
    var speed = p.speed;
    var trailLength = p.trailLength;
    var drops = [];
    for (var col = 0; col < ctx.cols; col++) {
      var colSeed = col * 997;
      if (seededRandom(colSeed) < density) {
        var totalTravel = ctx.rows + trailLength;
        var offset = seededRandom(colSeed + 1) * totalTravel;
        drops.push({ headY: ((ctx.t * speed * totalTravel + offset) % totalTravel) - trailLength });
      } else {
        drops.push({ headY: -trailLength - 1 });
      }
    }
    return grid.map(function(row, y) {
      return row.map(function(cell, x) {
        var drop = drops[x];
        var dist = y - drop.headY;
        if (dist < 0 || dist > trailLength) {
          return { char: cell.char, fg: cell.fg ? dimRgb(cell.fg, 0.3) : null, bg: cell.bg ? cell.bg.slice() : null };
        }
        if (dist < 1) {
          return { char: cell.char, fg: brightenRgb([200,255,200], 0.3), bg: cell.bg ? cell.bg.slice() : null };
        }
        var fade = 1 - dist / trailLength;
        return { char: cell.char, fg: [Math.round(0*fade), Math.round(180*fade), Math.round(0*fade)], bg: cell.bg ? cell.bg.slice() : null };
      });
    });
  }`);
  }

  if (usedKeys.has('flicker')) {
    effectFunctions.push(`
  function fx_flicker(grid, ctx, p) {
    var intensity = p.intensity;
    var boost = p.brightnessBoost;
    var baseSeed = ctx.frame * 1000;
    return grid.map(function(row, y) {
      return row.map(function(cell, x) {
        if (seededRandom(baseSeed + y * 61 + x * 43) < intensity) {
          var fg = cell.fg || [200,200,200];
          return { char: cell.char, fg: brightenRgb(fg, boost), bg: cell.bg ? cell.bg.slice() : null };
        }
        return { char: cell.char, fg: cell.fg ? cell.fg.slice() : null, bg: cell.bg ? cell.bg.slice() : null };
      });
    });
  }`);
  }

  if (usedKeys.has('colorWave')) {
    effectFunctions.push(`
  function fx_colorWave(grid, ctx, p) {
    var direction = Math.round(p.direction);
    var wavelength = p.wavelength;
    var speed = p.speed;
    var timeOffset = ctx.t * speed * 360;
    return grid.map(function(row, y) {
      return row.map(function(cell, x) {
        var fg = cell.fg || [200,200,200];
        var posFactor;
        if (direction === 1) posFactor = y / ctx.rows;
        else if (direction === 2) posFactor = (x / ctx.cols + y / ctx.rows) / 2;
        else posFactor = x / ctx.cols;
        var hueShift = (posFactor * 360 * wavelength + timeOffset) % 360;
        var hsl = rgbToHsl(fg[0], fg[1], fg[2]);
        var newH = (hsl[0] + hueShift) % 360;
        return { char: cell.char, fg: hslToRgb(newH, Math.max(hsl[1], 0.5), hsl[2]), bg: cell.bg ? cell.bg.slice() : null };
      });
    });
  }`);
  }

  if (usedKeys.has('blackwall')) {
    effectFunctions.push(`
  function bw_heartbeat(t) {
    var p = t % 1;
    var b1 = Math.exp(-Math.pow((p - 0.0) * 8, 2));
    var b2 = Math.exp(-Math.pow((p - 0.18) * 10, 2)) * 0.7;
    return Math.min(1, b1 + b2);
  }
  function bw_drip(x, y, ctx, speed, density) {
    var cs = x * 997 + 31;
    if (seededRandom(cs) > density) return 0;
    var tl = 6 + Math.floor(seededRandom(cs + 7) * 10);
    var ds = 0.6 + seededRandom(cs + 13) * 0.8;
    var off = seededRandom(cs + 19) * ctx.rows;
    var hy = ((ctx.t * speed * ds * ctx.rows + off) % (ctx.rows + tl)) - tl;
    var dist = y - hy;
    if (dist < 0 || dist > tl) return 0;
    if (dist < 1) return 1;
    return Math.max(0, 1 - dist / tl);
  }
  function fx_blackwall(grid, ctx, p) {
    var intensity = p.intensity;
    var corruption = p.corruption;
    var speed = p.speed;
    var dripDensity = p.dripDensity;
    var WD = [40,0,0], WR = [180,0,20], WC = [255,0,50], WH = [255,40,0];
    var AC = [0,200,220], AW = [255,220,220];
    var pulse = bw_heartbeat(ctx.t * speed);
    var breathe = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ctx.t * speed * Math.PI * 2));
    var baseSeed = ctx.frame * 1000;
    return grid.map(function(row, y) {
      return row.map(function(cell, x) {
        var fg = cell.fg || [200,200,200];
        var ch = cell.char;
        var nx = ctx.cols > 1 ? x / (ctx.cols - 1) : 0;
        var ny = ctx.rows > 1 ? y / (ctx.rows - 1) : 0;
        var ws = 0;
        for (var w = 0; w < 3; w++) {
          var freq = (w+1)*1.7, phase = w*2.1 + ctx.t*speed*(w+1)*0.8;
          ws += (Math.sin((nx*freq+phase)*Math.PI*2)*0.55 + Math.sin((ny*freq*0.7+phase*1.3)*Math.PI*2)*0.45)/3;
        }
        var wave = 0.5 + 0.5 * ws;
        var wc = blendColor(blendColor(WD,WR,wave), blendColor(WC,WH,wave), pulse*0.6+wave*0.4);
        var ei = intensity * (0.5 + 0.5 * breathe);
        var nfg = blendColor(fg, wc, ei);
        nfg = dimRgb(nfg, (1-wave)*0.4*intensity);
        if (pulse > 0.3) { nfg = brightenRgb(nfg, (pulse-0.3)/0.7*wave*0.5*intensity); }
        var drip = bw_drip(x, y, ctx, speed, dripDensity);
        if (drip > 0) {
          var dc = drip > 0.8 ? blendColor(WC, AW, (drip-0.8)*5) : blendColor(WD, WC, drip);
          nfg = blendColor(nfg, dc, drip * intensity);
        }
        if (corruption > 0) {
          var bx = Math.floor(x/4), by = Math.floor(y/3);
          var bs = ctx.frame*137 + bx*53 + by*29;
          if (seededRandom(bs) < corruption * intensity) {
            nfg = blendColor(WD, WR, seededRandom(bs+3));
            var cc = "\\u2591\\u2592\\u2593\\u2588";
            if (seededRandom(bs+7) < 0.4) ch = cc[Math.floor(seededRandom(bs+11)*cc.length)];
          }
        }
        if (pulse > 0.5 && intensity > 0.3) {
          var sr = seededRandom(baseSeed + y*73 + x*47);
          if (sr < 0.15*intensity) {
            var so = Math.round(sr*3)+1;
            var nxp = Math.min(ctx.cols-1, x+so);
            var nf = grid[y][nxp].fg || fg;
            nfg = [Math.min(255,Math.round(nf[0]*0.7+nfg[0]*0.3)), nfg[1], nfg[2]];
          }
        }
        var fr = seededRandom(baseSeed + y*89 + x*61);
        if (fr < 0.02*pulse*intensity) {
          var acc = fr < 0.01*pulse*intensity ? AC : AW;
          nfg = blendColor(nfg, acc, 0.6+fr*10);
        }
        return { char: ch, fg: nfg, bg: cell.bg ? cell.bg.slice() : null };
      });
    });
  }`);
  }

  if (usedKeys.has('typing')) {
    effectFunctions.push(`
  function fx_typing(grid, ctx, p) {
    var direction = Math.round(p.direction);
    var holdFrames = p.holdFrames;
    var totalCells = ctx.rows * ctx.cols;
    var totalFr = ctx.cycleDuration * 30;
    var holdFraction = totalFr > 0 ? holdFrames / totalFr : 0;
    var revealDuration = Math.max(0.01, 1 - holdFraction);
    var revealProgress = Math.min(ctx.t / revealDuration, 1);
    var revealCount = Math.floor(revealProgress * totalCells);
    var order = [];
    var y, x;
    switch (direction) {
      case 1:
        for (y = 0; y < ctx.rows; y++) for (x = ctx.cols - 1; x >= 0; x--) order.push([y, x]);
        break;
      case 2:
        for (y = 0; y < ctx.rows; y++) for (x = 0; x < ctx.cols; x++) order.push([y, x]);
        for (var i = order.length - 1; i > 0; i--) {
          var j = Math.floor(seededRandom(i * 137) * (i + 1));
          var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
        }
        break;
      case 3:
        for (x = 0; x < ctx.cols; x++) for (y = 0; y < ctx.rows; y++) order.push([y, x]);
        break;
      default:
        for (y = 0; y < ctx.rows; y++) for (x = 0; x < ctx.cols; x++) order.push([y, x]);
        break;
    }
    var revealed = {};
    for (var k = 0; k < revealCount && k < order.length; k++) {
      revealed[order[k][0] + "," + order[k][1]] = true;
    }
    return grid.map(function(row, ry) {
      return row.map(function(cell, rx) {
        if (revealed[ry + "," + rx]) {
          return { char: cell.char, fg: cell.fg ? cell.fg.slice() : null, bg: cell.bg ? cell.bg.slice() : null };
        }
        return { char: " ", fg: cell.fg ? cell.fg.slice() : null, bg: cell.bg ? cell.bg.slice() : null };
      });
    });
  }`);
  }

  js += effectFunctions.join('\n');

  // Pipeline dispatcher
  js += `
  var EFFECT_MAP = {${
    Array.from(usedKeys)
      .map((k) => `"${k}": fx_${k}`)
      .join(', ')
  }};
  function applyPipeline(grid, effects, ctx) {
    var current = grid;
    for (var i = 0; i < effects.length; i++) {
      var fn = EFFECT_MAP[effects[i].key];
      if (fn) current = fn(current, ctx, effects[i].params);
    }
    return current;
  }`;

  return js;
}
