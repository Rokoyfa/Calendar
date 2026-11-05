import { IconButton } from '../../../components/IconButton.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { classNames } from '../../../utils/classNames.ts'
import { getEventColorAttributes, getEventColorLabel } from '../../../utils/event.ts'
import { MAX_CUSTOM_COLORS } from '../constants/colors.ts'
import { useCustomColors } from '../hooks/useCustomColors.ts'

export function CustomColorSettings() {
  const { colors, error: loadError, removeColor } = useCustomColors()
  const { run, isPending, error } = useAsyncAction(removeColor)

  return (
    <PageSection
      title="Eigene Farben"
      description={`Bis zu ${MAX_CUSTOM_COLORS} Farben, die du beim Bearbeiten eines Termins hinzufügst. Termine behalten ihre Farbe, auch wenn du sie hier entfernst.`}
    >
      {colors.length === 0 ? (
        <p className="emptyHint">Noch keine eigenen Farben.</p>
      ) : (
        <ul className="colorList">
          {colors.map((color) => {
            const { className, style } = getEventColorAttributes(color)
            const label = getEventColorLabel(color)
            return (
              <li key={color} className="colorListItem">
                <span className={classNames('colorSwatch', className)} style={style} aria-hidden="true" />
                <span className="colorListLabel">{label}</span>
                <IconButton label={`Farbe ${label} entfernen`} plain disabled={isPending} onClick={() => void run(color)}>
                  ×
                </IconButton>
              </li>
            )
          })}
        </ul>
      )}
      <ErrorMessage message={loadError ?? error} />
    </PageSection>
  )
}
