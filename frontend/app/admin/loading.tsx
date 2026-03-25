"use client";

import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingSkeleton() {
        return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Loading...</Typography>
                </Box>
        );
}
