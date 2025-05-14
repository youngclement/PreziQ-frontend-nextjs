import { useState } from 'react';
import Image from 'next/image';

// Define mapping for topic icons (These will be placeholders until you add real icons)
const topicIcons: Record<string, string> = {
	"Start": "/images/icons/navigation/placeholder.svg",
	"Art & Literature": "/images/icons/navigation/placeholder.svg",
	"Entertainment": "/images/icons/navigation/placeholder.svg",
	"Geography": "/images/icons/navigation/placeholder.svg",
	"History": "/images/icons/navigation/placeholder.svg",
	"Languages": "/images/icons/navigation/placeholder.svg",
	"Science & Nature": "/images/icons/navigation/placeholder.svg",
	"Sports": "/images/icons/navigation/placeholder.svg",
	"Trivia": "/images/icons/navigation/placeholder.svg",
};

// Get a generic icon for topics without a specific icon
const getTopicIcon = (topic: string): string => {
	if (topicIcons[topic]) return topicIcons[topic];

	// Return a generic icon for topics without a specific icon
	return "/images/icons/navigation/placeholder.svg";
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

	return (
		<div className="w-full overflow-x-auto pb-4">
			<div className="md:flex-row md:space-y-0 flex flex-col justify-between w-full space-y-2 font-sans text-base text-left text-black">
				{allTopics.map((topic) => (
					<a
						key={topic}
						onClick={(e) => {
							e.preventDefault();
							onTopicChange?.(topic === "All Topics" ? "" : topic);
						}}
						className="whitespace-nowrap group font-roboto md:flex-col md:space-x-0 flex flex-row items-center space-x-3 cursor-pointer"
						href="#"
					>
						<div className="relative md:w-9 md:h-9 w-5 h-5 flex items-center justify-center">
							{topic !== "All Topics" ? (
								<img
									src={getTopicIcon(topic)}
									alt={topic}
									className="md:w-9 md:h-9 w-5 h-5"
									draggable="false"
								/>
							) : (
								<div className="md:w-9 md:h-9 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
									<span className="text-xs font-bold">All</span>
								</div>
							)}
						</div>

						<div
							className={`pb-1 md:text-xs text-base font-bold leading-snug transition-opacity group-hover:opacity-100 ${(selectedTopic === topic) || (topic === "All Topics" && selectedTopic === "") ? "opacity-100" : "opacity-60"
								}`}
						>
							{topic}
						</div>

						<div
							className={`w-full group-hover:opacity-100 transition-opacity h-1 bg-black rounded-full hidden md:block ${(selectedTopic === topic) || (topic === "All Topics" && selectedTopic === "") ? "opacity-100" : "opacity-0"
								}`}
						></div>
					</a>
				))}
			</div>
		</div>
	);
}
