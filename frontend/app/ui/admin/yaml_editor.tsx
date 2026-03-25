'use client';

import { useState, useTransition } from 'react';
import { updateDashboardYaml } from '@/app/lib/actions';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function YamlEditor({ id, initialValue }: { id: number, initialValue: string }) {
        const [code, setCode] = useState(initialValue);
        const [isPending, startTransition] = useTransition();

        const handleSave = () => {
                startTransition(async () => {
                        await updateDashboardYaml(id, code);
                });
        };

        return (
                <Box sx={{ position: 'relative', flexGrow: 1, height: '100%', minHeight: 400 }}>
                        <form id="yaml-form" action={handleSave} style={{ height: '100%' }}>
                                <textarea
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#1e1e1e',
                                                color: '#4ade80',
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                padding: '1rem',
                                                outline: 'none',
                                                resize: 'none',
                                                border: 'none',
                                        }}
                                        spellCheck={false}
                                        placeholder="# Enter your YAML configuration here..."
                                />
                        </form>
                        {isPending && (
                                <Box
                                        sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                bgcolor: 'rgba(0,0,0,0.7)',
                                                p: 1,
                                                borderRadius: 1,
                                        }}
                                >
                                        <CircularProgress size={16} color="inherit" />
                                        <Typography variant="caption">Saving...</Typography>
                                </Box>
                        )}
                </Box>
        );
}
