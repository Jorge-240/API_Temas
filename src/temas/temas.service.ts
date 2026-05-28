import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tema } from './tema.entity';
import { CreateTemaDto } from './create-tema.dto';
import { UpdateTemaDto } from './update-tema.dto';

@Injectable()
export class TemasService {
    constructor(
        @InjectRepository(Tema)
        private readonly temaRepository: Repository<Tema>,
    ) { }

    // GET /api/temas
    async findAll(): Promise<Tema[]> {
        const rows = await this.temaRepository.query(
            `SELECT id, nombre_tema AS tema FROM public.tema ORDER BY id ASC`,
        );
        return rows;
    }

    // GET /api/temas/:id
    async findOne(id: number): Promise<Tema> {
        const rows = await this.temaRepository.query(
            `SELECT id, nombre_tema AS tema FROM public.tema WHERE id = $1`,
            [id],
        );
        if (!rows || rows.length === 0) {
            throw new NotFoundException(`Tema con id ${id} no encontrado`);
        }
        return rows[0];
    }

    // POST /api/temas
    async create(createTemaDto: CreateTemaDto): Promise<Tema> {
        const rows = await this.temaRepository.query(
            `INSERT INTO public.tema (nombre_tema) VALUES ($1) RETURNING id, nombre_tema AS tema`,
            [createTemaDto.tema],
        );
        return rows[0];
    }

    // PATCH /api/temas/:id
    async update(id: number, updateTemaDto: UpdateTemaDto): Promise<Tema> {
        // Verify it exists first
        await this.findOne(id);

        const rows = await this.temaRepository.query(
            `UPDATE public.tema SET nombre_tema = $1 WHERE id = $2 RETURNING id, nombre_tema AS tema`,
            [updateTemaDto.tema, id],
        );
        return rows[0];
    }

    // DELETE /api/temas/:id
    async remove(id: number): Promise<{ message: string }> {
        // Verify it exists first
        await this.findOne(id);

        await this.temaRepository.query(
            `DELETE FROM public.tema WHERE id = $1`,
            [id],
        );
        return { message: `Tema con id ${id} eliminado correctamente` };
    }
}
