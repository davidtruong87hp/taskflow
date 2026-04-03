import { Injectable, NotFoundException } from '@nestjs/common';

const TASKS = [
  { id: '1', title: 'Set up CI pipeline', userId: '1', status: 'done' },
  { id: '2', title: 'Write K8s manifests', userId: '1', status: 'done' },
  { id: '3', title: 'Add OpenTelemetry', userId: '2', status: 'in-progress' },
];

@Injectable()
export class AppService {
  findAll() {
    return { data: TASKS, total: TASKS.length };
  }

  findOne(id: string) {
    const task = TASKS.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  findByUser(userId: string) {
    return { data: TASKS.filter((t) => t.userId === userId) };
  }
}
