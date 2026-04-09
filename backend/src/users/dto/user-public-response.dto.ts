import { UserSex } from '../enums';

/** Serializable user for API; includes computed avatar_url (no avatar_key). */
export interface UserPublicResponseDto {
  id: string;
  name: string;
  email: string | null;
  date_of_birth: Date | null;
  sex: UserSex | null;
  height_cm: number | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}
