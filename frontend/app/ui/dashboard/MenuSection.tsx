'use client';

import ReactMarkdown from 'react-markdown';
import { Box, Typography } from '@mui/material';

interface Props {
        title: string;
        content: string;
}

export default function MenuSection({ title, content }: Props) {
        return (
                <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" gutterBottom>{title}</Typography>
                        <Box sx={{ '& p': { mb: 1 } }}>
                                <ReactMarkdown>{content}</ReactMarkdown>
                        </Box>
                </Box>
        );
}
