/**
 * Genere les 7 avatars Machii via OpenAI gpt-image-2.
 * (Le 1er, voyageur, a deja ete genere comme pilote.)
 *
 * Usage : OPENAI_API_KEY=sk-... node scripts/gen_avatars.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const COMMON =
  'Color palette: navy blue 1B3D6E and bright yellow F4C842 only. Beige cream background F8F4EC. ' +
  'Modern flat 2D illustration style similar to Bolt or Uber app illustrations. Clean vector lines, no gradients. ' +
  'Character shown from face to torso, centered composition, friendly expression, no text, illustration only - not a photo. ' +
  'The character is a young Tunisian person, age 25-35, modern look.';

const AVATARS = [
  {
    file: '02_regulier.png',
    prompt:
      'Flat 2D illustration of a friendly confident Tunisian commuter character with a calm smile, ' +
      'wearing a navy jacket and a yellow scarf, holding a phone in one hand looking at travel app, ' +
      'background shows subtle hint of a road or yellow dots. ' + COMMON,
  },
  {
    file: '03_conducteur.png',
    prompt:
      'Flat 2D illustration of a Tunisian driver character with a friendly grin, ' +
      'wearing a yellow polo shirt and a navy cap, holding car keys in one hand, ' +
      'small steering wheel icon visible in the background. ' + COMMON,
  },
  {
    file: '04_verifie.png',
    prompt:
      'Flat 2D illustration of a trustworthy Tunisian character with a confident smile, ' +
      'wearing a navy shirt with a small yellow verified badge pin (checkmark shield) on the chest pocket, ' +
      'shield checkmark icon floating subtly next to head. ' + COMMON,
  },
  {
    file: '05_confiance.png',
    prompt:
      'Flat 2D illustration of a happy reliable Tunisian character with a warm smile, ' +
      'wearing a navy hoodie with a small embroidered yellow star on the chest, ' +
      'thumb up gesture with one hand, very approachable. ' + COMMON,
  },
  {
    file: '06_veteran.png',
    prompt:
      'Flat 2D illustration of an experienced Tunisian veteran rideshare character, ' +
      'age 40-50, with short beard and warm wise eyes, wearing a navy jacket and a yellow vintage cap, ' +
      'arms folded confidently, looks like he has seen every road. ' + COMMON,
  },
  {
    file: '07_ambassadeur.png',
    prompt:
      'Flat 2D illustration of an enthusiastic Tunisian ambassador character with a bright smile, ' +
      'wearing a navy blazer with a small yellow flag pin (Tunisia inspired) on the lapel, ' +
      'thumbs-up gesture, very warm welcoming pose. ' + COMMON,
  },
  {
    file: '08_legende.png',
    prompt:
      'Flat 2D illustration of a legendary Tunisian carpooling hero character with a charismatic smile, ' +
      'wearing a navy suit with golden yellow accents and a small golden crown emblem on the chest, ' +
      'a subtle yellow halo of stars around the head, very iconic and elevated pose. ' + COMMON,
  },
];

const OUT_DIR = path.join('D:', 'Projets', 'machii', 'assets', 'avatars');
fs.mkdirSync(OUT_DIR, { recursive: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(1);
}

function generate(avatar) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-image-2',
      prompt: avatar.prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
      output_format: 'png',
    });
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            const j = JSON.parse(d);
            if (j.error) return reject(new Error(`${avatar.file}: ${j.error.message}`));
            const out = path.join(OUT_DIR, avatar.file);
            fs.writeFileSync(out, Buffer.from(j.data[0].b64_json, 'base64'));
            resolve({ file: avatar.file, size: fs.statSync(out).size, usage: j.usage });
          } catch (e) {
            reject(new Error(`${avatar.file}: parse err ${e.message}`));
          }
        });
      },
    );
    req.on('error', (e) => reject(new Error(`${avatar.file}: req err ${e.message}`)));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log(`Generating ${AVATARS.length} avatars in parallel...`);
  const start = Date.now();
  const results = await Promise.allSettled(AVATARS.map(generate));
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`OK  ${AVATARS[i].file} (${r.value.size} bytes)`);
    } else {
      console.error(`ERR ${AVATARS[i].file}: ${r.reason.message}`);
    }
  });
  console.log(`Done in ${Math.round((Date.now() - start) / 1000)}s`);
})();
