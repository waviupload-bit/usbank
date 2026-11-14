import React, { useState } from 'react';
import { MERCHANT_META } from '../data/bankData';
import { MerchantId } from '../types/bank';

interface MerchantLogoProps {
  merchantId: MerchantId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  whiteRing?: boolean;
  className?: string;
}

export const MerchantLogo: React.FC<MerchantLogoProps> = ({
  merchantId,
  size = 'md',
  whiteRing = false,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const meta = MERCHANT_META[merchantId] ?? MERCHANT_META['us-bank'];

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  }[size];

  const bg = whiteRing ? 'bg-white shadow-sm' : meta.bgClass;

  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden flex items-center justify-center shrink-0 ${bg} ${className}`}
    >
      {!failed ? (
        <img
          src={meta.logo}
          alt={meta.name}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={
            whiteRing
              ? merchantId === 'apple'
                ? 'w-7 h-7 object-contain'
                : merchantId === 'nike'
                  ? 'w-full h-full object-cover'
                  : 'w-9 h-9 object-contain'
              : meta.imgClass
          }
        />
      ) : (
        <span className="font-display font-bold text-xs text-white bg-[#0E1747] w-full h-full flex items-center justify-center">
          {meta.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
};
