"use client";

import Link from 'next/link';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Button } from '@mui/material';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function DashboardHeader({ code }: { code: string }) {
        return (
                <Box>
                        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                                <MuiLink component={Link} href="/admin/dashboards" underline="hover" color="inherit">
                                        Dashboards
                                </MuiLink>
                                <Typography color="textPrimary">{code}</Typography>
                        </Breadcrumbs>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Link href="/admin/dashboards" passHref>
                                                <Button variant="outlined" size="small" startIcon={<ArrowLeftIcon className="w-5 h-5" />}>
                                                        Back
                                                </Button>
                                        </Link>
                                        <Typography variant="h5">Dashboard: {code}</Typography>
                                </Box>
                                <Box>
                                        <Button variant="outlined" sx={{ mr: 1 }}>Add Data</Button>
                                        <Button type="submit" form="yaml-form" variant="contained" sx={{ mr: 1 }}>Save Config</Button>
                                        <Button type="submit" form="yaml-form" variant="contained" color="secondary">Render Dashboard</Button>
                                </Box>
                        </Box>
                </Box>
        );
}
