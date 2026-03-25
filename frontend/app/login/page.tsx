import LoginForm from "../ui/login-form";
import { Container, Box, Paper } from '@mui/material';

export default function LoginPage() {
        return (
                <Container maxWidth="sm" sx={{ py: 8 }}>
                        <LoginForm />
                </Container>
        );
}
