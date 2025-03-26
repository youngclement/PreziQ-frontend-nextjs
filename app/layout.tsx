import { ThemeProvider } from "@/components/theme-provider";
import { NavBar } from "@/components/nav-bar";
import "aos/dist/aos.css";
import "./globals.css";
import Header from "@/components/header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

          <Header />
          {children}

        </ThemeProvider>
      </body>
    </html>
  );
}