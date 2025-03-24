'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
	links: {
		title: string;
		href: string;
		isActive: boolean;
		disabled?: boolean;
	}[];
}

export function TopNav({ className, links, ...props }: TopNavProps) {
	const pathname = usePathname();
	return (
		<>
			<div className="md:hidden">
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<Button size="icon" variant="outline">
							<Menu />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="bottom" align="start">
						{links.map(({ title, href, isActive, disabled }) => (
							<DropdownMenuItem key={`${title}-${href}`} asChild>
								{disabled ? (
									<span className="text-muted-foreground cursor-not-allowed">
										{title}
									</span>
								) : (
									<Link
										href={href}
										className={!isActive ? 'text-muted-foreground' : ''}
									>
										{title}
									</Link>
								)}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<nav
				className={cn(
					'hidden items-center space-x-4 md:flex lg:space-x-6',
					className
				)}
				{...props}
			>
				{links.map(({ title, href, isActive, disabled }) => (
					<Link
						key={`${title}-${href}`}
						href={href}
						className={cn(
							'text-sm font-medium transition-colors hover:text-primary',
							pathname === href ? 'text-foreground' : 'text-foreground/60'
						)}
					>
						{title}
					</Link>
				))}
			</nav>
		</>
	);
}
