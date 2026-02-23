import * as React from 'react';
import { cn } from './cn';

const Label = React.forwardRef<HTMLLabelElement, React.ComponentProps<'label'>>(({ className, ...props }, ref) => {
  return <label ref={ref} className={cn('text-sm font-medium leading-none', className)} {...props} />;
});

Label.displayName = 'Label';

export { Label };
