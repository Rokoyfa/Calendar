import { useI18n } from '../../../i18n/index.ts'
import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { getEventColorAttributes, getEventColorLabel } from '../../../domain/event.ts'
import { MAX_CUSTOM_COLORS } from '../constants/colors.ts'
import { useCustomColors } from '../hooks/useCustomColors.ts'
import { ItemList } from '../../../components/ItemList.tsx'
import { RemoveButton } from '../../../components/RemoveButton.tsx'

export function CustomColorSettings() {
  const { m } = useI18n()
  const { colors, error: loadError, removeColor } = useCustomColors()
  const { run, isPending, error } = useAsyncAction(removeColor)

  return (
    <PageSection title={m.events.customColors} description={m.events.customColorsDescription(MAX_CUSTOM_COLORS)}>
      <ItemList items={colors} empty={m.events.noCustomColors}>
        {(color) => {
          const label = getEventColorLabel(color, m)
          return (
            <li key={color} className="itemRow">
              <span {...getEventColorAttributes(color, 'colorSwatch')} aria-hidden="true" />
              <span className="itemRowMain colorCode">{label}</span>
              <RemoveButton label={m.events.removeColor(label)} disabled={isPending} onClick={() => void run(color)} />
            </li>
          )
        }}
      </ItemList>
      <ErrorMessage message={loadError ?? error} />
    </PageSection>
  )
}
