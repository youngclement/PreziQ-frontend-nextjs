import React from 'react';
import ScrollBaseAnimation from '../clement-kit-ui/text-marquee';
import { useLanguage } from '@/contexts/language-context';

function TextMarqueeSection() {
    const { t } = useLanguage();

    return (
        <>
            <div className='h-[500px] grid place-content-center'>
                <ScrollBaseAnimation
                    delay={500}
                    baseVelocity={-3}
                    clasname='font-bold tracking-[-0.07em] leading-[90%] text-primary'
                >
                    {t('marqueeTextFirst')}
                </ScrollBaseAnimation>
                <ScrollBaseAnimation
                    delay={500}
                    baseVelocity={3}
                    clasname='font-bold tracking-[-0.07em] leading-[90%] text-primary/75'
                >
                    {t('marqueeTextSecond')}
                </ScrollBaseAnimation>
            </div>
        </>
    );
}

export default TextMarqueeSection;