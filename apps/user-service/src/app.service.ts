import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.user.findMany();
    return { data, total: data.length };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}
