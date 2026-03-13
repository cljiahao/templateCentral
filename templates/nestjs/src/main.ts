import { config } from 'dotenv';

config();

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConsoleLogger, Logger } from '@nestjs/common';

import { AppModule } from './app.module';
import { appConfig, setupCors, setupSecurity, setupSwagger } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: new ConsoleLogger({
        logLevels: ['error', 'warn', 'log', 'debug', 'verbose'],
        prefix: appConfig.PROJECT_NAME,
      }),
    },
  );
  const logger = new Logger('Bootstrap');

  setupSecurity(app);
  logger.log('Security middleware configured');

  setupCors(app);
  logger.log('CORS configured');

  setupSwagger(app);
  logger.log('Swagger documentation configured');

  await app.init();
  logger.log('Application initialized');

  const port = appConfig.PORT;
  await app.listen(port, '0.0.0.0');

  logger.log(`${appConfig.PROJECT_NAME} running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
