import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from './supabaseClient';

// --- カットタイプ変換 ---
export type HaircutType = "カット" | "前髪" | "坊主";

export function haircutTypeToNumber(type: HaircutType): number {
  if (type === "カット") return 1;
  if (type === "前髪") return 2;
  if (type === "坊主") return 3;
  return 1;
}
export function numberToHaircutType(num: number): HaircutType {
  if (num === 1) return "カット";
  if (num === 2) return "前髪";
  if (num === 3) return "坊主";
  return "カット";
}

// --- Supabase CRUDユーティリティ ---
// 待ち人数・お知らせ取得
export async function fetchWaitingStatus() {
  const { data, error } = await supabase
    .from('waiting_status')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}
// 待ち人数・お知らせ更新
export async function updateWaitingStatus(updateObj: Partial<{ waiting_count: number; announcement: string; is_announcement_visible: boolean; updated_at: string; }>) {
  const { data, error } = await supabase
    .from('waiting_status')
    .update(updateObj)
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}
// 散髪記録一覧取得
export async function fetchHaircutRecords() {
  const { data, error } = await supabase
    .from('haircut_records')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false });
  if (error) throw error;
  return data;
}
// 散髪記録追加
export async function addHaircutRecordToSupabase(date: string, time: string, haircut_type: number) {
  const { data, error } = await supabase
    .from('haircut_records')
    .insert([{ date, time, haircut_type }])
    .select();
  if (error) throw error;
  return data;
}
// 散髪記録削除
export async function deleteHaircutRecordFromSupabase(id: number) {
  const { error } = await supabase
    .from('haircut_records')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
// 散髪記録更新
export async function updateHaircutRecordInSupabase(id: number, updateObj: Partial<{ date: string; time: string; haircut_type: number }>) {
  const { data, error } = await supabase
    .from('haircut_records')
    .update(updateObj)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

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
  lastUpdatedTime: string
  announcement: string
  isAnnouncementVisible: boolean
  haircutRecords: HaircutRecord[]
  // holidaysは現状維持
  holidays: HolidayData[]
  // Supabase同期用
  fetchWaitingStatusFromDB: () => Promise<void>
  updateWaitingCountInDB: (count: number) => Promise<void>
  updateAnnouncementInDB: (text: string) => Promise<void>
  toggleAnnouncementVisibilityInDB: () => Promise<void>
  fetchHaircutRecordsFromDB: () => Promise<void>
  addHaircutRecordToDB: (type: HaircutType) => Promise<void>
  addHaircutRecordWithDateTimeToDB: (type: HaircutType, date: string, time: string) => Promise<void>
  deleteHaircutRecordFromDB: (id: number) => Promise<void>
}

export const useSalonStore = create<SalonState>()((set, get) => ({
  waitingCount: 0,
  lastUpdatedTime: '',
  announcement: '',
  isAnnouncementVisible: false,
  haircutRecords: [],
  holidays: [], // holidaysは必ずDBから取得する

  // --- Supabase: 待ち人数・お知らせ ---
  fetchWaitingStatusFromDB: async () => {
    const data = await fetchWaitingStatus();
    set({
      waitingCount: data.waiting_count ?? 0,
      announcement: data.announcement ?? '',
      isAnnouncementVisible: data.is_announcement_visible ?? false,
      lastUpdatedTime: data.updated_at ?? '',
    });
  },
  updateWaitingCountInDB: async (count: number) => {
    const updated = await updateWaitingStatus({ waiting_count: count, updated_at: new Date().toISOString() });
    set({
      waitingCount: updated.waiting_count,
      lastUpdatedTime: updated.updated_at,
    });
  },
  updateAnnouncementInDB: async (text: string) => {
    const updated = await updateWaitingStatus({ announcement: text, updated_at: new Date().toISOString() });
    set({
      announcement: updated.announcement,
      lastUpdatedTime: updated.updated_at,
    });
  },
  toggleAnnouncementVisibilityInDB: async () => {
    const current = get().isAnnouncementVisible;
    const updated = await updateWaitingStatus({ is_announcement_visible: !current, updated_at: new Date().toISOString() });
    set({
      isAnnouncementVisible: updated.is_announcement_visible,
      lastUpdatedTime: updated.updated_at,
    });
  },

  // --- Supabase: 散髪記録 ---
  fetchHaircutRecordsFromDB: async () => {
    const data = await fetchHaircutRecords();
    set({
      haircutRecords: data.map((r: any) => ({
        id: r.id.toString(),
        type: numberToHaircutType(r.haircut_type),
        timestamp: `${r.date}T${r.time}`,
        date: r.date,
      })),
    });
  },
  addHaircutRecordToDB: async (type: HaircutType) => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    await addHaircutRecordToSupabase(date, time, haircutTypeToNumber(type));
    await get().fetchHaircutRecordsFromDB();
    // 待ち人数が5（受付終了）の場合は減らさない
    if (get().waitingCount !== 5) {
      const newCount = Math.max(0, get().waitingCount - 1);
      await get().updateWaitingCountInDB(newCount);
    }
  },
  addHaircutRecordWithDateTimeToDB: async (type: HaircutType, date: string, time: string) => {
    await addHaircutRecordToSupabase(date, `${time}:00`, haircutTypeToNumber(type));
    await get().fetchHaircutRecordsFromDB();
  },
  deleteHaircutRecordFromDB: async (id: number) => {
    await deleteHaircutRecordFromSupabase(id);
    await get().fetchHaircutRecordsFromDB();
  },
}));

// --- Holidays Supabase CRUD ---
export async function fetchHolidays() {
  const { data, error } = await supabase
    .from('holidays')
    .select('*');
  if (error) throw error;
  return data;
}

export async function upsertHoliday(date: string, isHoliday: boolean) {
  const { data, error } = await supabase
    .from('holidays')
    .upsert([{ date, is_holiday: isHoliday }], { onConflict: 'date' })
    .select();
  if (error) throw error;
  return data;
}

export async function updateHoliday(date: string, updateObj: Partial<{ is_holiday: boolean }>) {
  const { data, error } = await supabase
    .from('holidays')
    .update(updateObj)
    .eq('date', date)
    .select();
  if (error) throw error;
  return data;
}

export async function getNationalHolidayDates() {
  const { data, error } = await supabase
    .from('holidays')
    .select('date')
    .eq('is_national_holiday', true);
  if (error) throw error;
  return data?.map((row: any) => row.date) || [];
}

export async function getHolidayNameByDate(date: string) {
  const { data, error } = await supabase
    .from('holidays')
    .select('holiday_name')
    .eq('date', date)
    .single();
  if (error) return null;
  return data?.holiday_name || null;
}

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
