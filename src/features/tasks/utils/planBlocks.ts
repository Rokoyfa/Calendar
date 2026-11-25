import { WORK_CATEGORY } from '../../../utils/category.ts'
import { createEventInputForSlots, type CalendarEvent, type EventInput } from '../../../utils/event.ts'
import type { Task, TaskPlanPreview } from '../types/task.ts'
import type { PlannedBlock } from './taskPlanner.ts'

const PLAN_PREVIEW_PREFIX = 'planPreview:'

export const toBlockInput = (task: Task, block: PlannedBlock, timeZone: string): EventInput => ({
  ...createEventInputForSlots({ date: block.date, hour: 0 }, { date: block.date, hour: 0 }, timeZone),
  title: task.title,
  start: block.start,
  endDate: block.date,
  end: block.end,
  visibility: 'private',
  builtinCategories: task.builtinCategories.length > 0 ? task.builtinCategories : [WORK_CATEGORY],
  taskId: task.id,
})

export const isPlanPreviewEvent = (event: Pick<CalendarEvent, 'id'>) => event.id.startsWith(PLAN_PREVIEW_PREFIX)

export const toPlanPreviewEvents = ({ task, calendarId, timeZone, blocks }: TaskPlanPreview): CalendarEvent[] =>
  blocks.map((block, index) => {
    const id = `${PLAN_PREVIEW_PREFIX}${index}`
    return {
      ...toBlockInput(task, block, timeZone),
      id,
      calendarId,
      uid: id,
      attachmentCount: 0,
      version: 0,
      createdBy: null,
      createdAt: task.updatedAt,
      updatedAt: task.updatedAt,
    }
  })
