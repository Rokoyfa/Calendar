type IconProps = {
  size?: number
}

function IconBase({ size = 22, path }: IconProps & { path: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
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
