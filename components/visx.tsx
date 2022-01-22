import React, { useRef, useState, useMemo } from "react"
import { scaleTime, scaleLinear } from "@visx/scale"
import { Brush } from "@visx/brush"
import { Bounds } from "@visx/brush/lib/types"
import BaseBrush, {
  BaseBrushState,
  UpdateBrush,
} from "@visx/brush/lib/BaseBrush"
import { PatternLines } from "@visx/pattern"
import { LinearGradient } from "@visx/gradient"
import { max, extent } from "d3-array"

import AreaChart from "./area-chart"
import AreaChartBrush from "./area-chart-brush"
import { DayData } from "types"

// Initialize some variables
const brushMargin = { top: 10, bottom: 15, left: 50, right: 20 }
const chartSeparation = 30
const PATTERN_ID = "brush_pattern"
const GRADIENT_ID = "brush_gradient"
export const accentColor = "#000"
export const background = "#000"
export const background2 = "#fff"
const selectedBrushStyle = {
  fill: `url(#${PATTERN_ID})`,
  stroke: "white",
}

// accessors
const getDate = (d: DayData) => new Date(d.date)
const getStockValue = (d: DayData) => d.totalOpened

export type BrushProps = {
  width: number
  height: number
  margin?: { top: number; right: number; bottom: number; left: number }
  compact?: boolean
  data: DayData[]
}

function BrushChart({
  compact = false,
  width,
  height,
  margin = {
    top: 20,
    left: 50,
    bottom: 20,
    right: 20,
  },
  data,
}: BrushProps) {
  const brushRef = useRef<BaseBrush | null>(null)
  const [filteredStock, setFilteredStock] = useState(data)

  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return
    const { x0, x1, y0, y1 } = domain
    const stockCopy = data.filter((s) => {
      const x = getDate(s).getTime()
      const y = getStockValue(s)
      return x > x0 && x < x1 && y > y0 && y < y1
    })
    setFilteredStock(stockCopy)
  }

  const innerHeight = height - margin.top - margin.bottom
  const topChartBottomMargin = compact
    ? chartSeparation / 2
    : chartSeparation + 10
  const topChartHeight = 0.9 * innerHeight - topChartBottomMargin
  const bottomChartHeight = innerHeight - topChartHeight - chartSeparation

  // bounds
  const xMax = Math.max(width - margin.left - margin.right, 0)
  const yMax = Math.max(topChartHeight, 0)
  const xBrushMax = Math.max(width - brushMargin.left - brushMargin.right, 0)
  const yBrushMax = Math.max(
    bottomChartHeight - brushMargin.top - brushMargin.bottom,
    0
  )

  // scales
  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: extent(filteredStock, getDate) as [Date, Date],
      }),
    [xMax, filteredStock]
  )
  const stockScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, max(filteredStock, getStockValue) || 0],
        nice: true,
      }),
    [yMax, filteredStock]
  )
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xBrushMax],
        domain: extent(data, getDate) as [Date, Date],
      }),
    [xBrushMax]
  )
  const brushStockScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [0, max(data, getStockValue) || 0],
        nice: true,
      }),
    [yBrushMax]
  )

  const initialBrushPosition = useMemo(
    () => ({
      start: { x: brushDateScale(getDate(data[data.length - 90])) },
      end: { x: brushDateScale(getDate(data[data.length - 1])) },
    }),
    [brushDateScale]
  )

  return (
    <svg width={width} height={height}>
      <LinearGradient
        id={GRADIENT_ID}
        from={background}
        to={background2}
        rotate={45}
        toOpacity={0.1}
        fromOpacity={0.1}
      />
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={`url(#${GRADIENT_ID})`}
        rx={14}
      />
      <AreaChart
        data={filteredStock}
        width={width}
        margin={{ ...margin, bottom: topChartBottomMargin }}
        yMax={yMax}
        xScale={dateScale}
        yScale={stockScale}
        gradientColor={background2}
      />
      <AreaChartBrush
        hideBottomAxis
        hideLeftAxis
        data={data}
        width={width}
        yMax={yBrushMax}
        xScale={brushDateScale}
        yScale={brushStockScale}
        margin={brushMargin}
        top={topChartHeight + topChartBottomMargin + margin.top}
        gradientColor={background2}
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
          yScale={brushStockScale}
          width={xBrushMax}
          height={yBrushMax}
          margin={brushMargin}
          handleSize={8}
          innerRef={brushRef}
          resizeTriggerAreas={["left", "right"]}
          brushDirection="horizontal"
          initialBrushPosition={initialBrushPosition}
          onChange={onBrushChange}
          onClick={() => setFilteredStock(data)}
          selectedBoxStyle={selectedBrushStyle}
          useWindowMoveEvents
        />
      </AreaChartBrush>
    </svg>
  )
}

export default BrushChart
