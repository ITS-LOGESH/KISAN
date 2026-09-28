import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "We couldn't load this information.",
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-3xl border border-[#FDE68A] bg-[#FFFBEB] p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-3 max-w-md mx-auto ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-[#B45309]">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-serif font-bold text-base text-[#1C1510]">
          {message}
        </h4>
        <p className="text-xs text-[#6B5E51] font-light mt-0.5">
          Please check your connection and try again.
        </p>
      </div>

      {onRetry && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
