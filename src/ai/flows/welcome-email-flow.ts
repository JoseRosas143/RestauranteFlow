'use server';
/**
 * @fileOverview Genera el correo de bienvenida oficial para el dueño del negocio.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const WelcomeEmailInputSchema = z.object({
  userName: z.string().describe('Nombre del usuario registrado'),
  userEmail: z.string().describe('Email de acceso'),
  password: z.string().describe('Contraseña elegida'),
  storeId: z.string().describe('ID de tienda generado'),
});
export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

const WelcomeEmailOutputSchema = z.object({
  subject: z.string().describe('Asunto del correo'),
  body: z.string().describe('Cuerpo del correo formateado'),
});
export type WelcomeEmailOutput = z.infer<typeof WelcomeEmailOutputSchema>;

export async function generateWelcomeEmail(input: WelcomeEmailInput): Promise<WelcomeEmailOutput> {
  return welcomeEmailFlow(input);
}

const welcomeEmailFlow = ai.defineFlow(
  {
    name: 'welcomeEmailFlow',
    inputSchema: WelcomeEmailInputSchema,
    outputSchema: WelcomeEmailOutputSchema,
  },
  async (input) => {
    const subject = 'Nuevo Registro Exitoso';
    const body = `
Bienvenido a RESTAURANTE FLOW ${input.userName},

Estos son tus datos de Registro 

Usuario: ${input.userEmail}
Contraseña: ${input.password}
ID de Tienda: ${input.storeId}

Mucho Éxito

El equipo de RESTAURANTE FLOW
    `.trim();

    return { subject, body };
  }
);
