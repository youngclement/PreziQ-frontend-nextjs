import React from 'react';
import ScrollBaseAnimation from '../clement-kit-ui/text-marquee';

function TextMarqueeSection() {
    return (
        <>
            <div className='h-[500px] grid place-content-center'>
                <ScrollBaseAnimation
                    delay={500}
                    baseVelocity={-3}
                    clasname='font-bold tracking-[-0.07em] leading-[90%] text-primary'
                >
                    Create Impressive Presentations with PreziQ
                </ScrollBaseAnimation>
                <ScrollBaseAnimation
                    delay={500}
                    baseVelocity={3}
                    clasname='font-bold tracking-[-0.07em] leading-[90%] text-primary/75'
                >
                    Engage Your Audience • Deliver Your Message • Stand Out
                </ScrollBaseAnimation>
            </div>
        </>
    );
}

export default TextMarqueeSection;