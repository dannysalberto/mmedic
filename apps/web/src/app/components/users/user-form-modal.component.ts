import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { User, UserRole, CreateUserDto, UpdateUserDto } from '@mmedic/types';
import { UsersService } from '../../services/users.service';

function passwordMatchValidator(isEdit: boolean): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const passwordCtrl = group.get('password');
    const confirmCtrl = group.get('confirmPassword');
    if (!passwordCtrl || !confirmCtrl) return null;

    const password = passwordCtrl.value || '';
    const confirm = confirmCtrl.value || '';

    // If edit mode and both are empty, it's valid
    if (isEdit && !password && !confirm) {
      if (confirmCtrl.hasError('mismatch') || confirmCtrl.hasError('requiredIfPassword')) {
        const errs = { ...confirmCtrl.errors };
        delete errs['mismatch'];
        delete errs['requiredIfPassword'];
        confirmCtrl.setErrors(Object.keys(errs).length ? errs : null);
      }
      return null;
    }

    // If password is typed, confirm is required
    if (password && !confirm) {
      confirmCtrl.setErrors({ ...confirmCtrl.errors, requiredIfPassword: true });
      return { mismatch: true };
    }

    // If values do not match
    if (password !== confirm) {
      confirmCtrl.setErrors({ ...confirmCtrl.errors, mismatch: true });
      return { mismatch: true };
    }

    // Values match: clear mismatch errors
    if (confirmCtrl.errors) {
      const errs = { ...confirmCtrl.errors };
      delete errs['mismatch'];
      delete errs['requiredIfPassword'];
      confirmCtrl.setErrors(Object.keys(errs).length ? errs : null);
    }
    return null;
  };
}

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.css'],
})
export class UserFormModalComponent implements OnInit {
  @Input() userToEdit: User | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<User>();

  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  form!: FormGroup;

  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'ROL_SUPERADMIN', label: 'Super Administrador' },
    { value: 'ROL_ADMIN', label: 'Administrador de Clínica' },
    { value: 'ROL_MEDICO', label: 'Médico Especialista' },
    { value: 'ROL_CAJERO', label: 'Cajero / Facturación' },
    { value: 'ROL_GERENCIA', label: 'Gerencia y Reportes' },
  ];

  ngOnInit() {
    const isEdit = !!this.userToEdit;
    this.form = this.fb.group(
      {
        fullName: [this.userToEdit?.fullName || '', [Validators.required, Validators.minLength(3)]],
        username: [
          { value: this.userToEdit?.username || '', disabled: isEdit },
          [Validators.required, Validators.minLength(3)],
        ],
        email: [
          { value: this.userToEdit?.email || '', disabled: isEdit },
          [Validators.required, Validators.email],
        ],
        role: [this.userToEdit?.role || 'ROL_CAJERO', [Validators.required]],
        password: [
          '',
          isEdit ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)],
        ],
        confirmPassword: ['', isEdit ? [] : [Validators.required]],
      },
      {
        validators: [passwordMatchValidator(isEdit)],
      }
    );
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();

    if (this.userToEdit) {
      const updateDto: UpdateUserDto = {
        fullName: val.fullName,
        role: val.role,
      };
      if (val.password && val.password.trim().length >= 6) {
        updateDto.password = val.password;
      }

      this.usersService.updateUser(this.userToEdit.id, updateDto).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.saved.emit(res.data);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al actualizar usuario');
        },
      });
    } else {
      const createDto: CreateUserDto = {
        fullName: val.fullName,
        username: val.username,
        email: val.email,
        password: val.password,
        role: val.role,
      };

      this.usersService.createUser(createDto).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.saved.emit(res.data);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Error al crear usuario');
        },
      });
    }
  }
}
