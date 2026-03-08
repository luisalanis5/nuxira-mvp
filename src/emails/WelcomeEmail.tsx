import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Img, Heading, Button } from '@react-email/components';

interface WelcomeEmailProps {
    name: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({ name }) => (
    <Html>
        <Head />
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    {/* Aquí iría el logo de Nuxira, por ahora usamos texto con estilo */}
                    <Heading style={headingLogo}>N U X I R A</Heading>
                </Section>

                <Section style={content}>
                    <Heading style={headingTitle}>¡Bienvenido a tu nuevo multiverso digital!</Heading>

                    <Text style={paragraph}>Hola <strong>{name}</strong>,</Text>

                    <Text style={paragraph}>
                        ¡Bienvenido a Nuxira! Tu cuenta ha sido creada exitosamente.
                        Prepárate para empezar a monetizar y conectar con tu audiencia como nunca antes.
                    </Text>

                    <Text style={paragraph}>
                        Estamos muy emocionados de verte crecer. Entra a tu Centro de Mando, personaliza tu perfil, añade tus enlaces y empieza a compartir.
                    </Text>

                    <Section style={buttonContainer}>
                        <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}>
                            Ir a mi Centro de Mando
                        </Button>
                    </Section>

                    <Text style={footerText}>
                        Si tienes alguna duda, responde a este correo o contáctanos en soporte.
                        <br />
                        El equipo de Nuxira 🚀
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

const main = {
    backgroundColor: '#050505',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '580px',
};

const header = {
    padding: '24px',
    textAlign: 'center' as const,
};

const headingLogo = {
    color: '#c2cdff',
    fontSize: '28px',
    fontWeight: 'bold',
    letterSpacing: '8px',
    margin: '0',
};

const content = {
    backgroundColor: '#0a0a0e',
    border: '1px solid #1f2028',
    borderRadius: '12px',
    padding: '40px',
};

const headingTitle = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    margin: '0 0 24px',
};

const paragraph = {
    color: '#a1a1aa',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#00FFCC',
    borderRadius: '8px',
    color: '#000000',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 28px',
};

const footerText = {
    color: '#52525b',
    fontSize: '14px',
    lineHeight: '24px',
    textAlign: 'center' as const,
    marginTop: '48px',
};

export default WelcomeEmail;
