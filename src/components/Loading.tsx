
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const Loading = ({ 
  size = 'md', 
  text = 'Loading...', 
  className,
  fullScreen = false 
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4",
      fullScreen && "min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900",
      className
    )}>
      <div className="flex items-center space-x-3">
        <Shield className={cn(
          sizeClasses[size],
          fullScreen ? "text-blue-400" : "text-blue-600",
          "animate-pulse"
        )} />
        <div className={cn(
          "animate-spin rounded-full border-2 border-t-transparent",
          sizeClasses[size],
          fullScreen ? "border-blue-400" : "border-blue-600"
        )} />
      </div>
      {text && (
        <p className={cn(
          textSizeClasses[size],
          fullScreen ? "text-white" : "text-slate-600"
        )}>
          {text}
        </p>
      )}
    </div>
  );

  return content;
};

export default Loading;
