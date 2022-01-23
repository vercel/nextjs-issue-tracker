import React from "react"
import { Group } from "@visx/group"
import { AreaClosed } from "@visx/shape"
import { AxisBottom } from "@visx/axis"
import { LinearGradient } from "@visx/gradient"
import { curveMonotoneX } from "@visx/curve"
import type { DayData } from "types"
import { scaleLinear, scaleTime } from "@visx/scale"
import { getDate, getDayValue } from "lib/visx"

// @ts-ignore
import { max, extent } from "d3-array"
import { PatternLines } from "@visx/pattern"
import { Brush } from "@visx/brush"
import { Bounds } from "@visx/brush/lib/types"
import subDays from "date-fns/subDays"

// Initialize some variables
const axisColor = "#fff"

interface BrushChartProps {
  data: DayData[]
  width: number
  height: number
  margin: Record<"top" | "right" | "bottom" | "left", number>

  top: number
  initialBrushSpanInDays?: number
  setData: React.Dispatch<React.SetStateAction<DayData[]>>
}

export default function BrushChart(props: BrushChartProps) {
  const {
    data,
    width,
    height,
    margin,
    top,
    initialBrushSpanInDays = 500,
    setData,
  } = props

  const xMax = Math.max(width, 0)
  const yMax = Math.max(height, 0)

  const xScale = scaleTime<number>({
    range: [0, xMax],
    domain: extent(data, getDate) as [Date, Date],
  })

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, max(data, getDayValue) || 0],
    nice: true,
  })

  const today = new Date()
  const initialBrushPosition = {
    start: {
      x: xScale(subDays(today, initialBrushSpanInDays)),
    },
    end: { x: xScale(today) },
  }

  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return
    const { x0, x1 } = domain
    const filteredData = data.filter((s) => {
      const x = Date.parse(s.date)
      return x > x0 && x < x1
    })
    setData(filteredData)
  }

  return (
    <Group left={margin.left} top={top}>
      <AreaClosed<DayData>
        data={data}
        x={(d) => xScale(getDate(d)) || 0}
        y={(d) => yScale(getDayValue(d)) || 0}
        yScale={yScale}
        fill="#888"
        fillOpacity={0.8}
        curve={curveMonotoneX}
      />
      <AxisBottom
        top={yMax}
        scale={xScale}
        numTicks={width > 520 ? 10 : 5}
        stroke={axisColor}
        tickStroke={axisColor}
        tickLabelProps={() => ({
          textAnchor: "middle",
          fontFamily: "Arial",
          fontSize: 10,
          fill: axisColor,
        })}
      />
      <PatternLines
        id="brush_pattern"
        height={4}
        width={4}
        stroke="#222"
        strokeWidth={1}
        orientation={["diagonal"]}
      />
      <Brush
        xScale={xScale}
        yScale={yScale}
        width={xMax}
        height={yMax}
        margin={margin}
        handleSize={8}
        resizeTriggerAreas={["left", "right"]}
        brushDirection="horizontal"
        initialBrushPosition={initialBrushPosition}
        onChange={onBrushChange}
        onClick={() => setData(data)}
        selectedBoxStyle={{ fill: `url(#brush_pattern)`, stroke: "#ddd" }}
        useWindowMoveEvents
      />
    </Group>
  )
}
