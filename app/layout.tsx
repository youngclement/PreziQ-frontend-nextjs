import { Providers } from '@/lib/providers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './globals.css';

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<Providers>
					{/* <NavBar /> */}
					{children}
					<ToastContainer position="top-right" />
				</Providers>
			</body>
		</html>
	);
}
