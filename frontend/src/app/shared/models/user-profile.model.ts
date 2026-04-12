export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly date_of_birth: string;
  readonly sex: string;
  readonly height: {
    readonly display: string;
    readonly unit: string;
  };
  readonly avatar_url: string;
}