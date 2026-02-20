import { FileText, Save, Search, Calendar } from 'lucide-react';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function ConsultationNotes() {
  const [notes, setNotes] = useState(`1. 승공동 OR 상트르드 : 승공동 코드 테스트
2. 예약번호 : 예약번호 테스트
3. 상담내용 : 상담내용 테스트`);
  const [subCategory, setSubCategory] = useState('');
  const [consultationType1, setConsultationType1] = useState('테마여행');
  const [consultationType2, setConsultationType2] = useState('성지순례');
  const [consultationType3, setConsultationType3] = useState('예약확인');
  const [historyType1, setHistoryType1] = useState('개인');
  const [historyType2, setHistoryType2] = useState('NA');
  const [historyType3, setHistoryType3] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [reservationName, setReservationName] = useState('');
  const [reservationPhone, setReservationPhone] = useState('');
  const [callResult, setCallResult] = useState('');
  const [isReservationChecked, setIsReservationChecked] = useState(false);

  const handleSave = () => {
    toast.success('상담 내용이 저장되었습니다.');
  };

  const handleReset = () => {
    setSubCategory('');
    setConsultationType1('');
    setConsultationType2('');
    setConsultationType3('');
    setHistoryType1('');
    setHistoryType2('');
    setHistoryType3('');
    setNotes('');
    setReservationDate('');
    setReservationName('');
    setReservationPhone('');
    setCallResult('');
    setIsReservationChecked(false);
    toast.success('초기화되었습니다.');
  };

  const handleInstantSave = () => {
    toast.success('쪽지보내기 처리되었습니다.');
  };

  const handleTemporarySave = () => {
    toast.success('저장대기 처리되었습니다.');
  };

  const handleComplete = () => {
    toast.success('임시지장 처리되었습니다.');
  };

  return (
    <Card className="p-4 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <FileText className="w-5 h-5" />
        <h3 className="font-semibold">상담 메모</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {/* 소분류 검색 */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
          <label className="text-sm font-medium bg-gray-100 p-2 rounded border">소분류 검색</label>
          <div className="flex gap-2">
            <Input
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="flex-1"
            />
            <Button variant="default" size="sm" className="px-4 bg-slate-700 hover:bg-slate-800">
              <Search className="w-4 h-4 mr-1" />
              조회
            </Button>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="== 선택 ==" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">선택1</SelectItem>
                <SelectItem value="option2">선택2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 상담 유형 */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
          <label className="text-sm font-medium bg-gray-100 p-2 rounded border">상담 유형</label>
          <div className="flex gap-2">
            <Select value={consultationType1} onValueChange={setConsultationType1}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="테마여행">테마여행</SelectItem>
                <SelectItem value="패키지여행">패키지여행</SelectItem>
                <SelectItem value="자유여행">자유여행</SelectItem>
              </SelectContent>
            </Select>
            <Select value={consultationType2} onValueChange={setConsultationType2}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="성지순례">성지순례</SelectItem>
                <SelectItem value="골프투어">골프투어</SelectItem>
                <SelectItem value="크루즈여행">크루즈여행</SelectItem>
              </SelectContent>
            </Select>
            <Select value={consultationType3} onValueChange={setConsultationType3}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="예약확인">예약확인</SelectItem>
                <SelectItem value="일정변경">일정변경</SelectItem>
                <SelectItem value="취소문의">취소문의</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 이력 유형 */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
          <label className="text-sm font-medium bg-gray-100 p-2 rounded border">이력 유형</label>
          <div className="flex gap-2">
            <Select value={historyType1} onValueChange={setHistoryType1}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="개인">개인</SelectItem>
                <SelectItem value="단체">단체</SelectItem>
                <SelectItem value="기업">기업</SelectItem>
              </SelectContent>
            </Select>
            <Select value={historyType2} onValueChange={setHistoryType2}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">NA</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="일반">일반</SelectItem>
              </SelectContent>
            </Select>
            <Select value={historyType3} onValueChange={setHistoryType3}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="== 선택 ==" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">선택1</SelectItem>
                <SelectItem value="option2">선택2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 상담 내용 */}
        <div className="grid grid-cols-[100px_1fr] gap-2">
          <label className="text-sm font-medium bg-gray-100 p-2 rounded border">상담 내용</label>
          <Textarea
            placeholder="AI가 실시간 STT 내용을 분석하여 자동으로 채워드립니다..."
            className="min-h-[180px] resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* 상담 예약 */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded border h-10">
            <input
              type="checkbox"
              checked={isReservationChecked}
              onChange={(e) => setIsReservationChecked(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium">상담 예약</label>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="text"
                placeholder="예약일시"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm" className="px-3">
                <Calendar className="w-4 h-4" />
              </Button>
            </div>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="== 선택 ==" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">선택1</SelectItem>
                <SelectItem value="option2">선택2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 예약자 정보 */}
        <div className="grid grid-cols-[100px_1fr] gap-2">
          <div></div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">고객정보</span>
              <Input
                placeholder="예) 홍길동"
                value={reservationName}
                onChange={(e) => setReservationName(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">예)</span>
              <Input
                placeholder="010-XXXX-XXXX"
                value={reservationPhone}
                onChange={(e) => setReservationPhone(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* 통화결과 */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
          <label className="text-sm font-medium bg-gray-100 p-2 rounded border">통화결과</label>
          <Select value={callResult} onValueChange={setCallResult}>
            <SelectTrigger>
              <SelectValue placeholder="== 선택 ==" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="상담완료">상담완료</SelectItem>
              <SelectItem value="예약진행">예약진행</SelectItem>
              <SelectItem value="보류">보류</SelectItem>
              <SelectItem value="부재중">부재중</SelectItem>
              <SelectItem value="취소">취소</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* 하단 버튼 */}
      <div className="grid grid-cols-4 gap-2 mt-4 flex-shrink-0">
        <Button variant="outline" onClick={handleReset} className="bg-slate-600 hover:bg-slate-700 text-white">
          초기화
        </Button>
        <Button variant="outline" onClick={handleInstantSave} className="bg-slate-600 hover:bg-slate-700 text-white">
          쪽지보내기
        </Button>
        <Button variant="outline" onClick={handleTemporarySave} className="bg-slate-600 hover:bg-slate-700 text-white">
          저장대기
        </Button>
        <Button onClick={handleComplete} className="bg-slate-600 hover:bg-slate-700">
          임시지장
        </Button>
      </div>
    </Card>
  );
}