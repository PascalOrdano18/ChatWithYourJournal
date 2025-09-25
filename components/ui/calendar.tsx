"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  className?: string
  showOutsideDays?: boolean

  // API compatible con page.tsx (modo 'single')
  mode?: "single"
  selected?: Date | undefined
  onSelect?: (date?: Date) => void
  modifiers?: Record<string, (date: Date) => boolean>
  modifiersClassNames?: Record<string, string>

  // Compatibilidad hacia atrás con la API previa
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  entries?: Date[]
  onEntryDateSelect?: (date: Date) => void
}

export function Calendar({
  className,
  // API page.tsx
  mode = "single",
  selected,
  onSelect,
  modifiers = {},
  modifiersClassNames = {},
  // Backwards compat
  selectedDate,
  onDateSelect,
  showOutsideDays = true,
  entries = [],
  onEntryDateSelect,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Obtener el primer día del mes y cuántos días tiene
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  const firstDayWeekday = firstDayOfMonth.getDay()
  
  // Generar array de días del mes
  const days: Array<
    | null
    | {
        date: Date
        isCurrentMonth: boolean
        isToday: boolean
        isSelected: boolean
        hasEntry?: boolean
        appliedModifierClasses?: string
      }
  > = []
  
  // Días del mes anterior (si showOutsideDays es true)
  if (showOutsideDays) {
    const prevMonth = new Date(year, month - 1, 0)
    const daysInPrevMonth = prevMonth.getDate()
    
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      })
    }
  } else {
    // Llenar con días vacíos si no se muestran días externos
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null)
    }
  }
  
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const isToday = 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    
    // Selección: prioriza la API nueva (selected), luego la previa (selectedDate)
    let isSelected = false
    if (mode === "single" && selected) {
      isSelected =
        date.getDate() === selected.getDate() &&
        date.getMonth() === selected.getMonth() &&
        date.getFullYear() === selected.getFullYear()
    } else if (selectedDate) {
      isSelected =
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
    }
    
    // Verificar si este día tiene un entry
    const hasEntryFromArray = entries.some(entryDate => 
      entryDate.getDate() === date.getDate() &&
      entryDate.getMonth() === date.getMonth() &&
      entryDate.getFullYear() === date.getFullYear()
    )

    // Modifiers (API tipo DayPicker)
    const appliedModifierKeys = Object.keys(modifiers).filter((key) => {
      try {
        return !!modifiers[key]?.(date)
      } catch {
        return false
      }
    })
    const appliedModifierClasses = appliedModifierKeys
      .map((key) => modifiersClassNames[key])
      .filter(Boolean)
      .join(" ")

    const hasEntryFromModifiers = appliedModifierKeys.includes("hasEntry")
    const hasEntry = hasEntryFromArray || hasEntryFromModifiers
    
    days.push({
      date,
      isCurrentMonth: true,
      isToday,
      isSelected,
      hasEntry,
      appliedModifierClasses,
    })
  }
  
  // Días del mes siguiente (si showOutsideDays es true)
  if (showOutsideDays) {
    const remainingCells = 42 - days.length // 6 semanas * 7 días = 42
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      })
    }
  }
  
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]
  
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const handleDateClick = (date: Date, hasEntry: boolean) => {
    // API nueva (onSelect) tiene prioridad
    if (onSelect) {
      onSelect(date)
      return
    }

    // Compatibilidad hacia atrás
    if (hasEntry && onEntryDateSelect) {
      onEntryDateSelect(date)
    } else if (onDateSelect) {
      onDateSelect(date)
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold text-white">
          {monthNames[month]} {year}
        </h2>
        
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-[hsl(var(--primary))] py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-10" />
          }

          return (
            <Button
              key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}-${index}`}
      variant="ghost"
      size="sm"
              className={cn(
                "h-10 w-10 p-0 text-sm font-medium transition-all duration-200 relative",
                "hover:bg-[hsl(var(--primary)/0.15)]",
                day.isCurrentMonth
                  ? "text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--foreground)/0.6)]",
                day.isToday && "ring-1 ring-[hsl(var(--foreground))] ring-offset-0",
                day.isSelected && "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110 shadow-md",
                day.hasEntry && !day.isSelected && "border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]",
                day.appliedModifierClasses
              )}
              onClick={() => handleDateClick(day.date, day.hasEntry || false)}
            >
              <span className="relative z-10">{day.date.getDate()}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}