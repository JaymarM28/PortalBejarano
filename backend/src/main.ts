import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Obtener ConfigService
  const configService = app.get(ConfigService);
  
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

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Payroll System API')
    .setDescription('API del sistema de nómina')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Backend corriendo en puerto ${port}`);
  console.log(`📝 API disponible en /api`);
  console.log(`📖 Swagger disponible en /api/docs`);
  console.log(`🌐 CORS habilitado para: ${allowedOrigins.join(', ')}`);
}

bootstrap();