import { useState } from 'react'
import { Button } from '../../../../components/Button.tsx'
import { Modal } from '../../../../components/Modal.tsx'
import { TextField } from '../../../../components/TextField.tsx'
import { ROLE_LABELS } from '../../constants/calendars.ts'
import type { TeamMember } from '../../types/calendar.ts'

type TransferOwnershipModalProps = {
  candidates: readonly TeamMember[]
  onSelect: (member: TeamMember) => void
  onClose: () => void
}

const matches = ({ name, email }: TeamMember, query: string) =>
  `${name} ${email}`.toLocaleLowerCase('de').includes(query.trim().toLocaleLowerCase('de'))

export function TransferOwnershipModal({ candidates, onSelect, onClose }: TransferOwnershipModalProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const results = candidates.filter((member) => matches(member, query))
  const selected = candidates.find((member) => member.userId === selectedId) ?? null

  return (
    <Modal title="Leitung übertragen" onClose={onClose}>
      <div className="formSection">
        <TextField
          label="Mitglied suchen"
          name="memberSearch"
          type="search"
          autoComplete="off"
          placeholder="Name oder E-Mail"
          value={query}
          onChange={setQuery}
          data-autofocus
        />
        {results.length === 0 ? (
          <p className="emptyHint">Kein Mitglied gefunden.</p>
        ) : (
          <ul className="memberPicker" role="radiogroup" aria-label="Neuer Owner">
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
                  <span className="badge">{ROLE_LABELS[member.role]}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="formActions">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button disabled={!selected} onClick={() => selected && onSelect(selected)}>
            Bestätigen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
