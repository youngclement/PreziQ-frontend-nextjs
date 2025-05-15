import { Providers } from '@/lib/providers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './globals.css';
import '@fontsource/dancing-script/700.css';

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import ClientOnly from '@/components/ClientOnly';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'PreziQ - Interactive Learning Platform',
	description: 'PreziQ is an interactive learning platform that helps you create and share engaging quizzes and presentations.',
	keywords: ['learning platform', 'interactive quizzes', 'education', 'presentations', 'quiz creator'],
	authors: [{ name: 'PreziQ Team' }],
	creator: 'PreziQ',
	publisher: 'PreziQ',
	formatDetection: {
		email: false,
		telephone: false,
		address: false,
	},
	metadataBase: new URL('https://preziq.com'),
	alternates: {
		canonical: '/',
	},
	openGraph: {
		title: 'PreziQ - Interactive Learning Platform',
		description: 'Create and share engaging quizzes and presentations with PreziQ',
		url: 'https://preziq.com',
		siteName: 'PreziQ',
		locale: 'en_US',
		type: 'website',
		images: [
			{
				url: '/images/og-image.jpg',
				width: 1200,
				height: 630,
				alt: 'PreziQ - Interactive Learning Platform',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'PreziQ - Interactive Learning Platform',
		description: 'Create and share engaging quizzes and presentations with PreziQ',
		images: ['/images/twitter-image.jpg'],
	},
	robots: {
		index: true,
		follow: true,
	},
	icons: {
		icon: [
			{ url: '/favicon.svg', type: 'image/svg+xml' },
			{ url: '/favicon.png', type: 'image/png', sizes: '32x32' },
			{ url: '/favicon.ico', sizes: 'any' },
			
		],
		shortcut: '/favicon.png',
		apple: '/favicon.png',
	},
	manifest: '/manifest.json',
	viewport: {
		width: 'device-width',
		initialScale: 1,
	},
	themeColor: '#4F46E5',
	appleWebApp: {
		title: 'PreziQ',
		statusBarStyle: 'black-translucent',
		capable: true,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<AuthProvider>
					<LanguageProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<Providers>
								{children}
								<ClientOnly>
									<ToastContainer position="top-right" />
								</ClientOnly>
								<Toaster />
							</Providers>
						</ThemeProvider>
					</LanguageProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
