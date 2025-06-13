import { google } from "googleapis";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { start, end, name, email, detail, meetingType } = req.body;

    if (!start || !end || !name || !email || !detail || !meetingType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: `${meetingType === 'onsite' ? '来社' : 'オンライン'}面談: ${name}`,
      description: `予約者: ${name}\nメール: ${email}\n\nご要件:\n${detail}`,
      start: {
        dateTime: start,
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: end,
        timeZone: 'Asia/Tokyo',
      },
      attendees: [
        { email: email },
        { email: process.env.CALENDAR_EMAIL }, // 担当者のメールアドレス
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1日前
          { method: 'popup', minutes: 30 }, // 30分前
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID,
      requestBody: event,
      sendUpdates: 'all', // 参加者にメール通知を送信
    });

    res.status(200).json({ event: response.data });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
} 