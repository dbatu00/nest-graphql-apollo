import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { NotBlank, Trim } from '../../common/validation/string.decorators';

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
    @Trim()
    @IsString()
    @MinLength(1)
    @NotBlank('content must not be empty')
    content: string;
}
