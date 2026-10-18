import React from 'react';
import { Currency } from '../utils/stopLossEngine';

export const RupeeIcon: React.FC<{ className?: string }> = ({
  className = 'w-[0.8em] h-[0.8em] inline-block shrink-0',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`${className} -mt-0.5 mr-0.5`}
    aria-hidden="true"
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13l8.5 8" />
    <path d="M6 13h3a4 4 0 0 0 0-8" />
  </svg>
);

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  compact?: boolean;
  className?: string;
  suffix?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  compact = false,
  className = '',
  suffix = '',
}) => {
  if (currency === 'USD') {
    let formatted = Math.round(amount).toLocaleString('en-US');
    if (compact) {
      if (Math.abs(amount) >= 1000000) formatted = `${(amount / 1000000).toFixed(1)}M`;
      else if (Math.abs(amount) >= 1000) formatted = `${(amount / 1000).toFixed(1)}k`;
    }
    return (
      <span className={className}>
        ${formatted}
        {suffix}
      </span>
    );
  }

  // INR
  let formatted = Math.round(amount).toLocaleString('en-IN');
  if (compact) {
    if (Math.abs(amount) >= 10000000) formatted = `${(amount / 10000000).toFixed(1)} Cr`;
    else if (Math.abs(amount) >= 100000) formatted = `${(amount / 100000).toFixed(1)}L`;
    else if (Math.abs(amount) >= 1000) formatted = `${(amount / 1000).toFixed(1)}k`;
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <RupeeIcon />
      <span>
        {formatted}
        {suffix}
      </span>
    </span>
  );
};
