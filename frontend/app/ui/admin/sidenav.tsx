import Link from 'next/link';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Button } from '@mui/material';
import { HomeIcon } from '@heroicons/react/20/solid';
import { handleSignOut } from '@/app/lib/actions';
import { auth } from '@/auth';
import NavLinks from '@/app/ui/admin/nav-links';

export default async function SideNav() {
        const session = await auth();
        const user = session?.user as any;
        const userName = user?.username;

        return (
                <Drawer
                        variant="permanent"
                        sx={{
                                width: 240,
                                flexShrink: 0,
                                [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
                        }}
                >
                        <Box sx={{ p: 2 }}>
                                <Link href="/" passHref>
                                        <Box sx={{ mb: 2, cursor: 'pointer' }}>
                                                <Typography variant="h6" color="primary">
                                                        Administration
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                        Welcome, <b>{userName}</b>
                                                </Typography>
                                        </Box>
                                </Link>
                        </Box>
                        <NavLinks />
                        <Box sx={{ flexGrow: 1 }} />
                        <Box sx={{ p: 2 }}>
                                <form action={handleSignOut}>
                                        <Button
                                                fullWidth
                                                variant="outlined"
                                                startIcon={<HomeIcon className="w-6" />}
                                                type="submit"
                                        >
                                                Log Out
                                        </Button>
                                </form>
                        </Box>
                </Drawer>
        );
}
