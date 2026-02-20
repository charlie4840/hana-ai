import { Mic, MicOff, User, Headset } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useState, useEffect } from 'react';

interface Message {
  speaker: string;
  text: string;
  time: string;
  channel: 'voice' | 'chat';
}

interface RealtimeSTTProps {
  onTranscriptUpdate?: (messages: Message[]) => void;
}

export function RealtimeSTT({ onTranscriptUpdate }: RealtimeSTTProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<Message[]>([
    { speaker: '고객', text: '안녕하세요, 제주도 여행 패키지 상품 문의드립니다.', time: '14:23:15', channel: 'voice' },
    { speaker: '상담원', text: '안녕하세요. 고객님, 언제쯤 여행을 계획하고 계신가요?', time: '14:23:20', channel: 'voice' },
    { speaker: '고객', text: '다음 달 중순쯤 3박 4일로 가족 여행 계획 중입니다.', time: '14:23:28', channel: 'voice' },
    { speaker: '상담원', text: '가족 구성원이 몇 분이신가요? 그리고 선호하시는 숙소 유형이 있으신가요?', time: '14:23:32', channel: 'voice' },
    { speaker: '고객', text: '4명이고요, 호텔보다는 펜션이나 풀빌라를 선호합니다.', time: '14:23:38', channel: 'voice' },
    { speaker: '상담원', text: '제주 서귀포 쪽에 가족 단위로 인기 있는 풀빌라 패키지 상품이 있습니다. 안내해드릴까요?', time: '14:23:45', channel: 'voice' },
    { speaker: '고객', text: '네, 가격대가 궁금합니다. 그리고 렌터카는 포함되어 있나요?', time: '14:23:52', channel: 'voice' },
    { speaker: '상담원', text: '해당 상품은 1인 기준 32만 원대이고, 4분이시면 VIP 할인 적용 시 약 128만 원 정도입니다. 렌터카는 옵션으로 3박 기준 12만 원 추가입니다.', time: '14:24:00', channel: 'voice' },
    { speaker: '고객', text: '괜찮네요. 조식은 포함인가요?', time: '14:24:08', channel: 'voice' },
    { speaker: '상담원', text: '네, 첫날과 마지막 날 조식이 포함되어 있고, 중간 날은 자유식입니다. 풀빌라 내 바베큐 시설도 이용 가능하세요.', time: '14:24:15', channel: 'voice' },
    { speaker: '고객', text: '좋아요. 예약하려면 어떻게 하면 되나요?', time: '14:24:22', channel: 'voice' },
    { speaker: '상담원', text: '예약금 30만 원 입금 후 1영업일 내 확정 안내 드리겠습니다. 잔금은 출발 7일 전까지 입금해 주시면 됩니다.', time: '14:24:30', channel: 'voice' },
    { speaker: '고객', text: '알겠습니다. 여행자 보험도 가입하고 싶은데 가능할까요?', time: '14:24:38', channel: 'voice' },
    { speaker: '상담원', text: '네, 가족형 보험 4만 5천 원대로 신청 가능합니다. 예약 확정 후 함께 안내해 드릴게요.', time: '14:24:45', channel: 'voice' },
    { speaker: '고객', text: '그럼 그렇게 진행해 주세요. 감사합니다.', time: '14:24:52', channel: 'voice' },
    { speaker: '상담원', text: '감사합니다. 곧 예약 안내 문자 보내 드리겠습니다. 좋은 여행 되세요.', time: '14:24:58', channel: 'voice' },
  ]);

  useEffect(() => {
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);

  useEffect(() => {
    if (isRecording) {
      // 시뮬레이션: 8초마다 새 대화 추가
      const interval = setInterval(() => {
        const voiceMessages = [
          { speaker: '상담원', text: '가족 구성원이 몇 분이신가요? 그리고 선호하시는 숙소 유형이 있으신가요?', time: new Date().toLocaleTimeString('ko-KR', { hour12: false }), channel: 'voice' as const },
          { speaker: '고객', text: '4명이고요, 호텔보다는 펜션이나 풀빌라를 선호합니다.', time: new Date().toLocaleTimeString('ko-KR', { hour12: false }), channel: 'voice' as const },
          { speaker: '상담원', text: '제주 서귀포 쪽에 가족 단위로 인기 있는 풀빌라 패키지 상품이 있습니다. 안내해드릴까요?', time: new Date().toLocaleTimeString('ko-KR', { hour12: false }), channel: 'voice' as const },
          { speaker: '고객', text: '네, 가격대가 궁금합니다. 그리고 렌터카는 포함되어 있나요?', time: new Date().toLocaleTimeString('ko-KR', { hour12: false }), channel: 'voice' as const },
        ];
        
        const newMessage = voiceMessages[Math.floor(Math.random() * voiceMessages.length)];
        
        setTranscript(prev => [...prev, newMessage]);
      }, 8000);
      
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <Card className="p-0 h-full flex flex-col overflow-hidden">
      {/* 채팅방 헤더 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
            <Headset className="w-5 h-5 text-violet-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">실시간 STT</h3>
            <p className="text-xs text-gray-500">음성 인식 대화</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isRecording ? 'destructive' : 'default'}
          className="font-medium shrink-0"
          onClick={() => setIsRecording(!isRecording)}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4 mr-1.5" />
              녹음 중지
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-1.5" />
              녹음
            </>
          )}
        </Button>
      </div>

      {/* 채팅 메시지 영역 - 스크롤 가능 */}
      <div className="flex-1 min-h-0 flex flex-col bg-violet-50/50 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 h-0">
          <div className="px-3 py-4 space-y-4 pb-4">
            {transcript.map((item, index) => {
              const isCustomer = item.speaker === '고객';
              // 고객: 왼쪽, 상담원: 오른쪽
              const isRight = !isCustomer;
              return (
                <div
                  key={index}
                  className={`flex gap-2 max-w-[90%] ${isRight ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* 아바타 */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCustomer ? 'bg-violet-500' : 'bg-gray-600'
                    }`}
                  >
                    {isCustomer ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Headset className="w-4 h-4 text-white" />
                    )}
                  </div>
                  {/* 말풍선 + 시간 */}
                  <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-500 mb-0.5 px-1">
                      {item.speaker} · {item.time}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isCustomer
                          ? 'bg-violet-500 text-white rounded-tl-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tr-md'
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-keep whitespace-pre-wrap">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* 하단: 녹음 상태 바 */}
        {isRecording && (
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border-t flex-shrink-0">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-700">녹음 중</span>
          </div>
        )}
      </div>
    </Card>
  );
}
