import { FormField } from '../../../components/FormField.tsx'
import { IconLink } from '../../../components/IconLink.tsx'
import { MapPinIcon } from '../../../components/Icons.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useFeatures } from '../../../context/HostContext.ts'
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  type EventInput,
  type EventValidationErrors,
} from '../../../domain/event.ts'
import { useLocationUrl } from '../../../hooks/useLocationUrl.ts'
import { useI18n } from '../../../i18n/index.ts'
import type { EventFieldSetter } from '../hooks/useEventForm.ts'
import { LinksField } from './LinksField.tsx'
import { TextArea } from '../../../components/Input.tsx'

type EventDetailsFieldsProps = {
  values: EventInput
  errors: EventValidationErrors
  isRequest: boolean
  setField: EventFieldSetter
}

export function EventDetailsFields({ values, errors, isRequest, setField }: EventDetailsFieldsProps) {
  const { m } = useI18n()
  const features = useFeatures()
  const locationUrl = useLocationUrl()(values.location)

  return (
    <>
      <TextField
        label={m.events.location}
        name="location"
        autoComplete="off"
        maxLength={EVENT_LOCATION_MAX_LENGTH}
        value={values.location}
        error={errors.location}
        onChange={(location) => setField('location', location)}
        addon={
          locationUrl && (
            <IconLink href={locationUrl} label={m.events.openMap(values.location.trim())}>
              <MapPinIcon size={18} />
            </IconLink>
          )
        }
      />

      {features.links && !isRequest && (
        <LinksField links={values.links} error={errors.links} onChange={(links) => setField('links', links)} />
      )}

      <FormField label={isRequest ? m.peers.note : m.events.description} error={errors.description}>
        <TextArea
          className="eventDescription"
          name="description"
          maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
        />
      </FormField>
    </>
  )
}
