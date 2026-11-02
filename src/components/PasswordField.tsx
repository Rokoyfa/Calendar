import { useState } from 'react'
import { TextField, type TextFieldProps } from './TextField.tsx'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'addon'>

export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  return (
    <TextField
      {...props}
      type={isVisible ? 'text' : 'password'}
      addon={
        <button
          type="button"
          className="fieldToggle"
          aria-pressed={isVisible}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? 'Verbergen' : 'Anzeigen'}
        </button>
      }
    />
  )
}
