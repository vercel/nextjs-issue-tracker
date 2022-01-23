import type { DayData } from "types"

import Head from "next/head"

import { prisma } from "lib/prisma"
import { GetStaticProps } from "next"
import Charts from "components/charts"

export default function Home({ data }: { data: DayData[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col w-full flex-1 overflow-hidden">
        <h1 className="text-white text-center text-4xl font-bold mx-16 py-4">
          Next.js Issue Tracker
        </h1>
        <Charts
          height={600}
          data={data}
          margin={{ top: 20, left: 50, bottom: 20, right: 50 }}
        />
        {/* <p className="text-white m-12">
          Above is a chart showing the number of issues opened and closed on the
          Next.js.
        </p> */}
      </main>
      <footer className="flex items-center justify-center w-full h-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vercel.svg" alt="Vercel Logo" className="h-4 ml-2" />
      </footer>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ONE_HOUR = 60 * 60
  const data = await prisma.day.findMany({
    select: { date: true, totalOpened: true },
  })

  const result = changeAccuracy(data, "day")
  return {
    props: {
      data: result,
    },
    revalidate: ONE_HOUR,
  }
}

function changeAccuracy(data: DayData[], accuracy: "day" | "week" | "month") {
  const modulo = { day: 1, week: 7, month: 31 }[accuracy]
  return data.reduce<DayData[]>((acc, day, i) => {
    if (i % modulo === 0 || i === data.length - 1) acc.push(day)
    return acc
  }, [])
}
