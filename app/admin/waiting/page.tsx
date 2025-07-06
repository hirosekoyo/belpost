"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Minus, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useSalonStore, getCalendarForMonth, getPrevMonth, getNextMonth } from "@/lib/data"
import { useSwipe } from "@/hooks/use-swipe"

export default function WaitingPage() {
  const { waitingCount, holidays, updateWaitingCount, toggleHoliday } = useSalonStore()
  const [count, setCount] = useState(waitingCount)

  // 現在の年月を取得
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  const calendarData = getCalendarForMonth(currentYear, currentMonth)
  const calendarRef = useRef<HTMLDivElement>(null)

  // スワイプハンドラーを設定
  useSwipe(calendarRef, {
    onSwipeLeft: () => {
      const { year, month } = getNextMonth(currentYear, currentMonth)
      setCurrentYear(year)
      setCurrentMonth(month)
    },
    onSwipeRight: () => {
      const { year, month } = getPrevMonth(currentYear, currentMonth)
      setCurrentYear(year)
      setCurrentMonth(month)
    },
  })

  const handleIncrement = () => {
    setCount((prev) => prev + 1)
  }

  const handleDecrement = () => {
    setCount((prev) => Math.max(0, prev - 1))
  }

  const handleSave = () => {
    updateWaitingCount(count)
  }

  // 前月へ移動
  const handlePrevMonth = () => {
    const { year, month } = getPrevMonth(currentYear, currentMonth)
    setCurrentYear(year)
    setCurrentMonth(month)
  }

  // 次月へ移動
  const handleNextMonth = () => {
    const { year, month } = getNextMonth(currentYear, currentMonth)
    setCurrentYear(year)
    setCurrentMonth(month)
  }

  // 休日かどうかを判定する関数
  const isHoliday = (date: string) => {
    const holiday = holidays.find((h) => h.date === date)
    return holiday?.isHoliday || false
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md">
      <header className="flex items-center gap-2 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">待ち人数・休日管理</h1>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">待ち人数設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleDecrement}>
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                type="number"
                min="0"
                value={count}
                onChange={(e) => setCount(Number.parseInt(e.target.value) || 0)}
                className="text-center"
              />

              <Button variant="outline" size="icon" onClick={handleIncrement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleSave} className="w-full mt-4">
              保存
            </Button>
          </CardContent>
        </Card>

        <div ref={calendarRef} className="touch-pan-y">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5" />
                  {calendarData.name}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
                  <div
                    key={i}
                    className={`font-medium p-2 text-sm ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : ""}`}
                  >
                    {day}
                  </div>
                ))}

                {/* 月の1日目の曜日に合わせて空白を挿入 */}
                {Array.from({ length: calendarData.days[0].dayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}

                {calendarData.days.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => toggleHoliday(day.date)}
                    className={`p-2 rounded-md relative ${
                      isHoliday(day.date)
                        ? "bg-red-100 text-red-600"
                        : day.dayOfWeek === 0
                          ? "text-red-500"
                          : day.dayOfWeek === 6
                            ? "text-blue-500"
                            : ""
                    }`}
                  >
                    {day.day}
                    {isHoliday(day.date) && (
                      <Badge variant="destructive" className="absolute top-0 right-0 text-[8px] h-3 min-w-3 px-0.5">
                        休
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
          <p>左右にスワイプして月を切り替えられます</p>
        </div>
      </div>
    </div>
  )
}
