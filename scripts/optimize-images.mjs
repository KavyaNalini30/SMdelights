// One-off image pipeline: reads the client's raw files from Images/ (git-ignored)
// and writes optimised, web-safe copies into public/images and app/ (committed).
//
//   node scripts/optimize-images.mjs
//
// Re-run whenever the client sends new photos. Never upscales: small originals
// stay small (Next/Image then serves them at their real size).
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = "Images";
const OUT = "public/images";
const IVORY = "#F2ECE0"; // logo background — keep in sync with --color-ivory

// source file (relative to Images/) -> product slug. Slugs match supabase/03_seed_data.sql.
// `inset` trims a thin screenshot border (fraction of each side).
const PRODUCTS = [
  ["Brownies/melo brownie.png", "classic-melo-brownie"],
  ["Brownies/white_choc.png", "white-chocolate-brownie"],
  ["Brownies/Cookie and Cream.png", "cookies-and-cream-brownie"],
  ["Brownies/ferrero rocher.png", "ferrero-nutella-brownie"],
  ["Brownies/Triple chocolate.png", "triple-chocolate-brownie"],
  ["Brownies/kitkat.png", "kitkat-brownie"],
  ["Brownies/diarymilk.png", "dairy-milk-brownie"],
  ["Brownies/pistachio (1).png", "pistachio-brownie"],
  ["Brownies/Milk chocolate Brownie Tub.jpg", "brownie-tub-milk-chocolate"],
  ["Brownies/White chocolate brownie tub.png", "brownie-tub-white-chocolate"],
  ["Brownies/Dark chocolate Brownie Tub.jpg", "brownie-tub-dark-chocolate"],
  ["Brownies/Double chocolate Brownie Tub.jpg", "brownie-tub-double-chocolate"],
  ["Brownies/Triple chocolate Brownie Tub.jpg", "brownie-tub-triple-chocolate"],
  ["Brownies/Pistachio brownie tub.png", "brownie-tub-pistachio-kunafa"],
  ["Brownies/Marshmallow Brownie Tub.png", "marshmallow-brownie"],
  ["Brownies/Bombolini.jpg", "bomboloni"], // not on the price list yet — kept for when it is
  ["Brownies/Fudge brownie Box (1).png", "fudge-brownie-box", 0.02],
  ["Brownies/Brownie Duo.png", "brownie-duo", 0.02],
  ["Brownies/Brownie Trio.png", "brownie-trio", 0.02],
  ["Tea Cakes/Classic vannila Tea Cake.png", "classic-vanilla-tea-cake"],
  ["Tea Cakes/Chocolate Tea Cake.png", "chocolate-tea-cake"],
  ["Tea Cakes/Walnut Tea Cake.jpg", "banana-walnut-cake"],
  ["Tea Cakes/Dry Fruit Tea Cake.png", "dry-fruit-and-nut-tea-cake"],
  ["Cookies & Biscuits/Butter.png", "butter-cookies", 0.02],
  ["Cookies & Biscuits/salted.png", "salt-biscuits", 0.02],
  ["Cookies & Biscuits/Millet.png", "millet-biscuits", 0.02],
  ["Cookies & Biscuits/Jeera.png", "jeera-biscuits", 0.02],
  ["Cookies & Biscuits/Choco chip.jpg", "choco-chip-cookies"],
  ["Cookies & Biscuits/Double choco chip.png", "double-chocolate-cookies", 0.02],
  ["Drinks/hot_chocolate.jpg", "hot-chocolate"],
  ["Drinks/white_chocolate_bobashake.jpg", "white-chocolate-boba-shake"],
  ["Gift Boxes & Combos/Assorted brownies.jpg", "assorted-brownie-box"],
  ["Gift Boxes & Combos/Tea Time Family Box.png", "tea-time-family-box", 0.02],
  ["Gift Boxes & Combos/Brownie Family Box.png", "brownie-family-box", 0.02],
  ["Gift Boxes & Combos/Cookie Lover's Box.png", "cookie-lovers-box", 0.02],
  ["Gift Boxes & Combos/SM Delight's Family Box.png", "sm-delights-family-box", 0.02],
];

// Backgrounds. `crop` removes UI chrome / watermarks: [left, top, right, bottom] fractions.
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

async function product([file, slug, inset = 0]) {
  const input = path.join(SRC, file);
  const meta = await sharp(input).metadata();
  const box = cropBox(meta, [inset, inset, inset, inset]);
  const side = Math.min(box.width, box.height, 1000);
  const out = path.join(OUT, "products", `${slug}.webp`);
  await sharp(input)
    .extract(box)
    .resize(side, side, { fit: "cover", position: "attention" })
    .webp({ quality: 80 })
    .toFile(out);
  return `${out} (${side}px${side < 400 ? " — LOW RES, ask client for a larger photo" : ""})`;
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
      .png()
      .toFile(file);
  };
  await square(512, "app/icon.png");
  await square(180, "app/apple-icon.png");

  // Open Graph (1200x630): hero photo on the left, full logo on the right.
  const photo = await sharp(path.join(SRC, BACKGROUNDS[0][0]))
    .extract(cropBox(await sharp(path.join(SRC, BACKGROUNDS[0][0])).metadata(), BACKGROUNDS[0][2]))
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

for (const dir of ["products", "bg", "brand"]) await fs.mkdir(path.join(OUT, dir), { recursive: true });
for (const p of PRODUCTS) console.log(await product(p));
for (const b of BACKGROUNDS) console.log(await background(b));
console.log(await brand());
