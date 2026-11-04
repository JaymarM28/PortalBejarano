import { Injectable, NotFoundException, InternalServerErrorException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto, SignPaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { Employee } from '../employees/employee.entity';
import PDFDocument from 'pdfkit';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, employerId: string, houseId: string): Promise<Payment> {
    const employee = await this.employeeRepository.findOne({
      where: { id: createPaymentDto.employeeId, houseId }
    });

    if (!employee) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    const baseSalary = createPaymentDto.baseSalary ?? employee.baseSalary ?? 0;
    const totalAmount = Number(baseSalary) + 
                       Number(createPaymentDto.bonuses || 0) - 
                       Number(createPaymentDto.deductions || 0);

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      baseSalary,
      employerId,
      totalAmount,
      houseId
    });

    try {
      const savedPayment = await this.paymentRepository.save(payment);

      const paymentWithRelations = await this.paymentRepository.findOne({
        where: { id: savedPayment.id, houseId },
        relations: ['employee', 'employer']
      });

      if (!paymentWithRelations) {
        throw new InternalServerErrorException('Error al cargar el pago guardado');
      }

      // La notificación por correo se envía al firmar el pago (ver signPayment)
      return paymentWithRelations;
    } catch (error) {
      console.error('Error en create payment:', error);
      throw new InternalServerErrorException('Error al crear el pago');
    }
  }

  async findAll(houseId?: string): Promise<Payment[]> {
    const where = houseId ? { houseId } : {};
    return this.paymentRepository.find({
      where,
      relations: ['employee', 'employer'],
      order: { paymentDate: 'DESC' }
    });
  }

  async findOne(id: string, houseId?: string): Promise<Payment> {
    const where: any = { id };
    if (houseId) where.houseId = houseId;

    const payment = await this.paymentRepository.findOne({
      where,
      relations: ['employee', 'employer']
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto, houseId?: string): Promise<Payment> {
    const payment = await this.findOne(id, houseId);

    // Evita reasignar el pago a un trabajador de otra casa
    if (updatePaymentDto.employeeId && updatePaymentDto.employeeId !== payment.employeeId) {
      const employee = await this.employeeRepository.findOne({
        where: { id: updatePaymentDto.employeeId, houseId: payment.houseId },
      });
      if (!employee) {
        throw new NotFoundException('Trabajador no encontrado');
      }
    }

    if (updatePaymentDto.bonuses !== undefined || updatePaymentDto.deductions !== undefined) {
      const bonuses = updatePaymentDto.bonuses ?? payment.bonuses ?? 0;
      const deductions = updatePaymentDto.deductions ?? payment.deductions ?? 0;
      payment.totalAmount = Number(payment.baseSalary) + Number(bonuses) - Number(deductions);
    }

    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string, houseId?: string): Promise<void> {
    const payment = await this.findOne(id, houseId);
    await this.paymentRepository.remove(payment);
  }

  async signPayment(id: string, signPaymentDto: SignPaymentDto, houseId?: string): Promise<Payment> {
    const payment = await this.findOne(id, houseId);
    this.assertPending(payment);
    
    payment.digitalSignature = signPaymentDto.digitalSignature;
    payment.status = PaymentStatus.SIGNED;
    payment.signedAt = new Date();

    const saved = await this.paymentRepository.save(payment);
    this.notifySigned(saved);
    return saved;
  }

  /** Una firma ya registrada no se puede sobrescribir (evita alterar comprobantes firmados). */
  private assertPending(payment: Payment): void {
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Este pago ya fue firmado y no se puede volver a firmar');
    }
  }

  /**
   * Envía el comprobante firmado (PDF adjunto) a los usuarios de la casa y, si tiene
   * email registrado, al trabajador. Corre en segundo plano: un fallo en el correo
   * no revierte ni bloquea la firma.
   */
  private notifySigned(payment: Payment): void {
    setImmediate(async () => {
      try {
        const [pdf, houseUsers] = await Promise.all([
          this.buildPdf(payment),
          payment.houseId ? this.usersService.findAll(payment.houseId) : Promise.resolve([]),
        ]);
        const activeUsers = houseUsers.filter(u => u.isActive);
        await this.emailService.sendPaymentSignedNotification(payment, activeUsers, pdf);
      } catch (error) {
        this.logger.error(`Error enviando comprobante firmado del pago ${payment.id}`, error?.stack);
      }
    });
  }

  async uploadSignedDocument(id: string, filename: string, houseId?: string): Promise<Payment> {
    const payment = await this.findOne(id, houseId);
    this.assertPending(payment);
    
    payment.signedDocumentUrl = filename;
    payment.status = PaymentStatus.COMPLETED;
    payment.signedAt = new Date();

    return this.paymentRepository.save(payment);
  }

  async generatePDF(id: string, houseId?: string): Promise<Buffer> {
    const payment = await this.findOne(id, houseId);
    return this.buildPdf(payment);
  }

  /** Genera el PDF del comprobante. Requiere las relaciones `employee` y `employer`. */
  buildPdf(payment: Payment): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('COMPROBANTE DE PAGO', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Comprobante #${payment.id}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text('RESPONSABLE:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Nombre: ${payment.employer.fullName}`);
      doc.text(`Email: ${payment.employer.email}`);
      doc.moveDown(1.5);

      doc.fontSize(14).text('TRABAJADOR:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Nombre: ${payment.employee.fullName}`);
      doc.text(`Documento: ${payment.employee.documentId}`);
      doc.moveDown(1.5);

      doc.fontSize(14).text('DETALLES DEL PAGO:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(
        `Fecha de pago: ${new Date(payment.paymentDate).toLocaleDateString('es-ES')}`
      );
      doc.moveDown(1);

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

      if (payment.notes) {
        doc.fontSize(11).text('Notas:', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(payment.notes);
        doc.moveDown(2);
      }

      doc.moveDown(2);
      if (payment.digitalSignature) {
        try {
          const base64Data = payment.digitalSignature.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');

          doc.fontSize(11).text('Firma:', { align: 'left' });
          doc.moveDown(0.5);

          const fitWidth = 200;
          const fitHeight = 80;
          const xRight = doc.page.width - doc.page.margins.right - fitWidth;
          const y = doc.y;

          doc.image(imageBuffer, xRight, y, { fit: [fitWidth, fitHeight] });
          doc.y = y + fitHeight;
          doc.moveDown(1);

          doc.fontSize(9).text(
            `Firmado digitalmente el: ${new Date(payment.signedAt).toLocaleDateString('es-ES')} a las ${new Date(payment.signedAt).toLocaleTimeString('es-ES')}`,
            { align: 'left' }
          );
        } catch (error) {
          console.error('Error al insertar firma:', error);
          doc.fontSize(11).text('Firmado digitalmente', { align: 'center' });
          doc.fontSize(9).text(
            `Fecha de firma: ${new Date(payment.signedAt).toLocaleDateString('es-ES')}`,
            { align: 'center' }
          );
        }
      } else {
        doc.moveDown(3);
        doc.fontSize(11).text('_________________________', { align: 'center' });
        doc.moveDown(0.5);
        doc.text('Firma', { align: 'center' });
      }

      doc.moveDown(2);
      doc.fontSize(8).text(
        `Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
        { align: 'center' }
      );

      doc.end();
    });
  }
}