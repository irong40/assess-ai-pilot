import React from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDeviceType } from '@/hooks/useDeviceType';

export const DeviceTypeIndicator: React.FC = () => {
  const deviceType = useDeviceType();

  const getIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-3 w-3" />;
      case 'tablet':
        return <Tablet className="h-3 w-3" />;
      case 'desktop':
        return <Monitor className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (deviceType) {
      case 'mobile':
        return 'secondary';
      case 'tablet':
        return 'outline';
      case 'desktop':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant()} className="hidden sm:flex items-center gap-1">
      {getIcon()}
      <span className="capitalize text-xs">{deviceType}</span>
    </Badge>
  );
};