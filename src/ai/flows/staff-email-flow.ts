'use server';
/**
 * @fileOverview Genera el correo de notificación para un nuevo empleado asignado.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const StaffEmailInputSchema = z.object({
  staffName: z.string().describe('Nombre del empleado'),
  storeName: z.string().describe('Nombre de la tienda'),
  locationName: z.string().describe('Nombre de la sucursal'),
  role: z.string().describe('Rol asignado'),
  pin: z.string().describe('PIN asignado'),
});
export type StaffEmailInput = z.infer<typeof StaffEmailInputSchema>;

const StaffEmailOutputSchema = z.object({
  subject: z.string().describe('Asunto del correo'),
  body: z.string().describe('Cuerpo del correo formateado'),
});
export type StaffEmailOutput = z.infer<typeof StaffEmailOutputSchema>;

export async function generateStaffEmail(input: StaffEmailInput): Promise<StaffEmailOutput> {
  return staffEmailFlow(input);
}

const staffEmailFlow = ai.defineFlow(
  {
    name: 'staffEmailFlow',
    inputSchema: StaffEmailInputSchema,
    outputSchema: StaffEmailOutputSchema,
  },
  async (input) => {
    const subject = `Nuevo usuario para ${input.storeName}`;
    const body = `
Usted ha sido correctamente asignado o asignada a la sucursal ${input.locationName} con el rol de ${input.role} y su Pin es: ${input.pin}.

El Equipo de RESTAURANTEFLOW
    `.trim();

    return { subject, body };
  }
);
