export type Risk = 'Alto' | 'Medio' | 'Bajo';

export interface Member {
  id: string;
  marca_temporal: string | null;
  name: string;
  gender: string | null;
  age: number | null;
  phone: string | null;
  alta_date: string | null;

  member_no: string | null;
  rp: string | null;
  app_downloaded: boolean;
  sportlab: boolean;
  keepgoing: boolean;

  objetivo: string | null;
  meta90: string | null;
  relacion: string | null;
  dias: string | null;
  condicion_perc: string | null;
  mejorar: string | null;
  abandono: string | null;
  ayudaria: string | null;
  confianza: number | null;
  nota_futuro: string | null;
  momentos: string | null;

  enfoque_label: string | null;
  enfoque_score: number | null;
  adherencia_score: number | null;
  frecuencia_score: number | null;
  condicion_score: number | null;
  condicion_level: string | null;
  abandono_score: number | null;
  nivel_general_label: string | null;
  risk: Risk | null;

  intake_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffComment {
  id: string;
  member_id: string;
  staff: string;
  comment_date: string;
  text: string;
  created_at: string;
}

export type MemberPatch = Partial<
  Pick<Member, 'member_no' | 'rp' | 'app_downloaded' | 'sportlab' | 'keepgoing'>
>;
