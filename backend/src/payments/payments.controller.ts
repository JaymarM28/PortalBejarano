import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Request,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, SignPaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminOrSuperAdminGuard } from '../auth/super-admin.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.create(createPaymentDto, req.user.userId, req.user.houseId);
  }

  @Get()
  findAll(@Request() req) {
    return this.paymentsService.findAll(req.user.houseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.paymentsService.findOne(id, req.user.houseId);
  }

  @Patch(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Request() req) {
    return this.paymentsService.update(id, updatePaymentDto, req.user.houseId);
  }

  @Delete(':id')
  @UseGuards(AdminOrSuperAdminGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.paymentsService.remove(id, req.user.houseId);
  }

  @Post(':id/sign')
  signPayment(@Param('id') id: string, @Body() signPaymentDto: SignPaymentDto, @Request() req) {
    return this.paymentsService.signPayment(id, signPaymentDto, req.user.houseId);
  }

  @Post(':id/upload-signed')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/signed-documents',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
        return cb(new BadRequestException('Solo se permiten archivos PDF o imágenes'), false);
      }
      cb(null, true);
    }
  }))
  uploadSignedDocument(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }
    return this.paymentsService.uploadSignedDocument(id, file.filename, req.user.houseId);
  }

  @Get(':id/pdf')
  async generatePDF(@Param('id') id: string, @Res() res: Response, @Request() req) {
    const pdfBuffer = await this.paymentsService.generatePDF(id, req.user.houseId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=comprobante-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}