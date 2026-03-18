import { ArgsType, Field } from '@nestjs/graphql';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { ACTIVITY_TYPE } from '../activity.constants';

@ArgsType()
export class FeedArgs {
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    @MinLength(1)
    username?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsIn(Object.values(ACTIVITY_TYPE), { each: true })
    types?: string[];
}
