import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

export interface Registrosalida{
  id: number;
  empleado: string;
  departamento:string;
  motivo:string;
  horaSalida:string;
  horaRetorno:string |null;
  estado:'Fuera' | 'Retornado';
}

@Component({
  selector: 'app-salidas-retornos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salidasRetornos.component.html',
  styleUrls: ['./salidasRetornos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

//control de pantalla
export  class SalidasRetornosComponent {
private fb = inject(FormBuilder);
registrosHoy = signal <number>(3);
cargando = signal <boolean>(false);


// formulario de salida reactivo
salidaForm: FormGroup = this.fb.group({
   empleado:['', [Validators.required]],
   departamento: ['', [Validators.required]],
   motivo: ['', [Validators.required]]

});
listaSalidas = signal<Registrosalida[]>([
  {
    id: 1,
    empleado:'Jose Matute',
    departamento:'Recursos Humanos',
    motivo:'Diligencia Bancaria',
    horaSalida:'11:15 AM',
    horaRetorno:'12:30',
    estado:'Retornado'
  },
]);
// agregar salida
agregarSalida (){
  if (this.salidaForm.invalid){
    this.salidaForm.markAllAsTouched();
    return;
  }
  const nuevosDatos= this.salidaForm.value;
  const nuevoRegistro: Registrosalida = {
  id: Date.now(),
  empleado: nuevosDatos.empleado,
  departamento: nuevosDatos.departamento,
  motivo:nuevosDatos.motivo,
  horaSalida: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
  horaRetorno: null,
  estado: 'Fuera'
  };

  this.listaSalidas.update(actuales => [nuevoRegistro, ...actuales]);
  this.registrosHoy.update(total  => total+1 );
  this.salidaForm.reset({departamento: ''});
}

  //modificar el estado del empleado 'fuera' a 'retornado'
  marcarRetorno(id:number){
    const horaActual = new Date().toLocaleDateString([], {hour: '2-digit', minute:'2-digit'});

  this.listaSalidas.update(salidas  =>
    salidas.map(s=> {
      if(s.id === id ){
        return{ ...s, horaRetorno: horaActual, estado: 'Retornado' as const};
      }
      return s;
    })
  );

  }
}


