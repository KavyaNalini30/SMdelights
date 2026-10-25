// Image pipeline: reads the client's raw files from Images/ (git-ignored, never modified)
// and writes optimised, web-safe copies into public/images and app/ (committed).
//
//   npm run images
//   REALESRGAN_BIN="C:\path\to\realesrgan-ncnn-vulkan.exe" npm run images   (AI upscaling)
//
// Product photos keep their own proportions — the site shows them whole (object-contain)
// on an ivory card, so nothing is ever cropped off. Small photos are upscaled 4x with
// Real-ESRGAN when REALESRGAN_BIN is set (results cached in .cache/upscaled/), otherwise
// with a careful Lanczos resize + light sharpening. Re-run whenever the client sends photos.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "Images";
const OUT = "public/images";
const CACHE = ".cache/upscaled";
const IVORY = "#F2ECE0"; // logo background — keep in sync with --color-ivory
const LONG_EDGE = 1400; // product photos: sharp on 3x phones at card size, and on the product page
const UPSCALE_BELOW = 1000; // long edge (px) under which a photo is AI-upscaled
const REALESRGAN = process.env.REALESRGAN_BIN;

// source (relative to Images/) -> product slug (matches supabase/03_seed_data.sql).
// crop = [left, top, right, bottom] fractions to trim: screenshot borders, AI-tool watermarks.
const SPARKLE = [0, 0, 0, 0.1]; // small "✦" watermark near the bottom-right corner
const BORDER = [0.02, 0.02, 0.02, 0.02]; // thin screenshot frame
const PRODUCTS = [
  ["Brownies/melo brownie.png", "classic-melo-brownie"],
  ["Brownies/white_choc.png", "white-chocolate-brownie"],
  ["Brownies/Cookie and Cream.png", "cookies-and-cream-brownie"],
  ["Brownies/ferrero rocher.png", "ferrero-nutella-brownie", BORDER],
  ["Brownies/Triple chocolate.png", "triple-chocolate-brownie", BORDER],
  ["Brownies/kitkat.png", "kitkat-brownie", BORDER],
  ["Brownies/diarymilk.png", "dairy-milk-brownie"],
  ["Brownies/pistachio (1).png", "pistachio-brownie"],
  ["Brownies/Milk chocolate Brownie Tub.jpg", "brownie-tub-milk-chocolate"],
  ["Brownies/White chocolate brownie tub.png", "brownie-tub-white-chocolate", SPARKLE],
  ["Brownies/Dark chocolate Brownie Tub.jpg", "brownie-tub-dark-chocolate"],
  ["Brownies/Double chocolate Brownie Tub.jpg", "brownie-tub-double-chocolate"],
  ["Brownies/Triple chocolate Brownie Tub.jpg", "brownie-tub-triple-chocolate"],
  ["Brownies/Pistachio brownie tub.png", "brownie-tub-pistachio-kunafa", SPARKLE],
  ["Brownies/Marshmallow Brownie Tub.png", "marshmallow-brownie", SPARKLE],
  ["Brownies/fudge_brownie.jpg", "fudge-brownie-box", SPARKLE],
  ["Brownies/brownie_duo.png", "brownie-duo", SPARKLE],
  ["Brownies/brownie_trio.png", "brownie-trio", SPARKLE],
  ["Brownies/London Cake in a cup.jpg", "london-cake"],
  ["Tea Cakes/Classic vannila Tea Cake.png", "classic-vanilla-tea-cake", BORDER],
  ["Tea Cakes/Chocolate Tea Cake.png", "chocolate-tea-cake", [0, 0, 0.03, 0.1]], // right border + watermark
  ["Tea Cakes/Walnut Tea Cake.jpg", "banana-walnut-cake"],
  ["Tea Cakes/Dry Fruit Tea Cake.png", "dry-fruit-and-nut-tea-cake", SPARKLE],
  ["Cookies & Biscuits/Butter.png", "butter-cookies", BORDER],
  ["Cookies & Biscuits/salted.png", "salt-biscuits", BORDER],
  ["Cookies & Biscuits/Millet.png", "millet-biscuits", BORDER],
  ["Cookies & Biscuits/Jeera.png", "jeera-biscuits", BORDER],
  ["Cookies & Biscuits/Choco chip.jpg", "choco-chip-cookies"],
  ["Cookies & Biscuits/Double choco chip.png", "double-chocolate-cookies", BORDER],
  ["Drinks/hot_chocolate.jpg", "hot-chocolate", [0.14, 0, 0.1, 0.1]], // re-centre the cup
  ["Drinks/White Chocolate Boba Shake.png", "white-chocolate-boba-shake", SPARKLE],
  ["Drinks/Nutella Boba Shake.jpg", "nutella-boba-shake", SPARKLE],
  ["Drinks/Lychee Sago drink.png", "lychee-sago-drink", SPARKLE],
  ["Gift Boxes & Combos/Assorted brownies.jpg", "assorted-brownie-box"],
  ["Gift Boxes & Combos/Tea_time Family Box.png", "tea-time-family-box", SPARKLE],
  ["Gift Boxes & Combos/Cookie Lover's Box.png", "cookie-lovers-box", SPARKLE],
  ["Gift Boxes & Combos/SM Delight's Family Box.png", "sm-delights-family-box", SPARKLE],
  ["Gift Boxes & Combos/Hot chocolate brownie.png", "brownie-hot-chocolate-combo", [0.18, 0, 0.12, 0]], // very wide: trim window + empty edge
];

