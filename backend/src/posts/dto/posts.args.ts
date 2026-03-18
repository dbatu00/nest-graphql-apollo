import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Matches, Min, MinLength } from 'class-validator';

@ArgsType()
export class PostByIdArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    id: number;
}

@ArgsType()
export class PostIdArgs {
    @Field(() => Int)
    @IsInt()
    @Min(1)
    postId: number;
}

@ArgsType()
export class AddPostArgs {
    @Field(() => String)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @MinLength(1)
    @Matches(/\S/, { message: 'content must not be empty' })
    content: string;
}
