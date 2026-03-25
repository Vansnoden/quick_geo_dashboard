import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/app/theme';


const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const roboto = Roboto({
	weight: ['300', '400', '500', '700'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-roboto',
})


export const metadata: Metadata = {
	title: "Quick Geo-Dashboard",
	description: "Create quick geo dashboards and maps for your csv or excel data",
}; 

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) {
	return (
    		<html lang="en">
      			<body className={
				`${geistSans.variable} 
				 ${geistMono.variable} 
				 ${roboto.variable} antialiased`}>
      				<AppRouterCacheProvider>
					<ThemeProvider theme={theme}>
        					{children}
					</ThemeProvider>
				</AppRouterCacheProvider>
      			</body>
    		</html>
  	);
}
