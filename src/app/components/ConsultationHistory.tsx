import { useState, useEffect } from 'react';
import { Clock, MessageSquare, Phone, Mail, Bot, User, FileText, PanelBottomClose, Maximize2, X } from 'lucide-react';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface HistoryItem {
  id: string;
  date: string;
  channel: '전화' | '채팅' | '이메일' | '챗봇';
  type: string;
  summary: string;
  status: '완료' | '진행중' | '보류';
  agent?: string;
}

// 상세 내용용 목 데이터 (실제로는 API에서 id별로 조회)
const detailById: Record<string, { duration?: string; result?: string; memo?: string }> = {
  'CS-2024-001': { duration: '약 12분', result: '견적서 발송 및 후속 연락 예정', memo: 'VIP 고객, 3월 중순 희망' },
  'CS-2024-002': { duration: '약 8분', result: '예약 가능 안내 및 링크 전달', memo: '' },
  'CS-2024-003': { duration: '약 15분', result: '일정 변경 완료, 항공권 재발권 처리', memo: '' },
  'CS-2024-004': { duration: '챗봇 자동 응답', result: 'FAQ 안내 완료', memo: '' },
  'CS-2024-005': { duration: '약 25분', result: '보상 처리 및 사과, 쿠폰 발급', memo: '에스컬레이션 후 해결' },
  'CS-2023-006': { duration: '약 10분', result: '취소 및 환불 접수 완료', memo: '' },
  'CS-2023-007': { duration: '약 7분', result: '마일리지 내역 메일 발송', memo: '' },
  'CS-2023-008': { duration: '챗봇 자동 응답', result: '상품 페이지 링크 제공', memo: '' },
  'CS-2023-009': { duration: '약 18분', result: '예약 진행 및 계약서 발송', memo: '' },
  'CS-2023-010': { duration: '약 9분', result: '보험 상품 3종 비교 안내', memo: '' },
};

