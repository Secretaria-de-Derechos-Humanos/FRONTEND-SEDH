import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ThemeToggleComponent } from '../components/themeToggle/themeToggle.component';
import { SystemPreloaderComponent } from '../components/preloader/systemPreloader.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'sedh-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    ThemeToggleComponent,
    SystemPreloaderComponent
  ],
  templateUrl: './loginPage.component.html',
  styleUrl: './loginPage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly showPreloader = signal(true);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get emailCtrl() {
    return this.loginForm.get('email');
  }

  get passwordCtrl() {
    return this.loginForm.get('password');
  }

  onPreloaderComplete(): void {
    this.showPreloader.set(false);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (user) => {
        this.loading.set(false);
        console.log('Login exitoso:', user);
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.message || 'Error al iniciar sesión');
      }
    });
  }
}
