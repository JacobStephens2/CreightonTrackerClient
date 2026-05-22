import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';

// PWA web app icon sizes (regular, rounded square)
const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const pwaDir = 'public/app-icons';

// Android TWA mipmap launcher (regular) sizes per density
const androidLauncherSizes = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

// Android TWA mipmap maskable sizes per density (~1.71x launcher to give
// padding around the safe-zone content under adaptive icon masks).
const androidMaskableSizes = {
  mdpi: 82,
  hdpi: 123,
  xhdpi: 164,
  xxhdpi: 246,
  xxxhdpi: 328,
};

// TWA splash screen icon sizes per density (square, centered on #FAFAFA bg)
const twaSplashSizes = {
  mdpi: 300,
  hdpi: 450,
  xhdpi: 600,
  xxhdpi: 900,
  xxxhdpi: 1200,
};

// Capacitor splash screen sizes (full-screen, portrait + landscape)
const capSplashPortrait = {
  mdpi: [320, 480],
  hdpi: [480, 800],
  xhdpi: [720, 1280],
  xxhdpi: [960, 1600],
  xxxhdpi: [1280, 1920],
};

const capSplashLandscape = {
  mdpi: [480, 320],
  hdpi: [800, 480],
  xhdpi: [1280, 720],
  xxhdpi: [1600, 960],
  xxxhdpi: [1920, 1280],
};

const androidResDirs = [
  'android-twa/app/src/main/res',
  'android/app/src/main/res',
];

/**
 * Build the icon SVG. Mirrors public/favicon.svg (burgundy → pink gradient
 * background with the white clock icon used in the app header). The
 * `maskable` variant drops the rounded corners and shrinks the icon so the
 * recognizable content sits well inside the Android adaptive-icon safe zone
 * (center ~80%).
 */
function generateSVG(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : Math.round(size * (14 / 64));

  // The header clock path is authored in a 24-unit viewBox. In the favicon it
  // is placed at translate(12,12) scale(1.667) inside a 64-unit canvas, which
  // yields a 40-unit icon centered in the 64-unit canvas (≈62.5%). For
  // maskable, shrink to ~52% of the canvas so it sits inside the safe zone.
  const iconRatio = maskable ? 0.52 : 0.625;
  const iconSize = size * iconRatio;
  const iconScale = iconSize / 24;
  const iconOffset = (size - iconSize) / 2;

  const clockPath =
    'M12 2c3.13 0 5.87 1.7 7.35 4.23.32.55.13 1.25-.42 1.56-.55.32-1.25.13-1.56-.42A6.25 6.25 0 0012 4.3 6.3 6.3 0 006.24 8.1 6.27 6.27 0 006.7 15c1.14 1.95 3.19 3.18 5.45 3.18 1.95 0 3.8-.93 4.98-2.48.38-.5 1.1-.6 1.61-.21.5.38.6 1.1.21 1.61A8.5 8.5 0 0112.15 20.5c-3.08 0-5.95-1.64-7.5-4.3A8.57 8.57 0 014.02 8.3 8.59 8.59 0 0112 2zm0 4.2c.63 0 1.15.51 1.15 1.15v3.98l2.72 1.63a1.15 1.15 0 11-1.18 1.98l-3.28-1.97a1.15 1.15 0 01-.56-.99V7.35c0-.64.51-1.15 1.15-1.15z';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(-35)">
      <stop offset="0%" stop-color="#7b5556"/>
      <stop offset="100%" stop-color="#f7c5c5"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <g transform="translate(${iconOffset}, ${iconOffset}) scale(${iconScale})" fill="#fff7f6">
    <path d="${clockPath}"/>
  </g>
</svg>`;
}

/**
 * Build a full-screen splash SVG. The gradient fills the entire canvas and the
 * clock icon is centered at a fixed size (roughly 20% of the shorter dimension).
 */
function generateSplashSVG(width, height) {
  const shorter = Math.min(width, height);
  const iconSize = shorter * 0.2;
  const iconScale = iconSize / 24;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2;

  const clockPath =
    'M12 2c3.13 0 5.87 1.7 7.35 4.23.32.55.13 1.25-.42 1.56-.55.32-1.25.13-1.56-.42A6.25 6.25 0 0012 4.3 6.3 6.3 0 006.24 8.1 6.27 6.27 0 006.7 15c1.14 1.95 3.19 3.18 5.45 3.18 1.95 0 3.8-.93 4.98-2.48.38-.5 1.1-.6 1.61-.21.5.38.6 1.1.21 1.61A8.5 8.5 0 0112.15 20.5c-3.08 0-5.95-1.64-7.5-4.3A8.57 8.57 0 014.02 8.3 8.59 8.59 0 0112 2zm0 4.2c.63 0 1.15.51 1.15 1.15v3.98l2.72 1.63a1.15 1.15 0 11-1.18 1.98l-3.28-1.97a1.15 1.15 0 01-.56-.99V7.35c0-.64.51-1.15 1.15-1.15z';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(-35)">
      <stop offset="0%" stop-color="#7b5556"/>
      <stop offset="100%" stop-color="#f7c5c5"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <g transform="translate(${iconX}, ${iconY}) scale(${iconScale})" fill="#fff7f6">
    <path d="${clockPath}"/>
  </g>
</svg>`;
}

