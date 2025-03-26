'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '@/lib/utils';

const Collapse = CollapsiblePrimitive.Root as React.FC<
	CollapsiblePrimitive.CollapsibleProps & {
		onOpenChange?: (open: boolean) => void;
	}
>;

const CollapseTrigger = React.forwardRef<
	React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<CollapsiblePrimitive.Trigger
		ref={ref}
		className={cn('flex w-full', className)}
		{...props}
	>
		{children}
	</CollapsiblePrimitive.Trigger>
));
CollapseTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

const CollapseContent = React.forwardRef<
	React.ElementRef<typeof CollapsiblePrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
	<CollapsiblePrimitive.Content
		ref={ref}
		className={cn(
			'data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down',
			className
		)}
		{...props}
	>
		{children}
	</CollapsiblePrimitive.Content>
));
CollapseContent.displayName = CollapsiblePrimitive.Content.displayName;

export { Collapse, CollapseContent, CollapseTrigger };
