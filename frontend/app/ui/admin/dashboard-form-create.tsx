'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
        Dialog,
        DialogTitle,
        DialogContent,
        DialogActions,
        TextField,
        Button,
        Alert,
        LinearProgress,
        Box,
} from '@mui/material';
import { DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { createDashboard, updateDashboard } from '@/app/lib/actions';

export default function DashboardFormCreate({
        dashboard,
        onClose,
}: {
        dashboard?: any;
        onClose?: () => void;
}) {
        const router = useRouter();
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [name, setName] = useState(dashboard?.name || '');
        const [error, setError] = useState<string | null>(null);
        const [touched, setTouched] = useState(false);

        const isValid = name.trim().length >= 3;
        const showError = touched && !isValid;

        const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
                event.preventDefault();

                if (!isValid) {
                        setTouched(true);
                        setError('Dashboard name must be at least 3 characters');
                        return;
                }

                setIsSubmitting(true);
                setError(null);

                try {
                        const formData = new FormData();
                        formData.append('name', name.trim());

                        let result = null;
                        if (dashboard?.id) {
                                result = await updateDashboard(Number(dashboard.id), formData);
                        } else {
                                result = await createDashboard(formData);
                        }

                        if (result && typeof result === 'object') {
                                if ('errors' in result && result.errors) {
                                        const errorMsg = Object.values(result.errors).flat().join(', ');
                                        setError(errorMsg || 'Validation failed');
                                        setIsSubmitting(false);
                                        return;
                                }
                                if ('message' in result && result.message) {
                                        setError(result.message as string);
                                        setIsSubmitting(false);
                                        return;
                                }
                        }

                        router.refresh();
                        if (onClose) onClose();
                        else router.push('/admin/dashboards');
                } catch (err) {
                        if (err && typeof err === 'object' && 'digest' in err) {
                                // Redirect
                                if (onClose) onClose();
                                return;
                        }
                        console.error('Form submission error:', err);
                        setError(err instanceof Error ? err.message : 'Failed to save dashboard');
                        setIsSubmitting(false);
                }
        };

        return (
                <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
                        <DialogTitle>
                                <Box display="flex" alignItems="center" gap={1}>
                                        <DocumentTextIcon className="w-5 h-5" />
                                        {dashboard ? 'Edit Dashboard' : 'Create New Dashboard'}
                                </Box>
                        </DialogTitle>
                        <form onSubmit={handleSubmit}>
                                <DialogContent>
                                        <TextField
                                                autoFocus
                                                margin="dense"
                                                label="Dashboard Name"
                                                fullWidth
                                                variant="outlined"
                                                value={name}
                                                onChange={(e) => {
                                                        setName(e.target.value);
                                                        setTouched(true);
                                                        setError(null);
                                                }}
                                                onBlur={() => setTouched(true)}
                                                error={showError}
                                                helperText={showError ? 'Name must be at least 3 characters' : 'Min. 3 characters'}
                                                required
                                                disabled={isSubmitting}
                                        />
                                        {error && (
                                                <Alert severity="error" sx={{ mt: 2 }} icon={<ExclamationCircleIcon className="h-5 w-5" />}>
                                                        {error}
                                                </Alert>
                                        )}
                                        {isSubmitting && <LinearProgress sx={{ mt: 2 }} />}
                                </DialogContent>
                                <DialogActions>
                                        <Button onClick={onClose} disabled={isSubmitting}>
                                                Cancel
                                        </Button>
                                        <Button type="submit" variant="contained" disabled={!isValid || isSubmitting}>
                                                {dashboard ? 'Update' : 'Create'}
                                        </Button>
                                </DialogActions>
                        </form>
                </Dialog>
        );
}
