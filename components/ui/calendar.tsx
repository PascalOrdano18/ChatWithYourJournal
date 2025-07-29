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
        "bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 [--cell-size:theme(spacing.8)] min-h-[350px] w-full overflow-hidden",
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
          "h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors border-gray-200 dark:border-gray-700",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors border-gray-200 dark:border-gray-700",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-12 w-full px-4 mb-2",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-lg font-serif font-semibold justify-center h-12 gap-2 text-gray-900 dark:text-white",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative border border-gray-300 dark:border-gray-600 shadow-sm rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-white dark:bg-gray-800 inset-0 opacity-0 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-serif font-semibold text-lg text-gray-900 dark:text-white",
          captionLayout === "label"
            ? "text-lg"
            : "rounded-md pl-3 pr-2 flex items-center gap-2 text-lg h-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse mt-4",
        weekdays: cn("flex mb-2", defaultClassNames.weekdays),
        weekday: cn(
          "text-gray-600 dark:text-gray-400 rounded-md flex-1 font-serif font-medium text-xs text-center py-2 select-none uppercase tracking-wider min-w-0",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full gap-0.5 mb-1.5", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-10 text-center",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-sm select-none text-gray-500 dark:text-gray-400 font-serif font-medium",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative flex-1 text-center select-none min-w-0",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-gray-900 dark:bg-white text-white dark:text-gray-900",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "rounded-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "rounded-r-md bg-gray-900 dark:bg-white text-white dark:text-gray-900",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-serif font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-md shadow-sm",
          defaultClassNames.today
        ),
        outside: cn(
          "text-gray-400 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-500",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-gray-300 dark:text-gray-700 opacity-50 cursor-not-allowed",
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
              <ChevronLeftIcon className={cn("size-4 text-gray-600 dark:text-gray-400", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4 text-gray-600 dark:text-gray-400", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4 text-gray-600 dark:text-gray-400", className)} {...props} />
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
        "h-8 w-full min-w-0 text-xs font-serif font-medium transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:ring-offset-1",
        "data-[selected-single=true]:bg-gray-900 dark:data-[selected-single=true]:bg-white data-[selected-single=true]:text-white dark:data-[selected-single=true]:text-gray-900 data-[selected-single=true]:font-semibold data-[selected-single=true]:shadow-md",
        "data-[range-middle=true]:bg-gray-200 dark:data-[range-middle=true]:bg-gray-700 data-[range-middle=true]:text-gray-900 dark:data-[range-middle=true]:text-white",
        "data-[range-start=true]:bg-gray-900 dark:data-[range-start=true]:bg-white data-[range-start=true]:text-white dark:data-[range-start=true]:text-gray-900 data-[range-start=true]:rounded-l-md",
        "data-[range-end=true]:bg-gray-900 dark:data-[range-end=true]:bg-white data-[range-end=true]:text-white dark:data-[range-end=true]:text-gray-900 data-[range-end=true]:rounded-r-md",
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
