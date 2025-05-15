import { useState, useRef } from 'react';
import Image from 'next/image';
import {
	BookText, Film, Globe, History, Languages, Beaker,
	Trophy, HelpCircle, Layers, Hash, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTheme } from 'next-themes';

// Define mapping for topic icons with Lucide icons
const TopicIcon = ({ topic, className }: { topic: string, className?: string }) => {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';

	// Base styling for all icons
	const baseClasses = `${className || ''} ${isDark ? 'text-white' : 'text-black'} transition-colors`;

	// Custom colors for each topic
	const topicColors: Record<string, { light: string, dark: string }> = {
		"All Topics": { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900 text-indigo-300" },
		"Art & Literature": { light: "text-purple-600", dark: "text-purple-400" },
		"Entertainment": { light: "text-pink-600", dark: "text-pink-400" },
		"Geography": { light: "text-green-600", dark: "text-green-400" },
		"History": { light: "text-amber-600", dark: "text-amber-400" },
		"Languages": { light: "text-blue-600", dark: "text-blue-400" },
		"Science & Nature": { light: "text-teal-600", dark: "text-teal-400" },
		"Sports": { light: "text-red-600", dark: "text-red-400" },
		"Trivia": { light: "text-violet-600", dark: "text-violet-400" },
	};

	// Get topic-specific colors
	const colorClass = topic in topicColors
		? isDark ? topicColors[topic].dark : topicColors[topic].light
		: isDark ? "text-gray-300" : "text-gray-700";

	const iconClass = `${baseClasses} ${colorClass}`;

	// Return the appropriate icon based on topic
	switch (topic) {
		case "Art & Literature":
			return <BookText className={iconClass} />;
		case "Entertainment":
			return <Film className={iconClass} />;
		case "Geography":
			return <Globe className={iconClass} />;
		case "History":
			return <History className={iconClass} />;
		case "Languages":
			return <Languages className={iconClass} />;
		case "Science & Nature":
			return <Beaker className={iconClass} />;
		case "Sports":
			return <Trophy className={iconClass} />;
		case "Trivia":
			return <HelpCircle className={iconClass} />;
		case "All Topics":
			return <Layers className={iconClass} />;
		default:
			return <Hash className={iconClass} />;
	}
};

interface CollectionFiltersProps {
	topics?: string[];
	selectedTopic?: string;
	onTopicChange?: (topic: string) => void;
}

export function CollectionFilters({
	topics = [],
	selectedTopic,
	onTopicChange,
}: CollectionFiltersProps) {
	// Add "All Topics" as the first item in our list
	const allTopics = ["All Topics", ...topics];
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === 'dark';
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const scrollLeft = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
		}
	};

	const scrollRight = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
		}
	};

	return (
		<div className="w-full relative">
			{/* Scroll buttons */}
			<button
				onClick={scrollLeft}
				className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md md:hidden`}
			>
				<ChevronLeft className="w-5 h-5" />
			</button>

			<button
				onClick={scrollRight}
				className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md md:hidden`}
			>
				<ChevronRight className="w-5 h-5" />
			</button>

			{/* Main scrollable container */}
			<div
				ref={scrollContainerRef}
				className="w-full overflow-x-auto pb-4 hide-scrollbar px-6 md:px-2 flex-nowrap"
				style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
			>
				<div className="flex flex-row flex-nowrap space-x-6 md:space-x-4 whitespace-nowrap min-w-max">
					{allTopics.map((topic) => {
						const isSelected = (selectedTopic === topic) || (topic === "All Topics" && selectedTopic === "");

						return (
							<a
								key={topic}
								onClick={(e) => {
									e.preventDefault();
									onTopicChange?.(topic === "All Topics" ? "" : topic);
								}}
								className="flex flex-col items-center justify-center cursor-pointer flex-shrink-0"
								href="#"
							>
								<div className={`relative md:w-12 md:h-12 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isSelected
									? isDark
										? 'bg-gray-800 shadow-inner shadow-gray-700'
										: 'bg-gray-100 shadow-inner shadow-gray-200'
									: isDark
										? 'bg-gray-900'
										: 'bg-white'
									}`}>
									<TopicIcon
										topic={topic}
										className="md:w-6 md:h-6 w-5 h-5"
									/>
								</div>

								<div
									className={`mt-2 md:text-xs text-sm font-bold text-center transition-opacity group-hover:opacity-100 ${isSelected ? "opacity-100" : "opacity-60"
										} ${isDark ? 'text-white' : 'text-black'}`}
								>
									{topic}
								</div>

								<div
									className={`w-full max-w-[48px] mt-1 transition-opacity h-1 rounded-full ${isSelected
										? "opacity-100"
										: "opacity-0"
										} ${topic in {
											"Art & Literature": true,
											"Entertainment": true,
											"Geography": true,
											"History": true,
											"Languages": true,
											"Science & Nature": true,
											"Sports": true,
											"Trivia": true,
											"All Topics": true,
										}
											? isDark
												? `bg-${topic === "All Topics" ? "indigo" : topic === "Art & Literature" ? "purple" : topic === "Entertainment" ? "pink" : topic === "Geography" ? "green" : topic === "History" ? "amber" : topic === "Languages" ? "blue" : topic === "Science & Nature" ? "teal" : topic === "Sports" ? "red" : "violet"}-400`
												: `bg-${topic === "All Topics" ? "indigo" : topic === "Art & Literature" ? "purple" : topic === "Entertainment" ? "pink" : topic === "Geography" ? "green" : topic === "History" ? "amber" : topic === "Languages" ? "blue" : topic === "Science & Nature" ? "teal" : topic === "Sports" ? "red" : "violet"}-600`
											: isDark
												? "bg-gray-400"
												: "bg-gray-600"
										}`}
								></div>
							</a>
						);
					})}
				</div>
			</div>

			{/* CSS for hiding scrollbar */}
			<style jsx>{`
				.hide-scrollbar::-webkit-scrollbar {
					display: none;
				}
			`}</style>
		</div>
	);
}
