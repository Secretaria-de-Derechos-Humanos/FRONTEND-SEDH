import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface UserProfile {
  personalInfo: {
    telefono: string;
  };
  institucionalInfo: {
    avatar: string;
    nombre: string;
    apellido: string;
    rol: string;
    emailInstitucional: string;
    departamento: string;
    fechaIngreso: string;
  };
}

interface ActivityData {
  date: string;
  count: number;
}

interface HeatmapWeek {
  days: (ActivityData | null)[];
}

@Component({
  selector: 'app-configuracion-usuario-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracionUsuarioPage.component.html',
  styleUrl: './configuracionUsuarioPage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionUsuarioPageComponent implements OnInit {
  protected readonly userProfile = signal<UserProfile | null>(null);
  protected readonly activityData = signal<ActivityData[]>([]);
  protected readonly heatmapWeeks = signal<HeatmapWeek[]>([]);
  protected readonly isEditingPersonal = signal(false);

  protected readonly editableData = signal({
    telefono: ''
  });

  protected readonly userInitials = computed(() => {
    const profile = this.userProfile();
    if (!profile) return 'U';

    const nombreInicial = profile.institucionalInfo.nombre?.charAt(0).toUpperCase() || '';
    const apellidoInicial = profile.institucionalInfo.apellido?.charAt(0).toUpperCase() || '';

    return `${nombreInicial}${apellidoInicial}` || 'U';
  });

  protected readonly totalActivities = computed(() => {
    return this.activityData().reduce((sum, day) => sum + day.count, 0);
  });

  protected readonly weekDayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

  protected readonly monthLabels = computed(() => {
    const months: { label: string; weeks: number }[] = [];
    const totalWeeks = this.heatmapWeeks().length;

    if (totalWeeks === 0) return months;

    const startDate = new Date(2025, 3, 28);
    let currentMonth = startDate.getMonth();

    for (let i = 0; i < 12; i++) {
      const weeksInMonth = Math.ceil(totalWeeks / 12);
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      months.push({
        label: monthNames[currentMonth],
        weeks: weeksInMonth
      });

      currentMonth = (currentMonth + 1) % 12;
    }

    return months;
  });

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadActivityData();
  }

  private loadUserProfile(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.userProfile.set({
      personalInfo: {
        telefono: user.telefono ?? '',
      },
      institucionalInfo: {
        avatar: '',
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.puesto,
        emailInstitucional: user.email,
        departamento: user.dependencia,
        fechaIngreso: user.fechaIngreso,
      },
    });

    this.editableData.set({
      telefono: user.telefono ?? '',
    });
  }

  private loadActivityData(): void {
    this.http.get<{ heatmapData: ActivityData[] }>('/data/userActivity.json').subscribe({
      next: (data) => {
        this.activityData.set(data.heatmapData);
        this.generateHeatmapWeeks(data.heatmapData);
      },
      error: (error) => console.error('Error cargando actividad:', error)
    });
  }

  private generateHeatmapWeeks(data: ActivityData[]): void {
    const weeks: HeatmapWeek[] = [];
    const today = new Date(2026, 3, 27);
    const oneYearAgo = new Date(2026, 3, 27);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const dataMap = new Map(data.map(d => [d.date, d.count]));

    const currentDate = new Date(oneYearAgo);

    let currentWeek: (ActivityData | null)[] = [];
    const startDayOfWeek = currentDate.getDay();

    if (startDayOfWeek !== 1) {
      const daysToMonday = startDayOfWeek === 0 ? 1 : (8 - startDayOfWeek) % 7;
      currentDate.setDate(currentDate.getDate() + daysToMonday);
    }

    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateString = currentDate.toISOString().split('T')[0];
        const count = dataMap.get(dateString) || 0;

        currentWeek.push({ date: dateString, count });

        if (dayOfWeek === 5) {
          weeks.push({ days: currentWeek });
          currentWeek = [];
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 5) {
        currentWeek.push(null);
      }
      weeks.push({ days: currentWeek });
    }

    this.heatmapWeeks.set(weeks);
  }

  protected getActivityLevel(count: number): string {
    if (count === 0) return 'level-0';
    if (count <= 3) return 'level-1';
    if (count <= 6) return 'level-2';
    if (count <= 9) return 'level-3';
    return 'level-4';
  }

  protected onEditPersonal(): void {
    this.isEditingPersonal.set(true);
  }

  protected onSavePersonal(): void {
    console.log('Guardar datos personales:', this.editableData());
    this.isEditingPersonal.set(false);
  }

  protected onCancelEdit(): void {
    const profile = this.userProfile();
    if (profile) {
      this.editableData.set({
        telefono: profile.personalInfo.telefono,
      });
    }
    this.isEditingPersonal.set(false);
  }
}
