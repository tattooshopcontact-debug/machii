/**
 * Helpers Supabase pour les documents KYC.
 *
 * Stocke dans le bucket privé `kyc` sous `{userId}/{docType}.{ext}`.
 * Crée/maj une ligne dans `kyc_documents` (status='pending') à chaque upload.
 * L'admin modère manuellement depuis le dashboard Supabase (V0).
 */
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

const BUCKET = 'kyc';

export type KycDocType = 'cin' | 'permis' | 'carte_grise' | 'photo_vehicule';
export type KycStatus = 'pending' | 'approved' | 'rejected';

export type KycDocument = {
  id: string;
  profileId: string;
  docType: KycDocType;
  filePath: string;
  status: KycStatus;
  reviewedAt: string | null;
  createdAt: string;
};

export async function pickKycImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("L'accès à tes photos est nécessaire pour envoyer un document.");
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.85,
  });
  if (r.canceled || !r.assets?.[0]) return null;
  return r.assets[0];
}

export async function uploadKycDocument(
  userId: string,
  docType: KycDocType,
  asset: ImagePicker.ImagePickerAsset,
): Promise<KycDocument> {
  const mime = asset.mimeType ?? 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/${docType}.${ext}`;

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mime,
    upsert: true,
    cacheControl: '0',
  });
  if (upErr) throw upErr;

  // Crée ou met à jour la ligne kyc_documents (status reset à pending).
  const { data: existing } = await supabase
    .from('kyc_documents')
    .select('id')
    .eq('profile_id', userId)
    .eq('doc_type', docType)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .update({ file_path: path, status: 'pending', reviewed_at: null })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return mapKyc(data);
  }

  const { data, error } = await supabase
    .from('kyc_documents')
    .insert({ profile_id: userId, doc_type: docType, file_path: path, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return mapKyc(data);
}

type KycRow = {
  id: string;
  profile_id: string;
  doc_type: KycDocType;
  file_path: string;
  status: KycStatus;
  reviewed_at: string | null;
  created_at: string;
};

function mapKyc(row: KycRow): KycDocument {
  return {
    id: row.id,
    profileId: row.profile_id,
    docType: row.doc_type,
    filePath: row.file_path,
    status: row.status,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

async function fetchMyKyc(userId: string): Promise<KycDocument[]> {
  const { data, error } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('profile_id', userId);
  if (error) throw error;
  return (data as unknown as KycRow[]).map(mapKyc);
}

export function useMyKyc(userId: string | undefined) {
  return useQuery({
    queryKey: ['kyc', userId],
    queryFn: () => fetchMyKyc(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useUploadKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      docType,
      asset,
    }: {
      userId: string;
      docType: KycDocType;
      asset: ImagePicker.ImagePickerAsset;
    }) => uploadKycDocument(userId, docType, asset),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['kyc', vars.userId] });
    },
  });
}

/** Retourne une signed URL (1h) pour afficher un document privé du bucket kyc. */
export async function getKycSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
