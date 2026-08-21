import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuariosApiService } from '../../core/services/usuarios-api';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './cambiar-password.html',
  styleUrls: ['./cambiar-password.css']
})
export class CambiarPasswordComponent {

  private usuariosService = inject(UsuariosApiService);
  private router = inject(Router);

  passwordActual = '';
  nuevaPassword = '';
  confirmarPassword = '';
  mostrarPassword = false;
  guardando = false;

  guardar() {
    if (
      !this.passwordActual ||
      !this.nuevaPassword ||
      !this.confirmarPassword
    ) {
      alert("Debe completar todos los campos.");
      return;
    }

    if (this.nuevaPassword.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    if (this.passwordActual === this.nuevaPassword) {
      alert("La nueva contraseña debe ser diferente.");
      return;
    }

    this.guardando = true;

    this.usuariosService
      .cambiarPassword(
        this.passwordActual,
        this.nuevaPassword
      )
      .subscribe({

        next: (respuesta:any)=>{
          this.guardando = false;
          alert(respuesta.message);
          this.router.navigate(['/login']);
        },
        error:(err)=>{
          this.guardando=false;
          console.error(err);
          alert(err.error.message);

        }

      });

  }

}
