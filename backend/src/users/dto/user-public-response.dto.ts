import { HeightUnit, UserSex } from '../enums';

/** Canonical height for API clients; unit labels are localized in the app. */
export type UserHeightPublicDto =
  | { unit: HeightUnit.CM; value: number }
  | { unit: HeightUnit.M; value: number }
  | { unit: HeightUnit.IN; feet: number; inches: number };

/** Serializable user for API; includes computed avatar_url (no avatar_key). */
export interface UserPublicResponseDto {
  id: string;
  name: string;
  email: string | null;
  date_of_birth: Date | null;
  sex: UserSex | null;
  height: UserHeightPublicDto | null;
  nationality: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}
