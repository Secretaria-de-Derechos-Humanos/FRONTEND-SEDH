export interface Usuario {
  idusuario: string;
  emailinstitucional: string;
  activo: boolean;
  nombre: string | null;
}
export interface Rol {
  idRol?: number;
  nomRol: string;
}
