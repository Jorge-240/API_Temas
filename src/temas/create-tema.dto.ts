import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateTemaDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    tema: string;
}
