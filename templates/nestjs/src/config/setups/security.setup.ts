import helmet from 'helmet';
import { INestApplication } from '@nestjs/common';
import { serviceConfig } from '..';

export function setupSecurity(app: INestApplication): void {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          'base-uri': ["'none'"],
          'frame-ancestors': ["'none'"],
        },
      },
      hsts: { maxAge: 31536000 },
      frameguard: { action: 'deny' },
    }),
  );

  app.use(
    (
      _req: unknown,
      res: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      res.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate, private',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    },
  );
}

export function setupCors(app: INestApplication): void {
  app.enableCors({
    origin: serviceConfig.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
