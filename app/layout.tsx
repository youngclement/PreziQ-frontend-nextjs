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

export const dynamic = 'force-dynamic';

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
