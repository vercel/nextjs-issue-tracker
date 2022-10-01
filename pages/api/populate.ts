import type { NextApiRequest, NextApiResponse } from "next"
import type { PrismaClientKnownRequestError } from "@prisma/client/runtime"

import { Octokit } from "octokit"

import { prisma } from "lib/prisma"
import { isoDate } from "utils"

interface TotalCountResult {
  repository: {
    totalOpened: {
      count: number
    }
    totalClosed: {
      count: number
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const timestamp = new Date()
    const date = isoDate(timestamp)

    console.log("Populate triggered", { date, timestamp })

    if (req.method !== "POST") {
      console.error(`Method ${req.method} not allowed`)
      return res.status(405).end("Method not allowed")
    }

    if (process.env.SECRET !== req.body.secret) {
      console.error(`Secret (${req.body.secret.slice(0, 4)}...) did not match`)
      return res.status(401).json({ message: "Unauthorized" })
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

    console.log("Fetching total count")

    const data = await octokit.graphql<TotalCountResult>(
      `query {
        repository(owner: "vercel", name: "next.js") {
          totalOpened: issues(states: OPEN) {
            count: totalCount
          }
          totalClosed: issues(states: CLOSED) {
            count: totalCount
          }
          totalOpenedPR: pullRequests(states: OPEN) {
            count: totalCount
          }
          totalClosedPR: pullRequests(states: CLOSED) {
            count: totalCount
          }
        }
      }`
    )

    console.log("Writing to database")

    const [issues, pullRequests] = await Promise.all([
      prisma.day.create({
        data: {
          date,
          totalOpened: data.repository.totalOpened.count,
          totalClosed: data.repository.totalClosed.count,
        },
      }),
      prisma.dayPR.create({
        data: {
          date,
          totalOpened: data.repository.totalOpened.count,
          totalClosed: data.repository.totalClosed.count,
        },
      }),
    ])
    const result = { issues, pullRequests }

    await res.revalidate("/")

    console.log("Done", result)

    return res.json(result)
  } catch (error) {
    console.error(error)
    if ((error as PrismaClientKnownRequestError).code === "P2002") {
      return res.status(400).json({ message: "Already exists" })
    }
    return res.status(500).json({ message: "Internal server error" })
  }
}
