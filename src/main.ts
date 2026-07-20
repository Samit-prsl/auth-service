import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './modules/auth/jwtAuth.guard';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  setupSwagger(app);
  const jwtGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtGuard);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
