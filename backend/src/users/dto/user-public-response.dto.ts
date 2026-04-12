import { HeightUnit, UserSex } from '../enums';

export interface UserHeightPublicDto {
  display: string;
  unit: HeightUnit;
}

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
