"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-white p-2 rounded-lg shadow-sm border border-gray-200 [--cell-size:theme(spacing.8)] min-h-[350px] w-full overflow-hidden",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "long" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "flex gap-6 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-2 w-full absolute top-0 inset-x-0 justify-between z-10",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 transition-colors",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200 transition-colors",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-12 w-full px-4 mb-2",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-lg font-semibold justify-center h-12 gap-2 text-gray-800",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative border border-gray-300 shadow-sm rounded-md hover:border-blue-300 transition-colors",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-white inset-0 opacity-0 border border-gray-200 rounded-md shadow-lg",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-semibold text-lg text-gray-800",
          captionLayout === "label"
            ? "text-lg"
            : "rounded-md pl-3 pr-2 flex items-center gap-2 text-lg h-10 hover:bg-gray-50 transition-colors",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse mt-4",
        weekdays: cn("flex mb-2", defaultClassNames.weekdays),
        weekday: cn(
          "text-gray-600 rounded-md flex-1 font-medium text-xs text-center py-2 select-none uppercase tracking-wide min-w-0",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full gap-0.5 mb-1.5", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-10 text-center",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-sm select-none text-gray-500 font-medium",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative flex-1 text-center select-none min-w-0",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-blue-500 text-white",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "rounded-none bg-blue-100 text-blue-800",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "rounded-r-md bg-blue-500 text-white",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-blue-50 text-blue-700 font-semibold border-2 border-blue-200 rounded-md",
          defaultClassNames.today
        ),
        outside: cn(
          "text-gray-400 hover:text-gray-500",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-gray-300 opacity-50 cursor-not-allowed",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4 text-gray-600", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4 text-gray-600", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4 text-gray-600", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex h-10 w-10 items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "h-8 w-full min-w-0 text-xs font-medium transition-all duration-200",
        "hover:bg-blue-50 hover:text-blue-700 hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1",
        "data-[selected-single=true]:bg-blue-600 data-[selected-single=true]:text-white data-[selected-single=true]:font-semibold data-[selected-single=true]:shadow-md",
        "data-[range-middle=true]:bg-blue-100 data-[range-middle=true]:text-blue-800",
        "data-[range-start=true]:bg-blue-600 data-[range-start=true]:text-white data-[range-start=true]:rounded-l-md",
        "data-[range-end=true]:bg-blue-600 data-[range-end=true]:text-white data-[range-end=true]:rounded-r-md",
        "rounded-md",
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:scale-100",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
