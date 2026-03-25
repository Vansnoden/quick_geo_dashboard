"use client";

import { useActionState, useEffect, useState } from 'react';
import { signup } from '@/app/lib/actions';
import {
        Box,
        TextField,
        Button,
        Typography,
        Paper,
        Alert,
        InputAdornment,
        IconButton,
        LinearProgress,
} from '@mui/material';
import {
        AtSymbolIcon,
        KeyIcon,
        UserIcon,
        EnvelopeIcon,
        ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import zxcvbn from 'zxcvbn';

export default function SignupForm() {
        const [errorMessage, formAction, isPending] = useActionState(signup, undefined);
        const [password, setPassword] = useState('');
        const [passwordStrength, setPasswordStrength] = useState(0);

        useEffect(() => {
                if (password) {
                        const result = zxcvbn(password);
                        setPasswordStrength(result.score);
                } else {
                        setPasswordStrength(0);
                }
        }, [password]);

        const strengthColor = () => {
                switch (passwordStrength) {
                        case 1: return 'error';
                        case 2: return 'warning';
                        case 3: return 'info';
                        case 4: return 'success';
                        default: return 'secondary';
                }
        };

        return (
                <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
                        <Typography variant="h5" component="h1" gutterBottom align="center">
                                Create your account
                        </Typography>
                        <form action={formAction}>
                                <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Full Name"
                                        name="fullname"
                                        required
                                        InputProps={{
                                                startAdornment: (
                                                        <InputAdornment position="start">
                                                                <UserIcon className="h-5 w-5" />
                                                        </InputAdornment>
                                                ),
                                        }}
                                />
                                <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Username"
                                        name="username"
                                        required
                                        helperText="Must be unique, at least 3 characters"
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
                                        label="Email Address"
                                        name="email"
                                        type="email"
                                        required
                                        InputProps={{
                                                startAdornment: (
                                                        <InputAdornment position="start">
                                                                <EnvelopeIcon className="h-5 w-5" />
                                                        </InputAdornment>
                                                ),
                                        }}
                                />
                                <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        helperText="Must be at least 4 characters"
                                        InputProps={{
                                                startAdornment: (
                                                        <InputAdornment position="start">
                                                                <KeyIcon className="h-5 w-5" />
                                                        </InputAdornment>
                                                ),
                                        }}
                                />
                                {password.length >= 4 && (
                                        <Box sx={{ mt: 1 }}>
                                                <LinearProgress
                                                        variant="determinate"
                                                        value={(passwordStrength / 4) * 100}
                                                        color={strengthColor()}
                                                />
                                                <Typography variant="caption" color="textSecondary">
                                                        {passwordStrength === 1 && 'Weak'}
                                                        {passwordStrength === 2 && 'Fair'}
                                                        {passwordStrength === 3 && 'Good'}
                                                        {passwordStrength === 4 && 'Strong'}
                                                </Typography>
                                        </Box>
                                )}
                                <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        sx={{ mt: 3 }}
                                        disabled={isPending}
                                        endIcon={<ArrowRightIcon className="h-5 w-5" />}
                                >
                                        {isPending ? 'Creating Account...' : 'Sign up'}
                                </Button>
                                {errorMessage && (
                                        <Alert severity="error" sx={{ mt: 2 }} icon={<ExclamationCircleIcon className="h-5 w-5" />}>
                                                {errorMessage}
                                        </Alert>
                                )}
                        </form>
                </Paper>
        );
}
