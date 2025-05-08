import { Providers } from '@/lib/providers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';

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
								<ToastContainer position="top-right" />
								<Toaster />
							</Providers>
						</ThemeProvider>
					</LanguageProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
