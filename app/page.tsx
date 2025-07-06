"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, CalendarIcon, Menu, RefreshCw } from "lucide-react"
import {
  useSalonStore,
  getCurrentTime,
  getCalendarData,
  getBusinessHoursText,
  getCurrentBusinessStatus,
  getBusinessHoursInfo,
} from "@/lib/data"
import { useSwipe } from "@/hooks/use-swipe"

export default function HomePage() {
  const { waitingCount, holidays, lastUpdatedTime, isReceptionClosed, refreshData } = useSalonStore()
  const [currentTime, setCurrentTime] = useState(getCurrentTime())
  const [currentCalendarIndex, setCurrentCalendarIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string>("")
  const calendarData = getCalendarData()
  const calendarRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const businessHoursText = getBusinessHoursText(now, holidays)
  const businessStatus = getCurrentBusinessStatus(now, holidays, isReceptionClosed)
  const businessHoursInfo = getBusinessHoursInfo()

  // スワイプハンドラーを設定
  useSwipe(calendarRef, {
    onSwipeLeft: () => {
      if (currentCalendarIndex < calendarData.length - 1) {
        setCurrentCalendarIndex(currentCalendarIndex + 1)
      }
    },
    onSwipeRight: () => {
      if (currentCalendarIndex > 0) {
        setCurrentCalendarIndex(currentCalendarIndex - 1)
      }
    },
  })

  // 1分ごとに時間を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // フィードバック表示用の関数
  const showFeedback = (message: string) => {
    setFeedback(message)
    setTimeout(() => setFeedback(""), 3000)
  }

  // 更新ボタンのハンドラー
  const handleRefresh = async () => {
    setIsRefreshing(true)

    // 少し遅延を入れてローディング感を演出
    await new Promise((resolve) => setTimeout(resolve, 500))

    refreshData()
    setCurrentTime(getCurrentTime())

    setIsRefreshing(false)
    showFeedback("情報を更新しました")
  }

  // 休日かどうかを判定する関数
  const isHoliday = (date: string) => {
    const holiday = holidays.find((h) => h.date === date)
    return holiday?.isHoliday || false
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md pb-20">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ベルポスト美容室</h1>
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* フィードバックメッセージ */}
      {feedback && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg text-blue-800 text-sm">{feedback}</div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                現在の待ち時間
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{lastUpdatedTime} 時点</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <Users className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                {isReceptionClosed ? (
                  <>
                    <p className="text-muted-foreground text-sm">受付状況</p>
                    <p className="text-4xl font-bold text-destructive">受付終了</p>
                    <p className="text-muted-foreground text-sm mt-2">本日の新規受付は終了いたしました</p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">現在の待ち人数</p>
                    <p className="text-4xl font-bold">{waitingCount}人</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      {waitingCount > 0 ? `およそ ${waitingCount * 25} 分のお待ち時間です` : "すぐにご案内できます"}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm">{businessHoursText}</span>
                <Badge
                  variant={
                    businessStatus === "営業中"
                      ? "default"
                      : businessStatus === "昼休み"
                        ? "outline"
                        : businessStatus === "受付終了"
                          ? "destructive"
                          : businessStatus === "休業日"
                            ? "destructive"
                            : "secondary"
                  }
                >
                  {businessStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div ref={calendarRef} className="touch-pan-y">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentCalendarIndex(0)}
                  disabled={currentCalendarIndex === 0}
                >
                  今月
                </Button>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5" />
                  {calendarData[currentCalendarIndex].name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentCalendarIndex(1)}
                  disabled={currentCalendarIndex === 1}
                >
                  来月
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
                {Array.from({ length: calendarData[currentCalendarIndex].days[0].dayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}

                {calendarData[currentCalendarIndex].days.map((day) => (
                  <div
                    key={day.date}
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 営業時間の詳細表示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              営業時間
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{businessHoursInfo.weekday.label}</p>
                  <p className="text-sm text-muted-foreground">{businessHoursInfo.weekday.hours}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  月〜金
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{businessHoursInfo.weekend.label}</p>
                  <p className="text-sm text-muted-foreground">{businessHoursInfo.weekend.hours}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  土日祝
                </Badge>
              </div>

              <div className="flex justify-center items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-center">
                  <p className="font-medium text-sm text-orange-800">昼休み</p>
                  <p className="text-sm text-orange-600">12:00 〜 13:00</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
          <p>左右にスワイプして月を切り替えられます</p>
        </div>
      </div>
    </div>
  )
}
