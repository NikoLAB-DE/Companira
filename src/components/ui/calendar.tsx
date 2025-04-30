import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "calendar-container",
        month: "",
        caption: "calendar-header",
        caption_label: "day-name",
        nav: "calendar-header",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "calendar-body",
        head_row: "calendar-header",
        head_cell: "day-name",
        row: "calendar-body",
        cell: "day-number",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "day-number"
        ),
        day_range_end: "day-range-end",
        day_selected: "selected",
        day_today: "today",
        day_outside: "other-month",
        day_disabled: "disabled",
        day_range_middle: "range-middle",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
