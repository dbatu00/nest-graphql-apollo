import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

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
    @IsString()
    @MinLength(1)
    content: string;
}
