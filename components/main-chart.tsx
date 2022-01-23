import React, { useCallback } from "react"
import { Group } from "@visx/group"
import { AreaClosed, Bar, Line } from "@visx/shape"
import { AxisLeft, AxisBottom, AxisScale } from "@visx/axis"
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
// @ts-ignore
import { bisector } from "d3-array"
import { ScaleTime } from "d3-scale"
import { format } from "date-fns"

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

// accessors
const getDate = (d: DayData) => new Date(d.date)
const getStockValue = (d: DayData) => d.totalOpened
const bisectDate = bisector<DayData, Date>((d) => new Date(d.date)).left

interface MainChartProps {
  data: DayData[]
  gradientColor: string
  xScale: ScaleTime<number, number, never>
  yScale: AxisScale<number>
  width: number
  yMax: number
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
  hideBottomAxis?: boolean
  hideLeftAxis?: boolean
  top?: number
  left?: number
}

export default function MainChart(props: MainChartProps) {
  const {
    data,
    gradientColor,
    width,
    yMax,
    margin,
    xScale,
    yScale,
    top,
    left,
  } = props

  const {
    tooltipData,
    showTooltip,
    hideTooltip,
    tooltipTop = 0,
    tooltipLeft = 0,
  } = useTooltip<DayData>()

  if (width < 10) return null

  const innerWidth = width - margin.left - margin.right
  const innerHeight = 500 - margin.top - margin.bottom

  const handleTooltip = useCallback(
    (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      let { x } = localPoint(event) || { x: 0 }

      const x0 = xScale.invert(x - margin.left)

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
        tooltipLeft: x,
        tooltipTop: yScale(d.totalOpened),
      })
    },
    [showTooltip, yScale, xScale]
  )

  return (
    <>
      <Group left={left || margin.left} top={top || margin.top}>
        <LinearGradient
          id="gradient"
          from={gradientColor}
          fromOpacity={1}
          to={gradientColor}
          toOpacity={0.2}
        />
        <AreaClosed<DayData>
          data={data}
          x={(d) => xScale(getDate(d)) || 0}
          y={(d) => yScale(getStockValue(d)) || 0}
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
      </Group>
      <Bar
        x={margin.left}
        y={margin.top}
        width={innerWidth}
        height={innerHeight}
        fill="transparent"
        onTouchStart={handleTooltip}
        onTouchMove={handleTooltip}
        onMouseMove={handleTooltip}
        onMouseLeave={() => hideTooltip()}
      />
      {tooltipData && (
        <g>
          <Line
            from={{ x: tooltipLeft, y: tooltipTop + margin.top }}
            to={{ x: tooltipLeft, y: innerHeight + margin.top + 10 }}
            stroke={accentColorDark}
            strokeWidth={2}
            pointerEvents="none"
            strokeDasharray="5,2"
          />
          <Portal>
            <TooltipWithBounds
              key={Math.random()}
              top={tooltipTop + margin.top + 90}
              left={tooltipLeft + 300 + margin.left + 10}
              style={tooltipStyles}
            >
              {`Opene issues: ${tooltipData.totalOpened}`}
            </TooltipWithBounds>
            <Tooltip
              top={innerHeight + margin.top + 89}
              left={tooltipLeft + 300 + margin.left}
              style={{
                ...defaultStyles,
                maxWidth: 150,
                minWidth: 72,
                textAlign: "center",
                transform: "translateX(-50%)",
              }}
            >
              {format(new Date(tooltipData.date), "yyyy MMMM dd")}
            </Tooltip>
          </Portal>
          <circle
            cx={tooltipLeft}
            cy={tooltipTop + margin.top + 1}
            r={5}
            fill="black"
            fillOpacity={0.9}
            pointerEvents="none"
          />
          <circle
            cx={tooltipLeft}
            cy={tooltipTop + margin.top}
            r={4}
            fill={accentColorDark}
            pointerEvents="none"
          />
        </g>
      )}
    </>
  )
}
