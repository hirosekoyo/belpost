"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
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
            <div className="space-y-4">
              {/* 現在の待ち人数表示 */}
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-primary">{count}人</p>
                <p className="text-sm text-muted-foreground">
                  {count === 5 ? "受付終了" : count > 0 ? `およそ ${count * 25} 分のお待ち時間` : "すぐにご案内できます"}
                </p>
              </div>

              {/* スクリーンキーボード風の数字選択 */}
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map((num) => (
                  <Button
                    key={num}
                    variant={count === num ? "default" : "outline"}
                    size="lg"
                    onClick={() => setCount(num)}
                    className={`h-12 text-lg font-bold ${
                      count === num ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              
              {/* 受付終了ボタン */}
              <div>
                <Button
                  variant={count === 5 ? "destructive" : "outline"}
                  size="lg"
                  onClick={() => setCount(5)}
                  className={`w-full h-12 text-lg font-bold ${
                    count === 5 ? "bg-destructive text-destructive-foreground" : ""
                  }`}
                >
                  受付終了
                </Button>
              </div>

              <Button onClick={handleSave} className="w-full">
                保存
              </Button>
            </div>
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
