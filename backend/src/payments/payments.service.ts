import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto, SignPaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { Employee } from '../employees/employee.entity';
import PDFDocument from 'pdfkit';
import { EmailService } from '../email/email.service';
import { UsersService } from 'src/users/users.service';
import { InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

async create(createPaymentDto: CreatePaymentDto, employerId: string): Promise<Payment> {
  // Obtener la empleada para conseguir su salario base
  const employee = await this.employeeRepository.findOne({
    where: { id: createPaymentDto.employeeId }
  });

  if (!employee) {
    throw new NotFoundException('Empleada no encontrada');
  }

  // Si no se proporciona salario base, usar el de la empleada
  const baseSalary = createPaymentDto.baseSalary ?? employee.baseSalary ?? 0;

  const totalAmount = Number(baseSalary) + 
                     Number(createPaymentDto.bonuses || 0) - 
                     Number(createPaymentDto.deductions || 0);

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      baseSalary,
      employerId,
      totalAmount,
    });

  try {
    // Guardar el pago
    const savedPayment = await this.paymentRepository.save(payment);

    // ✅ CARGAR LAS RELACIONES después de guardar
    const paymentWithRelations = await this.paymentRepository.findOne({
      where: { id: savedPayment.id },
      relations: ['employee', 'employer']
    });

    if (!paymentWithRelations) {
      throw new InternalServerErrorException('Error al cargar el pago guardado');
    }

    // Enviar email con el pago que tiene las relaciones cargadas
    const allUsers = await this.usersService.findAll();
    await this.emailService.sendPaymentNotification(paymentWithRelations, allUsers);

    return paymentWithRelations;
  } catch (error) {
    console.error('Error en create payment:', error);
    throw new InternalServerErrorException('Error al crear el pago');
  }
}

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['employee', 'employer'],
      order: { paymentDate: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['employee', 'employer']
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    
    // Recalcular el total si se cambian bonos o deducciones
    if (updatePaymentDto.bonuses !== undefined || updatePaymentDto.deductions !== undefined) {
      const bonuses = updatePaymentDto.bonuses ?? payment.bonuses ?? 0;
      const deductions = updatePaymentDto.deductions ?? payment.deductions ?? 0;
      payment.totalAmount = Number(payment.baseSalary) + Number(bonuses) - Number(deductions);
    }

    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  async signPayment(id: string, signPaymentDto: SignPaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);
    
    payment.digitalSignature = signPaymentDto.digitalSignature;
    payment.status = PaymentStatus.SIGNED;
    payment.signedAt = new Date();

    return this.paymentRepository.save(payment);
  }

  async uploadSignedDocument(id: string, filename: string): Promise<Payment> {
    const payment = await this.findOne(id);
    
    payment.signedDocumentUrl = filename;
    payment.status = PaymentStatus.COMPLETED;
    payment.signedAt = new Date();

    return this.paymentRepository.save(payment);
  }

  async generatePDF(id: string): Promise<Buffer> {
    const payment = await this.findOne(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('COMPROBANTE DE PAGO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Comprobante #${payment.id}`, { align: 'center' });
      doc.moveDown(2);

      // Información del empleador
      doc.fontSize(14).text('EMPLEADOR:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Nombre: ${payment.employer.fullName}`);
      doc.text(`Email: ${payment.employer.email}`);
      doc.moveDown(1.5);

      // Información de la empleada
      doc.fontSize(14).text('EMPLEADA:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Nombre: ${payment.employee.fullName}`);
      doc.text(`Documento: ${payment.employee.documentId}`);
      if (payment.employee.position) {
        doc.text(`Cargo: ${payment.employee.position}`);
      }
      doc.moveDown(1.5);

      // Detalles del pago
      doc.fontSize(14).text('DETALLES DEL PAGO:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Fecha de pago: ${new Date(payment.paymentDate).toLocaleDateString('es-ES')}`);
      doc.moveDown(1);

      // Tabla de conceptos
      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 400;

      doc.fontSize(11);
      doc.text('Salario base:', col1X, tableTop);
      doc.text(`$${Number(payment.baseSalary).toFixed(2)}`, col2X, tableTop);

      if (payment.bonuses > 0) {
        doc.text('Bonificaciones:', col1X, doc.y);
        doc.text(`$${Number(payment.bonuses).toFixed(2)}`, col2X, doc.y - 12);
      }

      if (payment.deductions > 0) {
        doc.text('Deducciones:', col1X, doc.y);
        doc.text(`-$${Number(payment.deductions).toFixed(2)}`, col2X, doc.y - 12);
      }

      doc.moveDown();
      doc.moveTo(col1X, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(13).font('Helvetica-Bold');
      doc.text('TOTAL:', col1X, doc.y);
      doc.text(`$${Number(payment.totalAmount).toFixed(2)}`, col2X, doc.y - 15);
      doc.font('Helvetica');

      doc.moveDown(2);

      // Notas
      if (payment.notes) {
        doc.fontSize(11).text('Notas:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(payment.notes);
        doc.moveDown(2);
      }

      // Firma digital
      doc.moveDown(2);
      if (payment.digitalSignature) {
        try {
          // Remover el prefijo data:image/png;base64, si existe
          const base64Data = payment.digitalSignature.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          doc.fontSize(11).text('Firma:', { align: 'left' });
          doc.moveDown(0.5);
          
          // Insertar imagen de firma (sin align porque no acepta 'left')
          doc.image(imageBuffer, 50, doc.y, {
            fit: [200, 80]
          });
          
          doc.moveDown(6); // Espacio después de la imagen
          doc.fontSize(9).text(`Firmado digitalmente el: ${new Date(payment.signedAt).toLocaleDateString('es-ES')} a las ${new Date(payment.signedAt).toLocaleTimeString('es-ES')}`, { align: 'left' });
        } catch (error) {
          console.error('Error al insertar firma:', error);
          doc.fontSize(11).text('Firmado digitalmente', { align: 'center' });
          doc.fontSize(9).text(`Fecha de firma: ${new Date(payment.signedAt).toLocaleDateString('es-ES')}`, { align: 'center' });
        }
      } else {
        doc.moveDown(3);
        doc.fontSize(11).text('_________________________', { align: 'center' });
        doc.moveDown(0.5);
        doc.text('Firma de la empleada', { align: 'center' });
      }

      doc.moveDown(2);
      doc.fontSize(8).text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });

      doc.end();
    });
  }
}