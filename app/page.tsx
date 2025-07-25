"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, CalendarIcon, Menu, RefreshCw, Megaphone } from "lucide-react"
import {
  useSalonStore,
  getBusinessHoursText,
  getCurrentBusinessStatus,
  getBusinessHoursInfo,
  getCalendarData,
  fetchHolidays,
  HolidayData,
} from "@/lib/data"
import { useSwipe } from "@/hooks/use-swipe"

export default function HomePage() {
  // holidaysをuseStateでローカル管理
  const [holidays, setHolidays] = useState<HolidayData[]>([])
  const { waitingCount, lastUpdatedTime, announcement, isAnnouncementVisible, fetchWaitingStatusFromDB } = useSalonStore()
  const [displayTime, setDisplayTime] = useState("")
  const [currentCalendarIndex, setCurrentCalendarIndex] = useState(0)
  const calendarData = getCalendarData()
  const calendarRef = useRef<HTMLDivElement>(null)
  const now = new Date()
  const businessHoursText = getBusinessHoursText(now, holidays)
  const businessStatus = getCurrentBusinessStatus(now, holidays)
  const businessHoursInfo = getBusinessHoursInfo()

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

  useEffect(() => {
    fetchWaitingStatusFromDB()
    // holidaysもSupabaseから取得してセット
    fetchHolidays().then((data) => {
      // isHoliday, is_holiday, is_national_holiday, holiday_nameを正規化
      const normalized = data.map((h: any) => ({
        ...h,
        isHoliday: h.is_holiday === true,
        is_holiday: h.is_holiday === true,
        is_national_holiday: h.is_national_holiday === true,
        holiday_name: h.holiday_name ?? '',
        date: h.date ? new Date(h.date).toISOString().split('T')[0] : '',
      }))
      // useSalonStoreのholidaysにセット
      // set関数はuseSalonStoreの外から呼べないので、useStateでローカル管理
      setHolidays(normalized)
    })
  }, [])

  useEffect(() => {
    if (lastUpdatedTime) {
      // hh:mm形式で表示
      const d = new Date(lastUpdatedTime)
      setDisplayTime(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`)
    }
  }, [lastUpdatedTime])

  // 休日かどうかを判定する関数
  const isHoliday = (date: string) => {
    const holiday = holidays.find((h) => h.date === date)
    return holiday?.isHoliday || false
  }

  // data.tsからコピーしている　ひろせ
  const getCurrentDate = (): string => {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()).replace(/\//g, '-');
  };

  // 今日の日付文字列
  // const todayStr = now.toISOString().split('T')[0]
  const todayStr = getCurrentDate();
  const todayHoliday = holidays.find(h => h.date === todayStr)
  const isShopHoliday = todayHoliday?.isHoliday === true || todayHoliday?.is_holiday === true
  const isNationalHoliday = todayHoliday?.is_national_holiday === true
  const dayOfWeek = now.getDay() // 0:日, 6:土
  const isSat = dayOfWeek === 6
  const isSun = dayOfWeek === 0
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const isBeforeOpening = hours < 9
  const isLunch = hours === 12
  // 営業時間テキスト
  let businessHourText = ''
    if (isNationalHoliday || isSat || isSun) {
      businessHourText = '営業時間　 9:00 〜 19:00（土日祝）'
    } else {
      businessHourText = '営業時間　 9:00 〜 20:00（平日）'
    }

  return (
    <div className="container mx-auto px-4 py-6 max-w-md pb-20">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">BELPOST</h1>
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* フィードバックメッセージ */}
      {/* 更新ボタンやisRefreshing, setCurrentTime, handleRefresh等は全て削除 */}

      <div className="space-y-6">
        {/* お知らせ表示 */}
        {isAnnouncementVisible && announcement && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                <Megaphone className="h-5 w-5" />
                お知らせ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-orange-700 whitespace-pre-wrap">{announcement}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                現在の待ち時間
              </span>
              <span className="text-sm">{displayTime && `${displayTime} 時点`}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <Users className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
              
                {/* 休業日 */}
                {isShopHoliday ? (
                  <>
                    <p className="text-4xl font-bold text-destructive">本日は休業日です</p>
                    </>
                ) : isBeforeOpening ? (
                  <p className="text-4xl font-bold text-gray-500">開店前です</p>
                ) : isLunch ? (
                  <>
                    <p className="text-4xl font-bold text-orange-600">昼休み中です</p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm">現在の待ち人数</p>
                    {waitingCount === 5 ? (
                      hours === 10 || hours === 11 ?  (
                        <>
                          <p className="text-4xl font-bold text-destructive">受付終了</p>
                          <p className="text-muted-foreground text-sm mt-2">
                            午前中の受付は終了しました
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-4xl font-bold text-destructive">受付終了</p>
                          <p className="text-muted-foreground text-sm mt-2">
                            本日の受付は終了しました
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        <p className="text-4xl font-bold">{waitingCount}人</p>
                        <p className="text-muted-foreground text-sm mt-2">
                          {waitingCount > 0 ? `およそ ${waitingCount * 30} 分のお待ち時間です` : "すぐにご案内できます"}
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 営業時間表示 */}
            {(!isShopHoliday) && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{businessHourText}<br />
                  昼休み　　12:00 〜 13:00</span>
                  
                </div>
              </div>
            )}
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

                {calendarData[currentCalendarIndex].days.map((day) => {
                  const h = holidays.find((h) => h.date === day.date)
                  const isSat = day.dayOfWeek === 6
                  const isSun = day.dayOfWeek === 0
                  const isNatHol = h?.is_national_holiday === true
                  const isShopHol = h?.isHoliday === true || h?.is_holiday === true
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
                    <div
                      key={day.date}
                      className={`p-2 rounded-md relative ${bgClass} ${textClass}`}
                    >
                      {day.day}
                      {isShopHol && (
                        <Badge variant="destructive" className="absolute top-0 right-0 text-[8px] h-3 min-w-3 px-0.5">
                          休
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* 祝日名リスト */}
              <div className="mt-4 text-xs text-muted-foreground">
                {holidays
                  .filter(h => h.holiday_name && h.date.slice(0, 7) === calendarData[currentCalendarIndex].days[0].date.slice(0, 7))
                  .map(h => `${parseInt(h.date.split('-')[2], 10)}日：${h.holiday_name} / `)}
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
