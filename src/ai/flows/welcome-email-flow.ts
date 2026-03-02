
'use server';
/**
 * @fileOverview Genera el texto de un correo de bienvenida cálido y profesional usando una plantilla.
 */

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

/**
 * Genera el correo de bienvenida usando una plantilla estática.
 */
export async function generateWelcomeEmail(input: WelcomeEmailInput): Promise<WelcomeEmailOutput> {
  const subject = `¡Bienvenido a RestauranteFlow, ${input.userName}! 🚀`;
  
  const body = `
    Hola ${input.userName},
    
    ¡Estamos muy emocionados de tenerte con nosotros en RestauranteFlow! Tu sistema ya está listo para transformar tu negocio gastronómico.
    
    Aquí tienes tus credenciales de acceso para tu terminal y panel administrativo:
    
    -------------------------------------------
    ID DE TIENDA: ${input.storeId} (¡Este es tu código de 6 dígitos!)
    USUARIO: ${input.userEmail}
    CONTRASEÑA: ${input.password}
    -------------------------------------------
    
    Recuerda que el Store ID es lo que identifica a tu negocio y lo que tu personal usará para entrar al POS. 
    
    ¡Te deseamos mucho éxito en esta nueva etapa!
    
    Atentamente,
    El equipo de RestauranteFlow
  `;

  return { subject, body };
}
