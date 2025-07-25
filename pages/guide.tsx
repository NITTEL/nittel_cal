import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function GuidePage() {
  const router = useRouter();

  // 直接アクセスされた場合はトップページにリダイレクト
  useEffect(() => {
    if (!router.isReady) return;
    if (!sessionStorage.getItem('fromReservation')) {
      router.push('/');
    }
  }, [router.isReady]);

  const handleMeetConnect = () => {
    window.open('https://meet.google.com/cki-ppib-yue', '_blank');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* タイトル */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12">
            ご案内の準備ができました
          </h1>

          {/* 説明文 */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              このあと、Google Meet のルームにご案内します。
              <br />
              スタッフは準備ができ次第、同じルームに入室して対応いたしますので、
              <br />
              先にルームに入ってお待ちください。
            </p>
          </div>

          {/* 接続ボタン */}
          <div className="flex justify-center">
            <button
              onClick={handleMeetConnect}
              className="group relative w-full max-w-md md:max-w-lg py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-center gap-3">
                {/* Google Meet アイコン */}
                <svg 
                  className="w-7 h-7" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm6.066 9.645c.183 4.04-2.83 8.544-8.164 8.544-1.622 0-3.131-.476-4.402-1.291 1.524.18 3.045-.244 4.252-1.189-1.256-.023-2.317-.854-2.684-1.995.451.086.895.061 1.298-.049-1.381-.278-2.335-1.522-2.304-2.853.388.215.83.344 1.301.359-1.279-.855-1.641-2.544-.889-3.835 1.416 1.738 3.533 2.881 5.92 3.001-.419-1.796.944-3.527 2.799-3.527.825 0 1.572.349 2.096.863.654-.128 1.27-.368 1.824-.697-.215.671-.67 1.233-1.263 1.589.581-.07 1.135-.224 1.649-.453-.384.578-.87 1.084-1.433 1.489z"/>
                </svg>
                <span>Google Meet に入室する</span>
              </div>
              {/* ホバー時のエフェクト */}
              <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 