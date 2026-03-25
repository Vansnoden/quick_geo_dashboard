import SignupForm from "@/app/ui/signup-form";
import { Container, Paper, Typography } from '@mui/material';

export default function SignupPage() {
        return (
                <Container maxWidth="sm" sx={{ py: 8 }}>
                        <Paper sx={{ p: 4 }}>
                                <SignupForm />
                        </Paper>
                </Container>
        );
}
