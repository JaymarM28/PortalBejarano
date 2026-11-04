import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Obtener ConfigService
  const configService = app.get(ConfigService);

  // Detrás de un proxy (Render, Railway, Nginx...) define TRUST_PROXY (p. ej. 1) para que
  // req.ip sea la IP real del cliente; lo usa el límite de intentos de login.
  const trustProxy = configService.get<string>('TRUST_PROXY');
  if (trustProxy) {
    app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true');
  }
  
  // Obtener URLs permitidas desde variables de entorno
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
  
  // Si quieres permitir múltiples URLs, sepáralas por comas en la variable de entorno
  const allowedOrigins = frontendUrl.split(',').map(url => url.trim());
  
  // Habilitar CORS con configuración completa
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Prefijo global para API
  app.setGlobalPrefix('api');

  // Swagger: desactivado salvo que se pida con ENABLE_SWAGGER=true (no exponer la API en producción)
  const swaggerEnabled = configService.get<string>('ENABLE_SWAGGER') === 'true';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Payroll System API')
      .setDescription('API del sistema de nómina')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Backend corriendo en puerto ${port}`);
  console.log(`📝 API disponible en /api`);
  if (swaggerEnabled) console.log(`📖 Swagger disponible en /api/docs`);
  console.log(`🌐 CORS habilitado para: ${allowedOrigins.join(', ')}`);
}

bootstrap();