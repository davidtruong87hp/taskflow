import { Injectable, NotFoundException } from '@nestjs/common';

// In a real service this would be injected database repositories.
// We're using in-memory data to keep the focus on service communication.
const USERS = [
  { id: '1', name: 'Alice Nguyen', email: 'alice@taskflow.dev' },
  { id: '2', name: 'Bob Tran', email: 'bob@taskflow.dev' },
];

@Injectable()
export class AppService {
  findAll() {
    return { data: USERS, total: USERS.length };
  }

  findOne(id: string) {
    const user = USERS.find((u) => u.id === id);
    if (!user) {
      // NestJS's NotFoundException automatically produces a 404 response
      // with a properly structured JSON error body — no manual work needed.
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}
