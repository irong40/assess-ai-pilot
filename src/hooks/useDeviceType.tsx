import { useState, useEffect } from 'react';
import { DeviceType, ResponsiveBreakpoints } from '@/types/analytics';

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
};

export function useDeviceType(customBreakpoints?: Partial<ResponsiveBreakpoints>): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints };

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.mobile) {
        setDeviceType('mobile');
      } else if (width < breakpoints.tablet) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Set initial value
    updateDeviceType();

    // Listen for window resize
    window.addEventListener('resize', updateDeviceType);
    
    return () => window.removeEventListener('resize', updateDeviceType);
  }, [breakpoints]);

  return deviceType;
}

export function useResponsiveValue<T>(values: { mobile?: T; tablet?: T; desktop?: T }, defaultValue: T): T {
  const deviceType = useDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return values.mobile ?? values.tablet ?? values.desktop ?? defaultValue;
    case 'tablet':
      return values.tablet ?? values.desktop ?? defaultValue;
    case 'desktop':
      return values.desktop ?? defaultValue;
    default:
      return defaultValue;
  }
}