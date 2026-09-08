import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
export class NewsletterSubscribeDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsIn(['en', 'fr', 'uk']) language: string = 'en';
  @IsString() @Matches(/^[a-z0-9][a-z0-9_-]{0,63}$/) source: string = 'website';
  @Equals(true) consent!: boolean;
  @IsOptional() @IsString() @MaxLength(0) website?: string;
}
export class NewsletterTokenDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) token!: string;
}
