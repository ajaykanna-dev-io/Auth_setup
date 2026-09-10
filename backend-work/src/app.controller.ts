import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Backend is running!";
  }

  @Get('health')
  getHealth() {
    return {
      status: "ok",
      datetime: new Date().toISOString(),
    };
  }
}
