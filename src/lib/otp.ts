/**
 * Helpers OTP : envoi et vérification via RPC Supabase (WhatsApp Cloud API
 * cote backend). Tant que les credentials Meta ne sont pas configures, l'envoi
 * ne fait rien (return sent=false) mais le code 6 chiffres est bien stocke en DB.
 *
 * En V0 / DEV : Faouez peut lire le dernier code via le dashboard Supabase
 * Table editor → phone_otp pour le saisir. En PROD avec Meta configure, le
 * code est envoye sur WhatsApp en quelques secondes.
 */
import { supabase } from '@/lib/supabase';

export type OtpSendResult = {
  sent: boolean;
  reason?: string;
};

export async function sendOtp(phone: string): Promise<OtpSendResult> {
  const { data, error } = await supabase.rpc('send_whatsapp_otp', { p_phone: phone });
  if (error) throw error;
  // data est jsonb : { sent, reason? }
  return (data as OtpSendResult) ?? { sent: false };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_whatsapp_otp', {
    p_phone: phone,
    p_code: code,
  });
  if (error) throw error;
  return !!data;
}
