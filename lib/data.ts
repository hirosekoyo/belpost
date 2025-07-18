import { create } from "zustand"
import { persist } from "zustand/middleware"

export type HaircutType = "カット" | "前髪" | "坊主"

export interface HaircutRecord {
  id: string
  type: HaircutType
  timestamp: string
  date: string
}

export interface HolidayData {
  date: string
  isHoliday: boolean
}

// ユーティリティ関数を先に定義
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}

// 現在の日付を取得
export const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0]
}

// 現在の時刻を取得
export const getCurrentTime = (): string => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
}

// 営業時間関連の関数
export const getBusinessHours = (date: Date): { open: string; close: string } => {
  const day = date.getDay()
  // 0: 日曜, 1-5: 月-金, 6: 土曜
  const isWeekend = day === 0 || day === 6

  return {
    open: "09:00",
    close: isWeekend ? "19:00" : "20:00",
  }
}

export const isHoliday = (date: string, holidays: HolidayData[]): boolean => {
  const holiday = holidays.find((h) => h.date === date)
  return holiday?.isHoliday || false
}

export const getBusinessHoursText = (date: Date, holidays: HolidayData[]): string => {
  const dateString = date.toISOString().split("T")[0]

  if (isHoliday(dateString, holidays)) {
    return "本日は休業日です"
  }

  const { open, close } = getBusinessHours(date)
  const day = date.getDay()
  const isWeekend = day === 0 || day === 6

  return `営業時間: ${open}〜${close}（昼休み 12:00〜13:00）${isWeekend ? "（土日祝）" : "（平日）"}`
}

export const getCurrentBusinessStatus = (date: Date, holidays: HolidayData[]): string => {
  const dateString = date.toISOString().split("T")[0]

  if (isHoliday(dateString, holidays)) {
    return "休業日"
  }

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const currentTime = hours * 60 + minutes

  const { open, close } = getBusinessHours(date)
  const [openHour, openMinute] = open.split(":").map(Number)
  const [closeHour, closeMinute] = close.split(":").map(Number)

  const openTime = openHour * 60 + openMinute
  const closeTime = closeHour * 60 + closeMinute
  const lunchStartTime = 12 * 60
  const lunchEndTime = 13 * 60

  if (currentTime < openTime) {
    return "開店前"
  } else if (currentTime >= closeTime) {
    return "閉店"
  } else if (currentTime >= lunchStartTime && currentTime < lunchEndTime) {
    return "昼休み"
  } else {
    return "営業中"
  }
}

// 営業時間の詳細情報を取得
export const getBusinessHoursInfo = () => {
  return {
    weekday: {
      label: "平日",
      hours: "9:00 〜 20:00",
      lunch: "12:00 〜 13:00（昼休み）",
    },
    weekend: {
      label: "土日祝",
      hours: "9:00 〜 19:00",
      lunch: "12:00 〜 13:00（昼休み）",
    },
  }
}

// 初期の休日データを生成（2ヶ月分）
const generateInitialHolidays = (): HolidayData[] => {
  const holidays: HolidayData[] = []
  const today = new Date()

  // 今月と来月の日付を生成
  for (let month = 0; month < 2; month++) {
    const currentMonth = new Date(today.getFullYear(), today.getMonth() + month, 1)
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const dateString = date.toISOString().split("T")[0]

      // 日曜日は休日に設定
      const isHoliday = date.getDay() === 0
      holidays.push({ date: dateString, isHoliday })
    }
  }

  return holidays
}

// サンプルの散髪記録を生成
const generateSampleRecords = (): HaircutRecord[] => {
  const records: HaircutRecord[] = []
  const types: HaircutType[] = ["カット", "前髪", "坊主"]
  const today = new Date()

  // 固定のシードを使用して一貫性のあるサンプルデータを生成
  const seed = 12345 // 固定シード

  // 過去30日分のサンプルデータを生成
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    // 日本時間での日付文字列を生成
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    // シードベースの擬似乱数生成
    const daySeed = seed + i
    const recordCount = (daySeed % 5) + 1 // 1〜5件の固定パターン

    for (let j = 0; j < recordCount; j++) {
      const hours = ((daySeed + j) % 8) + 10 // 10時〜18時
      const minutes = (daySeed + j) % 60
      date.setHours(hours, minutes)

      records.push({
        id: `record-${i}-${j}`,
        type: types[(daySeed + j) % types.length],
        timestamp: date.toISOString(),
        date: dateString,
      })
    }
  }

  return records
}

interface SalonState {
  waitingCount: number
  holidays: HolidayData[]
  haircutRecords: HaircutRecord[]
  lastUpdatedTime: string
  announcement: string
  isAnnouncementVisible: boolean
  updateWaitingCount: (count: number) => void
  toggleHoliday: (date: string) => void
  addHaircutRecord: (type: HaircutType) => void
  addHaircutRecordWithDateTime: (type: HaircutType, date: string, time: string) => void
  updateHaircutRecord: (id: string, type: HaircutType) => void
  updateHaircutRecordFull: (record: HaircutRecord) => void
  deleteHaircutRecord: (id: string) => void
  getRecordsByDate: (date: string) => HaircutRecord[]
  getCountByDate: (date: string) => number
  getStatsByDate: (date: string) => { total: number; cut: number; bangs: number; buzz: number }
  getStatsByMonth: (year: number, month: number) => { total: number; cut: number; bangs: number; buzz: number }
  updateLastUpdatedTime: () => void
  refreshData: () => void
  updateAnnouncement: (text: string) => void
  toggleAnnouncementVisibility: () => void
}

