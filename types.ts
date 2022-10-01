import type { Day } from "@prisma/client"
export type DayData = Pick<Day, "date" | "totalOpened">

export interface Issue {
  merged_at?: string | null
  closed_at?: string | null
  created_at: string
}
