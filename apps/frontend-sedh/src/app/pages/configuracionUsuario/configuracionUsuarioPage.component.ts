import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'sedh-configuracion-usuario-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DividerModule
  ],
  templateUrl: './configuracionUsuarioPage.component.html',
  styleUrl: './configuracionUsuarioPage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionUsuarioPageComponent {
  protected readonly authService = inject(AuthService);

  // Estado del formulario
  protected readonly isEditingProfile = signal(false);
  protected readonly isChangingPassword = signal(false);

  // Datos del perfil (editable)
  protected readonly profileForm = signal({
    nombre: this.authService.currentUser()?.nombre || '',
    apellido: this.authService.currentUser()?.apellido || '',
    emailInstitucional: this.authService.currentUser()?.emailInstitucional || '',
  });

  // Datos de cambio de contraseña
  protected readonly passwordForm = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Iniciales del usuario
  protected readonly userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'U';

    const nombreInicial = user.nombre?.charAt(0).toUpperCase() || '';
    const apellidoInicial = user.apellido?.charAt(0).toUpperCase() || '';

    return `${nombreInicial}${apellidoInicial}` || 'U';
  });

  onEditProfile(): void {
    this.isEditingProfile.set(true);
  }

  onCancelEditProfile(): void {
    this.isEditingProfile.set(false);
    // Restaurar datos originales
    this.profileForm.set({
      nombre: this.authService.currentUser()?.nombre || '',
      apellido: this.authService.currentUser()?.apellido || '',
      emailInstitucional: this.authService.currentUser()?.emailInstitucional || '',
    });
  }

  onSaveProfile(): void {
    // TODO: Implementar guardado de perfil
    console.log('Guardar perfil:', this.profileForm());
    this.isEditingProfile.set(false);
  }

  onChangePassword(): void {
    // TODO: Implementar cambio de contraseña
    console.log('Cambiar contraseña');
    this.passwordForm.set({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    this.isChangingPassword.set(false);
  }

  onCancelChangePassword(): void {
    this.isChangingPassword.set(false);
    this.passwordForm.set({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  }

  onStartChangePassword(): void {
    this.isChangingPassword.set(true);
  }
}
