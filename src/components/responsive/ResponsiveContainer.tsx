import React from 'react';
import { cn } from '@/lib/utils';
import { useDeviceType } from '@/hooks/useDeviceType';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = {
    mobile: 'full',
    tablet: '4xl',
    desktop: '7xl'
  },
  padding = {
    mobile: '4',
    tablet: '6',
    desktop: '8'
  }
}) => {
  const deviceType = useDeviceType();

  const getMaxWidth = () => {
    switch (deviceType) {
      case 'mobile':
        return `max-w-${maxWidth.mobile}`;
      case 'tablet':
        return `max-w-${maxWidth.tablet}`;
      case 'desktop':
        return `max-w-${maxWidth.desktop}`;
      default:
        return 'max-w-7xl';
    }
  };

  const getPadding = () => {
    switch (deviceType) {
      case 'mobile':
        return `p-${padding.mobile}`;
      case 'tablet':
        return `p-${padding.tablet}`;
      case 'desktop':
        return `p-${padding.desktop}`;
      default:
        return 'p-8';
    }
  };

  return (
    <div className={cn(
      'container mx-auto',
      getMaxWidth(),
      getPadding(),
      className
    )}>
      {children}
    </div>
  );
};