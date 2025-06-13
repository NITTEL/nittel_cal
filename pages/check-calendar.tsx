import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Calendar {
  name: string;
  id: string;
  isPrimary: boolean;
}

export default function CheckCalendar() {
  const { data: session } = useSession();
  const [calendarInfo, setCalendarInfo] = useState<{
    email: string;
    calendars: Calendar[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetch("/api/check-calendar")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setCalendarInfo(data);
          }
        })
        .catch((err) => {
          setError("カレンダー情報の取得に失敗しました");
          console.error(err);
        });
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">カレンダー情報を表示するにはログインが必要です</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!calendarInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">読み込み中...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Googleカレンダー情報</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">接続中のアカウント</h2>
          <p className="text-gray-700">{calendarInfo.email}</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">利用可能なカレンダー</h2>
          <div className="space-y-4">
            {calendarInfo.calendars.map((calendar) => (
              <div
                key={calendar.id}
                className={`p-4 rounded-lg border ${
                  calendar.isPrimary ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{calendar.name}</h3>
                    <p className="text-sm text-gray-600">{calendar.id}</p>
                  </div>
                  {calendar.isPrimary && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full">
                      メイン
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 