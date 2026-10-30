export type HexColor = `#${string}`

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const DARK_TEXT = '#222222'
const LIGHT_TEXT = '#ffffff'
const LUMINANCE_THRESHOLD = 0.2

export const isHexColor = (value: unknown): value is HexColor =>
  typeof value === 'string' && HEX_COLOR_PATTERN.test(value)

export const normalizeHexColor = (value: HexColor) => value.toLowerCase() as HexColor

const toLinear = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

export const getRelativeLuminance = (color: HexColor) => {
  const [red, green, blue] = [1, 3, 5].map((index) => toLinear(parseInt(color.slice(index, index + 2), 16) / 255))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export const getReadableTextColor = (background: HexColor) =>
  getRelativeLuminance(background) > LUMINANCE_THRESHOLD ? DARK_TEXT : LIGHT_TEXT