function writeSVG(path, svg) {
  // Trailing newline so re-runs don't churn POSIX line endings.
  writeFileSync(path, svg.endsWith('\n') ? svg : svg + '\n');
  console.log(`Generated ${path}`);
}

function writePNG(svgPath, pngPath, size) {
  // rsvg-convert preserves SVG geometry better than ImageMagick's convert.
  execFileSync('rsvg-convert', [
    '-w',
    String(size),
    '-h',
    String(size),
    '-o',
    pngPath,
    svgPath,
  ]);
  console.log(`Generated ${pngPath}`);
}

mkdirSync(pwaDir, { recursive: true });

// PWA icons (regular)
for (const size of pwaSizes) {
  const svgPath = `${pwaDir}/icon-${size}x${size}.svg`;
  const pngPath = `${pwaDir}/icon-${size}x${size}.png`;
  writeSVG(svgPath, generateSVG(size));
  writePNG(svgPath, pngPath, size);
}

// PWA maskable icon (512)
{
  const svgPath = `${pwaDir}/maskable-icon-512x512.svg`;
  const pngPath = `${pwaDir}/maskable-icon-512x512.png`;
  writeSVG(svgPath, generateSVG(512, { maskable: true }));
  writePNG(svgPath, pngPath, 512);
}

// Favicon (the source-of-truth visual)
writeSVG('public/favicon.svg', generateSVG(64));

// Android launcher icons. We render PNG-only here; the SVG is just
// scratch input for rsvg-convert and immediately discarded.
const tmpDir = '.icon-tmp';
mkdirSync(tmpDir, { recursive: true });

// Shared: launcher + foreground + round icons for both android dirs
for (const androidResDir of androidResDirs) {
  for (const [density, size] of Object.entries(androidLauncherSizes)) {
    const svgPath = `${tmpDir}/launcher-${size}.svg`;
    const pngPath = `${androidResDir}/mipmap-${density}/ic_launcher.png`;
    writeSVG(svgPath, generateSVG(size));
    writePNG(svgPath, pngPath, size);

    // Round icon variant (used by some launchers)
    const roundPath = `${androidResDir}/mipmap-${density}/ic_launcher_round.png`;
    writePNG(svgPath, roundPath, size);

    // Adaptive icon foreground layer (maskable, no rounded corners)
    const fgSvgPath = `${tmpDir}/maskable-fg-${size}.svg`;
    const fgPath = `${androidResDir}/mipmap-${density}/ic_launcher_foreground.png`;
    writeSVG(fgSvgPath, generateSVG(size, { maskable: true }));
    writePNG(fgSvgPath, fgPath, size);
  }
}

// TWA splash screen — square icon centered on #FAFAFA background
const twaResDir = androidResDirs[0];
for (const [density, size] of Object.entries(twaSplashSizes)) {
  const svgPath = `${tmpDir}/splash-${size}.svg`;
  const pngPath = `${twaResDir}/drawable-${density}/splash.png`;
  writeSVG(svgPath, generateSVG(size));
  writePNG(svgPath, pngPath, size);
}

// Capacitor splash screen — full-screen gradient + centered icon
const capResDir = androidResDirs[1];

// Portrait
for (const [density, [w, h]] of Object.entries(capSplashPortrait)) {
  const svgPath = `${tmpDir}/splash-port-${w}x${h}.svg`;
  const pngPath = `${capResDir}/drawable-port-${density}/splash.png`;
  writeSVG(svgPath, generateSplashSVG(w, h));
  writePNG(svgPath, pngPath, w);
}

// Landscape
for (const [density, [w, h]] of Object.entries(capSplashLandscape)) {
  const svgPath = `${tmpDir}/splash-land-${w}x${h}.svg`;
  const pngPath = `${capResDir}/drawable-land-${density}/splash.png`;
  writeSVG(svgPath, generateSplashSVG(w, h));
  writePNG(svgPath, pngPath, w);
}

// Base splash (fallback)
{
  const svgPath = `${tmpDir}/splash-base.svg`;
  const pngPath = `${capResDir}/drawable/splash.png`;
  writeSVG(svgPath, generateSplashSVG(480, 320));
  writePNG(svgPath, pngPath, 480);
}

console.log('Updated PWA icons, favicon, and Android icons + splash screen.');
