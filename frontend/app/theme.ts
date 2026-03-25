"use client";

import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
        weight: ['300', '400', '500', '700'],
        subsets: ['latin'],
        display: 'swap',
});

const theme = createTheme({
        typography: {
                fontFamily: roboto.style.fontFamily,
        },
        palette: {
                primary: {
                        main: '#8b5cf6', // violet-600
                },
                secondary: {
                        main: '#a78bfa', // violet-400
                },
        },
        components: {
                MuiButton: {
                        styleOverrides: {
                                root: {
                                        textTransform: 'none',
                                },
                        },
                },
        },
});

export default theme;
