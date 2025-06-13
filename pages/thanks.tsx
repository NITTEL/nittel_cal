import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ThanksPage() {
  const router = useRouter();
  const [meetingType, setMeetingType] = useState<string | null>(null);

  useEffect(() => {
    // 直前の予約方法をsessionStorageから取得（index.tsxで保存しておく想定）
    const type = sessionStorage.getItem('meetingType');
    setMeetingType(type);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">ご予約ありがとうございました！</h1>
        {meetingType === 'onsite' && (
          <>
            <p className="text-lg text-gray-700 mb-4">ご来社のご予約が完了しました。</p>
            <p className="text-base text-gray-600 mb-4">当日は下記住所までお越しください。</p>
            <div className="mb-4">
              <span className="font-semibold">〒123-4567 東京都サンプル区サンプル町1-2-3 サンプルビル5F</span>
            </div>
            <div className="mb-4">
              <Link href="https://example.com/company" target="_blank" className="text-blue-600 underline">会社案内ページはこちら</Link>
            </div>
            <div className="mb-6 flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-2">会社案内ページQRコード</span>
              <img src="/qr/company.png" alt="会社案内QR" className="w-32 h-32 mx-auto" />
            </div>
          </>
        )}
        {meetingType === 'online' && (
          <>
            <p className="text-lg text-gray-700 mb-4">オンライン面談のご予約が完了しました。</p>
            <p className="text-base text-gray-600 mb-6">ご登録いただいたメールアドレス宛にGoogle Meetの参加リンクをお送りします。<br />メールをご確認のうえ、当日お時間になりましたらご参加ください。</p>
          </>
        )}
        {!meetingType && (
          <p className="text-lg text-gray-700 mb-8">予約が完了しました。</p>
        )}
        <Link href="/">
          <span className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">トップページへ戻る</span>
        </Link>
      </div>
    </main>
  );
} 