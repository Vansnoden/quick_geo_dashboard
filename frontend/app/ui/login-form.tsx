"use client";

import { useState } from 'react';
import { useActionState } from 'react';
import { authenticate } from '@/app/lib/actions';
import {
        Box,
        TextField,
        Button,
        Typography,
        Paper,
        Alert,
        InputAdornment,
        IconButton,
} from '@mui/material';
import { AtSymbolIcon, KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';

export default function LoginForm() {
        const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
        const [showPassword, setShowPassword] = useState(false);

        return (
                <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
                        <form action={formAction}>
                                <Typography variant="h5" component="h1" gutterBottom align="center">
                                        Please log in to continue.
                                </Typography>
                                <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Username"
                                        name="username"
                                        required
                                        InputProps={{
                                                startAdornment: (
                                                        <InputAdornment position="start">
                                                                <AtSymbolIcon className="h-5 w-5" />
                                                        </InputAdornment>
                                                ),
                                        }}
                                />
                                <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        InputProps={{
                                                startAdornment: (
                                                        <InputAdornment position="start">
                                                                <KeyIcon className="h-5 w-5" />
                                                        </InputAdornment>
                                                ),
                                                endAdornment: (
                                                        <InputAdornment position="end">
                                                                <IconButton
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                        edge="end"
                                                                >
                                                                        {showPassword ? 'Hide' : 'Show'}
                                                                </IconButton>
                                                        </InputAdornment>
                                                ),
                                        }}
                                />
                                <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        disabled={isPending}
                                        endIcon={<ArrowRightIcon className="h-5 w-5" />}
                                >
                                        Log in
                                </Button>
                                {errorMessage && (
                                        <Alert severity="error" sx={{ mt: 2 }} icon={<ExclamationCircleIcon className="h-5 w-5" />}>
                                                {errorMessage}
                                        </Alert>
                                )}
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <Typography variant="body2">
                                                Don't have an account?{' '}
                                                <Link href="/signup" style={{ color: '#8b5cf6', textDecoration: 'none' }}>
                                                        Sign up here
                                                </Link>
                                        </Typography>
                                </Box>
                        </form>
                </Paper>
        );
}
