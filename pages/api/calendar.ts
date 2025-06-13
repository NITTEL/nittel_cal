// /pages/api/calendar.ts
import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { formatISO } from 'date-fns';

// 営業時間定義
const BUSINESS_HOURS: {
  onsite: { [key: string]: { start: number; end: number } };
  online: { [key: string]: { start: number; end: number } };
} = {
  onsite: {
    "2": { start: 14, end: 19 }, // 火
    "3": { start: 14, end: 19 }, // 水
    "4": { start: 14, end: 19 }, // 木
    "5": { start: 14, end: 19 }, // 金
    "6": { start: 10, end: 13 }, // 土
  },
  online: {
    "2": { start: 14, end: 19 },
    "3": { start: 14, end: 19 },
    "4": { start: 14, end: 19 },
    "5": { start: 14, end: 19 },
    "6": { start: 10, end: 13 },
  },
};

const timeZone = 'Asia/Hong_Kong';

function getBusinessHours(type: "onsite" | "online", date: Date) {
  const day = date.getDay().toString();
  const hours = BUSINESS_HOURS[type][day];
  if (!hours) return null;
  return hours;
}

// 香港時間の「今日の0時」から枠生成する
const now = toZonedTime(new Date(), timeZone);
const base = toZonedTime(new Date(now), timeZone);
base.setHours(0, 0, 0, 0);

const endDate = toZonedTime(new Date(base), timeZone);
endDate.setDate(base.getDate() + 30);
endDate.setHours(23, 59, 59, 999);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: "v3", auth });

    // 予定を全件取得（タイムゾーンを明示的に指定）
    const events = await calendar.events.list({
      calendarId: "primary",
      timeMin: formatISO(base),
      timeMax: formatISO(endDate),
      timeZone: timeZone,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });

    console.log('API Response TimeZone:', events.data.timeZone);
    console.log('Server Base Time:', formatInTimeZone(base, timeZone, 'yyyy-MM-dd HH:mm:ss zzz'));
    console.log('Server End Time:', formatInTimeZone(endDate, timeZone, 'yyyy-MM-dd HH:mm:ss zzz'));

    const items = events.data.items || [];

    // 在社予定（タイトルに「在社」含む）を抽出
    const onsitePeriods = items
      .filter(ev => ev.summary && ev.summary.includes("在社"))
      .map(ev => {
        const startStr = ev.start && (ev.start.dateTime ?? ev.start.date) ? String(ev.start.dateTime ?? ev.start.date) : new Date().toISOString();
        const endStr = ev.end && (ev.end.dateTime ?? ev.end.date) ? String(ev.end.dateTime ?? ev.end.date) : new Date().toISOString();
        return {
          start: toZonedTime(new Date(startStr), timeZone),
          end: toZonedTime(new Date(endStr), timeZone),
        };
      });

    // 他の予定（タイトルに「在社」含まない）
    const busyEvents = items
      .filter(ev => !ev.summary || !ev.summary.includes("在社"))
      .map(ev => {
        const startStr = ev.start && (ev.start.dateTime ?? ev.start.date) ? String(ev.start.dateTime ?? ev.start.date) : new Date().toISOString();
        const endStr = ev.end && (ev.end.dateTime ?? ev.end.date) ? String(ev.end.dateTime ?? ev.end.date) : new Date().toISOString();
        return {
          start: toZonedTime(new Date(startStr), timeZone),
          end: toZonedTime(new Date(endStr), timeZone),
        };
      });

    // 30分単位で今後30日分の枠を生成
    const onsiteSlots = [];
    const onlineSlots = [];
    let cursor = toZonedTime(new Date(base), timeZone);
    cursor.setMinutes(cursor.getMinutes() < 30 ? 0 : 30, 0, 0);

    while (cursor < endDate) {
      const zonedCursor = toZonedTime(cursor, timeZone);
      const nowZoned = toZonedTime(new Date(), timeZone);

      if (zonedCursor.getTime() < nowZoned.getTime()) {
        cursor = toZonedTime(new Date(cursor.getTime() + 30 * 60 * 1000), timeZone);
        continue;
      }

      // 来社枠：在社期間内かつ営業時間内
      const isOnsitePeriod = onsitePeriods.some(p => zonedCursor >= p.start && zonedCursor < p.end);
      const onsiteHours = getBusinessHours("onsite", zonedCursor);
      if (isOnsitePeriod && onsiteHours) {
        const hour = zonedCursor.getHours() + zonedCursor.getMinutes() / 60;
        if (hour >= onsiteHours.start && hour < onsiteHours.end) {
          const overlapping = busyEvents.some(ev => zonedCursor < ev.end && toZonedTime(new Date(cursor.getTime() + 30 * 60 * 1000), timeZone) > ev.start);
          if (!overlapping) {
            const zonedEnd = toZonedTime(new Date(cursor.getTime() + 30 * 60 * 1000), timeZone);
            onsiteSlots.push({
              start: formatISO(zonedCursor, { representation: 'complete' }),
              end: formatISO(zonedEnd, { representation: 'complete' })
            });
          }
        }
      }

      // オンライン枠：全営業日・営業時間内
      const onlineHours = getBusinessHours("online", zonedCursor);
      if (onlineHours) {
        const hour = zonedCursor.getHours() + zonedCursor.getMinutes() / 60;
        if (hour >= onlineHours.start && hour < onlineHours.end) {
          const overlapping = busyEvents.some(ev => zonedCursor < ev.end && toZonedTime(new Date(cursor.getTime() + 30 * 60 * 1000), timeZone) > ev.start);
          if (!overlapping) {
            const zonedEnd = toZonedTime(new Date(cursor.getTime() + 30 * 60 * 1000), timeZone);
            onlineSlots.push({
              start: formatISO(zonedCursor, { representation: 'complete' }),
              end: formatISO(zonedEnd, { representation: 'complete' })
            });
          }
        }
      }

      // 次の30分へ
      cursor = toZonedTime(new Date(cursor.getTime() + 30 * 60 * 1000), timeZone);
    }

    // デバッグ用：最初の数個のスロットをログ出力
    console.log('First few onsite slots:', onsiteSlots.slice(0, 3));
    console.log('First few online slots:', onlineSlots.slice(0, 3));

    res.status(200).json({ onsiteSlots, onlineSlots });
  } catch (error: unknown) {
    console.error("Calendar API Error:", error);
    res.status(500).json({ 
      message: "Calendar fetch failed", 
      error: (error instanceof Error ? error.message : "Unknown error")
    });
  }
}
