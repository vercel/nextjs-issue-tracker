import type { DayData } from "types"
import type { WithParentSizeProps } from "@visx/responsive/lib/enhancers/withParentSize"

import * as React from "react"

import { withParentSize } from "@visx/responsive"

import PrimaryChart from "./main-chart"
import SecondaryChart from "./brush-chart"
import subDays from "date-fns/subDays"

export interface ChartsProps extends WithParentSizeProps {
  height: number
  margin: Record<"top" | "right" | "bottom" | "left", number>
  data: DayData[]
  initialBrushSpanInDays?: number
  chartSeparation?: number
  chartGradientColor?: string
}

export default withParentSize<ChartsProps>(function Charts(props) {
  const {
    parentWidth: width = 0,
    height,
    margin,
    data,
    initialBrushSpanInDays = 500,
    chartSeparation = 30,
    chartGradientColor = "#fff",
  } = props

  const [filteredData, setFilteredData] = React.useState(() => {
    const today = Date.now()
    const daysAgo = subDays(today, initialBrushSpanInDays).valueOf()
    return data.filter((s) => {
      const x = Date.parse(s.date)
      return x > daysAgo
    })
  })

  const mainChartBottomMargin = chartSeparation + 10

  const innerHeight = height - margin.top - margin.bottom
  const innerWidth = width - margin.left - margin.right

  const mainChartHeight = 0.875 * innerHeight - mainChartBottomMargin
  const brushChartHeight = innerHeight - mainChartHeight - chartSeparation - 20

  return (
    <svg width={width} height={height} className="select-none overflow-hidden">
      <PrimaryChart
        data={filteredData}
        width={innerWidth}
        height={mainChartHeight}
        gradientColor={chartGradientColor}
        margin={{ ...margin, bottom: mainChartBottomMargin }}
      />
      <SecondaryChart
        data={data}
        width={innerWidth}
        height={brushChartHeight}
        top={mainChartHeight + mainChartBottomMargin + margin.top}
        setData={setFilteredData}
        gradientColor={chartGradientColor}
        margin={margin}
      />
    </svg>
  )
})
