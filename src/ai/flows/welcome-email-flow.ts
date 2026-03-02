'use server';
/**
 * @fileOverview Genera el texto de un correo de bienvenida cálido y profesional.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WelcomeEmailInputSchema = z.object({
  userName: z.string().describe('Nombre del usuario'),
  userEmail: z.string().describe('Email registrado'),
  storeId: z.string().describe('ID de tienda de 6 dígitos'),
  password: z.string().describe('Contraseña temporal (si aplica)'),
});
export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

const WelcomeEmailOutputSchema = z.object({
  subject: z.string().describe('Asunto del correo'),
  body: z.string().describe('Cuerpo del correo en formato texto enriquecido'),
});
export type WelcomeEmailOutput = z.infer<typeof WelcomeEmailOutputSchema>;

export async function generateWelcomeEmail(input: WelcomeEmailInput): Promise<WelcomeEmailOutput> {
  const {output} = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    input: {
      schema: WelcomeEmailInputSchema,
      data: input
    },
    output: {
      schema: WelcomeEmailOutputSchema
    },
    prompt: `Eres el asistente oficial de Onboarding de RestauranteFlow. 
    Genera un correo de bienvenida MUY cálido y profesional para un nuevo dueño de restaurante.
    
    Datos:
    - Nombre: {{{userName}}}
    - Email de Acceso: {{{userEmail}}}
    - ID de Tienda (Store ID): {{{storeId}}}
    - Contraseña: {{{password}}}
    
    El correo debe incluir:
    1. Una felicitación por unirse a la plataforma.
    2. Los 3 datos de acceso claramente formateados.
    3. Una breve explicación de que el Store ID es lo que identifica su terminal.
    4. Un tono inspirador sobre el éxito de su negocio gastronómico.`,
  });
  return output!;
}
