import { use } from 'react'
import { CaldavContext } from '../context/CaldavContext.ts'

export const useCaldav = () => use(CaldavContext)
