// /pages/api/calendar.ts
import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";
import { toZonedTime } from 'date-fns-tz';
import { formatISO } from 'date-fns';

const timeZone = 'Asia/Hong_Kong';

// 香港時間の「今日の0時」から枠生成する
const nowLocal = new Date();
console.log('ローカルタイムの現在:', nowLocal.toISOString());
const base = toZonedTime(nowLocal, timeZone);
console.log('toZonedTimeで変換後:', base.toISOString());
base.setHours(0, 0, 0, 0);
console.log('setHours(0,0,0,0)後:', base.toISOString());
const endDate = new Date(base);
endDate.setDate(base.getDate() + 30);
endDate.setHours(23, 59, 59, 999);
console.log('endDate:', endDate.toISOString());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth });

    // 予定を全件取得
    const events = await calendar.events.list({
      calendarId: "primary",
      timeMin: base.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });
    const items = events.data.items || [];

    // 在社予定（タイトルに「在社」含む）
    const onsitePeriods = items
      .filter(ev => ev.summary && ev.summary.includes("在社"))
      .map(ev => {
        const start = new Date(ev.start?.dateTime || ev.start?.date || new Date());
        const end = new Date(ev.end?.dateTime || ev.end?.date || new Date());
        return { start, end };
      });
    // 他の予定（タイトルに「在社」含まない）
    const busyEvents = items
      .filter(ev => !ev.summary || !ev.summary.includes("在社"))
      .map(ev => {
        const start = new Date(ev.start?.dateTime || ev.start?.date || new Date());
        const end = new Date(ev.end?.dateTime || ev.end?.date || new Date());
        return { start, end };
      });

    const onsiteSlots = [];
    const onlineSlots = [];
    let cursor = new Date(base);
    while (cursor < endDate) {
      const zoned = toZonedTime(cursor, timeZone);
      const dow = zoned.getDay();
      const hour = zoned.getHours() + zoned.getMinutes() / 60;
      // 営業時間ロジック
      // 来社: 火～金 14-19時、土 10-13時
      let onsiteOK = false;
      if (dow >= 2 && dow <= 5 && hour >= 14 && hour < 19) onsiteOK = true;
      if (dow === 6 && hour >= 10 && hour < 13) onsiteOK = true;
      // オンライン: 火～金 14-19時、土 10-13時
      let onlineOK = false;
      if (dow >= 2 && dow <= 5 && hour >= 14 && hour < 19) onlineOK = true;
      if (dow === 6 && hour >= 10 && hour < 13) onlineOK = true;
      // 来社: 在社予定がある時間帯＋busyでない
      if (onsiteOK && onsitePeriods.some(p => cursor >= p.start && cursor < p.end)) {
        const overlapping = busyEvents.some(ev => cursor < ev.end && new Date(cursor.getTime() + 30 * 60 * 1000) > ev.start);
        if (!overlapping) {
          onsiteSlots.push({
            start: formatISO(cursor, { representation: 'complete' }),
            end: formatISO(new Date(cursor.getTime() + 30 * 60 * 1000), { representation: 'complete' })
          });
        }
      }
      // オンライン: busyでなければ在社予定は関係なし
      if (onlineOK) {
        const overlapping = busyEvents.some(ev => cursor < ev.end && new Date(cursor.getTime() + 30 * 60 * 1000) > ev.start);
        if (!overlapping) {
          onlineSlots.push({
            start: formatISO(cursor, { representation: 'complete' }),
            end: formatISO(new Date(cursor.getTime() + 30 * 60 * 1000), { representation: 'complete' })
          });
        }
      }
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
    }
    onsiteSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    onlineSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    res.status(200).json({ onsiteSlots, onlineSlots });
  } catch (error: unknown) {
    res.status(500).json({ message: "Calendar fetch failed", error: (error instanceof Error ? error.message : "Unknown error") });
  }
}
