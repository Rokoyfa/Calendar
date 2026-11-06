import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { Modal } from '../../../../components/Modal.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import { useI18n } from '../../../../i18n/index.ts'
import type { TeamMember } from '../../types/calendar.ts'

type TransferOwnershipModalProps = {
  candidates: readonly TeamMember[]
  onSelect: (member: TeamMember) => void
  onClose: () => void
}

const matches = ({ name, email }: TeamMember, query: string, locale: string) =>
  `${name} ${email}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale))

export function TransferOwnershipModal({ candidates, onSelect, onClose }: TransferOwnershipModalProps) {
  const { m, locale } = useI18n()
  const { transfer, roles } = m.calendars
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const results = candidates.filter((member) => matches(member, query, locale))
  const selected = candidates.find((member) => member.userId === selectedId) ?? null

  return (
    <Modal title={transfer.title} onClose={onClose}>
      <div className="formSection">
        <TextField
          label={transfer.search}
          name="memberSearch"
          type="search"
          autoComplete="off"
          placeholder={transfer.searchPlaceholder}
          value={query}
          onChange={setQuery}
          data-autofocus
        />
        {results.length === 0 ? (
          <p className="emptyHint">{transfer.noResults}</p>
        ) : (
          <ul className="memberPicker" role="radiogroup" aria-label={transfer.newOwner}>
            {results.map((member) => (
              <li key={member.userId}>
                <label className="memberOption">
                  <input
                    type="radio"
                    name="newOwner"
                    value={member.userId}
                    checked={member.userId === selectedId}
                    onChange={() => setSelectedId(member.userId)}
                  />
                  <span className="itemRowMain">
                    <span className="itemRowTitle">{member.name}</span>
                    <span className="itemRowMeta">{member.email}</span>
                  </span>
                  <span className="badge">{roles[member.role]}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="formActions">
          <Button variant="secondary" onClick={onClose}>
            {m.common.cancel}
          </Button>
          <Button disabled={!selected} onClick={() => selected && onSelect(selected)}>
            {transfer.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
