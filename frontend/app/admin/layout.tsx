import SideNav from '@/app/ui/admin/sidenav';
import { Box, CssBaseline } from '@mui/material';

export default function Layout({ children }: { children: React.ReactNode }) {
        return (
                <Box sx={{ display: 'flex' }}>
                        <CssBaseline />
                        <SideNav />
                        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                                {children}
                        </Box>
                </Box>
        );
}
