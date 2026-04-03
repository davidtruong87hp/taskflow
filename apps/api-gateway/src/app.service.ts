import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private readonly userServiceUrl: string;
  private readonly taskServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.userServiceUrl = this.configService.get<string>('USER_SERVICE_URL');
    this.taskServiceUrl = this.configService.get<string>('TASK_SERVICE_URL');
  }

  async getUsers() {
    // HttpService returns an RxJS Observable. firstValueFrom converts it
    // to a Promise so we can use async/await, which is more familiar.
    // In a production app you might keep it as an Observable and use
    // RxJS operators for retry logic, timeouts, and circuit breaking.
    const response = await firstValueFrom(
      this.httpService.get(`${this.userServiceUrl}/users`),
    );
    return response.data;
  }

  async getUser(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.userServiceUrl}/users/${id}`),
    );
    return response.data;
  }

  async getTasks() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.taskServiceUrl}/tasks`),
    );
    return response.data;
  }

  async getTask(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.taskServiceUrl}/tasks/${id}`),
    );
    return response.data;
  }

  // This is the most interesting endpoint — it fetches a user AND their tasks
  // in a single gateway call, combining data from two services.
  // This "data aggregation" pattern is one of the primary reasons the
  // API Gateway pattern exists — clients make one request and get
  // everything they need, without knowing about the underlying services.
  async getUserWithTasks(userId: string) {
    // Run both requests in parallel rather than sequentially.
    // Promise.all fires both HTTP calls simultaneously and waits for both.
    // If you awaited them one by one, total time = userTime + taskTime.
    // In parallel, total time = max(userTime, taskTime). Much faster.
    const [user, tasks] = await Promise.all([
      firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users/${userId}`),
      ),
      firstValueFrom(
        this.httpService.get(`${this.taskServiceUrl}/tasks/user/${userId}`),
      ),
    ]);

    return {
      ...user.data,
      tasks: tasks.data.data,
    };
  }
}
