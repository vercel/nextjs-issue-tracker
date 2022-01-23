import type { DayData } from "types"

// @ts-ignore
import { bisector } from "d3-array"

// accessors
export const getDate = (d: DayData) => new Date(d.date)
export const getDayValue = (d: DayData) => d.totalOpened

export const bisectDate = bisector<DayData, Date>(
  (d: DayData) => new Date(d.date)
).left
