import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tema')
export class Tema {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'nombre_tema' })
    tema: string;
}
