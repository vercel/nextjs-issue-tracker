import type { NextApiRequest, NextApiResponse } from "next"
import type { Issue } from "types"
import type { PrismaClientKnownRequestError } from "@prisma/client/runtime"
import fs from "fs/promises"
import path from "path"
import { Octokit } from "octokit"

import { eachDayUntilToday, isoDate } from "utils"
import { prisma } from "lib/prisma"

/**
 * git log --reverse --pretty --date=iso
 * Author: Guillermo Rauch
 * Date:   2016-10-05 16:35:00 -0700
 */
const FIRST_COMMIT_DATE = new Date("2016-10-05")

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).end("Method not allowed")
    }

    if (process.env.SECRET !== req.body.secret) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const isPR = req.body.type === "pr"

    const issues = await getIssues({
      owner: req.body.owner ?? "vercel",
      repo: req.body.repo ?? "next.js",
      hardLimitPage: req.body.page_limit,
      isPR,
    })

    const dates = Object.fromEntries(
      eachDayUntilToday(FIRST_COMMIT_DATE).map((date) => {
        return [
          isoDate(date),
          {
            totalOpened: 0,
            totalClosed: 0,
            ...(isPR
              ? {
                  totalMerged: 0,
                  totalMergedAndClosed: 0,
                }
              : undefined),
          } as any,
        ]
      })
    )

    let openedAccumulator = 0
    let closedAccumulator = 0
    let mergedAccumulator = 0
    for (const date in dates) {
      const issuesOpened = issues.filter(
        (i) => isoDate(new Date(i.created_at)) === date
      )
      const issuesClosed = issues.filter(
        (i) => i.closed_at && isoDate(new Date(i.closed_at)) === date
      )
      closedAccumulator += issuesClosed.length

      let issuesMerged: Issue[] = []
      if (isPR) {
        issuesMerged = issues.filter(
          (i) => i.merged_at && isoDate(new Date(i.merged_at)) === date
        )
        mergedAccumulator += issuesMerged.length
      }

      if (issuesOpened.length) {
        openedAccumulator += issuesOpened.length
      }

      const mergedAndClosed =
        issuesClosed.length + (isPR ? issuesMerged.length : 0)

      openedAccumulator -= mergedAndClosed

      dates[date].totalOpened += openedAccumulator
      dates[date].totalClosed += closedAccumulator
      if (isPR) {
        dates[date].totalMerged += mergedAccumulator
        dates[date].totalMergedAndClosed += mergedAndClosed
      }
    }

    // http://localhost:3000/api/history?secret=SECRET&skip_save=1
    if (req.body.skip_save) {
      console.log("Skipping save")
    } else {
      console.log(`Saving ${isPR ? "pull requests" : "issues"} to database...`)
      const datesEntries = Object.entries(dates)

      fs.writeFile(
        path.join(process.cwd(), "data.json"),
        JSON.stringify(datesEntries, null, 2)
      )

      const datesPromises = datesEntries.map(([date, day]) => {
        if (isPR) {
          return prisma.dayPR.create({ data: { date, ...day } })
        } else {
          return prisma.day.create({ data: { date, ...day } })
        }
      })
      await prisma.$transaction(datesPromises)
      console.log("Saved to database")
    }

    return res.json(dates)
  } catch (error) {
    console.error(error)
    if ((error as PrismaClientKnownRequestError).code === "P2002") {
      return res.status(400).json({ message: "Already exists" })
    }
    return res.status(500).json({ message: "Internal server error" })
  }
}
async function getIssues(options: {
  owner: string
  repo: string
  /**
   * Allow a maximum of this number of pages.
   * Useful when debugging to avoid exceeding GitHub API limits.
   * @default Infinity
   */
  hardLimitPage?: number
  isPR?: boolean
}) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const issues: Issue[] = []
  const type = options.isPR ? "pull requests" : "issues"

  let page = 1
  const hardLimit = options?.hardLimitPage ?? Infinity
  console.time(`Fetching ${type} took`)
  while (page <= hardLimit) {
    const issuesPage = await octokit.rest.issues
      .listForRepo({
        owner: options.owner,
        repo: options.repo,
        state: "all",
        per_page: 100,
        page,
      })
      .then((response) => response.data)
    if (issuesPage.length) {
      console.log(
        `Page ${page} with ${issuesPage.length} issues and pull requests fetched`
      )

      for (const issue of issuesPage) {
        if (options.isPR && issue.pull_request) {
          issues.unshift({
            closed_at: issue.closed_at,
            merged_at: issue.pull_request.merged_at,
            created_at: issue.created_at,
          })
        } else {
          issues.unshift({
            closed_at: issue.closed_at,
            created_at: issue.created_at,
          })
        }
      }
      page += 1
    } else {
      console.log(
        `Reached last page: ${page - 1}, fetched ${issues.length} ${type}`
      )

      break
    }
  }
  console.timeEnd(`Fetching ${type} took`)

  return issues
}
