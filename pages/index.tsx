import type { DayData } from "types"

import Head from "next/head"

import { prisma } from "lib/prisma"
import { GetStaticProps } from "next"
import Example from "components/visx"

export default function Home({ data }: { data: DayData[] }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 text-center">
        <Example width={1600} height={800} data={data} />
        {/* <ReactChartsArea data={data} /> */}
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
