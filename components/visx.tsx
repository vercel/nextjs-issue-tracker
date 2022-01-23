import { useState, useMemo } from "react"
import { scaleTime, scaleLinear } from "@visx/scale"
import { Brush } from "@visx/brush"
import { Bounds } from "@visx/brush/lib/types"
import { PatternLines } from "@visx/pattern"
// @ts-ignore
import { max, extent } from "d3-array"

import PrimaryChart from "./main-chart"
import SecondaryChart from "./area-chart-brush"
import { DayData } from "types"
import subDays from "date-fns/subDays"

// Initialize some variables
const initialBrushSpanInDays = 500
const chartSeparation = 30
const accentColor = "#000"
const chartGradientColor = "#fff"

const PATTERN_ID = "brush_pattern"
const selectedBrushStyle = {
  fill: `url(#${PATTERN_ID})`,
  stroke: "white",
}

// accessors
const getDate = (d: DayData) => new Date(d.date)
const getDayValue = (d: DayData) => d.totalOpened

export interface ChartProps {
  width: number
  height: number
  margin?: { top: number; right: number; bottom: number; left: number }
  compact?: boolean
  data: DayData[]
}

export default function Chart(props: ChartProps) {
  const {
    width,
    height,
    margin = { top: 20, left: 50, bottom: 20, right: 20 },
    data,
  } = props

  const [filteredData, setFilteredData] = useState(() => {
    const today = Date.now()
    const daysAgo = subDays(today, initialBrushSpanInDays).valueOf()
    return data.filter((s) => {
      const x = Date.parse(s.date)
      return x > daysAgo
    })
  })

  const innerHeight = height - margin.top - margin.bottom
  const topChartBottomMargin = chartSeparation + 10
  const topChartHeight = 0.875 * innerHeight - topChartBottomMargin
  const bottomChartHeight = innerHeight - topChartHeight - chartSeparation

  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0)
  const yMax = Math.max(topChartHeight, 0)
  const xBrushMax = Math.max(width - margin.left - margin.right, 0)
  const yBrushMax = Math.max(bottomChartHeight - margin.top - margin.bottom, 0)

  // X coordinates, days

  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: extent(filteredData, getDate) as [Date, Date],
      }),
    [xMax, filteredData]
  )
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xBrushMax],
        domain: extent(data, getDate) as [Date, Date],
      }),
    [xBrushMax]
  )

  const initialBrushPosition = useMemo(() => {
    const now = new Date()
    return {
      start: {
        x: brushDateScale(subDays(now, initialBrushSpanInDays)),
      },
      end: { x: brushDateScale(now) },
    }
  }, [brushDateScale])

  function onBrushChange(domain: Bounds | null) {
    if (!domain) return
    const { x0, x1 } = domain
    const filteredData = data.filter((s) => {
      const x = Date.parse(s.date)
      return x > x0 && x < x1
    })
    setFilteredData(filteredData)
  }

  // Y coordinates, number of issues

  const countScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, max(filteredData, getDayValue) || 0],
        nice: true,
      }),
    [yMax, filteredData]
  )

  const brushScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [0, max(data, getDayValue) || 0],
        nice: true,
      }),
    [yBrushMax]
  )

  return (
    <>
      <svg width={width} height={height} className="select-none">
        <PrimaryChart
          data={filteredData}
          width={width}
          margin={{ ...margin, bottom: topChartBottomMargin }}
          yMax={yMax}
          xScale={dateScale}
          yScale={countScale}
          gradientColor={chartGradientColor}
        />
        <SecondaryChart
          hideLeftAxis
          data={data}
          width={width}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushScale}
          margin={margin}
          top={topChartHeight + topChartBottomMargin + margin.top}
          gradientColor={chartGradientColor}
        >
          <PatternLines
            id={PATTERN_ID}
            height={8}
            width={8}
            stroke={accentColor}
            strokeWidth={1}
            orientation={["diagonal"]}
          />
          <Brush
            xScale={brushDateScale}
            yScale={brushScale}
            width={xBrushMax}
            height={yBrushMax}
            margin={margin}
            handleSize={8}
            resizeTriggerAreas={["left", "right"]}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
            onClick={() => setFilteredData(data)}
            selectedBoxStyle={selectedBrushStyle}
            useWindowMoveEvents
          />
        </SecondaryChart>
      </svg>
    </>
  )
}
