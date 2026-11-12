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

export const TeamIcon = (props: IconProps) => (
  <IconBase
    {...props}
    strokeWidth={2.5}
    path="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
  />
)

export const PlusIcon = (props: IconProps) => <IconBase {...props} path="M12 5v14M5 12h14" />

export const RepeatIcon = (props: IconProps) => (
  <IconBase
    {...props}
    strokeWidth={2.5}
    path="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3"
  />
)

export const SettingsIcon = (props: IconProps) => (
  <IconBase
    {...props}
    strokeWidth={2}
    path="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
  />
)

export const SearchIcon = (props: IconProps) => (
  <IconBase {...props} strokeWidth={2.5} path="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5.2-5.2" />
)

export const ExternalLinkIcon = (props: IconProps) => (
  <IconBase {...props} strokeWidth={2.5} path="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
)

export const GlobeIcon = (props: IconProps) => (
  <IconBase
    {...props}
    strokeWidth={2.5}
    path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9M12 3c-2.4 2.5-3.6 5.5-3.6 9s1.2 6.5 3.6 9"
  />
)

export const MapPinIcon = (props: IconProps) => (
  <IconBase
    {...props}
    strokeWidth={2.5}
    path="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
  />
)
