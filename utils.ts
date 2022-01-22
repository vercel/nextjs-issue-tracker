import formatISO from "date-fns/formatISO"
import eachDayOfInterval from "date-fns/eachDayOfInterval"

/**
 * Converts `Date` to the format "yyyy-MM-dd"
 *
 * Defaults to today's date
 * @example isoDate(new Date()) // "2022-01-22"
 */
export function isoDate(date?: Date) {
  return formatISO(date ?? new Date(), { representation: "date" })
}

export function eachDayUntilToday(start: Date) {
  return eachDayOfInterval({ start, end: new Date() })
}
