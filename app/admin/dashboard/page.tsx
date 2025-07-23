"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CalendarIcon, ChevronLeft, ChevronRight, Scissors, Check, Users, Megaphone, Eye, EyeOff } from "lucide-react"
import { useSalonStore, getCalendarForMonth, getPrevMonth, getNextMonth, type HaircutType, fetchHolidays, upsertHoliday } from "@/lib/data"
import { useSwipe } from "@/hooks/use-swipe"
import { FooterNav } from "@/components/footer-nav"

export default function DashboardPage() {
  const {
    waitingCount,
    announcement,
    isAnnouncementVisible,
    fetchWaitingStatusFromDB,
    updateWaitingCountInDB,
    addHaircutRecordToDB,
    updateAnnouncementInDB,
    toggleAnnouncementVisibilityInDB,
    holidays,
    // toggleHoliday, // ←削除
  } = useSalonStore()
  const [selectedType, setSelectedType] = useState<HaircutType>("カット")
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false)
  const [announcementDraft, setAnnouncementDraft] = useState(announcement)
  const [haircutSaved, setHaircutSaved] = useState(false)

  // 現在の年月を取得
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  const calendarData = getCalendarForMonth(currentYear, currentMonth)
  const calendarRef = useRef<HTMLDivElement>(null)

  // holidaysテーブルのデータを管理
  const [holidaysDB, setHolidaysDB] = useState<any[]>([])
  const [nationalHolidays, setNationalHolidays] = useState<string[]>([])
  const [holidayNames, setHolidayNames] = useState<{ date: string, name: string }[]>([])

  // holidaysテーブルからデータ取得
  const reloadHolidays = async () => {
    const data = await fetchHolidays();
    const normalized = data.map((h: any) => ({
      ...h,
      isHoliday: h.is_holiday === true,
      isNationalHoliday: h.is_national_holiday === true,
      date: h.date ? new Date(h.date).toISOString().split('T')[0] : '',
    }));
    setHolidaysDB(normalized);
    setNationalHolidays(normalized.filter((h: any) => h.isNationalHoliday).map((h: any) => h.date));
    setHolidayNames(normalized.filter((h: any) => h.holiday_name).map((h: any) => ({ date: h.date, name: h.holiday_name })));
  };

  useEffect(() => {
    fetchWaitingStatusFromDB()
    reloadHolidays();
  }, [])

  useEffect(() => {
    setAnnouncementDraft(announcement)
  }, [announcement])

  useEffect(() => {
    reloadHolidays();
  }, [currentYear, currentMonth]);

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

  // 待ち人数を選択する関数
  const handleWaitingCountSelect = async (count: number) => {
    await updateWaitingCountInDB(count)
  }

  // お知らせの編集開始
  const handleAnnouncementEditStart = () => {
    setIsEditingAnnouncement(true)
    // 編集開始時に自動的に非表示にする
    if (isAnnouncementVisible) {
      toggleAnnouncementVisibilityInDB()
    }
  }

  // お知らせの表示切り替え時にのみ内容を更新
  const handleToggleAnnouncementVisibility = async () => {
    await updateAnnouncementInDB(announcementDraft)
    await toggleAnnouncementVisibilityInDB()
  }

  const handleHaircutSubmit = async () => {
    await addHaircutRecordToDB(selectedType)
    setHaircutSaved(true)
    setTimeout(() => setHaircutSaved(false), 2000)
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

  // 休日判定
  const isHolidayDB = (date: string) => {
    const h = holidaysDB.find((h: any) => h.date === date);
    return h?.isHoliday === true;
  };
  const isNationalHolidayDB = (date: string) => {
    return nationalHolidays.includes(date);
  };

  // 日付クリックでis_holidayをトグル
  const handleDayClick = async (date: string) => {
    try {
      const h = holidaysDB.find((h: any) => h.date === date);
      const newIsHoliday = !(h?.isHoliday === true);
      await upsertHoliday(date, newIsHoliday);
      await reloadHolidays();
    } catch (e) {
      alert('エラー: ' + (e instanceof Error ? e.message : JSON.stringify(e)));
      console.error(e);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">スタッフ管理画面</h1>
      </header>

      {/* フィードバックメッセージ */}
      {/* フィードバックやトースト表示部分は全て削除 */}

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
                      <p className="text-3xl font-bold text-primary">{waitingCount === 5 ? "受付終了" : `${waitingCount}人`}</p>
                      <p className="text-sm text-muted-foreground">
                        {waitingCount === 5 ? "本日の受付は終了しました" : waitingCount > 0 ? `およそ ${waitingCount * 30} 分のお待ち時間` : "すぐにご案内できます"}
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
                
                {/* 受付終了ボタン */}
                <div className="mt-3">
                  <Button
                    variant={waitingCount === 5 ? "destructive" : "outline"}
                    size="lg"
                    onClick={() => handleWaitingCountSelect(5)}
                    className={`w-full h-12 text-lg font-bold ${
                      waitingCount === 5 ? "bg-destructive text-destructive-foreground" : ""
                    }`}
                  >
                    受付終了
                  </Button>
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

                <Button 
                  onClick={handleHaircutSubmit} 
                  variant={haircutSaved ? "destructive" : "default"}
                  className="w-full mt-2"
                >
                  {haircutSaved ? '保存しました' : <><Check className="mr-2 h-4 w-4" /> 散髪完了</>}
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
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  onFocus={handleAnnouncementEditStart}
                  onBlur={() => {
                    setIsEditingAnnouncement(false)
                    // フィードバックやトースト表示部分は全て削除
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
                {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                  <div
                    key={i}
                    className={`font-medium p-2 text-sm ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}
                  >
                    {day}
                  </div>
                ))}
                {/* 月の1日目の曜日に合わせて空白を挿入 */}
                {Array.from({ length: calendarData.days[0].dayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}
                {calendarData.days.map((day) => {
                  const h = holidaysDB.find((h: any) => h.date === day.date)
                  const isSat = day.dayOfWeek === 6
                  const isSun = day.dayOfWeek === 0
                  const isNatHol = isNationalHolidayDB(day.date)
                  const isShopHol = h?.isHoliday === true
                  // デザイン優先順位: 店休日(赤背景) > 国民の祝日(赤文字) > 日曜(赤文字) > 土曜(青文字)
                  let textClass = ''
                  let bgClass = ''
                  if (isShopHol) {
                    bgClass = 'bg-red-100'
                    if (isSun || isSat || isNatHol) {
                      textClass = isSat ? 'text-blue-500' : 'text-red-600'
                    } else {
                      textClass = 'text-black'
                    }
                  } else if (isNatHol) {
                    textClass = 'text-red-500'
                  } else if (isSun) {
                    textClass = 'text-red-500'
                  } else if (isSat) {
                    textClass = 'text-blue-500'
                  }
                  return (
                    <button
                      key={day.date}
                      onClick={() => handleDayClick(day.date)}
                      className={`p-2 rounded-md relative ${bgClass} ${textClass}`}
                    >
                      {day.day}
                      {isShopHol && (
                        <Badge variant="destructive" className="absolute top-0 right-0 text-[8px] h-3 min-w-3 px-0.5">
                          休
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* 祝日名リスト */}
              <div className="mt-4 text-xs text-muted-foreground">
                {holidayNames
                  .filter(h => h.name && h.date.slice(0, 7) === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)
                  .map(h => `${parseInt(h.date.split('-')[2], 10)}日：${h.name} / `)}
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
