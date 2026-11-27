import type { InputHTMLAttributes, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { classNames } from '../utils/classNames.ts'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }

export function Input({ className, ...inputProps }: InputProps) {
  return <input {...inputProps} className={classNames('input', className)} />
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }

export function TextArea({ className, ...textAreaProps }: TextAreaProps) {
  return <textarea {...textAreaProps} className={classNames('textarea', className)} />
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }

export function Select({ className, ...selectProps }: SelectProps) {
  return <select {...selectProps} className={classNames('input', className)} />
}

type ChoiceProps = Omit<InputProps, 'type'>

export function Checkbox(props: ChoiceProps) {
  return <input {...props} type="checkbox" />
}

export function Radio(props: ChoiceProps) {
  return <input {...props} type="radio" />
}

export function FileInput(props: Omit<InputProps, 'type' | 'hidden'>) {
  return <input {...props} type="file" hidden />
}
