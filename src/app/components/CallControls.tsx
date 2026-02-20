import { Phone, PhoneOff, Pause, Play, Volume2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

interface CallControlsProps {
  onCallEnd?: () => void;
}

export function CallControls({ onCallEnd }: CallControlsProps) {
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
    <Card className="p-4">
      <div className="flex items-center justify-between">
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
        </div>
        
        <div className="flex gap-2">
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
    </Card>
  );
}