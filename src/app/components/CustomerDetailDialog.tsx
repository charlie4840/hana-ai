import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { User, Calendar, CreditCard, Gift, Package, XCircle, Receipt, PanelBottomClose, Maximize2, X } from 'lucide-react';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    name: string;
    id: string;
    phone: string;
    email: string;
    address: string;
    grade: string;
    joinDate: string;
    lastTrip?: string;
  };
}

export function CustomerDetailDialog({ open, onOpenChange, customer }: CustomerDetailDialogProps) {
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (!open) setMinimized(false);
  }, [open]);

  // 결제 이력 목 데이터
  const paymentHistory = [
    {
      no: 1,
      paymentDate: '2018-12-17 23:38:39',
      reservationCode: 'H180131477744',
      amount: '588,500',
      paymentMethod: '카드',
      paymentNumber: '등록시 BSP...',
      cardBank: '비카카드',
      approvalNumber: '36642943',
      mileageAdjustment: '',
      referenceNumber: '105692405',
      cancelRequest: 'N'
    },
    {
      no: 2,
      paymentDate: '2019-03-20 17:52:02',
      reservationCode: 'RG1928401118',
      amount: '998,800',
      paymentMethod: '카드',
      paymentNumber: 'KSNET-ARS',
      cardBank: 'NH 농협카드',
      approvalNumber: '30001679',
      mileageAdjustment: '',
      referenceNumber: '',
      cancelRequest: 'N'
    },
    {
      no: 3,
      paymentDate: '2019-03-05 12:10:07',
      reservationCode: 'RP1928201606',
      amount: '2,316,000',
      paymentMethod: '카드',
      paymentNumber: 'KSNET-ARS',
      cardBank: '삼성카드',
      approvalNumber: '65270481',
      mileageAdjustment: '',
      referenceNumber: '100945007',
      cancelRequest: 'N'
    },
    {
      no: 4,
      paymentDate: '2019-03-20 20:01:15',
      reservationCode: 'RW1928366876',
      amount: '300,000',
      paymentMethod: '은행',
      paymentNumber: '가상계좌',
      cardBank: '국민은행·가상계좌',
      approvalNumber: '',
      mileageAdjustment: '',
      referenceNumber: '103533916',
      cancelRequest: 'N'
    },
    {
      no: 5,
      paymentDate: '2019-03-04 19:10:34',
      reservationCode: 'RQ1927776251',
      amount: '1,000,000',
      paymentMethod: '은행',
      paymentNumber: '가상계좌',
      cardBank: '우리은행·가상계좌',
      approvalNumber: '',
      mileageAdjustment: '',
      referenceNumber: '',
      cancelRequest: 'N'
    }
  ];

  // 예약 이력 목 데이터
  const reservations = [
    {
      id: 'RSV-2024-0145',
      date: '2024-02-15',
      destination: '제주도 풀빌라 3박4일',
      status: '예약완료',
      price: '1,280,000원',
      travelers: 4
    },
    {
      id: 'RSV-2023-0892',
      date: '2023-12-20',
      destination: '오사카 자유여행 4박5일',
      status: '여행완료',
      price: '2,450,000원',
      travelers: 4
    },
    {
      id: 'RSV-2023-0654',
      date: '2023-08-10',
      destination: '유럽 패키지 투어 8박9일',
      status: '여행완료',
      price: '8,900,000원',
      travelers: 4
    }
  ];

  // 취소 이력 목 데이터
  const cancellations = [
    {
      id: 'CXL-2024-0032',
      date: '2024-01-10',
      destination: '방콕 여행 4박5일',
      cancelDate: '2024-01-08',
      refundAmount: '1,800,000원',
      cancelFee: '90,000원',
      reason: '개인 사정'
    },
    {
      id: 'CXL-2023-0201',
      date: '2023-06-15',
      destination: '다낭 리조트 3박4일',
      cancelDate: '2023-05-20',
      refundAmount: '1,200,000원',
      cancelFee: '0원',
      reason: '일정 변경'
    }
  ];

  // 마일리지 사용 이력
  const mileageHistory = [
    {
      id: 'MIL-2024-0234',
      date: '2024-02-15',
      type: '사용',
      amount: -50000,
      description: '제주도 패키지 결제',
      balance: 125000
    },
    {
      id: 'MIL-2024-0198',
      date: '2024-01-20',
      type: '적립',
      amount: 24500,
      description: '오사카 여행 완료',
      balance: 175000
    },
    {
      id: 'MIL-2023-1523',
      date: '2023-12-20',
      type: '적립',
      amount: 89000,
      description: '유럽 패키지 여행 완료',
      balance: 150500
    },
    {
      id: 'MIL-2023-1402',
      date: '2023-11-05',
      type: '사용',
      amount: -30000,
      description: '렌터카 예약 할인',
      balance: 61500
    },
    {
      id: 'MIL-2023-1105',
      date: '2023-08-15',
      type: '보너스',
      amount: 50000,
      description: 'VIP 등급 승급 보너스',
      balance: 91500
    }
  ];

  // 쿠폰 사용 이력
  const couponHistory = [
    {
      id: 'CPN-2024-0456',
      date: '2024-02-15',
      couponName: 'VIP 20% 할인 쿠폰',
      discountAmount: '256,000원',
      usedFor: '제주도 풀빌라 패키지',
      status: '사용완료'
    },
    {
      id: 'CPN-2024-0123',
      date: '2024-01-30',
      couponName: '5만원 즉시 할인',
      discountAmount: '50,000원',
      usedFor: '제주 렌터카 예약',
      status: '사용완료'
    },
    {
      id: 'CPN-2023-0987',
      date: '2023-12-10',
      couponName: '신규 회원 웰컴 쿠폰',
      discountAmount: '30,000원',
      usedFor: '오사카 항공권',
      status: '사용완료'
    },
    {
      id: 'CPN-ACTIVE-01',
      date: '2026-03-31 만료',
      couponName: '봄 시즌 15% 할인',
      discountAmount: '최대 20만원',
      usedFor: '-',
      status: '사용가능'
    },
    {
      id: 'CPN-ACTIVE-02',
      date: '2026-12-31 만료',
      couponName: '가족 여행 특가 쿠폰',
      discountAmount: '10만원',
      usedFor: '-',
      status: '사용가능'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '예약완료':
      case '사용가능':
        return 'bg-violet-100 text-violet-800';
      case '여행완료':
      case '사용완료':
        return 'bg-green-100 text-green-800';
      case '취소':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 축소 시: 작은 플로팅 패널만 표시 (다이얼로그/오버레이 없음 → 멀티태스킹 가능)
  if (open && minimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 w-[320px] rounded-lg border bg-white shadow-xl flex flex-col"
        aria-label="고객 상세정보 (축소)"
      >
        <div className="flex items-center gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{customer.name} 고객 상세정보</p>
            <p className="text-xs text-gray-500 truncate">고객번호: {customer.id}</p>
          </div>
          <Badge className="flex-shrink-0 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800">
            {customer.grade}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setMinimized(false)}
            title="화면 확대"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => onOpenChange(false)}
            title="닫기"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        <button
          type="button"
          className="p-3 text-xs text-gray-600 text-left hover:bg-gray-50 rounded-b-lg transition-colors cursor-pointer"
          onClick={() => setMinimized(false)}
        >
          클릭하여 다시 크게 보기
        </button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="customer-detail-dialog !max-w-[1400px] !w-[1400px] max-h-[90vh] p-0" aria-describedby="customer-detail-description">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
              <User className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{customer.name} 고객 상세 정보</h2>
              <p id="customer-detail-description" className="text-sm text-gray-500 font-normal">고객번호: {customer.id}</p>
            </div>
            <Badge className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-800">
              {customer.grade}
            </Badge>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setMinimized(true)}
                title="화면 축소 (멀티태스킹)"
              >
                <PanelBottomClose className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => onOpenChange(false)}
                title="닫기"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col px-6 pb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">
              <User className="w-4 h-4 mr-2" />
              고객 정보
            </TabsTrigger>
            <TabsTrigger value="payment">
              <Receipt className="w-4 h-4 mr-2" />
              결제 이력
            </TabsTrigger>
            <TabsTrigger value="reservation">
              <Package className="w-4 h-4 mr-2" />
              예약/취소이력
            </TabsTrigger>
            <TabsTrigger value="mileage">
              <CreditCard className="w-4 h-4 mr-2" />
              마일리지이력
            </TabsTrigger>
            <TabsTrigger value="coupon">
              <Gift className="w-4 h-4 mr-2" />
              쿠폰이력
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex-1 mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">이름</label>
                      <p className="text-base mt-1">{customer.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">전화번호</label>
                      <p className="text-base mt-1">{customer.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">이메일</label>
                      <p className="text-base mt-1">{customer.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">고객번호</label>
                      <p className="text-base mt-1">{customer.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">등급</label>
                      <p className="text-base mt-1">{customer.grade}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">가입일</label>
                      <p className="text-base mt-1">{customer.joinDate}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600">주소</label>
                  <p className="text-base mt-1">{customer.address}</p>
                </div>

                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600 mb-3 block">여행 통계</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-violet-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">총 여행 횟수</p>
                      <p className="text-2xl font-semibold text-violet-600 mt-1">5회</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">누적 결제액</p>
                      <p className="text-2xl font-semibold text-green-600 mt-1">15.5M</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">보유 마일리지</p>
                      <p className="text-2xl font-semibold text-purple-600 mt-1">125,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="payment" className="flex-1 mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 bg-white">
                    <tr className="bg-violet-50 border-b-2 border-violet-200">
                      <th className="p-2 text-left font-semibold whitespace-nowrap w-12">NO</th>
                      <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[140px]">결제일시</th>
                      <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[120px]">예약코드</th>
                      <th className="p-2 text-right font-semibold whitespace-nowrap min-w-[90px]">결제금액</th>
                      <th className="p-2 text-center font-semibold whitespace-nowrap w-20">결제<br/>수단</th>
                      <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[100px]">결제번호</th>
                      <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[120px]">카드사/은행</th>
                      <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[80px]">승인번호</th>
                      <th className="p-2 text-center font-semibold whitespace-nowrap w-20">마일리지<br/>차감/환불</th>
                      <th className="p-2 text-left font-semibold whitespace-nowrap min-w-[100px]">결제차대<br/>조회번호</th>
                      <th className="p-2 text-center font-semibold whitespace-nowrap w-20">취소<br/>요구</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.no} className="border-b hover:bg-gray-50">
                        <td className="p-2">{payment.no}</td>
                        <td className="p-2 whitespace-nowrap">{payment.paymentDate}</td>
                        <td className="p-2">{payment.reservationCode}</td>
                        <td className="p-2 text-right font-semibold text-violet-600 whitespace-nowrap">{payment.amount}</td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {payment.paymentMethod}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs">{payment.paymentNumber}</td>
                        <td className="p-2">{payment.cardBank}</td>
                        <td className="p-2">{payment.approvalNumber || '-'}</td>
                        <td className="p-2 text-center">{payment.mileageAdjustment || '-'}</td>
                        <td className="p-2">{payment.referenceNumber || '-'}</td>
                        <td className="p-2 text-center">
                          <Badge variant={payment.cancelRequest === 'N' ? 'secondary' : 'destructive'} className="text-xs">
                            {payment.cancelRequest}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-xs text-gray-500 flex items-center justify-between px-2">
                  <span>총 {paymentHistory.length}건</span>
                  <span>1 / 8</span>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reservation" className="flex-1 mt-4">
            <ScrollArea className="h-[55vh]">
              <div className="space-y-6">
                {/* 예약 이력 */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    예약 이력 ({reservations.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 bg-white">
                        <tr className="bg-violet-50 border-b-2 border-violet-200">
                          <th className="p-2 text-left font-semibold whitespace-nowrap">예약번호</th>
                          <th className="p-2 text-left font-semibold whitespace-nowrap">예약일</th>
                          <th className="p-2 text-left font-semibold whitespace-nowrap">여행 상품</th>
                          <th className="p-2 text-center font-semibold whitespace-nowrap">인원</th>
                          <th className="p-2 text-right font-semibold whitespace-nowrap">결제금액</th>
                          <th className="p-2 text-center font-semibold whitespace-nowrap">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{item.id}</td>
                            <td className="p-2 whitespace-nowrap">{item.date}</td>
                            <td className="p-2">{item.destination}</td>
                            <td className="p-2 text-center">{item.travelers}명</td>
                            <td className="p-2 text-right font-semibold text-violet-600 whitespace-nowrap">{item.price}</td>
                            <td className="p-2 text-center">
                              <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 text-xs text-gray-500 flex items-center justify-between px-2">
                      <span>총 {reservations.length}건</span>
                    </div>
                  </div>
                </div>

                {/* 취소 이력 */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    취소 이력 ({cancellations.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="sticky top-0 bg-white">
                        <tr className="bg-red-50 border-b-2 border-red-200">
                          <th className="p-2 text-left font-semibold whitespace-nowrap">취소번호</th>
                          <th className="p-2 text-left font-semibold whitespace-nowrap">예약일</th>
                          <th className="p-2 text-left font-semibold whitespace-nowrap">취소일</th>
                          <th className="p-2 text-left font-semibold whitespace-nowrap">여행 상품</th>
                          <th className="p-2 text-right font-semibold whitespace-nowrap">환불금액</th>
                          <th className="p-2 text-right font-semibold whitespace-nowrap">취소수수료</th>
                          <th className="p-2 text-left font-semibold whitespace-nowrap">취소사유</th>
                          <th className="p-2 text-center font-semibold whitespace-nowrap">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancellations.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-red-50/30">
                            <td className="p-2">{item.id}</td>
                            <td className="p-2 whitespace-nowrap">{item.date}</td>
                            <td className="p-2 whitespace-nowrap">{item.cancelDate}</td>
                            <td className="p-2">{item.destination}</td>
                            <td className="p-2 text-right font-semibold text-green-600 whitespace-nowrap">{item.refundAmount}</td>
                            <td className="p-2 text-right font-semibold text-red-600 whitespace-nowrap">{item.cancelFee}</td>
                            <td className="p-2">{item.reason}</td>
                            <td className="p-2 text-center">
                              <Badge className="bg-red-100 text-red-800">취소완료</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 text-xs text-gray-500 flex items-center justify-between px-2">
                      <span>총 {cancellations.length}건</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="mileage" className="flex-1 mt-4">
            <ScrollArea className="h-[55vh]">
              <div>
                <h3 className="font-semibold mb-3">마일리지 사용 이력</h3>
                <div className="space-y-2">
                  {mileageHistory.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={item.type === '사용' ? 'destructive' : 'default'} className="text-xs">
                              {item.type}
                            </Badge>
                            <span className="text-sm font-medium">{item.description}</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.date} | {item.id}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()} P
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            잔액: {item.balance.toLocaleString()} P
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="coupon" className="flex-1 mt-4">
            <ScrollArea className="h-[55vh]">
              <div>
                <h3 className="font-semibold mb-3">쿠폰 사용 이력</h3>
                <div className="space-y-2">
                  {couponHistory.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={item.status === '사용가능' ? 'default' : 'secondary'} 
                              className={item.status === '사용가능' ? 'bg-green-600 text-white text-xs' : 'text-xs'}
                            >
                              {item.status}
                            </Badge>
                            <span className="text-sm font-medium">{item.couponName}</span>
                          </div>
                          <p className="text-xs text-gray-500">{item.date} | {item.id}</p>
                          {item.usedFor !== '-' && (
                            <p className="text-xs text-gray-500 mt-1">사용처: {item.usedFor}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-violet-600">
                            {item.discountAmount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}