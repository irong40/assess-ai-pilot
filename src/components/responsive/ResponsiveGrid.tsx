import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveValue } from '@/hooks/useDeviceType';
import { GridColumns } from '@/types/analytics';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns: GridColumns;
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  gap = '4',
  className
}) => {
  const currentColumns = useResponsiveValue(columns, 1);

  const getGridCols = (cols: number) => {
    switch (cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      case 5: return 'grid-cols-5';
      case 6: return 'grid-cols-6';
      default: return 'grid-cols-1';
    }
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(currentColumns),
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  );
};