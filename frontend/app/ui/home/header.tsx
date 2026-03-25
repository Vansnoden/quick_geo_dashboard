import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Image from 'next/image';
import { ArrowRightIcon } from '@heroicons/react/16/solid';

export default function Header() {
        return (
                <AppBar position="fixed" color="default" elevation={1}>
                        <Toolbar>
                                <Link href="/" passHref style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                                        <Image src="/qgd_logo.svg" width={40} height={40} alt="QGD Logo" />
                                        <Box sx={{ ml: 1 }}>
                                                <Typography variant="subtitle2" component="span" fontWeight="bold">
                                                        Quick
                                                </Typography>
                                                <br />
                                                <Typography variant="subtitle2" component="span" fontWeight="bold">
                                                        Geo-Dashboard
                                                </Typography>
                                        </Box>
                                </Link>
                                <Box sx={{ flexGrow: 1 }} />
                                <Link href="/login" passHref>
                                        <Button variant="contained" endIcon={<ArrowRightIcon className="h-5 w-5" />}>
                                                Log In
                                        </Button>
                                </Link>
                        </Toolbar>
                </AppBar>
        );
}
