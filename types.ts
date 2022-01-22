import type { Day } from "@prisma/client"
import type { Octokit } from "octokit"
export type DayData = Pick<Day, "date" | "totalOpened">

type UnPromisify<T> = T extends Promise<infer U> ? U : T

export type Issue = UnPromisify<
  ReturnType<Octokit["rest"]["issues"]["listForRepo"]>
>["data"][0]
