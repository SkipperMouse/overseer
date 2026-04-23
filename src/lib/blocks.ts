import type { Block } from '../types'

export const BLOCK_DEFS: { key: Block; label: string }[] = [
  { key: 'morning', label: '[ утро ]' },
  { key: 'day',     label: '[ работа ]' },
  { key: 'evening', label: '[ вечер ]' },
]

export const BLOCKS: Block[] = BLOCK_DEFS.map(b => b.key)

export const BLOCK_LABELS: Record<Block, string> = Object.fromEntries(
  BLOCK_DEFS.map(b => [b.key, b.label])
) as Record<Block, string>
