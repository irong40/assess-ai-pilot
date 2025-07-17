import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeviceType } from '@/hooks/useDeviceType';
import { cn } from '@/lib/utils';

interface AdaptiveCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export const AdaptiveCard: React.FC<AdaptiveCardProps> = ({
  title,
  subtitle,
  children,
  className,
  variant = 'default'
}) => {
  const deviceType = useDeviceType();

  const getCardPadding = () => {
    switch (deviceType) {
      case 'mobile':
        return 'p-3';
      case 'tablet':
        return 'p-4';
      case 'desktop':
        return 'p-6';
      default:
        return 'p-6';
    }
  };

  const getHeaderPadding = () => {
    switch (deviceType) {
      case 'mobile':
        return 'pb-2';
      case 'tablet':
        return 'pb-3';
      case 'desktop':
        return 'pb-4';
      default:
        return 'pb-4';
    }
  };

  const cardVariants = {
    default: 'bg-card text-card-foreground border',
    outline: 'border-2 bg-transparent',
    ghost: 'border-0 shadow-none bg-transparent'
  };

  return (
    <Card className={cn(
      cardVariants[variant],
      'w-full',
      className
    )}>
      {(title || subtitle) && (
        <CardHeader className={cn(getHeaderPadding())}>
          {title && (
            <CardTitle className={cn(
              deviceType === 'mobile' ? 'text-lg' : 'text-xl'
            )}>
              {title}
            </CardTitle>
          )}
          {subtitle && (
            <p className={cn(
              'text-muted-foreground',
              deviceType === 'mobile' ? 'text-xs' : 'text-sm'
            )}>
              {subtitle}
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(getCardPadding())}>
        {children}
      </CardContent>
    </Card>
  );
};