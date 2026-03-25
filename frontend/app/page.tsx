import Header from "./ui/home/header";
import Footer from "./ui/home/footer";
import { lusitana } from "./ui/fonts";
import Link from "next/link";
import { Button } from "./ui/buttons";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { DocumentChartBarIcon } from "@heroicons/react/24/solid";
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import Image from 'next/image';

export default function Home() {
        return (
                <Box>
                        <Header />
                        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
                                <Paper sx={{ p: 4 }}>
                                        <Typography variant="h4" component="h1" align="center" gutterBottom>
                                                Welcome to the Quick Geo Dashboard creation tool
                                        </Typography>
                                        <Grid container spacing={4} alignItems="center">
                                                <Grid item xs={12} md={6}>
                                                        <Image src="/QGD.drawio.png" alt="Banner" width={600} height={500} style={{ maxWidth: '100%', height: 'auto' }} />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                        <Typography variant="body1" paragraph>
                                                                The goal of this tool is to enable non-technical users to quickly transform
                                                                tabular data (CSV or Excel) into interactive, shareable geo-dashboards...
                                                        </Typography>
                                                        <Box sx={{ mt: 2 }}>
                                                                <Link href="/admin/doc" passHref>
                                                                        <Button variant="contained" endIcon={<DocumentIcon className="h-5 w-5" />}>
                                                                                Go to Documentation
                                                                        </Button>
                                                                </Link>
                                                        </Box>
                                                        <Box sx={{ mt: 2 }}>
                                                                <Link href="#" passHref>
                                                                        <Button variant="outlined" endIcon={<DocumentChartBarIcon className="h-5 w-5" />}>
                                                                                See examples of dashboards
                                                                        </Button>
                                                                </Link>
                                                        </Box>
                                                </Grid>
                                        </Grid>
                                </Paper>
                        </Container>
                        <Footer />
                </Box>
        );
}
