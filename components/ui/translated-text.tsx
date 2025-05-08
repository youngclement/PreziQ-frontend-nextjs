'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';

type TranslatedTextProps = {
    text: string;
    translationKey?: string;
    fallback?: string;
    className?: string;
    as?: React.ElementType;
};

/**
 * A utility component that automatically translates text
 * 
 * @param text - The default text (usually in English)
 * @param translationKey - The key to use for translation lookup
 * @param fallback - Fallback text if translation is not found
 * @param className - Optional CSS class
 * @param as - Element type to render as (default: span)
 */
export function TranslatedText({
    text,
    translationKey,
    fallback,
    className = '',
    as: Component = 'span',
}: TranslatedTextProps) {
    const { t } = useLanguage();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const key = translationKey || text;
    const translation = t(key);

    // Use the translation if it exists, otherwise use fallback or original text
    const displayText = translation !== key ? translation : fallback || text;

    return (
        <Component className={className} suppressHydrationWarning>
            {isClient ? displayText : text}
        </Component>
    );
}

/**
 * Higher-order component that adds translation capabilities to any component
 * that accepts a 'children' prop
 */
export function withTranslation<P extends { children?: React.ReactNode }>(
    Component: React.ComponentType<P>
) {
    return function WithTranslationComponent(props: P & { translationKey?: string }) {
        const { translationKey, children, ...rest } = props;
        const { t } = useLanguage();
        const [isClient, setIsClient] = useState(false);

        useEffect(() => {
            setIsClient(true);
        }, []);

        // Only try to translate if children is a simple string
        if (typeof children === 'string' && translationKey && isClient) {
            const translation = t(translationKey);
            return <Component {...(rest as P)}>{translation}</Component>;
        }

        return <Component {...(rest as P)}>{children}</Component>;
    };
}

export default TranslatedText;
