"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CalendarIcon, ChevronLeft, ChevronRight, Scissors, Check, Users, Megaphone, Eye, EyeOff } from "lucide-react"
import { useSalonStore, getCalendarForMonth, getPrevMonth, getNextMonth, type HaircutType } from "@/lib/data"
import { useSwipe } from "@/hooks/use-swipe"
import { FooterNav } from "@/components/footer-nav"

export default function DashboardPage() {
  const {
    waitingCount,
    holidays,
    announcement,
    isAnnouncementVisible,
    updateWaitingCount,
    toggleHoliday,
    addHaircutRecord,
    updateLastUpdatedTime,
    updateAnnouncement,
    toggleAnnouncementVisibility,
  } = useSalonStore()
  const [selectedType, setSelectedType] = useState<HaircutType>("カット")
  const [feedback, setFeedback] = useState<string>("")
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false)

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

  // フィードバック表示用の関数
  const showFeedback = (message: string) => {
    setFeedback(message)
    setTimeout(() => setFeedback(""), 3000)
  }

  // 待ち人数を選択する関数
  const handleWaitingCountSelect = (count: number) => {
    updateWaitingCount(count)
    updateLastUpdatedTime()
    showFeedback(`待ち人数を${count}人に設定しました`)
  }

  // お知らせの編集開始
  const handleAnnouncementEditStart = () => {
    setIsEditingAnnouncement(true)
    // 編集開始時に自動的に非表示にする
    if (isAnnouncementVisible) {
      toggleAnnouncementVisibility()
    }
  }

  // お知らせの更新
  const handleAnnouncementUpdate = (text: string) => {
    updateAnnouncement(text)
  }



  // お知らせの表示切り替え
  const handleToggleAnnouncementVisibility = () => {
    toggleAnnouncementVisibility()
    showFeedback(isAnnouncementVisible ? "お知らせを非表示にしました" : "お知らせを表示しました")
  }

  const handleHaircutSubmit = () => {
    addHaircutRecord(selectedType)
    showFeedback(`${selectedType}の記録を追加しました`)
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
    <div className="container mx-auto px-4 py-6 max-w-md pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">スタッフ管理画面</h1>
      </header>

      {/* フィードバックメッセージ */}
      {feedback && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-800 text-sm">
          {feedback}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              待ち人数・散髪記録
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">待ち人数設定</h3>
                <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-primary">{waitingCount}人</p>
                      <p className="text-sm text-muted-foreground">
                        {waitingCount > 0 ? `およそ ${waitingCount * 25} 分のお待ち時間` : "すぐにご案内できます"}
                      </p>
                </div>

                {/* スクリーンキーボード風の数字選択 */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={waitingCount === num ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleWaitingCountSelect(num)}
                      className={`h-12 text-lg font-bold ${
                        waitingCount === num ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      {num}
                    </Button>
                  ))}
                </div>


              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">散髪記録</h3>
                <RadioGroup
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as HaircutType)}
                  className="grid grid-cols-3 gap-2"
                >
                  <div>
                    <RadioGroupItem value="カット" id="cut" className="peer sr-only" />
                    <Label
                      htmlFor="cut"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Scissors className="mb-1 h-4 w-4" />
                      <span className="text-xs">カット</span>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem value="前髪" id="bangs" className="peer sr-only" />
                    <Label
                      htmlFor="bangs"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Scissors className="mb-1 h-4 w-4" />
                      <span className="text-xs">前髪</span>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem value="坊主" id="buzz" className="peer sr-only" />
                    <Label
                      htmlFor="buzz"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Scissors className="mb-1 h-4 w-4" />
                      <span className="text-xs">坊主</span>
                    </Label>
                  </div>
                </RadioGroup>

                <Button onClick={handleHaircutSubmit} className="w-full mt-2">
                  <Check className="mr-2 h-4 w-4" /> 散髪完了
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* お知らせ設定カード */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5" />
              お知らせ設定
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">お知らせ内容</label>
                <textarea
                  value={announcement}
                  onChange={(e) => handleAnnouncementUpdate(e.target.value)}
                  onFocus={handleAnnouncementEditStart}
                  onBlur={() => {
                    setIsEditingAnnouncement(false)
                    showFeedback("お知らせを更新しました")
                  }}
                  placeholder="お知らせを入力してください..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                />
              </div>
              <div>
                <Button
                  variant={isAnnouncementVisible ? "default" : "outline"}
                  size="lg"
                  onClick={handleToggleAnnouncementVisibility}
                  className="w-full h-12 text-lg font-bold"
                  disabled={isEditingAnnouncement}
                >
                  {isAnnouncementVisible ? (
                    <>
                      <EyeOff className="mr-2 h-5 w-5" />
                      お知らせを非表示にする
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-5 w-5" />
                      お知らせを表示する
                    </>
                  )}
                </Button>
              </div>
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
                  {calendarData.name} - 休日設定
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

        <div className="fixed bottom-20 left-0 right-0 text-center text-xs text-muted-foreground">
          <p>左右にスワイプして月を切り替えられます</p>
        </div>
      </div>

      <FooterNav />
    </div>
  )
}
