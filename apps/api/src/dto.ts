import {Type, Transform} from 'class-transformer';
import {IsString,IsEmail,IsIn,IsOptional,MaxLength,MinLength,Equals,IsBoolean,IsArray,ValidateNested,ArrayMinSize,ArrayMaxSize,Matches,IsInt,Min,Max,IsDateString,IsObject,IsUrl} from 'class-validator';
import {ApiProperty,ApiPropertyOptional} from '@nestjs/swagger';
const clean=({value}:{value:unknown})=>typeof value==='string'?value.trim():value;
export class ListQuery {
 @ApiPropertyOptional({enum:['en','fr','uk']}) @IsOptional() @IsIn(['en','fr','uk']) locale='en';
 @ApiPropertyOptional({enum:['ACTIVITY','PROJECT','PUBLICATION']}) @IsOptional() @IsIn(['ACTIVITY','PROJECT','PUBLICATION']) kind?:'ACTIVITY'|'PROJECT'|'PUBLICATION';
 @ApiPropertyOptional() @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(100) limit=24;
 @ApiPropertyOptional() @IsOptional() @Type(()=>Number) @IsInt() @Min(0) @Max(100000) offset=0;
}
export class NewsletterDto {
 @ApiProperty() @Transform(({value})=>typeof value==='string'?value.trim().toLowerCase():value) @IsEmail() @MaxLength(254) email!:string;
 @ApiProperty({enum:['en','fr','uk']}) @IsIn(['en','fr','uk']) locale!:string;
 @ApiProperty({enum:[true]}) @Equals(true) consent!:boolean;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(0) website?:string;
}
export class ContactDto extends NewsletterDto {
 @ApiProperty() @Transform(clean) @IsString() @MinLength(2) @MaxLength(120) name!:string;
 @ApiPropertyOptional() @Transform(clean) @IsOptional() @IsString() @MaxLength(180) organization?:string;
 @ApiProperty() @Transform(clean) @IsString() @MinLength(3) @MaxLength(160) subject!:string;
 @ApiProperty() @Transform(clean) @IsString() @MinLength(20) @MaxLength(5000) message!:string;
}
export class TranslationDto {
 @ApiProperty({enum:['en','fr','uk']}) @IsIn(['en','fr','uk']) locale!:string;
 @ApiProperty() @IsString() @MinLength(3) @MaxLength(180) title!:string;
 @ApiProperty() @IsString() @MinLength(10) @MaxLength(600) summary!:string;
 @ApiProperty() @IsString() @MinLength(20) @MaxLength(50000) body!:string;
 @ApiProperty() @IsString() @MaxLength(100) category!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(180) seoTitle?:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(320) seoDescription?:string;
}
export class ContentDto {
 @ApiProperty() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(160) slug!:string;
 @ApiProperty({enum:['ACTIVITY','PROJECT','PUBLICATION']}) @IsIn(['ACTIVITY','PROJECT','PUBLICATION']) kind!:'ACTIVITY'|'PROJECT'|'PUBLICATION';
 @ApiProperty() @IsBoolean() published!:boolean;
 @ApiProperty() @IsBoolean() isDemo!:boolean;
 @ApiPropertyOptional() @IsOptional() @IsDateString() publishedAt?:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) imageId?:string;
 @ApiProperty({type:[TranslationDto]}) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3) @ValidateNested({each:true}) @Type(()=>TranslationDto) translations!:TranslationDto[];
}
export class AssetDto {
 @ApiProperty() @Matches(/^(\/images\/[a-zA-Z0-9/_\-.]+|https:\/\/[^\s]+)$/) @MaxLength(2000) url!:string;
 @ApiProperty() @IsString() @MinLength(5) @MaxLength(300) alt!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) credit?:string;
 @ApiPropertyOptional() @IsOptional() @IsUrl({protocols:['https'],require_protocol:true}) @MaxLength(2000) licenseUrl?:string;
}
export class PageDto {
 @ApiProperty() @Matches(/^[a-z0-9-]+$/) @MaxLength(100) slug!:string;
 @ApiProperty({enum:['en','fr','uk']}) @IsIn(['en','fr','uk']) locale!:string;
 @ApiProperty({type:[String]}) @IsArray() @ArrayMinSize(3) @ArrayMaxSize(12) @IsString({each:true}) @MaxLength(10000,{each:true}) blocks!:string[];
 @ApiProperty() @IsBoolean() approved!:boolean;
}
export class TeamDto {
 @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) name!:string;
 @ApiProperty() @IsObject() role!:Record<string,string>;
 @ApiProperty() @IsObject() biography!:Record<string,string>;
 @ApiPropertyOptional() @IsOptional() @Matches(/^(\/images\/[a-zA-Z0-9/_\-.]+|https:\/\/[^\s]+)$/) @MaxLength(2000) photoUrl?:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) photoAlt?:string;
 @ApiProperty() @IsBoolean() published!:boolean;
 @ApiProperty() @IsInt() @Min(0) @Max(1000) order!:number;
}

