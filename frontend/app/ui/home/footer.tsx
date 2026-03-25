import { Box, Typography } from '@mui/material';

export default function Footer() {
        return (
                <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                                Copyright © {new Date().getFullYear()}
                        </Typography>
                </Box>
        );
}
