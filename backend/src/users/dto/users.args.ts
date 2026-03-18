import { ArgsType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, IsUrl, ValidateIf } from 'class-validator';

@ArgsType()
export class UpdateMyProfileArgs {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MaxLength(100)
    displayName?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MaxLength(160)
    bio?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @ValidateIf((_, value) => typeof value === 'string' && value.length > 0)
    @IsUrl({ require_tld: false }, { message: 'avatarUrl must be a valid URL' })
    @MaxLength(500)
    avatarUrl?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @ValidateIf((_, value) => typeof value === 'string' && value.length > 0)
    @IsUrl({ require_tld: false }, { message: 'coverUrl must be a valid URL' })
    @MaxLength(500)
    coverUrl?: string;
}
