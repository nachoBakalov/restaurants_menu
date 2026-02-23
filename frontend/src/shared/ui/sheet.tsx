import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from './cn';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-black/40', className)}
    {...props}
    ref={ref}
  />
));

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn('fixed inset-y-0 left-0 z-50 w-72 border-r bg-background p-4 shadow-lg', className)}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2', className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-base font-semibold', className)} {...props} />
));

SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
SheetContent.displayName = SheetPrimitive.Content.displayName;
SheetTitle.displayName = SheetPrimitive.Title.displayName;

export { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger };
