'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';
import Cookies from 'js-cookie';

// Define the language context type
type LanguageContextType = {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
};

// Create the language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the props for the language provider
type LanguageProviderProps = {
    children: ReactNode;
};

// Initialize i18next
i18next
    .use(I18nextBrowserLanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        detection: {
            order: ['cookie', 'localStorage', 'navigator'],
            caches: ['cookie'],
        },
        resources: {
            en: {
                translation: {
                    // Navigation
                    "features": "Features",
                    "useCase": "Use Cases",
                    "pricing": "Pricing",
                    "achievements": "Achievements",
                    "testimonials": "Testimonials",
                    "faq": "FAQ",
                    "blog": "Blog",
                    "signIn": "Sign In",
                    "signUp": "Sign Up Free",

                    // Features submenu
                    "aiPresentationBuilder": "AI Presentation Builder",
                    "designTemplates": "Design Templates",
                    "realtimeCollaboration": "Real-time Collaboration",

                    // Use Cases submenu
                    "marketingTeams": "Marketing Teams",
                    "salesProfessionals": "Sales Professionals",
                    "education": "Education",

                    // Hero Section
                    "heroTitle": "Present Like a",
                    "presentationTitle": "Professional",
                    "heroSubtitle": "Design stunning presentations in minutes with our AI-powered tools",
                    "getStarted": "Get Started",
                    "learnMore": "Learn More",

                    // Features Section
                    "featuresTitle": "Powerful Features",
                    "featureOneTitle": "Engage Your Audience with Interactive Slides",
                    "featureOneDesc": "Create dynamic presentations that captivate your audience with interactive elements, polls, and real-time feedback.",
                    "featureTwoTitle": "Game-Based Learning Made Simple",
                    "featureTwoDesc": "Turn any presentation into an engaging quiz game similar to Kahoot, with leaderboards and team competitions.",
                    "featureThreeTitle": "Elevate Your Presentations with PreziQ's Game-Based Learning Tools",
                    "featureThreeDesc": "Join thousands of educators and presenters who have transformed their content using our interactive presentation and game-based learning platform.",

                    // Testimonials Section
                    "testimonialsTitle": "What Our Users Say",
                    "testimonialDesc": "Thousands of teams and individuals trust PreziQ",
                    "testimonialAuthor1": "Sarah Johnson",
                    "testimonialRole1": "Marketing Director",
                    "testimonialText1": "PreziQ transformed our marketing presentations. The AI features saved us countless hours and the interactive elements keep our audience engaged.",
                    "testimonialAuthor2": "Michael Chen",
                    "testimonialRole2": "University Professor",
                    "testimonialText2": "The game-based learning features have completely changed how I teach. My students are more engaged and retain information better.",
                    "testimonialAuthor3": "Emily Rodriguez",
                    "testimonialRole3": "Sales Executive",
                    "testimonialText3": "Our conversion rates have increased by 40% since we started using PreziQ for sales presentations. The interactive features make all the difference.",

                    // Text Marquee Section
                    "trustedBy": "Trusted by innovative companies worldwide",

                    // Newsletter Section
                    "newsletterTitle": "Stay Updated",
                    "newsletterDesc": "Subscribe to our newsletter to get the latest updates",
                    "emailPlaceholder": "Enter your email",
                    "subscribe": "Subscribe",
                    "privacyStatement": "We respect your privacy. Unsubscribe at any time.",

                    // Demo UI Section
                    "demoTitle": "Try it Yourself",
                    "demoSubtitle": "See how easy it is to create interactive presentations",
                    "demoButton": "View Demo",

                    // FAQ Section
                    "faqTitle": "Frequently Asked Questions",
                    "faqDesc": "Find answers to common questions",
                    "faq1Question": "How does the AI presentation builder work?",
                    "faq1Answer": "Our AI analyzes your content and automatically generates professional slides with appropriate layouts, graphics, and transitions based on your text input.",
                    "faq2Question": "Can I collaborate with my team in real-time?",
                    "faq2Answer": "Yes! Multiple team members can work on the same presentation simultaneously with all changes synced in real-time.",
                    "faq3Question": "How do the interactive game features work?",
                    "faq3Answer": "You can transform any presentation into an interactive quiz or game. Participants join using their mobile devices and compete in real-time.",
                    "faq4Question": "Is there a free plan available?",
                    "faq4Answer": "Yes, we offer a free tier with basic features. Premium plans unlock advanced AI capabilities and interactive elements.",
                    "faq5Question": "Can I import existing PowerPoint presentations?",
                    "faq5Answer": "Absolutely! You can import PowerPoint files and enhance them with PreziQ's interactive features and AI improvements.",
                    "viewAllFaqs": "View all FAQs",
                    "stillHaveQuestions": "Still have questions?",
                    "cantFindAnswer": "Can't find the answer you're looking for? Please chat with our friendly team.",
                    "chatWithSupport": "Chat with Support",

                    // Footer
                    "footerTitle": "PreziQ",
                    "footerDesc": "The AI-powered presentation platform",
                    "company": "Company",
                    "about": "About",
                    "careers": "Careers",
                    "contact": "Contact",
                    "legal": "Legal",
                    "privacy": "Privacy Policy",
                    "terms": "Terms of Service",
                    "copyright": "© 2023 PreziQ. All rights reserved.",

                    // User Auth
                    "email": "Email",
                    "password": "Password",
                    "forgotPassword": "Forgot Password?",
                    "dontHaveAccount": "Don't have an account?",
                    "alreadyHaveAccount": "Already have an account?",
                    "createAccount": "Create Account",
                    "name": "Name",
                    "confirmPassword": "Confirm Password",

                    // Language Switcher
                    "selectLanguage": "Select language",
                    "changeLanguage": "Change language",

                    // Navigation Compact Mode
                    "showMenu": "Show Menu",
                    "hideMenu": "Hide Menu",

                    // Common
                    "loading": "Loading...",
                    "save": "Save",
                    "cancel": "Cancel",
                    "delete": "Delete",
                    "edit": "Edit",
                    "back": "Back",
                    "next": "Next",
                    "submit": "Submit",
                    "search": "Search for presentations...",
                    "filterBy": "Filter by",
                    "sortBy": "Sort by"
                }
            },
            vi: {
                translation: {
                    // Navigation
                    "features": "Tính năng",
                    "useCase": "Trường hợp sử dụng",
                    "pricing": "Bảng giá",
                    "achievements": "Thành tựu",
                    "testimonials": "Đánh giá",
                    "faq": "Câu hỏi thường gặp",
                    "blog": "Blog",
                    "signIn": "Đăng nhập",
                    "signUp": "Đăng ký miễn phí",

                    // Features submenu
                    "aiPresentationBuilder": "Công cụ tạo bài thuyết trình AI",
                    "designTemplates": "Mẫu thiết kế",
                    "realtimeCollaboration": "Cộng tác thời gian thực",

                    // Use Cases submenu
                    "marketingTeams": "Đội ngũ tiếp thị",
                    "salesProfessionals": "Chuyên viên bán hàng",
                    "education": "Giáo dục",

                    // Hero Section
                    "heroTitle": "Thuyết trình như một",
                    "presentationTitle": "Chuyên gia",
                    "heroSubtitle": "Thiết kế bài thuyết trình tuyệt đẹp trong vài phút với công cụ AI của chúng tôi",
                    "getStarted": "Bắt đầu ngay",
                    "learnMore": "Tìm hiểu thêm",

                    // Features Section
                    "featuresTitle": "Tính năng mạnh mẽ",
                    "featureOneTitle": "Thu hút khán giả với Slides tương tác",
                    "featureOneDesc": "Tạo bài thuyết trình năng động thu hút khán giả với các yếu tố tương tác, bình chọn và phản hồi thời gian thực.",
                    "featureTwoTitle": "Học tập dựa trên trò chơi thật đơn giản",
                    "featureTwoDesc": "Biến bất kỳ bài thuyết trình nào thành trò chơi câu đỏi hấp dẫn tương tự như Kahoot, với bảng xếp hạng và thi đấu đồng đội.",
                    "featureThreeTitle": "Nâng cao bài thuyết trình của bạn với công cụ học tập trò chơi của PreziQ",
                    "featureThreeDesc": "Tham gia cùng hàng ngàn giáo viên và người thuyết trình đã cải thiện nội dung của họ bằng nền tảng thuyết trình tương tác và học tập dựa trên trò chơi của chúng tôi.",

                    // Testimonials Section
                    "testimonialsTitle": "Người dùng nói gì về chúng tôi",
                    "testimonialDesc": "Hàng ngàn đội nhóm và cá nhân tin tưởng PreziQ",
                    "testimonialAuthor1": "Sarah Johnson",
                    "testimonialRole1": "Giám đốc Marketing",
                    "testimonialText1": "PreziQ đã cải thiện hoàn toàn bài thuyết trình marketing của chúng tôi. Các tính năng AI tiết kiệm rất nhiều thời gian và các yếu tố tương tác giúp khán giả tập trung hơn.",
                    "testimonialAuthor2": "Michael Chen",
                    "testimonialRole2": "Giáo sư Đại học",
                    "testimonialText2": "Các tính năng học tập dựa trên trò chơi đã thay đổi hoàn toàn cách tôi giảng dạy. Sinh viên của tôi hứng thú hơn và ghi nhớ thông tin tốt hơn.",
                    "testimonialAuthor3": "Emily Rodriguez",
                    "testimonialRole3": "Giám đốc Bán hàng",
                    "testimonialText3": "Tỷ lệ chuyển đổi của chúng tôi đã tăng 40% kể từ khi bắt đầu sử dụng PreziQ cho các bài thuyết trình bán hàng. Các tính năng tương tác tạo nên sự khác biệt.",

                    // Text Marquee Section
                    "trustedBy": "Được tin dùng bởi các công ty đổi mới trên toàn thế giới",

                    // Newsletter Section
                    "newsletterTitle": "Cập nhật thông tin",
                    "newsletterDesc": "Đăng ký nhận bản tin để nhận thông tin cập nhật mới nhất",
                    "emailPlaceholder": "Nhập email của bạn",
                    "subscribe": "Đăng ký",
                    "privacyStatement": "Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.",

                    // Demo UI Section
                    "demoTitle": "Hãy thử nó",
                    "demoSubtitle": "Xem thử cách tạo bài thuyết trình tương tác dễ dàng như thế nào",
                    "demoButton": "Xem Demo",

                    // FAQ Section
                    "faqTitle": "Câu hỏi thường gặp",
                    "faqDesc": "Tìm câu trả lời cho các câu hỏi phổ biến",
                    "faq1Question": "Công cụ tạo bài thuyết trình AI hoạt động như thế nào?",
                    "faq1Answer": "AI của chúng tôi phân tích nội dung của bạn và tự động tạo các slide chuyên nghiệp với bố cục, đồ họa và hiệu ứng chuyển tiếp phù hợp dựa trên đầu vào văn bản của bạn.",
                    "faq2Question": "Tôi có thể cộng tác với nhóm của mình theo thời gian thực không?",
                    "faq2Answer": "Có! Nhiều thành viên trong nhóm có thể làm việc trên cùng một bài thuyết trình cùng một lúc với tất cả các thay đổi được đồng bộ hóa theo thời gian thực.",
                    "faq3Question": "Các tính năng trò chơi tương tác hoạt động như thế nào?",
                    "faq3Answer": "Bạn có thể chuyển đổi bất kỳ bài thuyết trình nào thành bài kiểm tra hoặc trò chơi tương tác. Người tham gia tham gia bằng thiết bị di động và cạnh tranh theo thời gian thực.",
                    "faq4Question": "Có gói miễn phí không?",
                    "faq4Answer": "Có, chúng tôi cung cấp gói miễn phí với các tính năng cơ bản. Các gói cao cấp mở khóa khả năng AI nâng cao và các yếu tố tương tác.",
                    "faq5Question": "Tôi có thể nhập các bài thuyết trình PowerPoint hiện có không?",
                    "faq5Answer": "Tất nhiên! Bạn có thể nhập tệp PowerPoint và nâng cao chúng với các tính năng tương tác và cải tiến AI của PreziQ.",
                    "viewAllFaqs": "Xem tất cả các câu hỏi thường gặp",
                    "stillHaveQuestions": "Vẫn còn thắc mắc?",
                    "cantFindAnswer": "Không thể tìm thấy câu trả lời bạn đang tìm kiếm? Vui lòng trò chuyện với đội ngũ hỗ trợ của chúng tôi.",
                    "chatWithSupport": "Trò chuyện với hỗ trợ",

                    // Footer
                    "footerTitle": "PreziQ",
                    "footerDesc": "Nền tảng thuyết trình được hỗ trợ bởi AI",
                    "company": "Công ty",
                    "about": "Giới thiệu",
                    "careers": "Tuyển dụng",
                    "contact": "Liên hệ",
                    "legal": "Pháp lý",
                    "privacy": "Chính sách bảo mật",
                    "terms": "Điều khoản sử dụng",
                    "copyright": "© 2023 PreziQ. Đã đăng ký bản quyền.",

                    // User Auth
                    "email": "Email",
                    "password": "Mật khẩu",
                    "forgotPassword": "Quên mật khẩu?",
                    "dontHaveAccount": "Chưa có tài khoản?",
                    "alreadyHaveAccount": "Đã có tài khoản?",
                    "createAccount": "Tạo tài khoản",
                    "name": "Tên",
                    "confirmPassword": "Xác nhận mật khẩu",

                    // Language Switcher
                    "selectLanguage": "Chọn ngôn ngữ",
                    "changeLanguage": "Thay đổi ngôn ngữ",

                    // Navigation Compact Mode
                    "showMenu": "Hiện menu",
                    "hideMenu": "Ẩn menu",

                    // Common
                    "loading": "Đang tải...",
                    "save": "Lưu",
                    "cancel": "Hủy",
                    "delete": "Xóa",
                    "edit": "Chỉnh sửa",
                    "back": "Quay lại",
                    "next": "Tiếp theo",
                    "submit": "Gửi",
                    "search": "Tìm kiếm bài thuyết trình...",
                    "filterBy": "Lọc theo",
                    "sortBy": "Sắp xếp theo"
                }
            }
        },
        interpolation: {
            escapeValue: false
        }
    });

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
    const { t } = useTranslation();
    const [isClient, setIsClient] = useState(false);
    const [language, setLanguageState] = useState('en'); // Default to English server-side

    useEffect(() => {
        // Mark that we're on the client side
        setIsClient(true);

        // Set initial language from cookie or default to English
        const currentLang = Cookies.get('i18next') || 'en';
        i18next.changeLanguage(currentLang);
        setLanguageState(currentLang);
    }, []);

    const setLanguage = (lang: string) => {
        i18next.changeLanguage(lang);
        setLanguageState(lang);
        Cookies.set('i18next', lang);
    };

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            t: (key: string) => isClient ? t(key) : key.startsWith('features') ? 'Features' : t(key)
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}; 