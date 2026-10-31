type IconProps = {
  size?: number
}

function IconBase({ size = 22, path, strokeWidth = 3 }: IconProps & { path: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

export const ChevronLeftIcon = (props: IconProps) => <IconBase {...props} path="M15 18l-6-6 6-6" />

export const ChevronRightIcon = (props: IconProps) => <IconBase {...props} path="M9 18l6-6-6-6" />

export const PlusIcon = (props: IconProps) => <IconBase {...props} path="M12 5v14M5 12h14" />

export const RepeatIcon = (props: IconProps) => (
  <IconBase {...props} strokeWidth={2.5} path="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3" />
)
