import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";

interface TimeSlot {
  start: string;
  end: string;
}

function formatSlot(slot: any) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const youbi = ["日", "月", "火", "水", "木", "金", "土"][start.getDay()];
  return `${start.getMonth() + 1}/${start.getDate()}（${youbi}） ${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}〜${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // 日曜始まり
  return d;
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
  const { data: session } = useSession();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [meetingType, setMeetingType] = useState<"onsite" | "online" | null>(null);
  const [onsiteSlots, setOnsiteSlots] = useState<any[]>([]);
  const [onlineSlots, setOnlineSlots] = useState<any[]>([]);
  const [nowAvailable, setNowAvailable] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", detail: "" });
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetch("/api/calendar")
      .then(res => res.json())
      .then(data => {
        setOnsiteSlots(data.onsiteSlots || []);
        setOnlineSlots(data.onlineSlots || []);
        setNowAvailable(
          data.freeSlots?.length > 0 && new Date(data.freeSlots[0].start) <= new Date()
        );
      });
  }, []);

  // ステップ0：トップ
  if (step === 0) {
    // 今すぐ対応可能な枠（onsite/onlineどちらでもOK）があるか判定
    const allSlots = [...onsiteSlots, ...onlineSlots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const now = new Date();
    const nowSlot = allSlots.find(slot => new Date(slot.start) <= now && new Date(slot.end) > now);
    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>ニッテル空き時間確認</h1>
        <h2 style={{ marginTop: "2rem" }}>面談をご希望ですか？</h2>
        <p style={{ margin: "1rem 0", fontSize: "1.2rem" }}>
          {nowSlot ? (
            <span style={{ color: "#1976d2", fontWeight: "bold" }}>🔵 今すぐ面談可能です</span>
          ) : (
            <span style={{ color: "#d32f2f", fontWeight: "bold" }}>🔴 現在対応できません</span>
          )}
        </p>
        <div style={{ display: "flex", gap: 16 }}>
          {nowSlot && (
            <button
              style={{ padding: "1rem 2rem", fontSize: "1.1rem", borderRadius: 8, background: "#1976d2", color: "#fff", border: "none", fontWeight: "bold" }}
              onClick={() => {
                setSelectedSlot(nowSlot);
                setStep(3); // すぐ予約フォームへ
              }}
            >
              今すぐ面談
            </button>
          )}
          <button
            style={{ padding: "1rem 2rem", fontSize: "1.1rem", borderRadius: 8, background: "#43a047", color: "#fff", border: "none", fontWeight: "bold" }}
            onClick={() => setStep(1)}
          >
            面談を予約する
          </button>
        </div>
      </main>
    );
  }

  // ステップ1：面談方法選択
  if (step === 1) {
    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h2>ご希望の面談方法を選んでください：</h2>
        <label style={{ display: "block", margin: "1rem 0" }}>
          <input type="radio" name="type" value="onsite"
            checked={meetingType === "onsite"}
            onChange={() => setMeetingType("onsite")}
          /> 来社で面談（対面）
        </label>
        <label style={{ display: "block", margin: "1rem 0" }}>
          <input type="radio" name="type" value="online"
            checked={meetingType === "online"}
            onChange={() => setMeetingType("online")}
          /> オンラインで面談（Zoomなど）
        </label>
        <button disabled={!meetingType} onClick={() => setStep(2)}>つづける</button>
      </main>
    );
  }

  // ステップ2：日程選択
  if (step === 2) {
    // meetingTypeで枠を切り替え
    const slots = meetingType === "onsite" ? onsiteSlots : onlineSlots;
    const sortedSlots = [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    const top4 = sortedSlots.slice(0, 4);
    const rest = sortedSlots.slice(4);

    // カレンダー表用データ作成
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + weekOffset * 7); // 今日から
    const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
    const allHours = Array.from(new Set(days.flatMap(d => getDayHours(meetingType || "onsite", d)))).sort((a, b) => a - b);

    // 表の○×判定
    function findSlot(day: Date, hour: number) {
      const slotStart = new Date(day);
      slotStart.setHours(Math.floor(hour), hour % 1 === 0 ? 0 : 30, 0, 0);
      return slots.find(s => {
        const sStart = new Date(s.start);
        return sStart.getTime() === slotStart.getTime();
      });
    }

    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>【最短予約枠】</h2>
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {top4.length === 0 ? <span>予約可能な枠がありません</span> : top4.map((slot, i) => (
            <button
              key={i}
              onClick={() => { setSelectedSlot(slot); setStep(3); }}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.1rem",
                borderRadius: 8,
                border: "2px solid #1976d2",
                background: "#e3f2fd",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              {formatSlot(slot)}
            </button>
          ))}
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginTop: 32 }}>日時を選択</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr>
                <th></th>
                {days.map((d, i) => (
                  <th key={i} style={{ padding: 4, border: "1px solid #ccc", background: d.getDay() === 0 || d.getDay() === 6 ? "#f0f0f0" : "#fff" }}>
                    {`${d.getMonth() + 1}/${d.getDate()}（${["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}）`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allHours.map((h, i) => (
                <tr key={i}>
                  <td style={{ padding: 4, border: "1px solid #ccc", fontWeight: "bold", background: "#fafafa" }}>{`${Math.floor(h)}:${h % 1 === 0 ? "00" : "30"}`}</td>
                  {days.map((d, j) => {
                    const slot = findSlot(d, h);
                    return (
                      <td key={j} style={{ textAlign: "center", border: "1px solid #ccc", padding: 2 }}>
                        {slot ? (
                          <button
                            onClick={() => { setSelectedSlot(slot); setStep(3); }}
                            style={{ background: "#fff", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
                          >○</button>
                        ) : (
                          <span style={{ color: "#bbb", fontSize: "1.2rem" }}>×</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setWeekOffset(weekOffset + 1)}>次の一週間</button>
        </div>
      </main>
    );
  }

  // ステップ3：フォーム入力
  if (step === 3) {
    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h2>ご予約内容の入力</h2>
        <form onSubmit={e => { e.preventDefault(); alert("送信処理（仮）"); }}>
          <input placeholder="お名前" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ display: "block", margin: "1rem 0" }} />
          <input placeholder="メール" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={{ display: "block", margin: "1rem 0" }} />
          <textarea placeholder="ご要件" value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))} required style={{ display: "block", margin: "1rem 0" }} />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">予約確認</h2>
            <button
              onClick={() => {
                // 実際の予約処理を行う
                alert("予約を確定しました");
                setStep(0); // トップに戻る
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              予約を確定
            </button>
          </div>
        </form>
      </main>
    );
  }

  return null;
}
