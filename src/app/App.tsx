import { CustomerInfo } from './components/CustomerInfo';
import { RealtimeSTT } from './components/RealtimeSTT';
import { ConsultationHistory } from './components/ConsultationHistory';
import { RecommendationPanel } from './components/RecommendationPanel';
import { ConsultationNotes } from './components/ConsultationNotes';
import { CustomerDetailDialog } from './components/CustomerDetailDialog';
import { ControlBar } from './components/ControlBar';
import { Toaster } from './components/ui/sonner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';
import { Plane, LogOut } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Message {
  speaker: string;
  text: string;
  time: string;
  channel: 'voice' | 'chat';
}

export default function App() {
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [autoSummary, setAutoSummary] = useState<{
    keyIssue: string;
    result: string;
    emotion: string;
  } | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

  // 목 데이터
  const customerData = {
    name: '김민수',
    id: 'CUST-2024-1234',
    phone: '010-1234-5678',
    email: 'minsu.kim@email.com',
    address: '서울시 강남구 테헤란로 123',
    grade: 'VIP',
    joinDate: '2022-03-15'
  };

  const handleCallEnd = () => {
    // 상담 종료 시 자동 요약 생성 (AI 시뮬레이션)
    toast.info('상담 내용을 분석하고 있습니다...');
    
    setTimeout(() => {
      const summary = {
        keyIssue: '제주도 3박 4일 가족 여행 상품 문의\n- 여행 인원: 4명 (가족 단위)\n- 여행 시기: 3월 중순\n- 선호 숙소: 풀빌라/펜션\n- 추가 요청: 렌터카 포함 여부, 여행자 보험 신청',
        result: '제주 서귀포 풀빌라 3박4일 패키지 상품 안내 완료\n- 상품 가격: 1,280,000원 (VIP 20% 할인 적용)\n- 렌터카 포함 패키지 추천\n- 여행자 보험 가족형 상품 안내\n- 예약 진행 중 (고객 검토 후 재연락 예정)',
        emotion: '긍정적 / 만족 (85%)'
      };
      
      setAutoSummary(summary);
      toast.success('상담 내용이 자동으로 요약되었습니다.');
    }, 2000);
  };

  const handleTranscriptUpdate = (messages: Message[]) => {
    setTranscript(messages);
  };

  const handleLogout = () => {
    toast.info('로그아웃 되었습니다.');
    // 실제로는 여기에 로그아웃 로직 추가
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster />
      
      {/* 헤더 */}
      <header className="bg-violet-700 text-white p-4 shadow-md flex-shrink-0">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plane className="w-6 h-6" />
            <h1 className="text-xl font-semibold">하나투어 여행 상담 시스템</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 컨트롤 바 */}
      <ControlBar agentName="홍길동" onCallEnd={handleCallEnd} />

      {/* 메인 콘텐츠 - 모든 영역 사이즈 조절 가능 */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full p-4 flex flex-col min-h-0">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 gap-1">
          {/* 왼쪽 컬럼: 고객 정보 / 상담 이력 (세로 분할) */}
          <ResizablePanel defaultSize={25} minSize={15} className="min-w-0">
            <ResizablePanelGroup direction="vertical" className="h-full gap-1">
              <ResizablePanel defaultSize={35} minSize={20} className="min-h-0">
                <div className="h-full overflow-auto">
                  <CustomerInfo
                    customer={customerData}
                    onClick={() => setIsCustomerDialogOpen(true)}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-gray-200" />
              <ResizablePanel defaultSize={65} minSize={30} className="min-h-0">
                <div className="h-full overflow-hidden">
                  <ConsultationHistory />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-gray-200" />

          {/* 중앙 컬럼: 실시간 STT / 상담 메모 (세로 분할) */}
          <ResizablePanel defaultSize={50} minSize={25} className="min-w-0">
            <ResizablePanelGroup direction="vertical" className="h-full gap-1">
              <ResizablePanel defaultSize={60} minSize={30} className="min-h-0">
                <div className="h-full overflow-hidden">
                  <RealtimeSTT onTranscriptUpdate={handleTranscriptUpdate} />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-gray-200" />
              <ResizablePanel defaultSize={40} minSize={20} className="min-h-0">
                <div className="h-full overflow-hidden">
                  <ConsultationNotes />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-gray-200" />

          {/* 오른쪽 컬럼: 추천 정보 */}
          <ResizablePanel defaultSize={25} minSize={15} className="min-w-0">
            <div className="h-full overflow-hidden">
              <RecommendationPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* 고객 상세 정보 팝업 */}
      <CustomerDetailDialog 
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        customer={customerData}
      />
    </div>
  );
}