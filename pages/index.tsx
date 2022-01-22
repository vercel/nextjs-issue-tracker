import type { DayData } from "types"

import Head from "next/head"

import ReactChartsArea from "components/react-charts-area"
import { prisma } from "lib/prisma"
import { GetStaticProps } from "next"

export default function Home({ data }: { data: DayData[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <ReactChartsArea data={data} />
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t">
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

  return { props: { data }, revalidate: ONE_HOUR }
}
