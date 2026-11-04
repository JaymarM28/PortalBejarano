import { Injectable, NotFoundException, InternalServerErrorException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto, SignPaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { Employee } from '../employees/employee.entity';
import { ConfigService } from '@nestjs/config';
import { renderPaymentPdf } from './payment-pdf';
import { brandFromSender } from '../common/format';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly brand: string;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private emailService: EmailService,
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    this.brand = brandFromSender(configService.get<string>('EMAIL_FROM'));
  }

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
    return renderPaymentPdf(payment, { brand: this.brand });
  }
}