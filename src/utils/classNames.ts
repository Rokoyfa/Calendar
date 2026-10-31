export const classNames = (...names: readonly (string | false | null | undefined)[]) =>
  names.filter(Boolean).join(' ')
