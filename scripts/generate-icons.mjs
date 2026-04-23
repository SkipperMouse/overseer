import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const BG = '#060d06'
const SIZE = 180

const src = join(root, 'public', 'icons', 'apple-touch-icon.png')
const dst = join(root, 'public', 'apple-touch-icon.png')

if (!existsSync(src)) {
  console.error(`source not found: ${src}`)
  process.exit(1)
}

await sharp(src)
  .resize(SIZE, SIZE, { fit: 'cover' })
  .flatten({ background: BG })
  .png()
  .toFile(dst)

console.log(`apple-touch-icon.png written to ${dst} (${SIZE}x${SIZE}, bg ${BG}, no alpha)`)
