import React from 'react';
import { Switch } from '@/components/ui/switch';

interface PublishToggleProps {
    isPublished: boolean;
    onToggle: (e: React.MouseEvent) => void;
    label?: boolean; // Whether to show a label
}

export const PublishToggle: React.FC<PublishToggleProps> = ({
    isPublished,
    onToggle,
    label = true
}) => {
    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(e);
    };

    return (
        <div
            className='flex items-center justify-between gap-2'
            onClick={(e) => e.stopPropagation()}
        >
            {label && (
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                    {isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
                </span>
            )}
            <Switch
                checked={isPublished}
                onCheckedChange={() => { }}
                onClick={handleToggle}
            />
        </div>
    );
};