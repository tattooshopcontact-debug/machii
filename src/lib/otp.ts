/**
 * Helpers OTP.
 *
 * Flux sécurisé (audit 2026-06) :
 *  - sendOtp(phone)         -> RPC send_whatsapp_otp : génère + envoie le code.
 *  - otpLogin(phone, code)  -> RPC otp_login : valide le code côté serveur et
 *    renvoie le couple (email synthétique, mot de passe dérivé HMAC) que le
 *    store utilise pour ouvrir la session. Le mot de passe n'est PLUS dérivable
 *    côté client : sans OTP valide, otp_login ne renvoie rien.
 *
 * En mode démo (WhatsApp non branché), le serveur accepte un code à 4-6
 * chiffres ; ce drapeau est contrôlé côté serveur (Vault `otp_demo_mode`),
 * pas par le client.
 */
import { supabase } from '@/lib/supabase';

export type OtpSendResult = {
  sent: boolean;
  reason?: string;
};

export type OtpLoginResult =
  | { ok: true; email: string; password: string }
  | { ok: false; reason: string };

export async function sendOtp(phone: string): Promise<OtpSendResult> {
  const { data, error } = await supabase.rpc('send_whatsapp_otp', { p_phone: phone });
  if (error) throw error;
  return (data as OtpSendResult) ?? { sent: false };
}

export async function otpLogin(
  phone: string,
  code: string,
  fullName?: string,
): Promise<OtpLoginResult> {
  const { data, error } = await supabase.rpc('otp_login', {
    p_phone: phone,
    p_code: code,
    p_full_name: fullName ?? null,
  });
  if (error) throw error;
  return (data as OtpLoginResult) ?? { ok: false, reason: 'unknown' };
}
