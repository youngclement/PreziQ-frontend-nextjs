'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
	children: React.ReactNode;
	className?: string;
	contentClassName?: string;
}

export default function LongText({
	children,
	className = '',
	contentClassName = '',
}: Props) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<div className="hidden sm:block">
				<TooltipProvider delayDuration={0}>
					<Tooltip open={isOpen} onOpenChange={setIsOpen}>
						<TooltipTrigger asChild>
							<div className={cn('truncate cursor-help', className)}>
								{children}
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p className={contentClassName}>{children}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			{/* <div className="sm:hidden">
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<div className={cn('truncate cursor-help', className)}>
							{children}
						</div>
					</PopoverTrigger>
					<PopoverContent className={cn('w-fit', contentClassName)}>
						<p>{children}</p>
					</PopoverContent>
				</Popover>
			</div> */}
		</>
	);
}
