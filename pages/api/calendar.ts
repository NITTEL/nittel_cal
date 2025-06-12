// /pages/api/calendar.ts
import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

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

function getBusinessHours(type: "onsite" | "online", date: Date) {
  const day = date.getDay().toString();
  const hours = BUSINESS_HOURS[type][day];
  if (!hours) return null;
  return hours;
}

function getDateRange(start: Date, end: Date) {
  const days = [];
  let d = new Date(start);
  d.setHours(0, 0, 0, 0);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

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

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 30); // 今後30日分
    endDate.setHours(23, 59, 59, 999);

    // 予定を全件取得
    const events = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });
    const items = events.data.items || [];

    // 在社予定（タイトルに「在社」含む）を抽出
    const onsitePeriods = items
      .filter(ev => ev.summary && ev.summary.includes("在社"))
      .map(ev => ({
        start: new Date(ev.start?.dateTime || ev.start?.date!),
        end: new Date(ev.end?.dateTime || ev.end?.date!),
      }));

    // 他の予定（タイトルに「在社」含まない）
    const busyEvents = items
      .filter(ev => !ev.summary || !ev.summary.includes("在社"))
      .map(ev => ({
        start: new Date(ev.start?.dateTime || ev.start?.date!),
        end: new Date(ev.end?.dateTime || ev.end?.date!),
      }));

    // 30分単位で今後30日分の枠を生成
    const onsiteSlots = [];
    const onlineSlots = [];
    let cursor = new Date(now);
    cursor.setMinutes(cursor.getMinutes() < 30 ? 0 : 30, 0, 0); // 30分単位に揃える
    while (cursor < endDate) {
      // 来社枠：在社期間内かつ営業時間内
      const isOnsitePeriod = onsitePeriods.some(p => cursor >= p.start && cursor < p.end);
      const onsiteHours = getBusinessHours("onsite", cursor);
      if (isOnsitePeriod && onsiteHours) {
        const hour = cursor.getHours() + cursor.getMinutes() / 60;
        if (hour >= onsiteHours.start && hour < onsiteHours.end) {
          // 他の予定が重なっていなければ枠追加
          const overlapping = busyEvents.some(ev => cursor < ev.end && new Date(cursor.getTime() + 30 * 60 * 1000) > ev.start);
          if (!overlapping) {
            onsiteSlots.push({
              start: cursor.toISOString(),
              end: new Date(cursor.getTime() + 30 * 60 * 1000).toISOString(),
            });
          }
        }
      }
      // オンライン枠：全営業日・営業時間内
      const onlineHours = getBusinessHours("online", cursor);
      if (onlineHours) {
        const hour = cursor.getHours() + cursor.getMinutes() / 60;
        if (hour >= onlineHours.start && hour < onlineHours.end) {
          // 他の予定が重なっていなければ枠追加
          const overlapping = busyEvents.some(ev => cursor < ev.end && new Date(cursor.getTime() + 30 * 60 * 1000) > ev.start);
          if (!overlapping) {
            onlineSlots.push({
              start: cursor.toISOString(),
              end: new Date(cursor.getTime() + 30 * 60 * 1000).toISOString(),
            });
          }
        }
      }
      // 次の30分へ
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
    }

    res.status(200).json({ onsiteSlots, onlineSlots });
  } catch (error: any) {
    console.error("Calendar API Error:", error);
    res.status(500).json({ 
      message: "Calendar fetch failed", 
      error: error?.message || "Unknown error" 
    });
  }
}
