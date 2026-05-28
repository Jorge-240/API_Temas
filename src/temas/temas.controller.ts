import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { TemasService } from './temas.service';
import { CreateTemaDto } from './create-tema.dto';
import { UpdateTemaDto } from './update-tema.dto';

@Controller('temas')
export class TemasController {
    constructor(private readonly temasService: TemasService) { }

    // GET /api/temas
    @Get()
    findAll() {
        return this.temasService.findAll();
    }

    // GET /api/temas/:id
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.temasService.findOne(id);
    }

    // POST /api/temas
    @Post()
    create(@Body() createTemaDto: CreateTemaDto) {
        return this.temasService.create(createTemaDto);
    }

    // PATCH /api/temas/:id
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateTemaDto: UpdateTemaDto,
    ) {
        return this.temasService.update(id, updateTemaDto);
    }

    // DELETE /api/temas/:id
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.temasService.remove(id);
    }
}
