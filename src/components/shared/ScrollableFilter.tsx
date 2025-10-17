"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ScrollableFilterProps<T> {
  items: T[]
  selected: T | null
  onSelect: (val: T) => void
  getLabel?: (item: T) => string
}

export function ScrollableFilter<T>({
  items,
  selected,
  onSelect,
  getLabel = (item) => String(item),
}: ScrollableFilterProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkScroll)
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [])

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" })
  }

  return (
    <div className="relative w-full flex items-center">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scrollByAmount(-250)}
          className="shrink-0 mr-2 p-2 bg-white shadow-md rounded-full border border-gray-200 hover:bg-gray-50"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth"
      >
        {items.map((item, idx) => {
          const label = getLabel(item)
          const isSelected = selected === item
          return (
            <Button
              key={idx}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`min-w-[120px] lg:min-w-[140px] whitespace-nowrap rounded-full border transition-all duration-200
                ${isSelected
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"}
              `}
              onClick={() => onSelect(item)}
            >
              {label}
            </Button>
          )
        })}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scrollByAmount(250)}
          className="shrink-0 ml-2 p-2 bg-white shadow-md rounded-full border border-gray-200 hover:bg-gray-50"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      )}
    </div>
  )
}
