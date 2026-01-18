import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { EmployeesService } from '../employees/employees.service';
import { PaymentsService } from '../payments/payments.service';
import { UsersService } from '../users/users.service';
import { MarketExpensesService } from '../market-expenses/market-expenses.service';
import { HousesService } from '../houses/houses.service';
import { Employee, Payment, User, MarketExpense, MarketExpenseStats, House } from '../shared/models';
import { NotificationService } from '../shared/notification.service';
import { NotificationsComponent } from '../shared/notifications.component';
import { SkeletonComponent } from '../shared/skeleton.component';
import { SignaturePadComponent } from '../shared/signature-pad.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NotificationsComponent, SkeletonComponent, SignaturePadComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  activeTab = 'payments';
  currentUser: User | null = null;
  currentHouse?: House;
  
  // Sidebar state - NUEVO
  sidebarExpanded = false;
  mobileSidebarOpen = false;
  
  // Data lists
  employees: Employee[] = [];
  payments: Payment[] = [];
  users: User[] = [];
  marketExpenses: MarketExpense[] = [];
  houses: House[] = [];

  // Loading states
  loadingEmployees = false;
  loadingPayments = false;
  loadingUsers = false;
  loadingMarketExpenses = false;
  loadingHouses = false;
  
  // Filtros para pagos
  searchTerm = '';
  filterEmployee = '';
  filterDateFrom = '';
  filterDateTo = '';

  // Filtros para gastos de mercado
  expenseSearchTerm = '';
  expenseFilterResponsible = '';
  expenseFilterDateFrom = '';
  expenseFilterDateTo = '';
  expenseFilterPlace = '';
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  monthStats: MarketExpenseStats | null = null;

  // Computed properties
  get filteredPayments(): Payment[] {
    let filtered = [...this.payments];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.employee.fullName.toLowerCase().includes(term) ||
        p.employer.fullName.toLowerCase().includes(term)
      );
    }

    if (this.filterEmployee) {
      filtered = filtered.filter(p => p.employee.id === this.filterEmployee);
    }

    if (this.filterDateFrom) {
      const dateFrom = new Date(this.filterDateFrom);
      filtered = filtered.filter(p => new Date(p.paymentDate) >= dateFrom);
    }

    if (this.filterDateTo) {
      const dateTo = new Date(this.filterDateTo);
      filtered = filtered.filter(p => new Date(p.paymentDate) <= dateTo);
    }

    return filtered;
  }

  get filteredMarketExpenses(): MarketExpense[] {
    let filtered = [...this.marketExpenses];

    if (this.expenseSearchTerm) {
      const term = this.expenseSearchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.place.toLowerCase().includes(term) ||
        e.responsible.fullName.toLowerCase().includes(term)
      );
    }

    if (this.expenseFilterResponsible) {
      filtered = filtered.filter(e => e.responsibleId === this.expenseFilterResponsible);
    }

    if (this.expenseFilterPlace) {
      const place = this.expenseFilterPlace.toLowerCase();
      filtered = filtered.filter(e => e.place.toLowerCase().includes(place));
    }

    if (this.expenseFilterDateFrom) {
      const dateFrom = new Date(this.expenseFilterDateFrom);
      filtered = filtered.filter(e => new Date(e.date) >= dateFrom);
    }

    if (this.expenseFilterDateTo) {
      const dateTo = new Date(this.expenseFilterDateTo);
      filtered = filtered.filter(e => new Date(e.date) <= dateTo);
    }

    return filtered;
  }

  // Forms
  employeeForm: FormGroup;
  paymentForm: FormGroup;
  userForm: FormGroup;
  changePasswordForm: FormGroup;
  marketExpenseForm: FormGroup;
  houseForm: FormGroup;
  
  // UI states
  showEmployeeModal = false;
  showPaymentModal = false;
  showUserModal = false;
  showChangePasswordModal = false;
  showSignatureModal = false;
  showMarketExpenseModal = false;
  showHouseModal = false;
  editingEmployee: Employee | null = null;
  editingPayment: Payment | null = null;
  editingUser: User | null = null;
  editingMarketExpense: MarketExpense | null = null;
  editingHouse: House | null = null;
  paymentToSign: Payment | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private employeesService: EmployeesService,
    private paymentsService: PaymentsService,
    private usersService: UsersService,
    private marketExpensesService: MarketExpensesService,
    private housesService: HousesService,
    private notificationService: NotificationService
  ) {
    this.currentUser = this.authService.getCurrentUser();

    this.employeeForm = this.fb.group({
      fullName: ['', Validators.required],
      documentId: ['', Validators.required],
      phone: [''],
      address: [''],
      position: [''],
      baseSalary: ['']
    });

    this.paymentForm = this.fb.group({
      employeeId: ['', Validators.required],
      paymentDate: ['', Validators.required],
      baseSalary: [{ value: 0, disabled: true }],
      bonuses: [0, Validators.min(0)],
      deductions: [0, Validators.min(0)],
      notes: ['']
    });

    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      houseId: ['']
    });

    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.marketExpenseForm = this.fb.group({
      date: [new Date().toISOString().split('T')[0], Validators.required],
      place: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      category: ['mercado'],
      responsibleId: ['', Validators.required]
    });

    this.houseForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      description: ['']
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    // Cargar casas solo si es super_admin
    if (this.currentUser?.role === 'super_admin') {
      this.loadHouses();
    } else {
      // Cargar casa actual si tiene una asignada
      this.loadCurrentHouse();
    }
    
    this.loadEmployees();
    this.loadPayments();
    this.loadMarketExpenses();
    this.loadUsers();
  }

  // ==========================================
  // SIDEBAR FUNCTIONS - NUEVO
  // ==========================================
  
  toggleMobileSidebar() {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    // Close mobile sidebar when selecting a tab
    if (this.mobileSidebarOpen) {
      this.mobileSidebarOpen = false;
    }
  }

  // Close mobile sidebar when pressing Escape key
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.mobileSidebarOpen = false;
  }

  // ==========================================
  // FILTERS
  // ==========================================

  clearFilters(): void {
    this.searchTerm = '';
    this.filterEmployee = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
  }

  clearExpenseFilters(): void {
    this.expenseSearchTerm = '';
    this.expenseFilterResponsible = '';
    this.expenseFilterDateFrom = '';
    this.expenseFilterDateTo = '';
    this.expenseFilterPlace = '';
  }

  // ==========================================
  // EXPORT TO EXCEL
  // ==========================================

  exportToExcel(): void {
    import('xlsx').then(XLSX => {
      const dataToExport = this.filteredPayments.map(payment => ({
        'Fecha': new Date(payment.paymentDate).toLocaleDateString('es-CO'),
        'Empleada': payment.employee.fullName,
        'Empleador': payment.employer.fullName,
        'Salario Base': payment.baseSalary,
        'Bonificaciones': payment.bonuses || 0,
        'Deducciones': payment.deductions || 0,
        'Total': payment.totalAmount,
        'Estado': payment.status === 'pending' ? 'Pendiente' : 
                  payment.status === 'signed' ? 'Firmado' : 'Completado',
        'Notas': payment.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pagos');

      const colWidths = [
        { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 12 },
        { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      const fileName = `pagos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      this.notificationService.success('Archivo Excel descargado exitosamente');
    }).catch(err => {
      console.error('Error al exportar:', err);
      this.notificationService.error('Error al exportar a Excel');
    });
  }

  exportMarketExpensesToExcel(): void {
    import('xlsx').then(XLSX => {
      const dataToExport = this.filteredMarketExpenses.map(expense => ({
        'Fecha': new Date(expense.date).toLocaleDateString('es-CO'),
        'Lugar': expense.place,
        'Responsable': expense.responsible.fullName,
        'Categoría': expense.category || 'N/A',
        'Monto': expense.amount,
        'Notas': expense.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Gastos');

      const colWidths = [
        { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      const fileName = `gastos_mercado_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      this.notificationService.success('Archivo Excel descargado exitosamente');
    }).catch(err => {
      console.error('Error al exportar:', err);
      this.notificationService.error('Error al exportar a Excel');
    });
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  getHouseName(houseId: string | undefined): string {
    if (!houseId) return '-';
    const house = this.houses.find(h => h.id === houseId);
    return house?.name || 'N/A';
  }

  // ==========================================
  // HOUSE METHODS
  // ==========================================

  loadHouses(): void {
    this.loadingHouses = true;
    this.housesService.getAll().subscribe({
      next: (data) => {
        this.houses = data;
        this.loadingHouses = false;
      },
      error: (err) => {
        this.notificationService.error('Error al cargar casas');
        this.loadingHouses = false;
      }
    });
  }

  loadCurrentHouse(): void {
    const houseId = this.authService.getHouseId();
    if (!houseId) return;

    this.housesService.getOne(houseId).subscribe({
      next: (house) => {
        this.currentHouse = house;
      },
      error: (err) => {
        console.error('Error al cargar casa actual:', err);
      }
    });
  }

  openHouseModal(house?: House): void {
    if (house) {
      this.editingHouse = house;
      this.houseForm.patchValue({
        name: house.name,
        slug: house.slug,
        description: house.description
      });
    } else {
      this.editingHouse = null;
      this.houseForm.reset();
    }
    this.showHouseModal = true;
  }

  saveHouse(): void {
    if (this.houseForm.valid) {
      this.loading = true;
      const formData = this.houseForm.value;

      const operation = this.editingHouse
        ? this.housesService.update(this.editingHouse.id, formData)
        : this.housesService.create(formData);

      operation.subscribe({
        next: () => {
          this.showHouseModal = false;
          this.loadHouses();
          this.loading = false;
          this.notificationService.success(
            this.editingHouse ? 'Casa actualizada' : 'Casa creada'
          );
        },
        error: (err) => {
          this.notificationService.error(
            'Error: ' + (err.error?.message || 'Error desconocido')
          );
          this.loading = false;
        }
      });
    }
  }

  deleteHouse(id: string): void {
    if (confirm('¿Estás seguro de eliminar esta casa? Solo se puede eliminar si no tiene datos asociados.')) {
      this.housesService.delete(id).subscribe({
        next: () => {
          this.loadHouses();
          this.notificationService.success('Casa eliminada exitosamente');
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || 'Error al eliminar casa'
          );
        }
      });
    }
  }

  closeHouseModal(): void {
    this.showHouseModal = false;
    this.editingHouse = null;
    this.houseForm.reset();
  }

  // ==========================================
  // EMPLOYEE METHODS
  // ==========================================

  loadEmployees(): void {
    this.loadingEmployees = true;
    this.employeesService.getAll().subscribe({
      next: (data) => {
        this.employees = data;
        this.loadingEmployees = false;
      },
      error: (err) => {
        this.notificationService.error('Error al cargar empleadas');
        this.loadingEmployees = false;
      }
    });
  }

  openEmployeeModal(employee?: Employee): void {
    if (employee) {
      this.editingEmployee = employee;
      this.employeeForm.patchValue(employee);
    } else {
      this.editingEmployee = null;
      this.employeeForm.reset();
    }
    this.showEmployeeModal = true;
  }

  saveEmployee(): void {
    if (this.employeeForm.valid) {
      this.loading = true;
      const formData = this.employeeForm.value;
      
      const data: any = {
        fullName: formData.fullName,
        documentId: formData.documentId,
      };
      
      if (formData.phone?.trim()) data.phone = formData.phone.trim();
      if (formData.address?.trim()) data.address = formData.address.trim();
      if (formData.position?.trim()) data.position = formData.position.trim();
      if (formData.baseSalary !== null && formData.baseSalary !== '' && formData.baseSalary !== undefined) {
        data.baseSalary = Number(formData.baseSalary);
      }

      const operation = this.editingEmployee
        ? this.employeesService.update(this.editingEmployee.id, data)
        : this.employeesService.create(data);

      operation.subscribe({
        next: () => {
          this.showEmployeeModal = false;
          this.loadEmployees();
          this.loading = false;
          this.notificationService.success(
            this.editingEmployee ? 'Empleada actualizada exitosamente' : 'Empleada creada exitosamente'
          );
        },
        error: (err) => {
          this.notificationService.error(
            'Error al guardar empleada: ' + (err.error?.message || 'Error desconocido')
          );
          this.loading = false;
        }
      });
    }
  }

  deleteEmployee(id: string): void {
    if (confirm('¿Estás seguro de eliminar esta empleada?')) {
      this.employeesService.delete(id).subscribe({
        next: () => {
          this.loadEmployees();
          this.notificationService.success('Empleada eliminada exitosamente');
        },
        error: () => {
          this.notificationService.error('Error al eliminar empleada');
        }
      });
    }
  }

  // ==========================================
  // PAYMENT METHODS
  // ==========================================

  loadPayments(): void {
    this.loadingPayments = true;
    this.paymentsService.getAll().subscribe({
      next: (data) => {
        this.payments = data;
        this.loadingPayments = false;
      },
      error: (err) => {
        this.notificationService.error('Error al cargar pagos');
        this.loadingPayments = false;
      }
    });
  }

  openPaymentModal(): void {
    this.editingPayment = null;
    this.paymentForm.reset({ bonuses: 0, deductions: 0, paymentDate: new Date().toISOString().split('T')[0] });
    this.paymentForm.get('baseSalary')?.setValue(0);
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.editingPayment = null;
  }

  onEmployeeChange(employeeId: string): void {
    const selectedEmployee = this.employees.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      this.paymentForm.get('baseSalary')?.setValue(selectedEmployee.baseSalary || 0);
    }
  }

  openEditPaymentModal(payment: Payment): void {
    this.editingPayment = payment;
    this.paymentForm.patchValue({
      employeeId: payment.employee.id,
      paymentDate: payment.paymentDate.toString().split('T')[0],
      bonuses: payment.bonuses || 0,
      deductions: payment.deductions || 0,
      notes: payment.notes || ''
    });
    this.paymentForm.get('baseSalary')?.setValue(payment.baseSalary);
    this.showPaymentModal = true;
  }

  savePayment(): void {
    if (this.paymentForm.valid) {
      this.loading = true;
      const formValue = this.paymentForm.getRawValue();
      const { baseSalary, ...paymentData } = formValue;
      
      if (paymentData.bonuses) paymentData.bonuses = Number(paymentData.bonuses);
      if (paymentData.deductions) paymentData.deductions = Number(paymentData.deductions);
      
      const isEditing = !!this.editingPayment;
      const operation = this.editingPayment
        ? this.paymentsService.update(this.editingPayment.id, paymentData)
        : this.paymentsService.create(paymentData);

      operation.subscribe({
        next: () => {
          this.closePaymentModal();
          this.loadPayments();
          this.loading = false;
          this.notificationService.success(
            isEditing ? 'Pago actualizado exitosamente' : 'Pago registrado exitosamente'
          );
        },
        error: (err) => {
          this.notificationService.error(
            'Error al guardar pago: ' + (err.error?.message || 'Error desconocido')
          );
          this.loading = false;
        }
      });
    }
  }

  deletePayment(id: string): void {
    if (confirm('¿Estás seguro de eliminar este pago?')) {
      this.paymentsService.delete(id).subscribe({
        next: () => {
          this.loadPayments();
          this.notificationService.success('Pago eliminado exitosamente');
        },
        error: () => {
          this.notificationService.error('Error al eliminar pago');
        }
      });
    }
  }

  downloadPDF(paymentId: string): void {
    this.paymentsService.downloadPDF(paymentId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante-${paymentId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('PDF descargado exitosamente');
      },
      error: () => {
        this.notificationService.error('Error al descargar PDF');
      }
    });
  }

  // ==========================================
  // SIGNATURE METHODS
  // ==========================================

  openSignatureModal(payment: Payment): void {
    this.paymentToSign = payment;
    this.showSignatureModal = true;
  }

  closeSignatureModal(): void {
    this.showSignatureModal = false;
    this.paymentToSign = null;
  }

  saveSignature(signatureData: string): void {
    if (!this.paymentToSign) return;

    this.loading = true;
    this.paymentsService.signPayment(this.paymentToSign.id, signatureData).subscribe({
      next: () => {
        this.notificationService.success('Firma guardada exitosamente');
        this.closeSignatureModal();
        this.loadPayments();
        this.loading = false;
      },
      error: (err) => {
        this.notificationService.error('Error al guardar firma: ' + (err.error?.message || 'Error desconocido'));
        this.loading = false;
      }
    });
  }

  // ==========================================
  // USER METHODS
  // ==========================================

  loadUsers(): void {
    this.loadingUsers = true;
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: (err) => {
        this.notificationService.error('Error al cargar usuarios');
        this.loadingUsers = false;
      }
    });
  }

  openUserModal(user?: User): void {
    if (user) {
      this.editingUser = user;
      this.userForm.patchValue({ 
        fullName: user.fullName, 
        email: user.email,
        houseId: user.houseId
      });
      this.userForm.get('password')?.clearValidators();
    } else {
      this.editingUser = null;
      this.userForm.reset();
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      
      // Si NO es super_admin, auto-asignar su casa
      if (this.currentUser?.role !== 'super_admin') {
        this.userForm.patchValue({ houseId: this.authService.getHouseId() });
      }
    }
    
    // Configurar validador de houseId según el rol
    if (this.currentUser?.role === 'super_admin') {
      this.userForm.get('houseId')?.setValidators([Validators.required]);
    } else {
      this.userForm.get('houseId')?.clearValidators();
    }
    
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('houseId')?.updateValueAndValidity();
    this.showUserModal = true;
  }

  saveUser(): void {
    if (this.userForm.valid) {
      this.loading = true;
      const formData = this.userForm.value;
      
      if (!this.authService.canManageUsers()) {
        this.notificationService.error('No tienes permisos para crear usuarios');
        this.loading = false;
        return;
      }
      
      // Determinar houseId
      let houseId: string;
      if (this.currentUser?.role === 'super_admin') {
        houseId = formData.houseId;
      } else {
        houseId = this.authService.getHouseId() || this.currentUser?.houseId || '';
      }

      // Validar que houseId no esté vacío
      if (!houseId) {
        this.notificationService.error('Debe seleccionar una casa para el usuario');
        this.loading = false;
        return;
      }

      const data: any = {
        fullName: formData.fullName,
        email: formData.email,
        houseId: houseId
      };
      
      if (formData.password) {
        data.password = formData.password;
      }

      const operation = this.editingUser
        ? this.usersService.update(this.editingUser.id, data)
        : this.usersService.create(data);

      operation.subscribe({
        next: () => {
          this.showUserModal = false;
          this.loadUsers();
          this.loading = false;
          this.notificationService.success(
            this.editingUser ? 'Usuario actualizado' : 'Usuario creado'
          );
        },
        error: (err) => {
          this.notificationService.error(
            'Error: ' + (err.error?.message || 'Error desconocido')
          );
          this.loading = false;
        }
      });
    }
  }

  deleteUser(id: string): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.usersService.delete(id).subscribe({
        next: () => {
          this.loadUsers();
          this.notificationService.success('Usuario eliminado exitosamente');
        },
        error: () => {
          this.notificationService.error('Error al eliminar usuario');
        }
      });
    }
  }

  // ==========================================
  // MARKET EXPENSE METHODS
  // ==========================================

  loadMarketExpenses(): void {
    this.loadingMarketExpenses = true;
    this.marketExpensesService.getAll().subscribe({
      next: (data) => {
        this.marketExpenses = data;
        this.loadingMarketExpenses = false;
        this.loadMonthStats();
      },
      error: (err) => {
        this.notificationService.error('Error al cargar gastos de mercado');
        this.loadingMarketExpenses = false;
      }
    });
  }

  loadMonthStats(): void {
    this.marketExpensesService.getStatsByMonth(this.selectedYear, this.selectedMonth).subscribe({
      next: (stats) => {
        this.monthStats = stats;
      },
      error: () => {
        this.monthStats = null;
      }
    });
  }

  onMonthYearChange(): void {
    this.loadMonthStats();
  }

  openMarketExpenseModal(expense?: MarketExpense): void {
    if (expense) {
      this.editingMarketExpense = expense;
      this.marketExpenseForm.patchValue({
        date: expense.date.toString().split('T')[0],
        place: expense.place,
        amount: expense.amount,
        notes: expense.notes || '',
        category: expense.category || 'mercado',
        responsibleId: expense.responsibleId
      });
    } else {
      this.editingMarketExpense = null;
      this.marketExpenseForm.reset({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: 'mercado'
      });
    }
    this.showMarketExpenseModal = true;
  }

  closeMarketExpenseModal(): void {
    this.showMarketExpenseModal = false;
    this.editingMarketExpense = null;
    this.marketExpenseForm.reset();
  }

  saveMarketExpense(): void {
    if (this.marketExpenseForm.valid) {
      this.loading = true;
      const formData = this.marketExpenseForm.value;
      
      const operation = this.editingMarketExpense
        ? this.marketExpensesService.update(this.editingMarketExpense.id, formData)
        : this.marketExpensesService.create(formData);

      operation.subscribe({
        next: () => {
          this.notificationService.success(
            this.editingMarketExpense ? 'Gasto actualizado exitosamente' : 'Gasto registrado exitosamente'
          );
          this.closeMarketExpenseModal();
          this.loadMarketExpenses();
          this.loading = false;
        },
        error: (err) => {
          this.notificationService.error(
            'Error al guardar gasto: ' + (err.error?.message || 'Error desconocido')
          );
          this.loading = false;
        }
      });
    }
  }

  deleteMarketExpense(id: string): void {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      this.marketExpensesService.delete(id).subscribe({
        next: () => {
          this.notificationService.success('Gasto eliminado exitosamente');
          this.loadMarketExpenses();
        },
        error: () => {
          this.notificationService.error('Error al eliminar gasto');
        }
      });
    }
  }

  // ==========================================
  // PASSWORD CHANGE
  // ==========================================

  openChangePasswordModal(): void {
    this.changePasswordForm.reset();
    this.showChangePasswordModal = true;
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.changePasswordForm.reset();
  }

  changePassword(): void {
    if (this.changePasswordForm.valid) {
      const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;
      
      if (newPassword !== confirmPassword) {
        this.notificationService.error('Las contraseñas no coinciden');
        return;
      }

      this.loading = true;
      this.usersService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.notificationService.success('Contraseña actualizada exitosamente');
          this.closeChangePasswordModal();
          this.loading = false;
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || 'Error al cambiar contraseña'
          );
          this.loading = false;
        }
      });
    }
  }

  // ==========================================
  // AUTH
  // ==========================================

  logout(): void {
    this.authService.logout();
  }
}