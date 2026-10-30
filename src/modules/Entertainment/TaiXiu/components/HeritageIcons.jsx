// src/modules/Entertainment/TaiXiu/components/HeritageIcons.jsx
import React from 'react';

/**
 * Mặt trời Đông Sơn 14 cánh với các vòng tròn đồng tâm và họa tiết răng cưa hình học
 */
export function DongSonSun({ size = 24, className = '', glow = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {glow && (
        <defs>
          <filter id="bronze-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      )}
      <g filter={glow ? 'url(#bronze-glow)' : undefined}>
        {/* Vòng ngoài cùng viền kép */}
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" strokeOpacity="0.7" />
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />

        {/* Vòng hạt cườm / chấm tròn đồng tâm */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const cx = 50 + 36 * Math.cos(rad);
          const cy = 50 + 36 * Math.sin(rad);
          return <circle key={i} cx={cx} cy={cy} r="1.1" fill="currentColor" fillOpacity="0.75" />;
        })}

        {/* Vòng răng cưa tam giác Đông Sơn */}
        <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
        <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i * 360) / 14;
          const rad = (angle * Math.PI) / 180;
          const radNext = (((angle + 12.8) * Math.PI) / 180);
          const radMid = (((angle + 6.4) * Math.PI) / 180);
          const x1 = 50 + 26 * Math.cos(rad);
          const y1 = 50 + 26 * Math.sin(rad);
          const x2 = 50 + 32 * Math.cos(radMid);
          const y2 = 50 + 32 * Math.sin(radMid);
          const x3 = 50 + 26 * Math.cos(radNext);
          const y3 = 50 + 26 * Math.sin(radNext);
          return (
            <path
              key={`tri-${i}`}
              d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3}`}
              stroke="currentColor"
              strokeWidth="0.8"
              strokeOpacity="0.65"
              fill="currentColor"
              fillOpacity="0.15"
            />
          );
        })}

        {/* Ngôi sao mặt trời 14 cánh nhọn trung tâm */}
        <circle cx="50" cy="50" r="8" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        {Array.from({ length: 14 }).map((_, i) => {
          const angle = (i * 360) / 14 - 90;
          const rad = (angle * Math.PI) / 180;
          const radL = (((angle - 8) * Math.PI) / 180);
          const radR = (((angle + 8) * Math.PI) / 180);

          const tipX = 50 + 24 * Math.cos(rad);
          const tipY = 50 + 24 * Math.sin(rad);
          const b1X = 50 + 8 * Math.cos(radL);
          const b1Y = 50 + 8 * Math.sin(radL);
          const b2X = 50 + 8 * Math.cos(radR);
          const b2Y = 50 + 8 * Math.sin(radR);

          return (
            <polygon
              key={`ray-${i}`}
              points={`${tipX},${tipY} ${b1X},${b1Y} 50,50 ${b2X},${b2Y}`}
              fill="currentColor"
              fillOpacity="0.85"
            />
          );
        })}
      </g>
    </svg>
  );
}

/**
 * Biểu tượng Chim Lạc cách điệu bay ngược chiều kim đồng hồ
 */
export function ChimLac({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M36 12C31 12 25 15 20 20C16 16 10 14 4 14C3 14 2 15 2 16C6 18 10 21 13 25C9 26 5 28 3 31C8 30 14 29 18 26C21 30 25 33 30 35C28 31 27 26 27 22C31 20 35 18 38 14C38 13 37 12 36 12Z"
        fill="currentColor"
      />
      <circle cx="33" cy="15" r="1.2" fill="#171411" />
      <path
        d="M20 20L32 14"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
    </svg>
  );
}

/**
 * Huy hiệu Trống Đồng Đông Sơn hoàn chỉnh (có cả mặt trời & chim Lạc sải cánh xung quanh)
 */
export function DongSonMedallion({ size = 56, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full flex items-center justify-center p-1 bg-gradient-to-b from-[#A87932] via-[#35251C] to-[#171411] border border-[#D5B46B]/60 shadow-[0_4px_16px_rgba(0,0,0,0.6)] ${className}`}
    >
      <DongSonSun size={size * 0.88} className="text-[#D5B46B]" glow />
    </div>
  );
}

/**
 * Hoa sen Việt Nam cách điệu
 */
export function LotusMotif({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Cánh sen trung tâm */}
      <path
        d="M12 3C12 3 8.5 8 8.5 13C8.5 16 10 18 12 18C14 18 15.5 16 15.5 13C15.5 8 12 3 12 3Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      {/* Cánh trái */}
      <path
        d="M8 8C8 8 4 11.5 4 15C4 17.5 5.5 19 8 18.5C9.5 16.5 9.8 14 9.8 14C8.5 12 8 8 8 8Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      {/* Cánh phải */}
      <path
        d="M16 8C16 8 20 11.5 20 15C20 17.5 18.5 19 16 18.5C14.5 16.5 14.2 14 14.2 14C15.5 12 16 8 16 8Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      {/* Đài sen */}
      <path
        d="M6 19.5C9 21 15 21 18 19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Đồng xu đồng cổ Việt Nam (với lỗ vuông chạm khắc góc)
 */
export function HeritageCoinIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1 1.5" strokeOpacity="0.7" />
      {/* Lỗ vuông trung tâm */}
      <rect x="9" y="9" width="6" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.2" fill="#171411" />
    </svg>
  );
}

/**
 * Vân mây cổ truyền thống Việt Nam
 */
export function HeritageCloud({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 40 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <path
        d="M6 18C4 18 2 16 2 14C2 12.2 3.3 10.7 5 10.3C5.5 6.7 8.5 4 12.2 4C14.5 4 16.5 5 17.8 6.7C19.2 4.4 21.8 3 24.8 3C29.2 3 32.8 6.6 32.8 11C32.8 11.3 32.7 11.7 32.6 12C35 12.4 36.8 14.5 36.8 17C36.8 19.8 34.6 22 31.8 22L7 22C4.2 22 2 19.8 2 17"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M12 18C14 18 16 16.5 16 15C16 13.5 14.5 12.5 13 13.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
