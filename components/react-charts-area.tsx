import type { DayData } from "types"

import * as React from "react"
import { AxisOptions, Chart } from "react-charts"
import { format } from "date-fns"

export default function Bar({ data }: { data: DayData[] }) {
  const primaryAxis = React.useMemo<AxisOptions<DayData>>(
    () => ({
      getValue: ({ date }) => new Date(date),
      formatters: {
        tooltip(value?: Date) {
          return value && format(value, "yyyy MMMM dd")
        },
      },
    }),
    []
  )

  const secondaryAxes = React.useMemo<AxisOptions<DayData>[]>(
    () => [
      {
        getValue: ({ totalOpened }) => totalOpened,
        elementType: "area",
      },
    ],
    []
  )

  if (!data.length) {
    return <p className="text-white">No data</p>
  }

  return (
    <Chart
      options={{
        data: [{ data, label: "Opened" }],
        primaryAxis,
        secondaryAxes,
        dark: true,
        defaultColors: ["#fff"],
        getSeriesStyle() {
          return {
            area: {
              opacity: 0.7,
            },
          }
        },
      }}
    />
  )
}