export class PartnerDto {
 @ApiProperty() @IsString() @MinLength(1) @MaxLength(100) id!:string;
 @ApiProperty() @IsString() @MinLength(2) @MaxLength(180) name!:string;
 @ApiPropertyOptional() @IsOptional() @Matches(/^\/images\/[a-zA-Z0-9/_\-.]+$/) @MaxLength(2000) logoUrl?:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) logoAlt?:string;
 @ApiPropertyOptional() @IsOptional() @IsUrl({protocols:['https'],require_protocol:true}) @MaxLength(2000) href?:string;
 @ApiProperty() @IsBoolean() isDemo!:boolean;
}
export class PartnersDto {
 @ApiProperty({type:[PartnerDto]}) @IsArray() @ArrayMaxSize(100) @ValidateNested({each:true}) @Type(()=>PartnerDto) partners!:PartnerDto[];
}

export class AboutLocalizedDto {
 @ApiProperty() @IsString() @MinLength(1) @MaxLength(180) en!:string;
 @ApiProperty() @IsString() @MinLength(1) @MaxLength(180) fr!:string;
 @ApiProperty() @IsString() @MinLength(1) @MaxLength(180) uk!:string;
}
export class AboutPhotoDto {
 @ApiProperty() @Matches(/^(\/images\/[a-zA-Z0-9/_\-.]+|https:\/\/[^\s]+)$/) @MaxLength(2000) url!:string;
 @ApiProperty() @IsString() @MinLength(5) @MaxLength(300) alt!:string;
 @ApiProperty() @IsString() @MinLength(1) @MaxLength(300) credit!:string;
 @ApiProperty() @IsUrl({protocols:['https'],require_protocol:true}) @MaxLength(2000) source!:string;
 @ApiProperty() @IsUrl({protocols:['https'],require_protocol:true}) @MaxLength(2000) licenseUrl!:string;
 @ApiProperty() @IsString() @MinLength(1) @MaxLength(100) licenseLabel!:string;
}
export class AboutProfileDto {
 @ApiProperty() @Matches(/^\d{4}$/) founded!:string;
 @ApiProperty() @IsString() @MinLength(1) @MaxLength(180) registeredOffice!:string;
 @ApiProperty({type:AboutLocalizedDto}) @IsObject() @ValidateNested() @Type(()=>AboutLocalizedDto) organisationType!:AboutLocalizedDto;
 @ApiProperty({type:AboutLocalizedDto}) @IsObject() @ValidateNested() @Type(()=>AboutLocalizedDto) geographicalFocus!:AboutLocalizedDto;
 @ApiProperty({type:[AboutPhotoDto]}) @IsArray() @ArrayMinSize(2) @ArrayMaxSize(10) @ValidateNested({each:true}) @Type(()=>AboutPhotoDto) photos!:AboutPhotoDto[];
}
