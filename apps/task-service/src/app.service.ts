import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.task.findMany();
    return { data, total: data.length };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: parseInt(id) },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async findByUser(userId: string) {
    const data = await this.prisma.task.findMany({
      where: { userId: parseInt(userId) },
    });
    return { data };
  }
}
