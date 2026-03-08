import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Button } from '@react-email/components';

interface VerificationEmailProps {
    name: string;
    verificationLink: string;
}

export const VerificationEmail: React.FC<Readonly<VerificationEmailProps>> = ({ name, verificationLink }) => (
    <Html>
        <Head />
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <Heading style={headingLogo}>N U X I R A</Heading>
                </Section>

                <Section style={content}>
                    <Heading style={headingTitle}>Bienvenido, confirma tu identidad</Heading>

                    <Text style={paragraph}>Hola <strong>{name}</strong>,</Text>

                    <Text style={paragraph}>
                        Gracias por unirte a Nuxira. Para proteger tu cuenta y asegurar que eres el dueño legítimo de este correo, necesitamos que lo verifiques.
                    </Text>

                    <Text style={paragraph}>
                        Haz clic en el botón de abajo para activar tu cuenta de Nuxira instantáneamente:
                    </Text>

                    <Section style={buttonContainer}>
                        <Button style={button} href={verificationLink}>
                            Verificar mi correo
                        </Button>
                    </Section>

                    <Text style={footerText}>
                        Si tú no solicitaste crear esta cuenta, puedes ignorar este correo de forma segura. La cuenta será eliminada automáticamente.
                        <br /><br />
                        Nuxira Security
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
    color: '#00FFCC',
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
    fontSize: '13px',
    lineHeight: '22px',
    textAlign: 'center' as const,
    marginTop: '48px',
};

export default VerificationEmail;
