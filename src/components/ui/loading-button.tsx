import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingText?: React.ReactNode;
};

export default function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={className}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
