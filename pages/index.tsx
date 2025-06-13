import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/router';

interface TimeSlot {
  start: string;
  end: string;
}

function formatSlot(slot: TimeSlot) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][start.getDay()];
  return `${start.getMonth() + 1}/${start.getDate()}（${youbi}） ${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}〜${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

function getDayHours(meetingType: string, day: Date) {
  // meetingType: "onsite" or "online"
  // 営業時間ロジックをAPIと揃える
  const dow = day.getDay();
  if (meetingType === "onsite") {
    // 火～金 14-19時、土 10-13時
    if (dow >= 2 && dow <= 5) return [14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5];
    if (dow === 6) return [10, 10.5, 11, 11.5, 12, 12.5];
    return [];
  } else {
    // オンラインは火～金 14-19時、土 10-13時（例として同じ）
    if (dow >= 2 && dow <= 5) return [14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5];
    if (dow === 6) return [10, 10.5, 11, 11.5, 12, 12.5];
    return [];
  }
}

export default function ReservationFlow() {
  const router = useRouter();
  useSession();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [meetingType, setMeetingType] = useState<"onsite" | "online" | null>(null);
  const [onsiteSlots, setOnsiteSlots] = useState<TimeSlot[]>([]);
  const [onlineSlots, setOnlineSlots] = useState<TimeSlot[]>([]);
  const [form, setForm] = useState({ name: "", email: "", detail: "" });
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/calendar")
      .then(res => res.json())
      .then(data => {
        setOnsiteSlots(data.onsiteSlots || []);
        setOnlineSlots(data.onlineSlots || []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // ステップ0：トップ
  if (step === 0) {
    const allSlots = [...onsiteSlots, ...onlineSlots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const now = new Date();
    const nowSlot = allSlots.find(slot => new Date(slot.start) <= now && new Date(slot.end) > now);

    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-2">
              <span role="img" aria-label="calendar">📅</span> 面談予約ページ
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              ご来店ありがとうございます！<br />
            </p>
          </div>
          <div className="flex flex-col gap-8">
            {isLoading ? (
              <div className="bg-white rounded-2xl shadow-xl p-7 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-center">
                  現在の空き状況を確認中です...
                </p>
              </div>
            ) : (
              <>
                {/* 今すぐ案内カード */}
                {nowSlot ? (
                  <div className="bg-white rounded-2xl shadow-xl p-7 flex flex-col items-center transition-all duration-200 hover:shadow-2xl">
                    <span className="text-3xl mb-2">✅</span>
                    <h2 className="text-lg font-bold mb-1">現在、担当者がオンライン対応可能です。</h2>
                    <p className="text-gray-600 mb-5 text-center text-sm">
                      このままご案内を開始できます。
                    </p>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('fromReservation', 'true');
                        router.push('/guide');
                      }}
                      className="w-full max-w-[220px] py-2.5 rounded-lg font-bold transition-colors text-base shadow-md bg-green-600 text-white hover:bg-green-700"
                    >
                      今すぐ案内を開始する
                    </button>
                    <p className="text-xs text-gray-500 mt-4">
                      ※このボタンが表示されている場合、担当者の予定に空きがあり、すぐにご案内が可能です。
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-xl p-7 flex flex-col items-center">
                    <span className="text-3xl mb-2">⏰</span>
                    <h2 className="text-lg font-bold mb-1">現在の状況</h2>
                    <p className="text-gray-600 mb-5 text-center text-sm">
                      現在、営業時間外もしくは担当者は対応中です。<br />
                      ご希望の日時でご予約いただけます。
                    </p>
                  </div>
                )}
                {/* 後日予約カード */}
                <div className="bg-white rounded-2xl shadow-xl p-7 flex flex-col items-center transition-all duration-200 hover:shadow-2xl">
                  <span className="text-3xl mb-2">📅</span>
                  <h2 className="text-lg font-bold mb-1">後日面談を予約</h2>
                  <p className="text-gray-600 mb-5 text-center text-sm">ご希望の日程で来店またはオンライン面談を予約</p>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full max-w-[220px] bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors text-base shadow-md"
                  >
                    予約を開始する
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ステップ1：面談方法選択
  if (step === 1) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              面談方法を選択
            </h1>
            <p className="text-xl text-gray-600">
              ご希望の面談方法をお選びください
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 来社面談カード */}
            <div 
              className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 ${
                meetingType === "onsite" ? 'ring-2 ring-blue-500' : 'hover:shadow-xl'
              }`}
              onClick={() => setMeetingType("onsite")}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  🏢
                </div>
                <h2 className="text-2xl font-bold ml-4">対面で面談</h2>
              </div>
              <p className="text-gray-600 mb-6">
                オフィスに来ていただき、対面で面談を行います。
                <br />
                より詳しいご相談が可能です。
              </p>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="onsite"
                  checked={meetingType === "onsite"}
                  onChange={() => setMeetingType("onsite")}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">選択する</span>
              </div>
            </div>

            {/* オンライン面談カード */}
            <div 
              className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 ${
                meetingType === "online" ? 'ring-2 ring-blue-500' : 'hover:shadow-xl'
              }`}
              onClick={() => setMeetingType("online")}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  💻
                </div>
                <h2 className="text-2xl font-bold ml-4">オンライン面談</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Google Meetを使用してオンラインで面談を行います。
                <br />
                ご自宅やオフィスからご参加いただけます。
              </p>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="online"
                  checked={meetingType === "online"}
                  onChange={() => setMeetingType("online")}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">選択する</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              disabled={!meetingType}
              onClick={() => setStep(2)}
              className={`px-8 py-3 rounded-lg font-bold text-white transition-colors ${
                meetingType
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              次へ進む
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ステップ2：日程選択
  if (step === 2) {
    const slots = meetingType === "onsite" ? onsiteSlots : onlineSlots;
    const sortedSlots = [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const top4 = sortedSlots.slice(0, 4);

    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + weekOffset * 7);
    const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
    const allHours = Array.from(new Set(days.flatMap(d => getDayHours(meetingType || "onsite", d)))).sort((a, b) => a - b);

    function findSlot(day: Date, hour: number) {
      const slotStart = new Date(day);
      slotStart.setHours(Math.floor(hour), hour % 1 === 0 ? 0 : 30, 0, 0);
      return slots.find(s => {
        const sStart = new Date(s.start);
        return sStart.getTime() === slotStart.getTime();
      });
    }

    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              面談日時を選択
            </h1>
            <p className="text-xl text-gray-600">
              {meetingType === "onsite" ? "来社" : "オンライン"}での面談日時をお選びください
            </p>
          </div>

          {/* 最短予約枠 */}
          {top4.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">【最短予約枠】</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {top4.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(3)}
                    className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border-2 border-blue-500"
                  >
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">
                        {new Date(slot.start).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {new Date(slot.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-gray-400"> 〜 </span>
                        {new Date(slot.end).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* カレンダー */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">日時を選択</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 bg-gray-50 border border-gray-200"></th>
                    {days.map((d, i) => (
                      <th
                        key={i}
                        className={`p-2 border border-gray-200 ${
                          d.getDay() === 0 || d.getDay() === 6 ? 'bg-red-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-bold">
                          {d.getMonth() + 1}/{d.getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allHours.map((h, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-gray-200 bg-gray-50 font-bold text-sm">
                        {`${Math.floor(h)}:${h % 1 === 0 ? "00" : "30"}`}
                      </td>
                      {days.map((d, j) => {
                        const slot = findSlot(d, h);
                        return (
                          <td
                            key={j}
                            className="p-2 border border-gray-200 text-center"
                          >
                            {slot ? (
                              <button
                                onClick={() => setStep(3)}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                              >
                                ○
                              </button>
                            ) : (
                              <span className="text-gray-300">×</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                次の一週間を見る
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ステップ3：フォーム入力
  if (step === 3) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ご予約内容の入力
            </h1>
            <p className="text-xl text-gray-600">
              以下の情報をご入力ください
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={e => { e.preventDefault(); alert("送信処理（仮）"); }}>
              <div className="space-y-6">
                {/* お名前 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="山田 太郎"
                  />
                </div>

                {/* メールアドレス */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="example@email.com"
                  />
                </div>

                {/* ご要件 */}
                <div>
                  <label htmlFor="detail" className="block text-sm font-medium text-gray-700 mb-2">
                    ご要件 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="detail"
                    value={form.detail}
                    onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ご相談内容やご質問など、お気軽にご記入ください"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  ← 戻る
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  予約を確定する
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
