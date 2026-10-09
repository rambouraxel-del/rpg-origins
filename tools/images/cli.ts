// Ligne de commande : npm run image:generate -- --prompt "..." [--output nom.png] [--quality low] [--size 1536x864] [--model ...] [--n 1]
//                     npm run image:edit -- --input source.png --prompt "..." [--mask masque.png] [...]
import { parseArgs } from 'node:util';
import { DEFAULTS, MAX_IMAGES_PER_TASK, editImage, generateImage } from './openai-images.ts';

const mode = process.argv[2];
const { values } = parseArgs({
  args: process.argv.slice(3),
  options: {
    prompt: { type: 'string', short: 'p' },
    input: { type: 'string', short: 'i', multiple: true },
    mask: { type: 'string' },
    output: { type: 'string', short: 'o' },
    model: { type: 'string', short: 'm' },
    quality: { type: 'string', short: 'q' },
    size: { type: 'string', short: 's' },
    n: { type: 'string' },
  },
});

function usage(): never {
  console.error(`Usage :
  npm run image:generate -- --prompt "..." [--output nom.png] [--quality low|medium|high] [--size 1536x864] [--model ${DEFAULTS.model}] [--n 1]
  npm run image:edit     -- --input source.png --prompt "..." [--mask masque.png] [--output nom.png] [...]
Maximum ${MAX_IMAGES_PER_TASK} images par commande. Résultats dans public/assets/generated/, journal dans logs/image-generations.jsonl.`);
  process.exit(2);
}

if ((mode !== 'generate' && mode !== 'edit') || !values.prompt) usage();
if (mode === 'edit' && !values.input?.length) usage();

try {
  const common = { prompt: values.prompt!, model: values.model, quality: values.quality, size: values.size, output: values.output, n: values.n ? Number(values.n) : 1 };
  const result =
    mode === 'generate' ? await generateImage(common) : await editImage({ ...common, inputs: values.input!, mask: values.mask });
  console.log(`OK : ${result.files.join(', ')}`);
  if (result.usage) console.log('Usage :', JSON.stringify(result.usage));
} catch (e) {
  console.error(`ÉCHEC : ${(e as Error).message}`);
  process.exit(1); // arrêt net : aucune nouvelle tentative automatique
}