// Backgrounds. crop removes UI chrome / watermarks.
const BACKGROUNDS = [
  // ivory parchment brownies — hero. Bottom strip has an AI-tool sparkle watermark.
  ["Website wallpaper and bg/Generated Image October 22, 2026 - 8_20PM.png", "hero-parchment", [0, 0, 0, 0.07]],
  ["Website wallpaper and bg/cosmos_1173507375.webp", "dusted-brownies"],
  ["Website wallpaper and bg/cosmos_327594486.webp", "wooden-box-cake", [0, 0, 0, 0.1]],
  ["Website wallpaper and bg/cosmos_645351539.webp", "ganache-stack"],
  // top-left has a screenshot close button
  ["Website wallpaper and bg/cosmos_117130935.webp", "sliced-loaf", [0, 0.09, 0, 0]],
];

function cropBox(meta, [l, t, r, b]) {
  const left = Math.round(meta.width * l);
  const top = Math.round(meta.height * t);
  return {
    left,
    top,
    width: meta.width - left - Math.round(meta.width * r),
    height: meta.height - top - Math.round(meta.height * b),
  };
}

/** Crops the source, then (if small) upscales it 4x with Real-ESRGAN. Returns a buffer + how it was made. */
async function prepare(input, crop) {
  const meta = await sharp(input).metadata();
  const cropped = await sharp(input).rotate().extract(cropBox(meta, crop)).png().toBuffer();
  const { width, height } = await sharp(cropped).metadata();
  if (Math.max(width, height) >= UPSCALE_BELOW || !REALESRGAN) return { buf: cropped, how: "resize" };

  const hash = createHash("sha1").update(cropped).digest("hex").slice(0, 16);
  const cached = path.join(CACHE, `${hash}.png`);
  if (!existsSync(cached)) {
    const tmpIn = path.join(CACHE, `${hash}-in.png`);
    await fs.writeFile(tmpIn, cropped);
    execFileSync(REALESRGAN, ["-i", path.resolve(tmpIn), "-o", path.resolve(cached), "-n", "realesrgan-x4plus"], {
      cwd: path.dirname(REALESRGAN),
      stdio: "ignore",
    });
    await fs.rm(tmpIn);
  }
  return { buf: await fs.readFile(cached), how: "Real-ESRGAN x4" };
}

async function product([file, slug, crop = [0, 0, 0, 0]]) {
  const { buf, how } = await prepare(path.join(SRC, file), crop);
  const out = path.join(OUT, "products", `${slug}.webp`);
  const info = await sharp(buf)
    // Fit inside LONG_EDGE x LONG_EDGE keeping proportions. Without AI upscaling,
    // allow at most a 2x Lanczos enlargement so tiny photos aren't blown up into mush.
    .resize({
      width: LONG_EDGE,
      height: LONG_EDGE,
      fit: "inside",
      withoutEnlargement: how === "resize",
      kernel: "lanczos3",
    })
    .sharpen({ sigma: how === "resize" ? 0.8 : 0.4 })
    .webp({ quality: 82, effort: 6 })
    .toFile(out);
  const long = Math.max(info.width, info.height);
  return `${out} ${info.width}x${info.height} (${how})${long < 800 ? " — LOW RES, ask client for a larger photo" : ""}`;
}

async function background([file, name, crop = [0, 0, 0, 0]]) {
  const input = path.join(SRC, file);
  const meta = await sharp(input).metadata();
  const out = path.join(OUT, "bg", `${name}.webp`);
  await sharp(input)
    .extract(cropBox(meta, crop))
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(out);
  return out;
}

async function brand() {
  const logo = path.join(SRC, "Logo/Logo.jpeg");
  // Monogram ("SM" artwork only) measured from the 1254px original.
  const mono = { left: 130, top: 180, width: 995, height: 680 };
  const monogram = await sharp(logo).extract(mono).toBuffer();

  await sharp(logo).resize(800).webp({ quality: 85 }).toFile(path.join(OUT, "brand", "logo.webp"));
  await sharp(monogram).resize({ height: 160 }).webp({ quality: 85 }).toFile(path.join(OUT, "brand", "monogram.webp"));

  // Square app icons: monogram centred on ivory.
  const square = async (size, file) => {
    const inner = Math.round(size * 0.86);
    const m = await sharp(monogram).resize(inner, inner, { fit: "inside" }).toBuffer();
    await sharp({ create: { width: size, height: size, channels: 3, background: IVORY } })
      .composite([{ input: m, gravity: "center" }])
      .png({ palette: true, quality: 85, compressionLevel: 9 }) // browsers fetch this on every visit — keep it small
      .toFile(file);
  };
  await square(256, "app/icon.png");
  await square(180, "app/apple-icon.png");

  // Open Graph (1200x630): hero photo on the left, full logo on the right.
  const heroSrc = path.join(SRC, BACKGROUNDS[0][0]);
  const photo = await sharp(heroSrc)
    .extract(cropBox(await sharp(heroSrc).metadata(), BACKGROUNDS[0][2]))
    .resize(540, 630, { fit: "cover" })
    .toBuffer();
  const fullLogo = await sharp(logo).resize(600, 600).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: IVORY } })
    .composite([
      { input: photo, left: 0, top: 0 },
      { input: fullLogo, left: 570, top: 15 },
    ])
    .jpeg({ quality: 85 })
    .toFile("app/opengraph-image.jpg");
  return "brand: logo, monogram, icon.png, apple-icon.png, opengraph-image.jpg";
}

console.log(REALESRGAN ? `AI upscaling with ${REALESRGAN}` : "REALESRGAN_BIN not set: using Lanczos resize + sharpening");
for (const dir of [path.join(OUT, "products"), path.join(OUT, "bg"), path.join(OUT, "brand"), CACHE]) {
  await fs.mkdir(dir, { recursive: true });
}
for (const p of PRODUCTS) console.log(await product(p));
for (const b of BACKGROUNDS) console.log(await background(b));
console.log(await brand());
