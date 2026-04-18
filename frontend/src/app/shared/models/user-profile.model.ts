import type { UserHeightPublic } from '../utils/measurement-display.util';

export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly date_of_birth: string;
  readonly sex: string;
  readonly height: UserHeightPublic | null;
  readonly avatar_url: string;
  readonly nationality: string | null;
}