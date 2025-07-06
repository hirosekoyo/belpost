"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarIcon, Clock, Scissors, ChevronLeft, ChevronRight } from "lucide-react"
import {
  useSalonStore,
  formatDate,
  formatTime,
  getCalendarForMonth,
  getPrevMonth,
  getNextMonth,
  getCurrentDate,
} from "@/lib/data"
import { useSwipe } from "@/hooks/use-swipe"
import { FooterNav } from "@/components/footer-nav"

export default function StatsPage() {
  const { haircutRecords, holidays, getRecordsByDate, getCountByDate } = useSalonStore()
  const [selectedDate, setSelectedDate] = useState(getCurrentDate())

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

  // 選択された日付のレコードを取得
  const selectedRecords = getRecordsByDate(selectedDate)

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
    <div className="container mx-auto px-4 py-6 max-w-md pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">散髪集計</h1>
      </header>

      <div className="space-y-6">
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

                {calendarData.days.map((day) => {
                  const count = getCountByDate(day.date)
                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`p-2 rounded-md relative ${
                        selectedDate === day.date
                          ? "bg-primary text-primary-foreground"
                          : isHoliday(day.date)
                            ? "bg-red-100 text-red-600"
                            : day.dayOfWeek === 0
                              ? "text-red-500"
                              : day.dayOfWeek === 6
                                ? "text-blue-500"
                                : ""
                      }`}
                    >
                      {day.day}
                      {count > 0 && <Badge className="absolute top-0 right-0 text-[8px] h-4 min-w-4">{count}</Badge>}
                      {isHoliday(day.date) && count === 0 && (
                        <Badge variant="destructive" className="absolute top-0 right-0 text-[8px] h-3 min-w-3 px-0.5">
                          休
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scissors className="h-5 w-5" />
              {formatDate(selectedDate)}の散髪記録
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>時間</TableHead>
                    <TableHead>カットタイプ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRecords
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatTime(record.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.type}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">この日の記録はありません</div>
            )}
          </CardContent>
        </Card>

        <div className="fixed bottom-20 left-0 right-0 text-center text-xs text-muted-foreground">
          <p>左右にスワイプして月を切り替えられます</p>
        </div>
      </div>

      <FooterNav />
    </div>
  )
}
