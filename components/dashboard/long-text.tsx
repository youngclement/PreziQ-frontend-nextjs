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
	maxLength?: number;
}

export default function LongText({
	children,
	className = '',
	contentClassName = '',
	maxLength = 30,
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const text = typeof children === 'string' ? children : String(children || '');
	const isTruncated = text.length > maxLength;

	const truncatedText = isTruncated
		? `${text.substring(0, maxLength)}...`
		: text;

	// Nếu văn bản không dài, không cần tooltip/popover
	if (!isTruncated) {
		return <div className={className}>{text}</div>;
	}

	return (
		<>
			<div className="hidden sm:block">
				<TooltipProvider delayDuration={300}>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn('truncate max-w-[200px] cursor-help', className)}
							>
								{text}
							</div>
						</TooltipTrigger>
						<TooltipContent side="top" className="max-w-[300px] break-words">
							<p className={contentClassName}>{text}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<div className="sm:hidden">
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<div
							className={cn('truncate max-w-[150px] cursor-help', className)}
						>
							{truncatedText}
						</div>
					</PopoverTrigger>
					<PopoverContent className={cn('w-[280px] p-2', contentClassName)}>
						<p className="break-words">{text}</p>
					</PopoverContent>
				</Popover>
			</div>
		</>
	);
}
