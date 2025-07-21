"use client"

import { useState, useRef, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, Scissors, ChevronLeft, ChevronRight, Edit, Trash2, Check, X, Calendar, Plus } from "lucide-react"
import {
  useSalonStore,
  formatDate,
  formatTime,
  getCalendarForMonth,
  getPrevMonth,
  getNextMonth,
  getCurrentDate,
  type HaircutType,
  updateHaircutRecordInSupabase,
  haircutTypeToNumber,
} from "@/lib/data"
import { useSwipe } from "@/hooks/use-swipe"
import { FooterNav } from "@/components/footer-nav"

export default function StatsPage() {
  const {
    haircutRecords,
    fetchHaircutRecordsFromDB,
    addHaircutRecordWithDateTimeToDB,
    deleteHaircutRecordFromDB,
    holidays,
  } = useSalonStore()
  const [selectedDate, setSelectedDate] = useState("")
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<HaircutType>("カット")
  const [editingTime, setEditingTime] = useState("")
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 現在の年月を取得
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  // クライアントサイドでのみ初期化
  useEffect(() => {
    setIsClient(true)
    setSelectedDate(getCurrentDate()) // 当日の日付を設定
    fetchHaircutRecordsFromDB()
  }, [])

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

  // 日付でフィルタ
  const selectedRecords = isClient && selectedDate ? haircutRecords.filter(r => r.date === selectedDate) : []
  // 日別集計
  const dailyStats = isClient && selectedDate ? {
    total: selectedRecords.length,
    cut: selectedRecords.filter(r => r.type === "カット").length,
    bangs: selectedRecords.filter(r => r.type === "前髪").length,
    buzz: selectedRecords.filter(r => r.type === "坊主").length,
  } : null
  // 月別集計
  const monthlyRecords = isClient ? haircutRecords.filter(r => {
    const d = new Date(r.date)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  }) : []
  const monthlyStats = isClient ? {
    total: monthlyRecords.length,
    cut: monthlyRecords.filter(r => r.type === "カット").length,
    bangs: monthlyRecords.filter(r => r.type === "前髪").length,
    buzz: monthlyRecords.filter(r => r.type === "坊主").length,
  } : null

  // 編集開始
  const handleEditStart = (record: any) => {
    setEditingRecordId(record.id)
    setEditingType(record.type)
    
    // 時刻のみを設定
    const recordDate = new Date(record.timestamp)
    setEditingTime(`${String(recordDate.getHours()).padStart(2, '0')}:${String(recordDate.getMinutes()).padStart(2, '0')}`)
  }

  // 新規追加開始
  const handleAddStart = () => {
    setIsAddingNew(true)
    setEditingType("カット")
    
    // 現在時刻を設定
    const now = new Date()
    setEditingTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
  }

  // 編集完了
  const handleEditComplete = async () => {
    if (editingRecordId) {
      // 選択した日付と時刻を組み合わせてタイムスタンプを生成
      const [hours, minutes] = editingTime.split(':').map(Number)
      const selectedDateObj = new Date(selectedDate)
      selectedDateObj.setHours(hours, minutes, 0, 0)
      // 新しい日付文字列を生成
      const newDateString = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${String(selectedDateObj.getDate()).padStart(2, '0')}`
      // Supabaseに更新
      await updateHaircutRecordInSupabase(Number(editingRecordId), {
        date: newDateString,
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
        haircut_type: haircutTypeToNumber(editingType),
      })
      await fetchHaircutRecordsFromDB()
      setEditingRecordId(null)
    }
  }

  // 新規追加完了
  const handleAddComplete = async () => {
    // 選択した日付で新しい記録を追加
    const selectedDateObj = new Date(selectedDate)
    const editingDateString = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}-${String(selectedDateObj.getDate()).padStart(2, '0')}`
    await addHaircutRecordWithDateTimeToDB(editingType, editingDateString, editingTime)
    
    setIsAddingNew(false)
  }

  // 編集キャンセル
  const handleEditCancel = () => {
    setEditingRecordId(null)
    setIsAddingNew(false)
  }

  // 記録削除
  const handleDeleteRecord = async (id: string) => {
    if (confirm('この記録を削除しますか？')) {
      await deleteHaircutRecordFromDB(Number(id))
    }
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
    const h = (holidays as any[]).find((h) => h.date === date)
    return h?.isHoliday === true || h?.is_holiday === true
  }

  // クライアントサイドでのみレンダリング
  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-md pb-20">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">散髪集計</h1>
        </header>
        <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
      </div>
    )
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
                  const count = isClient ? haircutRecords.filter(r => r.date === day.date).length : 0
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
                      {isClient && count > 0 && <Badge className="absolute top-0 right-0 text-[8px] h-4 min-w-4">{count}</Badge>}
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
            <div className="space-y-3">
              {selectedRecords.length > 0 && (
                <>
                  {selectedRecords
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((record, index) => (
                      <div
                        key={record.id}
                        className="relative overflow-hidden rounded-lg border bg-card"
                      >
                        <div className="p-4">
                          {editingRecordId === record.id ? (
                            // 編集モード
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">時刻</label>
                                <Input
                                  type="time"
                                  value={editingTime}
                                  onChange={(e) => setEditingTime(e.target.value)}
                                  className="w-full"
                                />
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium mb-2 block">カットタイプ</label>
                                <RadioGroup
                                  value={editingType}
                                  onValueChange={(value) => setEditingType(value as HaircutType)}
                                  className="grid grid-cols-3 gap-2"
                                >
                                  <div>
                                    <RadioGroupItem value="カット" id={`cut-${record.id}`} className="peer sr-only" />
                                    <Label
                                      htmlFor={`cut-${record.id}`}
                                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                      <Scissors className="mb-2 h-5 w-5" />
                                      <span className="text-sm">カット</span>
                                    </Label>
                                  </div>
                                  <div>
                                    <RadioGroupItem value="前髪" id={`bangs-${record.id}`} className="peer sr-only" />
                                    <Label
                                      htmlFor={`bangs-${record.id}`}
                                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                      <Scissors className="mb-2 h-5 w-5" />
                                      <span className="text-sm">前髪</span>
                                    </Label>
                                  </div>
                                  <div>
                                    <RadioGroupItem value="坊主" id={`buzz-${record.id}`} className="peer sr-only" />
                                    <Label
                                      htmlFor={`buzz-${record.id}`}
                                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                      <Scissors className="mb-2 h-5 w-5" />
                                      <span className="text-sm">坊主</span>
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  onClick={handleEditComplete}
                                  className="flex-1"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  保存
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={handleEditCancel}
                                  className="flex-1"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  キャンセル
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // 通常表示モード
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => handleEditStart(record)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-muted-foreground" />
                                  <span className="font-medium">{formatTime(record.timestamp)}</span>
                                </div>
                                <Badge variant="outline">{record.type}</Badge>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteRecord(record.id)
                                }}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* 新規追加モード */}
              {isAddingNew && (
                <div className="relative overflow-hidden rounded-lg border bg-card">
                  <div className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">時刻</label>
                        <Input
                          type="time"
                          value={editingTime}
                          onChange={(e) => setEditingTime(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">カットタイプ</label>
                        <RadioGroup
                          value={editingType}
                          onValueChange={(value) => setEditingType(value as HaircutType)}
                          className="grid grid-cols-3 gap-2"
                        >
                          <div>
                            <RadioGroupItem value="カット" id="cut-new" className="peer sr-only" />
                            <Label
                              htmlFor="cut-new"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <Scissors className="mb-2 h-5 w-5" />
                              <span className="text-sm">カット</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="前髪" id="bangs-new" className="peer sr-only" />
                            <Label
                              htmlFor="bangs-new"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <Scissors className="mb-2 h-5 w-5" />
                              <span className="text-sm">前髪</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="坊主" id="buzz-new" className="peer sr-only" />
                            <Label
                              htmlFor="buzz-new"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              <Scissors className="mb-2 h-5 w-5" />
                              <span className="text-sm">坊主</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={handleAddComplete}
                          className="flex-1"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          追加
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleEditCancel}
                          className="flex-1"
                        >
                          <X className="mr-2 h-4 w-4" />
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 新規追加ボタン */}
              {!isAddingNew && (
                <button
                  onClick={handleAddStart}
                  className="w-full p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Plus className="h-5 w-5" />
                    <span>新しい記録を追加</span>
                  </div>
                </button>
              )}

              {selectedRecords.length === 0 && !isAddingNew && (
                <div className="text-center py-8 text-muted-foreground">この日の記録はありません</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 日付毎の集計 */}
        {dailyStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scissors className="h-5 w-5" />
                {formatDate(selectedDate)}の集計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">{dailyStats.total}</div>
                  <div className="text-sm text-muted-foreground">合計</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">{dailyStats.cut}</div>
                  <div className="text-sm text-muted-foreground">カット</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">{dailyStats.bangs}</div>
                  <div className="text-sm text-muted-foreground">前髪</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-600">{dailyStats.buzz}</div>
                  <div className="text-sm text-muted-foreground">坊主</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 月毎の集計 */}
        {monthlyStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                {currentYear}年{currentMonth + 1}月の集計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">{monthlyStats.total}</div>
                  <div className="text-sm text-muted-foreground">合計</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">{monthlyStats.cut}</div>
                  <div className="text-sm text-muted-foreground">カット</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">{monthlyStats.bangs}</div>
                  <div className="text-sm text-muted-foreground">前髪</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-600">{monthlyStats.buzz}</div>
                  <div className="text-sm text-muted-foreground">坊主</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        <div className="fixed bottom-20 left-0 right-0 text-center text-xs text-muted-foreground">
          <p>左右にスワイプして月を切り替えられます</p>
        </div>
      </div>

      <FooterNav />
    </div>
  )
}
