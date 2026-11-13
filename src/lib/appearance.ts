import { getReadableTextColor as getTextColorOn, isHexColor } from '../utils/color.ts'
import { isCssColor, isFontFamily, MAX_RADIUS, type CalendarAppearance } from './options.ts'

const SHORT_HEX = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i

export const getReadableTextColor = (color: string) => {
  const hex = color.trim().replace(SHORT_HEX, '#$1$1$2$2$3$3')
  return isHexColor(hex) ? getTextColorOn(hex) : null
}

export const getAppearanceVariables = ({ accentColor, fontFamily, radius }: CalendarAppearance) => {
  const variables: Record<string, string> = {}
  if (isCssColor(accentColor)) {
    variables['--calendar-accent'] = accentColor.trim()
    const text = getReadableTextColor(accentColor)
    if (text) variables['--calendar-on-accent'] = text
  }
  if (isFontFamily(fontFamily)) variables['--calendar-font'] = fontFamily.trim()
  if (typeof radius === 'number' && radius >= 0 && radius <= MAX_RADIUS) variables['--calendar-radius'] = `${radius}px`
  return variables
}
