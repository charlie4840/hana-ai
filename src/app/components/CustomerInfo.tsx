import { User, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Card } from './ui/card';

interface CustomerInfoProps {
  customer: {
    name: string;
    id: string;
    phone: string;
    email: string;
    address: string;
    grade: string;
    joinDate: string;
  };
  onClick?: () => void;
}

export function CustomerInfo({ customer, onClick }: CustomerInfoProps) {
  return (
    <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
          <User className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">{customer.name}</h2>
          <span className="text-sm text-gray-500">고객번호: {customer.id}</span>
        </div>
        <div className="ml-auto">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            {customer.grade}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4" />
          <span>{customer.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Mail className="w-4 h-4" />
          <span>{customer.email}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4" />
          <span>{customer.address}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>가입일: {customer.joinDate}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t text-center">
        <p className="text-xs text-violet-600 font-medium">클릭하여 상세 정보 보기</p>
      </div>
    </Card>
  );
}