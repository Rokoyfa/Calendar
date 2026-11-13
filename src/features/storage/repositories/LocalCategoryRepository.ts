import { AppError } from '../../../utils/appError.ts'
import {
  isCategoryNameTaken,
  MAX_CATEGORIES,
  normalizeCategoryName,
  parseCategory,
  type Category,
} from '../../../utils/category.ts'
import type { CategoryRepository } from '../types/storage.ts'
import { LocalStorageList } from '../utils/localStorageList.ts'

const DEFAULT_STORAGE_KEY = 'calendar.categories.v1'

export class LocalCategoryRepository implements CategoryRepository {
  readonly #categories: LocalStorageList<Category>

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#categories = new LocalStorageList(storageKey, parseCategory, 'saveCategoriesFailed')
  }

  async list(calendarIds: readonly string[]) {
    return this.#categories.read().filter((category) => calendarIds.includes(category.calendarId))
  }

  async create(calendarId: string, name: string) {
    const categories = this.#categories.read()
    if (isCategoryNameTaken(categories, calendarId, name)) throw new AppError('categoryExists')
    if (categories.filter((category) => category.calendarId === calendarId).length >= MAX_CATEGORIES)
      throw new AppError('tooManyCategories')
    const category: Category = { id: crypto.randomUUID(), calendarId, name: normalizeCategoryName(name) }
    this.#categories.write([...categories, category])
    return category
  }

  async rename(id: string, name: string) {
    const categories = this.#categories.read()
    const current = categories.find((category) => category.id === id)
    if (!current) throw new AppError('categoryNotFound')
    if (isCategoryNameTaken(categories, current.calendarId, name, id)) throw new AppError('categoryExists')
    const renamed = { ...current, name: normalizeCategoryName(name) }
    this.#categories.write(categories.map((category) => (category.id === id ? renamed : category)))
    return renamed
  }

  async remove(id: string) {
    this.#categories.update((categories) => categories.filter((category) => category.id !== id))
  }
}
