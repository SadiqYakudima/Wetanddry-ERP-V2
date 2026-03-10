"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    date?: Date
    onDateChange?: (date: Date | undefined) => void
    error?: boolean
    // Required string prop to easily emulate standard inputs inside a generic form
    value?: string
}

export function DatePicker({
    date,
    onDateChange,
    className,
    error,
    placeholder = "Pick a date",
    value,
    onChange,
    name,
    ...props
}: DatePickerProps) {
    // Try to parse an initial date string if `date` is not provided directly
    const [internalDate, setInternalDate] = React.useState<Date | undefined>(() => {
        if (date) return date
        if (value && !isNaN(Date.parse(value))) return new Date(value)
        return undefined
    })

    // Keep internal state in sync with external `date` prop
    React.useEffect(() => {
        if (date !== undefined) setInternalDate(date)
        else if (value && !isNaN(Date.parse(value))) setInternalDate(new Date(value))
    }, [date, value])

    const handleSelect = (newDate: Date | undefined) => {
        setInternalDate(newDate)
        if (onDateChange) onDateChange(newDate)

        // Call standard input onChange manually for form integrations
        if (onChange && newDate) {
            const e = {
                target: { name: name || '', value: format(newDate, 'yyyy-MM-dd') }
            } as React.ChangeEvent<HTMLInputElement>
            onChange(e)
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center px-4 py-3 bg-gray-50 border rounded-xl text-left font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all",
                        !internalDate && "text-gray-500",
                        error ? "border-red-300 focus:ring-red-500" : "border-gray-200",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {internalDate ? format(internalDate, "PPP") : <span>{placeholder}</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <Calendar
                    mode="single"
                    selected={internalDate}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
            {/* Hidden input to ensure standard HTML forms still receive the date value */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={internalDate ? format(internalDate, 'yyyy-MM-dd') : ''}
                    {...props}
                />
            )}
        </Popover>
    )
}