export function ConsultationHistory() {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [historyMinimized, setHistoryMinimized] = useState(false);

  useEffect(() => {
    if (!detailOpen) setHistoryMinimized(false);
  }, [detailOpen]);

  const history: HistoryItem[] = [
    {
      id: 'CS-2024-001',
      date: '2024-02-15 14:30',
      channel: '전화',
      type: '여행 상담',
      summary: '제주도 3박4일 가족 여행 패키지 문의 및 견적 안내',
      status: '완료',
      agent: '홍길동'
    },
    {
      id: 'CS-2024-002',
      date: '2024-02-10 16:20',
      channel: '채팅',
      type: '예약 문의',
      summary: '제주 렌터카 예약 가능 여부 확인',
      status: '완료',
      agent: '김상담'
    },
    {
      id: 'CS-2024-003',
      date: '2024-01-20 10:20',
      channel: '이메일',
      type: '예약 변경',
      summary: '오사카 여행 일정 변경 및 항공권 재발권 요청',
      status: '완료',
      agent: '이상담'
    },
    {
      id: 'CS-2024-004',
      date: '2024-01-15 09:45',
      channel: '챗봇',
      type: '일반 문의',
      summary: '여권 유효기간 및 비자 발급 절차 안내',
      status: '완료'
    },
    {
      id: 'CS-2024-005',
      date: '2023-12-28 11:30',
      channel: '전화',
      type: '불만 처리',
      summary: '항공권 예약 오류로 인한 불편사항 접수 및 보상 처리',
      status: '완료',
      agent: '박상담'
    },
    {
      id: 'CS-2023-006',
      date: '2023-12-10 16:45',
      channel: '채팅',
      type: '취소 요청',
      summary: '방콕 여행 상품 취소 및 환불 처리',
      status: '완료',
      agent: '홍길동'
    },
    {
      id: 'CS-2023-007',
      date: '2023-11-22 14:15',
      channel: '이메일',
      type: '마일리지 문의',
      summary: '마일리지 적립 내역 확인 및 사용 방법 안내',
      status: '완료',
      agent: '김상담'
    },
    {
      id: 'CS-2023-008',
      date: '2023-10-05 19:30',
      channel: '챗봇',
      type: '상품 문의',
      summary: '제주도 패키지 상품 가격 및 일정 정보 제공',
      status: '완료'
    },
    {
      id: 'CS-2023-009',
      date: '2023-08-15 11:15',
      channel: '전화',
      type: '여행 상담',
      summary: '유럽 패키지 투어 상담 및 예약 진행',
      status: '완료',
      agent: '이상담'
    },
    {
      id: 'CS-2023-010',
      date: '2023-07-20 15:40',
      channel: '채팅',
      type: '보험 문의',
      summary: '해외여행자 보험 가입 상담 및 추천',
      status: '완료',
      agent: '박상담'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료':
        return 'bg-green-100 text-green-800';
      case '진행중':
        return 'bg-violet-100 text-violet-800';
      case '보류':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case '전화':
        return <Phone className="w-5 h-5 text-violet-600" />;
      case '채팅':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case '이메일':
        return <Mail className="w-5 h-5 text-purple-600" />;
      case '챗봇':
        return <Bot className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case '전화':
        return 'bg-violet-100 border-violet-300';
      case '채팅':
        return 'bg-green-100 border-green-300';
      case '이메일':
        return 'bg-purple-100 border-purple-300';
      case '챗봇':
        return 'bg-orange-100 border-orange-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case '전화':
        return 'bg-violet-500 text-white';
      case '채팅':
        return 'bg-green-500 text-white';
      case '이메일':
        return 'bg-purple-500 text-white';
      case '챗봇':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="p-4 h-full flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-semibold">상담 이력</h3>
        <Badge variant="secondary" className="ml-auto">{history.length}건</Badge>
      </div>
      
      <ScrollArea className="flex-1 min-h-0 h-0 pr-2">
        <div className="relative pb-4">
          {/* 타임라인 세로선 */}
          <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gray-200" />
          
          <div className="space-y-6 pb-4">
            {history.map((item, index) => (
              <div key={item.id} className="relative pl-12">
                {/* 타임라인 도트 */}
                <div className={`absolute left-0 top-1 w-10 h-10 rounded-full ${getChannelColor(item.channel)} border-4 border-white shadow-md flex items-center justify-center`}>
                  {getChannelIcon(item.channel)}
                </div>
                
                {/* 내용 카드 */}
                <div
                  role="button"
                  tabIndex={0}
                  className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item);
                    setDetailOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedItem(item);
                      setDetailOpen(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`${getChannelBadgeColor(item.channel)} text-xs`}>
                          {item.channel}
                        </Badge>
                        <h4 className="font-medium text-sm">{item.type}</h4>
                        <Badge className={getStatusColor(item.status)} variant="secondary">
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.summary}</p>
                      {item.agent && (
                        <p className="text-xs text-gray-500">상담원: {item.agent}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item.id}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* 상담 이력 상세 - 축소 시 플로팅 패널 */}
      {detailOpen && historyMinimized && selectedItem && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[300px] rounded-lg border bg-white shadow-xl flex flex-col"
          aria-label="상담 이력 상세 (축소)"
        >
          <div className="flex items-center gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
            {getChannelIcon(selectedItem.channel)}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">상담 이력 상세</p>
              <p className="text-xs text-gray-500 truncate">{selectedItem.id} · {selectedItem.type}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoryMinimized(false)} title="화면 확대">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailOpen(false)} title="닫기">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <button type="button" className="p-3 text-xs text-gray-600 text-left hover:bg-gray-50 rounded-b-lg" onClick={() => setHistoryMinimized(false)}>
            클릭하여 다시 크게 보기
          </button>
        </div>
      )}

      {/* 상담 이력 상세 팝업 */}
      <Dialog open={detailOpen && !historyMinimized} onOpenChange={setDetailOpen}>
        <DialogContent className="history-detail-dialog sm:max-w-lg" aria-describedby="history-detail-description">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getChannelIcon(selectedItem.channel)}
                  <span>상담 이력 상세</span>
                  <Badge className={getChannelBadgeColor(selectedItem.channel)}>
                    {selectedItem.channel}
                  </Badge>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setHistoryMinimized(true)} title="화면 축소">
                      <PanelBottomClose className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDetailOpen(false)} title="닫기">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div id="history-detail-description" className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">상담번호</span>
                    <p className="font-medium mt-0.5">{selectedItem.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">상담일시</span>
                    <p className="font-medium mt-0.5">{selectedItem.date}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">유형</span>
                    <p className="font-medium mt-0.5">{selectedItem.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">상태</span>
                    <p className="mt-0.5">
                      <Badge className={getStatusColor(selectedItem.status)} variant="secondary">
                        {selectedItem.status}
                      </Badge>
                    </p>
                  </div>
                  {selectedItem.agent && (
                    <div className="col-span-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500">상담원</span>
                      <span className="font-medium">{selectedItem.agent}</span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 text-sm">요약</span>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md border">
                    {selectedItem.summary}
                  </p>
                </div>
                {detailById[selectedItem.id] && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      <FileText className="w-4 h-4" />
                      상세 내용
                    </div>
                    <dl className="space-y-2 text-sm">
                      {detailById[selectedItem.id].duration && (
                        <div>
                          <dt className="text-gray-500">상담 소요 시간</dt>
                          <dd className="font-medium mt-0.5">{detailById[selectedItem.id].duration}</dd>
                        </div>
                      )}
                      {detailById[selectedItem.id].result && (
                        <div>
                          <dt className="text-gray-500">처리 결과</dt>
                          <dd className="mt-0.5">{detailById[selectedItem.id].result}</dd>
                        </div>
                      )}
                      {detailById[selectedItem.id].memo && (
                        <div>
                          <dt className="text-gray-500">비고</dt>
                          <dd className="mt-0.5">{detailById[selectedItem.id].memo}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}