import * as React from "react"
import { Group } from "@visx/group"
import { AreaClosed, Bar, Line } from "@visx/shape"
import { AxisLeft, AxisBottom } from "@visx/axis"
import { LinearGradient } from "@visx/gradient"
import type { DayData } from "types"
import {
  defaultStyles,
  Portal,
  Tooltip,
  TooltipWithBounds,
  useTooltip,
} from "@visx/tooltip"
import { localPoint } from "@visx/event"
import { clamp, format } from "date-fns"
import { bisectDate, getDate, getDayValue } from "lib/visx"
import { scaleLinear, scaleTime } from "@visx/scale"

// @ts-ignore
import { max, extent } from "d3-array"

// Initialize some variables
const axisColor = "#fff"
const axisBottomTickLabelProps = () => ({
  textAnchor: "middle" as const,
  fontFamily: "Arial",
  fontSize: 10,
  fill: axisColor,
})
const axisLeftTickLabelProps = () => ({
  dx: "-0.25em",
  dy: "0.25em",
  fontFamily: "Arial",
  fontSize: 10,
  textAnchor: "end" as const,
  fill: axisColor,
})

export const background = "#000"
export const accentColorDark = "#fff"

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: "rgba(0,0,0,0.9)",
  color: "white",
}

interface MainChartProps {
  data: DayData[]
  width: number
  height: number
  gradientColor: string
  margin: Record<"top" | "right" | "bottom" | "left", number>
}

export default function MainChart(props: MainChartProps) {
  const { data, width, height, gradientColor, margin } = props

  const {
    tooltipData,
    showTooltip,
    hideTooltip,
    tooltipTop = 0,
    tooltipLeft = 0,
  } = useTooltip<DayData>()

  const xMax = Math.max(width, 0)
  const yMax = Math.max(height, 0)

  const xScale = scaleTime<number>({
    range: [0, xMax],
    domain: extent(data, getDate) as [Date, Date],
  })

  const yScale = scaleLinear<number>({
    range: [yMax, 0],
    domain: [0, max(data, getDayValue) || 0],
    nice: true,
  })

  const handleTooltip = (
    event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
  ) => {
    let { x } = localPoint(event) || { x: 0 }
    x = x - margin.left
    const x0 = xScale.invert(x)

    const index = bisectDate(data, x0, 1)
    const d0 = data[index - 1]
    const d1 = data[index]
    let d = d0
    if (d1 && getDate(d1)) {
      d =
        x0.valueOf() - getDate(d0).valueOf() >
        getDate(d1).valueOf() - x0.valueOf()
          ? d1
          : d0
    }

    showTooltip({
      tooltipData: d,
      tooltipLeft: Math.min(Math.max(x, 0), width),
      tooltipTop: yScale(d.totalOpened),
    })
  }

  return (
    <Group left={margin.left} top={margin.top}>
      <LinearGradient
        id="gradient"
        from={gradientColor}
        fromOpacity={1}
        to={gradientColor}
        toOpacity={0}
      />
      <AreaClosed<DayData>
        data={data}
        x={(d) => xScale(getDate(d)) || 0}
        y={(d) => yScale(getDayValue(d)) || 0}
        yScale={yScale}
        strokeWidth={1}
        stroke="url(#gradient)"
        fill="url(#gradient)"
      />
      <AxisBottom
        top={yMax}
        scale={xScale}
        numTicks={width > 520 ? 10 : 5}
        stroke={axisColor}
        tickStroke={axisColor}
        tickLabelProps={axisBottomTickLabelProps}
      />
      <AxisLeft
        scale={yScale}
        numTicks={10}
        stroke={axisColor}
        tickStroke={axisColor}
        tickLabelProps={axisLeftTickLabelProps}
      />
      <Bar
        width={width}
        height={height}
        fill="transparent"
        onTouchStart={handleTooltip}
        onTouchMove={handleTooltip}
        onMouseMove={handleTooltip}
        onMouseLeave={() => hideTooltip()}
      />
      {tooltipData && (
        <g>
          <Line
            from={{ x: tooltipLeft, y: tooltipTop }}
            to={{ x: tooltipLeft, y: height }}
            stroke={accentColorDark}
            strokeWidth={2}
            pointerEvents="none"
            strokeDasharray="5,5"
          />
          <circle
            cx={tooltipLeft}
            cy={tooltipTop + 1}
            r={5}
            fill="black"
            fillOpacity={0.9}
            pointerEvents="none"
          />
          <circle
            cx={tooltipLeft}
            cy={tooltipTop}
            r={4}
            fill={accentColorDark}
            pointerEvents="none"
          />
          <Portal>
            <TooltipWithBounds
              key={Math.random()}
              top={tooltipTop + margin.top}
              left={tooltipLeft + margin.left}
              style={tooltipStyles}
            >
              {`Open issues: ${tooltipData.totalOpened}`}
            </TooltipWithBounds>
            <Tooltip
              top={height + margin.top - 20}
              left={tooltipLeft + margin.left - 10}
              style={{
                ...defaultStyles,
                minWidth: 72,
                borderRadius: 0,
                textAlign: "center",
                transform: "translateX(-50%)",
                color: "black",
              }}
            >
              {format(new Date(tooltipData.date), "yyyy MMMM dd")}
            </Tooltip>
          </Portal>
        </g>
      )}
    </Group>
  )
}
