import { useState, useMemo, useEffect } from 'react';
import { Lightbulb, TrendingUp, ShoppingCart, BookOpen, Tag, MessageSquare, FileText, Filter, PanelBottomClose, Maximize2, X } from 'lucide-react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface KmsItem {
  title: string;
  category: string;
  relevance: number;
  docId: string;
  content: string;
}

interface PromotionItem {
  title: string;
  category: string;
  discount: string;
  period: string;
  content: string;
}

interface ScriptItem {
  title: string;
  category: string;
  content: string;
}

interface ProductItem {
  name: string;
  price: string;
  discount: string;
  reason: string;
}

export function RecommendationPanel() {
  const [kmsDetailOpen, setKmsDetailOpen] = useState(false);
  const [selectedKms, setSelectedKms] = useState<KmsItem | null>(null);
  const [promotionDetailOpen, setPromotionDetailOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromotionItem | null>(null);
  const [scriptDetailOpen, setScriptDetailOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ScriptItem | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [kmsMinimized, setKmsMinimized] = useState(false);
  const [promoMinimized, setPromoMinimized] = useState(false);
  const [scriptMinimized, setScriptMinimized] = useState(false);
  const [productMinimized, setProductMinimized] = useState(false);
  useEffect(() => { if (!kmsDetailOpen) setKmsMinimized(false); }, [kmsDetailOpen]);
  useEffect(() => { if (!promotionDetailOpen) setPromoMinimized(false); }, [promotionDetailOpen]);
  useEffect(() => { if (!scriptDetailOpen) setScriptMinimized(false); }, [scriptDetailOpen]);
  useEffect(() => { if (!productDetailOpen) setProductMinimized(false); }, [productDetailOpen]);
  // KMS: 카테고리 필터, 정렬
  const [kmsCategory, setKmsCategory] = useState<string>('all');
  const [kmsSort, setKmsSort] = useState<string>('relevance-desc');
  // 프로모션: 카테고리 필터, 정렬
  const [promoCategory, setPromoCategory] = useState<string>('all');
  const [promoSort, setPromoSort] = useState<string>('title');
  // 스크립트: 카테고리 필터, 정렬
  const [scriptCategory, setScriptCategory] = useState<string>('all');
  const [scriptSort, setScriptSort] = useState<string>('category');
  // 상품: 정렬만
  const [productSort, setProductSort] = useState<string>('discount-desc');
  const kmsInfo = [
    {
      title: '대한항공 환불 정책',
      category: '항공사 정책',
      relevance: 95,
      docId: 'KMS-AIR-001',
      content: '[환불 수수료]\n• 국내선: 출발 3일 전 면제, 당일 10,000원\n• 국제선: 출발 30일 전 면제, 14일 전 50,000원, 당일 100,000원\n\n[환불 불가 항공권]\n• 특가 항공권 (프로모션)\n• 마일리지 항공권 (재예약만 가능)\n\n[환불 처리 기간]\n• 신용카드: 3-5 영업일\n• 무통장입금: 7-10 영업일'
    },
    {
      title: '제주도 패키지 상품 FAQ',
      category: 'FAQ',
      relevance: 92,
      docId: 'KMS-FAQ-015',
      content: 'Q. 렌터카는 현장에서 변경 가능한가요?\nA. 예약 시점 차종 확정이 원칙이나, 현장 여유분이 있을 경우 차액 지불 후 변경 가능합니다.\n\nQ. 악천후 시 일정 취소가 가능한가요?\nA. 태풍, 폭우 등으로 여행이 불가능한 경우 100% 환불 또는 일정 변경이 가능합니다.\n\nQ. 유아 동반 시 추가 비용이 있나요?\nA. 만 2세 미만 무료, 만 2-5세 50% 할인 적용됩니다.'
    },
    {
      title: '아시아나항공 좌석 변경 규정',
      category: '항공사 정책',
      relevance: 88,
      docId: 'KMS-AIR-002',
      content: '[좌석 변경 수수료]\n• 일반석: 무료 (출발 24시간 전까지)\n• 비즈니스석: 무료\n• 특가 항공권: 20,000원\n\n[사전 좌석 배정]\n• 웹 체크인: 출발 48시간 전부터\n• 비상구 좌석: 신장 160cm 이상, 15,000원\n• 유아 동반: 바시넷 좌석 사전 예약 필수'
    },
    {
      title: '호텔 노쇼(No-Show) 처리 매뉴얼',
      category: '상담 매뉴얼',
      relevance: 85,
      docId: 'KMS-MAN-008',
      content: '[노쇼 발생 시 상담 절차]\n1. 고객 체크인 예정 시간 2시간 경과 확인\n2. 고객에게 연락 시도 (전화 → 문자 → 이메일)\n3. 호텔에 연락하여 예약 유지 요청 (최대 1일)\n4. 고객 무응답 시 자동 취소 처리\n5. 취소 수수료: 1박 요금의 80%\n6. CRM에 노쇼 이력 기록'
    },
    {
      title: '여권 유효기간 안내',
      category: 'FAQ',
      relevance: 90,
      docId: 'KMS-FAQ-003',
      content: '[국가별 여권 잔여 유효기간]\n• 일본, 중국, 동남아: 입국일 기준 6개월 이상\n• 유럽(<|im_start|>ген): 출국일 기준 3개월 이상\n• 미국, 캐나다: 입국일 기준 유효하면 가능\n\n[여권 재발급 소요 기간]\n• 일반: 4-6 영업일\n• 긴급: 익일 발급 (수수료 추가)\n\n⚠️ 출발 1개월 전 여권 확인 권장'
    },
    {
      title: '취소 수수료 정책',
      category: '상담 매뉴얼',
      relevance: 93,
      docId: 'KMS-MAN-001',
      content: '[패키지 상품 취소 수수료]\n• 출발 30일 전: 계약금 면제\n• 출발 20일 전: 여행 요금의 10%\n• 출발 10일 전: 여행 요금의 15%\n• 출발 8일 전: 여행 요금의 20%\n• 출발 1일 전: 여행 요금의 50%\n• 출발 당일: 여행 요금의 100%\n\n[특약 사항]\n• VIP 회원: 수수료 50% 감면\n• 성수기(7-8월, 12월): 수수료 1.5배 적용'
    },
    {
      title: '해외여행자 보험 안내',
      category: 'FAQ',
      relevance: 87,
      docId: 'KMS-FAQ-022',
      content: '[보험 가입 대상]\n• 권장: 모든 해외여행객\n• 필수: 유럽(<|im_start|>ген) 여행 시 의무\n\n[보장 내용]\n• 상해/질병 치료비: 최대 1억원\n• 휴대품 손해: 최대 50만원\n• 항공기 지연: 1시간당 10만원\n• 여행 중단/취소: 실비 보장\n\n[보험료]\n• 아시아 3-4일: 15,000원\n• 유럽 7-10일: 45,000원\n• 가족형 할인: 20% 적용'
    },
    {
      title: '신규 고객 응대 스크립트',
      category: '상담 매뉴얼',
      relevance: 82,
      docId: 'KMS-MAN-012',
      content: '[1단계: 인사 및 신원 확인]\n"안녕하십니까, 여행 전문 상담사 OOO입니다."\n"성함과 연락처를 확인해도 될까요?"\n\n[2단계: 회원 가입 안내]\n"고객님, 회원 가입 시 즉시 5% 할인 쿠폰과\n마일리지 적립 혜택을 받으실 수 있습니다."\n\n[3단계: 여행 상담 시작]\n"어떤 여행을 계획하고 계신가요?"\n"원하시는 여행지, 날짜, 인원을 말씀해주세요."'
    },
    {
      title: 'VIP 고객 응대 가이드',
      category: '상담 매뉴얼',
      relevance: 96,
      docId: 'KMS-MAN-015',
      content: '[VIP 고객 특징]\n• 연간 500만원 이상 이용\n• 전담 상담사 배정\n• 프리미엄 상품 선호\n\n[응대 시 주의사항]\n✓ 존댓말 철저히 사용\n✓ 대기 시간 최소화 (30초 이내)\n✓ 맞춤형 상품 우선 제안\n✓ 추가 혜택 자동 적용 안내\n\n[제공 혜택]\n• 최대 30% 할인\n• 공항 라운지 이용권\n• 무료 일정 변경 1회\n• 전용 고객센터 이용'
    },
    {
      title: '비자 발급 안내',
      category: 'FAQ',
      relevance: 84,
      docId: 'KMS-FAQ-018',
      content: '[무비자 입국 가능 국가]\n• 일본, 싱가포르, 대만: 90일\n• 홍콩, 마카오: 30일\n• 태국, 말레이시아: 90일\n\n[비자 발급 필요 국가]\n• 중국: 15일 소요, 수수료 80,000원\n• 베트남: 7일 소요, 수수료 50,000원\n• 인도: 온라인 비자, 수수료 60,000원\n• 러시아: 30일 소요, 수수료 150,000원\n\n[비자 대행 서비스]\n• 당사 수수료: 30,000원\n• 처리 기간: 영사관 기간 + 3일'
    },
    {
      title: '항공권 예약 변경 처리',
      category: '상담 매뉴얼',
      relevance: 89,
      docId: 'KMS-MAN-005',
      content: '[변경 가능 여부 확인]\n1. 항공권 종류 확인 (일반/특가/마일리지)\n2. 항공사별 변경 규정 조회\n3. 잔여 좌석 실시간 확인\n\n[변경 수수료 안내]\n• 국내선: 10,000원\n• 국제선: 50,000원 + 운임 차액\n• 특가 항공권: 변경 불가 (환불 후 재구매)\n\n[시스템 처리]\n1. 기존 예약 취소 처리\n2. 신규 예약 등록\n3. 차액 결제 또는 환불\n4. 변경 완료 문자 발송'
    },
    {
      title: '단체 여행 상담 프로세스',
      category: '상담 매뉴얼',
      relevance: 80,
      docId: 'KMS-MAN-020',
      content: '[단체 기준]\n• 15인 이상\n• 기업, 학교, 동호회 등\n\n[상담 절차]\n1. 단체 정보 수집 (인원, 예산, 목적)\n2. 맞춤 일정 기획 (3-5안 제시)\n3. 견적서 발송 (3영업일 이내)\n4. 계약금 입금 (총액의 30%)\n5. 출발 30일 전 잔금 납부\n\n[단체 특별 혜택]\n• 20인 이상: 15% 할인\n• 30인 이상: 인솔자 1인 무료\n• 전용 차량 및 가이드 배정'
    }
  ];

  const promotionInfo = [
    {
      title: 'VIP 고객 전용 프로모션',
      category: '회원 혜택',
      discount: '최대 30%',
      period: '2026.02.01 ~ 2026.03.31',
      content: '• 패키지 상품 20% 기본 할인\n• 렌터카 무료 업그레이드\n• 공항 라운지 이용권 2매 제공\n• 여행자 보험 무료 가입'
    },
    {
      title: '제주 봄 시즌 특가',
      category: '시즌 프로모션',
      discount: '15%',
      period: '2026.03.01 ~ 2026.03.31',
      content: '3월 제주 여행 전 상품 15% 할인\n유채꽃 축제 입장권 증정\n조식 무료 업그레이드'
    },
    {
      title: '가족 여행 패키지',
      category: '테마 상품',
      discount: '25%',
      period: '2026.02.15 ~ 2026.04.30',
      content: '4인 가족 기준 할인가 제공\n아쿠아플라넷 입장권 포함\n키즈 어메니티 무료 제공\n체험 프로그램 1회 무료'
    },
    {
      title: '얼리버드 예약 특전',
      category: '사전 예약',
      discount: '10%',
      period: '상시',
      content: '30일 전 예약 시 10% 추가 할인\n선택 관광지 1곳 무료\n공항 픽업 서비스 제공'
    },
    {
      title: '풀빌라 조기 예약 혜택',
      category: '숙소 프로모션',
      discount: '20%',
      period: '2026.02.01 ~ 2026.12.31',
      content: '45일 전 예약 시 20% 할인\n레이트 체크아웃 무료 (14시)\n웰컴 과일 바구니 제공\nBBQ 세트 50% 할인'
    },
    {
      title: '재방문 고객 리워드',
      category: '재구매 혜택',
      discount: '추가 5%',
      period: '상시',
      content: '최근 1년 내 이용 고객 추가 5% 할인\n마일리지 2배 적립\n다음 여행 시 사용 가능한 쿠폰 3만원 증정'
    }
  ];

  const scriptInfo = [
    {
      title: '인사 및 상담 시작',
      category: '오프닝',
      content: '"안녕하세요, [회사명] 여행 상담사 [이름]입니다.\n오늘 어떤 여행을 계획하고 계신가요?\n고객님의 소중한 시간을 함께 만들어드리겠습니다."'
    },
    {
      title: '고객 니즈 파악 질문',
      category: '상담 진행',
      content: '1. "여행 예정 날짜와 기간이 정해지셨나요?"\n2. "몇 분이 함께 가시나요? (동반자 구성)"\n3. "어떤 스타일의 여행을 선호하시나요? (휴양/관광/액티비티 등)"\n4. "예산은 어느 정도로 생각하고 계신가요?"\n5. "특별히 가보고 싶은 곳이나 하고 싶은 활동이 있으신가요?"'
    },
    {
      title: '상품 추천 멘트',
      category: '상품 제안',
      content: '"고객님의 니즈에 딱 맞는 상품을 추천드리겠습니다.\n[상품명]은 고객님과 같은 [특징]을 선호하시는 분들께\n가장 만족도가 높은 상품입니다.\n특히 [시즌/기간]에는 [혜택]도 제공되고 있습니다."'
    },
    {
      title: '가격 안내 스크립트',
      category: '가격 협상',
      content: '"기본 상품 가격은 [금액]입니다.\n현재 고객님께서는 [등급] 회원이시고,\n[프로모션명]이 적용되어 총 [할인율]% 할인된\n[최종금액]으로 안내드릴 수 있습니다.\n추가로 [옵션]을 선택하시면 [혜택]도 받으실 수 있습니다."'
    },
    {
      title: '예약 확정 단계',
      category: '클로징',
      content: '"그럼 예약을 진행해드리겠습니다.\n여행자 대표 성함과 생년월일을 확인해주시겠습니까?\n예약금은 [금액]이며, 잔금은 출발 [일수]일 전까지\n입금해주시면 됩니다.\n예약 확정 후 상세 일정표를 문자로 발송해드리겠습니다."'
    },
    {
      title: '취소/변경 정책 안내',
      category: '정책 설명',
      content: '"여행 취소 및 변경 정책을 안내드리겠습니다.\n• 출발 [일수]일 전: [환불율]% 환불\n• 출발 [일수]일 전: [환불율]% 환불\n• 출발 당일: 환불 불가\n일정 변경은 출발 [일수]일 전까지 가능하며,\n변경 수수료가 발생할 수 있습니다."'
    },
    {
      title: '이의제기 처리',
      category: '불만 응대',
      content: '"고객님의 불편하신 점 충분히 이해합니다.\n먼저 상황을 정확히 파악하여 도와드리겠습니다.\n[문제 확인] → [해결방안 제시] → [보상안 안내]\n고객님의 만족을 위해 최선을 다하겠습니다.\n혹시 추가로 원하시는 부분이 있으신가요?"'
    },
    {
      title: '상담 종료',
      category: '클로징',
      content: '"오늘 상담 내용을 요약해드리면 [요약 내용]입니다.\n추가 문의사항은 언제든 [연락처]로 연락주시면\n친절히 안내해드리겠습니다.\n즐거운 여행 되시길 바랍니다. 감사합니다!"'
    }
  ];

  const productRecommendations = [
    {
      name: '제주 서귀포 풀빌라 3박4일',
      price: '1,280,000원',
      discount: '20%',
      reason: 'VIP 고객 특별가, 가족 여행 추천 1위'
    },
    {
      name: '제주 렌터카 + 호텔 패키지',
      price: '890,000원',
      discount: '15%',
      reason: '여행 상품과 함께 구매 시 할인'
    },
    {
      name: '우도 + 성산일출봉 투어',
      price: '180,000원',
      discount: '10%',
      reason: '제주 여행 필수 코스'
    },
    {
      name: '여행자 보험 (가족형)',
      price: '45,000원',
      discount: '30%',
      reason: '패키지 구매 고객 특별 할인'
    }
  ];

  // KMS 필터·정렬 적용
  const kmsFiltered = useMemo(() => {
    let list = kmsCategory === 'all' ? kmsInfo : kmsInfo.filter((k) => k.category === kmsCategory);
    if (kmsSort === 'relevance-desc') list = [...list].sort((a, b) => b.relevance - a.relevance);
    else if (kmsSort === 'relevance-asc') list = [...list].sort((a, b) => a.relevance - b.relevance);
    else if (kmsSort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [kmsCategory, kmsSort]);

  // 프로모션 필터·정렬 적용
  const promoFiltered = useMemo(() => {
    let list = promoCategory === 'all' ? promotionInfo : promotionInfo.filter((p) => p.category === promoCategory);
    if (promoSort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (promoSort === 'discount') list = [...list].sort((a, b) => (b.discount || '').localeCompare(a.discount || ''));
    return list;
  }, [promoCategory, promoSort]);

  // 스크립트 필터·정렬 적용
  const scriptFiltered = useMemo(() => {
    let list = scriptCategory === 'all' ? scriptInfo : scriptInfo.filter((s) => s.category === scriptCategory);
    if (scriptSort === 'category') list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    else if (scriptSort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [scriptCategory, scriptSort]);

  // 상품 정렬 적용 (가격 파싱: "1,280,000원" -> 숫자)
  const productFiltered = useMemo(() => {
    const parsePrice = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    const parseDiscount = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
    let list = [...productRecommendations];
    if (productSort === 'discount-desc') list.sort((a, b) => parseDiscount(b.discount) - parseDiscount(a.discount));
    else if (productSort === 'price-asc') list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (productSort === 'price-desc') list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    else if (productSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [productSort]);

  // KMS 카테고리별 배지 스타일 (구분별 다른 색)
  const getKmsCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '항공사 정책':
        return 'bg-blue-100 text-blue-800 border-0';
      case 'FAQ':
        return 'bg-emerald-100 text-emerald-800 border-0';
      case '상담 매뉴얼':
        return 'bg-violet-100 text-violet-800 border-0';
      default:
        return 'bg-gray-100 text-gray-800 border-0';
    }
  };

  // 프로모션 카테고리별 배지 스타일
  const getPromoCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '회원 혜택':
        return 'bg-amber-100 text-amber-800 border-0';
      case '시즌 프로모션':
        return 'bg-orange-100 text-orange-800 border-0';
      case '테마 상품':
        return 'bg-rose-100 text-rose-800 border-0';
      case '사전 예약':
        return 'bg-sky-100 text-sky-800 border-0';
      case '숙소 프로모션':
        return 'bg-lime-100 text-lime-800 border-0';
      case '재구매 혜택':
        return 'bg-fuchsia-100 text-fuchsia-800 border-0';
      default:
        return 'bg-gray-100 text-gray-800 border-0';
    }
  };

  // 스크립트 카테고리별 배지 스타일
  const getScriptCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '오프닝':
        return 'bg-emerald-100 text-emerald-800 border-0';
      case '상담 진행':
        return 'bg-cyan-100 text-cyan-800 border-0';
      case '상품 제안':
        return 'bg-indigo-100 text-indigo-800 border-0';
      case '가격 협상':
        return 'bg-amber-100 text-amber-800 border-0';
      case '클로징':
        return 'bg-violet-100 text-violet-800 border-0';
      case '정책 설명':
        return 'bg-slate-200 text-slate-800 border-0';
      case '불만 응대':
        return 'bg-red-100 text-red-800 border-0';
      default:
        return 'bg-gray-100 text-gray-800 border-0';
    }
  };

  // 상품 할인율별 배지 스타일 (구분별 다른 색)
  const getProductDiscountBadgeClass = (discount: string) => {
    const num = parseInt(discount.replace(/[^0-9]/g, ''), 10) || 0;
    if (num >= 25) return 'bg-teal-100 text-teal-800 border-0';
    if (num >= 20) return 'bg-cyan-100 text-cyan-800 border-0';
    if (num >= 15) return 'bg-sky-100 text-sky-800 border-0';
    if (num >= 10) return 'bg-indigo-100 text-indigo-800 border-0';
    return 'bg-violet-100 text-violet-800 border-0';
  };

  return (
    <Card className="p-4 h-full flex flex-col overflow-hidden">
      <Tabs defaultValue="kms" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-4 flex-shrink-0 gap-1 p-1">
          <TabsTrigger
            value="kms"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-blue-300 border border-transparent"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            KMS
          </TabsTrigger>
          <TabsTrigger
            value="promotion"
            className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 data-[state=active]:border-amber-300 border border-transparent"
          >
            <Tag className="w-4 h-4 mr-1" />
            프로모션
          </TabsTrigger>
          <TabsTrigger
            value="script"
            className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:border-emerald-300 border border-transparent"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            스크립트
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-800 data-[state=active]:border-teal-300 border border-transparent"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            상품
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="kms" className="flex-1 mt-4 min-h-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={kmsCategory} onValueChange={setKmsCategory}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="항공사 정책">항공사 정책</SelectItem>
                <SelectItem value="FAQ">FAQ</SelectItem>
                <SelectItem value="상담 매뉴얼">상담 매뉴얼</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kmsSort} onValueChange={setKmsSort}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance-desc">관련도 높은순</SelectItem>
                <SelectItem value="relevance-asc">관련도 낮은순</SelectItem>
                <SelectItem value="title">제목 가나다순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1 min-h-0 h-0 pr-4">
            <div className="space-y-3 pb-2 min-h-0">
              {kmsFiltered.map((info, index) => (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedKms(info);
                    setKmsDetailOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedKms(info);
                      setKmsDetailOpen(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{info.title}</h4>
                    <Badge className="text-xs flex-shrink-0 ml-2 bg-gray-100 text-gray-700 border-0">
                      {info.relevance}% 관련
                    </Badge>
                  </div>
                  <Badge className={`mb-2 text-xs border-0 ${getKmsCategoryBadgeClass(info.category)}`}>{info.category}</Badge>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {info.content.replace(/\n/g, ' ').slice(0, 120)}
                    {info.content.length > 120 ? '…' : ''}
                  </p>
                  <p className="text-xs text-violet-600 mt-1">클릭하여 상세 보기</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="promotion" className="flex-1 mt-4 min-h-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={promoCategory} onValueChange={setPromoCategory}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="회원 혜택">회원 혜택</SelectItem>
                <SelectItem value="시즌 프로모션">시즌 프로모션</SelectItem>
                <SelectItem value="테마 상품">테마 상품</SelectItem>
                <SelectItem value="사전 예약">사전 예약</SelectItem>
                <SelectItem value="숙소 프로모션">숙소 프로모션</SelectItem>
                <SelectItem value="재구매 혜택">재구매 혜택</SelectItem>
              </SelectContent>
            </Select>
            <Select value={promoSort} onValueChange={setPromoSort}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">할인율 높은순</SelectItem>
                <SelectItem value="title">제목 가나다순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1 min-h-0 h-0 pr-4">
            <div className="space-y-3 pb-2 min-h-0">
              {promoFiltered.map((promo, index) => (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  className="p-3 border rounded-lg hover:bg-violet-50 cursor-pointer border-l-4 border-l-violet-500 transition-colors"
                  onClick={() => {
                    setSelectedPromo(promo);
                    setPromotionDetailOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPromo(promo);
                      setPromotionDetailOpen(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{promo.title}</h4>
                    <Badge className="text-xs flex-shrink-0 ml-2 bg-amber-500 text-white border-0">{promo.discount}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs border-0 ${getPromoCategoryBadgeClass(promo.category)}`}>{promo.category}</Badge>
                    <span className="text-xs text-gray-500">기간: {promo.period}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {promo.content.replace(/\n/g, ' ').slice(0, 80)}
                    {promo.content.length > 80 ? '…' : ''}
                  </p>
                  <p className="text-xs text-violet-600 mt-1">클릭하여 상세 보기</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="script" className="flex-1 mt-4 min-h-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={scriptCategory} onValueChange={setScriptCategory}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="오프닝">오프닝</SelectItem>
                <SelectItem value="상담 진행">상담 진행</SelectItem>
                <SelectItem value="상품 제안">상품 제안</SelectItem>
                <SelectItem value="가격 협상">가격 협상</SelectItem>
                <SelectItem value="클로징">클로징</SelectItem>
                <SelectItem value="정책 설명">정책 설명</SelectItem>
                <SelectItem value="불만 응대">불만 응대</SelectItem>
              </SelectContent>
            </Select>
            <Select value={scriptSort} onValueChange={setScriptSort}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">카테고리순</SelectItem>
                <SelectItem value="title">제목 가나다순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1 min-h-0 h-0 pr-4">
            <div className="space-y-3 pb-2 min-h-0">
              {scriptFiltered.map((script, index) => (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  className="p-3 border rounded-lg hover:bg-green-50 cursor-pointer border-l-4 border-l-green-500 transition-colors"
                  onClick={() => {
                    setSelectedScript(script);
                    setScriptDetailOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedScript(script);
                      setScriptDetailOpen(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{script.title}</h4>
                    <Badge className={`text-xs flex-shrink-0 ml-2 border-0 ${getScriptCategoryBadgeClass(script.category)}`}>{script.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {script.content.replace(/\n/g, ' ').slice(0, 80)}
                    {script.content.length > 80 ? '…' : ''}
                  </p>
                  <p className="text-xs text-violet-600 mt-1">클릭하여 상세 보기</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="products" className="flex-1 mt-4 min-h-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={productSort} onValueChange={setProductSort}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount-desc">할인율 높은순</SelectItem>
                <SelectItem value="price-asc">가격 낮은순</SelectItem>
                <SelectItem value="price-desc">가격 높은순</SelectItem>
                <SelectItem value="name">이름 가나다순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1 min-h-0 h-0 pr-4">
            <div className="space-y-3 pb-2 min-h-0">
              {productFiltered.map((product, index) => (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedProduct(product);
                    setProductDetailOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedProduct(product);
                      setProductDetailOpen(true);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <Badge className={`flex-shrink-0 ml-2 border-0 ${getProductDiscountBadgeClass(product.discount)}`}>{product.discount}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-violet-600">{product.price}</span>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500">{product.reason}</p>
                  <p className="text-xs text-violet-600 mt-1">클릭하여 상세 보기</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* KMS 축소 패널 */}
      {kmsDetailOpen && kmsMinimized && selectedKms && (
        <div className="fixed bottom-6 right-6 z-50 w-[300px] rounded-lg border bg-white shadow-xl flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">KMS · {selectedKms.title}</p>
              <p className="text-xs text-gray-500 truncate">{selectedKms.docId}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setKmsMinimized(false)} title="화면 확대"><Maximize2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setKmsDetailOpen(false)} title="닫기"><X className="h-4 w-4" /></Button>
          </div>
          <button type="button" className="p-3 text-xs text-gray-600 text-left hover:bg-gray-50 rounded-b-lg" onClick={() => setKmsMinimized(false)}>클릭하여 다시 크게 보기</button>
        </div>
      )}
      {/* KMS 상세 팝업 */}
      <Dialog open={kmsDetailOpen && !kmsMinimized} onOpenChange={setKmsDetailOpen}>
        <DialogContent className="recommendation-panel-dialog sm:max-w-2xl max-h-[85vh] flex flex-col" aria-describedby="kms-detail-description">
          {selectedKms && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span>{selectedKms.title}</span>
                  <Badge className="text-xs bg-gray-100 text-gray-700 border-0">
                    {selectedKms.docId}
                  </Badge>
                  <Badge className={`text-xs border-0 ${getKmsCategoryBadgeClass(selectedKms.category)}`}>{selectedKms.category}</Badge>
                  <Badge className="text-xs bg-gray-50 text-gray-600 border border-gray-200">
                    {selectedKms.relevance}% 관련
                  </Badge>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setKmsMinimized(true)} title="화면 축소"><PanelBottomClose className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setKmsDetailOpen(false)} title="닫기"><X className="h-5 w-5" /></Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div id="kms-detail-description" className="flex-1 overflow-y-auto pt-2">
                <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedKms.content}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 프로모션 축소 패널 */}
      {promotionDetailOpen && promoMinimized && selectedPromo && (
        <div className="fixed bottom-6 right-6 z-50 w-[300px] rounded-lg border bg-white shadow-xl flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
            <Tag className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">프로모션 · {selectedPromo.title}</p>
              <p className="text-xs text-gray-500 truncate">{selectedPromo.discount} · {selectedPromo.period}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPromoMinimized(false)} title="화면 확대"><Maximize2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPromotionDetailOpen(false)} title="닫기"><X className="h-4 w-4" /></Button>
          </div>
          <button type="button" className="p-3 text-xs text-gray-600 text-left hover:bg-gray-50 rounded-b-lg" onClick={() => setPromoMinimized(false)}>클릭하여 다시 크게 보기</button>
        </div>
      )}
      {/* 프로모션 상세 팝업 */}
      <Dialog open={promotionDetailOpen && !promoMinimized} onOpenChange={setPromotionDetailOpen}>
        <DialogContent className="recommendation-panel-dialog sm:max-w-lg max-h-[85vh] flex flex-col" aria-describedby="promo-detail-description">
          {selectedPromo && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-5 h-5 flex-shrink-0" />
                  <span>{selectedPromo.title}</span>
                  <Badge className="bg-amber-500 text-white border-0">{selectedPromo.discount}</Badge>
                  <Badge className={`border-0 ${getPromoCategoryBadgeClass(selectedPromo.category)}`}>{selectedPromo.category}</Badge>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setPromoMinimized(true)} title="화면 축소"><PanelBottomClose className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setPromotionDetailOpen(false)} title="닫기"><X className="h-5 w-5" /></Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div id="promo-detail-description" className="flex-1 overflow-y-auto pt-2 space-y-3">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">적용 기간:</span> {selectedPromo.period}
                </p>
                <div className="p-4 bg-violet-50 rounded-lg border border-violet-100 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedPromo.content}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 스크립트 축소 패널 */}
      {scriptDetailOpen && scriptMinimized && selectedScript && (
        <div className="fixed bottom-6 right-6 z-50 w-[300px] rounded-lg border bg-white shadow-xl flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
            <MessageSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">스크립트 · {selectedScript.title}</p>
              <p className="text-xs text-gray-500 truncate">{selectedScript.category}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScriptMinimized(false)} title="화면 확대"><Maximize2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScriptDetailOpen(false)} title="닫기"><X className="h-4 w-4" /></Button>
          </div>
          <button type="button" className="p-3 text-xs text-gray-600 text-left hover:bg-gray-50 rounded-b-lg" onClick={() => setScriptMinimized(false)}>클릭하여 다시 크게 보기</button>
        </div>
      )}
      {/* 스크립트 상세 팝업 */}
      <Dialog open={scriptDetailOpen && !scriptMinimized} onOpenChange={setScriptDetailOpen}>
        <DialogContent className="recommendation-panel-dialog sm:max-w-2xl max-h-[85vh] flex flex-col" aria-describedby="script-detail-description">
          {selectedScript && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <span>{selectedScript.title}</span>
                  <Badge className={`border-0 ${getScriptCategoryBadgeClass(selectedScript.category)}`}>{selectedScript.category}</Badge>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setScriptMinimized(true)} title="화면 축소"><PanelBottomClose className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setScriptDetailOpen(false)} title="닫기"><X className="h-5 w-5" /></Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div id="script-detail-description" className="flex-1 overflow-y-auto pt-2">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedScript.content}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 상품 축소 패널 */}
      {productDetailOpen && productMinimized && selectedProduct && (
        <div className="fixed bottom-6 right-6 z-50 w-[300px] rounded-lg border bg-white shadow-xl flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b bg-gray-50 rounded-t-lg">
            <ShoppingCart className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">상품 · {selectedProduct.name}</p>
              <p className="text-xs text-gray-500 truncate">{selectedProduct.price} {selectedProduct.discount}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProductMinimized(false)} title="화면 확대"><Maximize2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProductDetailOpen(false)} title="닫기"><X className="h-4 w-4" /></Button>
          </div>
          <button type="button" className="p-3 text-xs text-gray-600 text-left hover:bg-gray-50 rounded-b-lg" onClick={() => setProductMinimized(false)}>클릭하여 다시 크게 보기</button>
        </div>
      )}
      {/* 상품 상세 팝업 */}
      <Dialog open={productDetailOpen && !productMinimized} onOpenChange={setProductDetailOpen}>
        <DialogContent className="recommendation-panel-dialog sm:max-w-md" aria-describedby="product-detail-description">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                  <span>{selectedProduct.name}</span>
                  <Badge className={`border-0 ${getProductDiscountBadgeClass(selectedProduct.discount)}`}>{selectedProduct.discount}</Badge>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setProductMinimized(true)} title="화면 축소"><PanelBottomClose className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setProductDetailOpen(false)} title="닫기"><X className="h-5 w-5" /></Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div id="product-detail-description" className="pt-2 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">가격</span>
                  <span className="text-xl font-semibold text-violet-600">{selectedProduct.price}</span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <span className="text-sm text-gray-500">추천 사유</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg border text-sm">{selectedProduct.reason}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}