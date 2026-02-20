import { Phone, PhoneOff, Pause, Play, Mic, Clock, PhoneForwarded, Layers, Settings, GraduationCap, HeartPulse, Coffee, Volume2, Utensils } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useState, useEffect } from 'react';

interface ControlBarProps {
  agentName?: string;
  onCallEnd?: () => void;
}

export function ControlBar({ agentName = '홍길동', onCallEnd }: ControlBarProps) {
  const [callStatus, setCallStatus] = useState<'active' | 'paused' | 'ended'>('active');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (callStatus === 'active') {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endCall = () => {
    setCallStatus('ended');
    if (onCallEnd) {
      onCallEnd();
    }
  };

  const togglePause = () => {
    setCallStatus(callStatus === 'active' ? 'paused' : 'active');
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 통화 상태 표시 */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${ 
              callStatus === 'active' ? 'bg-green-500 animate-pulse' : 
              callStatus === 'paused' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} />
            <div>
              <div className="text-sm font-medium">
                {callStatus === 'active' ? '통화 중' : 
                 callStatus === 'paused' ? '일시 정지' : 
                 '통화 종료'}
              </div>
              <div className="text-xs text-gray-500">
                통화 시간: {formatDuration(callDuration)}
              </div>
            </div>
            
            {/* 통화 컨트롤 버튼들 */}
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={togglePause}
                disabled={callStatus === 'ended'}
              >
                {callStatus === 'paused' ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={callStatus === 'ended'}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={endCall}
                disabled={callStatus === 'ended'}
              >
                <PhoneOff className="w-4 h-4 mr-1" />
                통화 종료
              </Button>
            </div>
          </div>

          {/* 중앙: 컨트롤 버튼들 */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <PhoneOff className="w-5 h-5 text-red-500" />
              <span className="text-xs">OFF</span>
            </Button>
            
            <Separator orientation="vertical" className="h-10" />
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Pause className="w-5 h-5 text-orange-500" />
              <span className="text-xs">대기</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Mic className="w-5 h-5 text-violet-500" />
              <span className="text-xs">녹음</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-xs">보류확인</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <PhoneForwarded className="w-5 h-5 text-green-500" />
              <span className="text-xs">호전환</span>
            </Button>
            
            <Separator orientation="vertical" className="h-10" />
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Phone className="w-5 h-5 text-violet-500" />
              <span className="text-xs">통화</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span className="text-xs">관리</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="text-xs">교육</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Utensils className="w-5 h-5 text-violet-400" />
              <span className="text-xs">식사</span>
            </Button>
            
            <Button variant="outline" size="sm" className="flex flex-col items-center h-auto py-2 px-3 gap-1">
              <Coffee className="w-5 h-5 text-amber-500" />
              <span className="text-xs">휴식</span>
            </Button>
          </div>

          {/* 오른쪽: 상담원 정보 + 날짜/시간 */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-violet-50 border border-violet-200 rounded text-sm font-medium text-violet-700">
              {agentName}
            </div>
            <div className="text-sm text-gray-600">
              2026-02-19 14:23
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}