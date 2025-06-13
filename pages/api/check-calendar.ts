import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: "認証されていません" });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // セッションからアクセストークンを設定
    auth.setCredentials({
      access_token: (session as any).access_token,
    });

    // ユーザー情報を取得
    const oauth2 = google.oauth2({ version: "v2", auth });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    // カレンダー一覧を取得
    const calendar = google.calendar({ version: "v3", auth });
    const calendarList = await calendar.calendarList.list();

    // レスポンスを整形
    const calendars = calendarList.data.items?.map(cal => ({
      name: cal.summary,
      id: cal.id,
      isPrimary: cal.primary || false,
    }));

    res.status(200).json({
      email,
      calendars,
    });
  } catch (error) {
    console.error("カレンダー情報の取得に失敗:", error);
    res.status(500).json({ error: "カレンダー情報の取得に失敗しました" });
  }
} 