// Zustandストアの作成
export const useSalonStore = create<SalonState>()(
  persist(
    (set, get) => ({
      waitingCount: 3, // 初期待ち人数
      holidays: generateInitialHolidays(),
      haircutRecords: generateSampleRecords(),
      lastUpdatedTime: getCurrentTime(),
      announcement: "", // お知らせテキスト
      isAnnouncementVisible: false, // お知らせの表示状態

      updateWaitingCount: (count) =>
        set({
          waitingCount: count,
          lastUpdatedTime: getCurrentTime(),
        }),

      toggleHoliday: (date) =>
        set((state) => {
          const holidays = [...state.holidays]
          const index = holidays.findIndex((h) => h.date === date)

          if (index >= 0) {
            holidays[index] = { ...holidays[index], isHoliday: !holidays[index].isHoliday }
          } else {
            holidays.push({ date, isHoliday: true })
          }

          return { holidays }
        }),

      addHaircutRecord: (type) =>
        set((state) => {
          const now = new Date()
          // 日本時間での日付文字列を生成
          const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

          const newRecord: HaircutRecord = {
            id: `record-${Date.now()}`,
            type,
            timestamp: now.toISOString(),
            date: dateString,
          }

          return {
            haircutRecords: [...state.haircutRecords, newRecord],
            // 散髪完了したら待ち人数を減らす（0未満にはならないように）
            waitingCount: Math.max(0, state.waitingCount - 1),
            lastUpdatedTime: getCurrentTime(),
          }
        }),

      addHaircutRecordWithDateTime: (type: HaircutType, date: string, time: string) =>
        set((state) => {
          // 日付と時刻を組み合わせてタイムスタンプを生成
          const [hours, minutes] = time.split(':').map(Number)
          const recordDate = new Date(date)
          recordDate.setHours(hours, minutes, 0, 0)

          const newRecord: HaircutRecord = {
            id: `record-${Date.now()}`,
            type,
            timestamp: recordDate.toISOString(),
            date: date,
          }

          return {
            haircutRecords: [...state.haircutRecords, newRecord],
            lastUpdatedTime: getCurrentTime(),
          }
        }),

      updateHaircutRecord: (id, type) =>
        set((state) => ({
          haircutRecords: state.haircutRecords.map((record) =>
            record.id === id ? { ...record, type } : record
          ),
          lastUpdatedTime: getCurrentTime(),
        })),

      updateHaircutRecordFull: (updatedRecord: HaircutRecord) =>
        set((state) => ({
          haircutRecords: state.haircutRecords.map((record) =>
            record.id === updatedRecord.id ? updatedRecord : record
          ),
          lastUpdatedTime: getCurrentTime(),
        })),

      deleteHaircutRecord: (id) =>
        set((state) => ({
          haircutRecords: state.haircutRecords.filter((record) => record.id !== id),
          lastUpdatedTime: getCurrentTime(),
        })),

      getRecordsByDate: (date) => {
        return get().haircutRecords.filter((record) => record.date === date)
      },

      getCountByDate: (date) => {
        return get().haircutRecords.filter((record) => record.date === date).length
      },

      getStatsByDate: (date: string) => {
        const records = get().haircutRecords.filter((record) => record.date === date)
        const stats = {
          total: records.length,
          cut: records.filter(r => r.type === "カット").length,
          bangs: records.filter(r => r.type === "前髪").length,
          buzz: records.filter(r => r.type === "坊主").length,
        }
        return stats
      },

      getStatsByMonth: (year: number, month: number) => {
        const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
        const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-31`
        
        const records = get().haircutRecords.filter((record) => {
          return record.date >= monthStart && record.date <= monthEnd
        })
        
        const stats = {
          total: records.length,
          cut: records.filter(r => r.type === "カット").length,
          bangs: records.filter(r => r.type === "前髪").length,
          buzz: records.filter(r => r.type === "坊主").length,
        }
        return stats
      },

      updateLastUpdatedTime: () => set({ lastUpdatedTime: getCurrentTime() }),

      refreshData: () => set({ lastUpdatedTime: getCurrentTime() }),

      updateAnnouncement: (text) =>
        set({
          announcement: text,
          lastUpdatedTime: getCurrentTime(),
        }),

      toggleAnnouncementVisibility: () =>
        set((state) => ({
          isAnnouncementVisible: !state.isAnnouncementVisible,
          lastUpdatedTime: getCurrentTime(),
        })),
    }),
    {
      name: "salon-storage",
    },
  ),
)

// 月のカレンダーデータを生成
export const getMonthCalendar = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  const days = []
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    // 日本時間での日付文字列を生成
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({
      date: dateString,
      day: i,
      dayOfWeek: date.getDay(),
    })
  }

  return days
}

// 指定した年月のカレンダーデータを取得
export const getCalendarForMonth = (year: number, month: number) => {
  return {
    year,
    month,
    name: `${year}年${month + 1}月`,
    days: getMonthCalendar(year, month),
  }
}

// 今月と来月のカレンダーデータを取得
export const getCalendarData = () => {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  return [
    {
      year: currentYear,
      month: currentMonth,
      name: `${currentYear}年${currentMonth + 1}月`,
      days: getMonthCalendar(currentYear, currentMonth),
    },
    {
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      month: (currentMonth + 1) % 12,
      name: `${currentMonth === 11 ? currentYear + 1 : currentYear}年${((currentMonth + 1) % 12) + 1}月`,
      days: getMonthCalendar(currentMonth === 11 ? currentYear + 1 : currentYear, (currentMonth + 1) % 12),
    },
  ]
}

// 前月・次月の年月を取得
export const getPrevMonth = (year: number, month: number) => {
  if (month === 0) {
    return { year: year - 1, month: 11 }
  }
  return { year, month: month - 1 }
}

export const getNextMonth = (year: number, month: number) => {
  if (month === 11) {
    return { year: year + 1, month: 0 }
  }
  return { year, month: month + 1 }
}
