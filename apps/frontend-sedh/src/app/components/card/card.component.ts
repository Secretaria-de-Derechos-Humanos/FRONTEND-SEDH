import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  // Inputs
  title = input.required<string>();
  imageUrl = input.required<string>();
  altText = input<string>('');

  // Output
  cardClick = output<void>();

  // Estado interno
  protected isOpening = signal(false);

  protected handleClick(): void {
    // Activar animación de cierre de la puerta
    this.isOpening.set(true);

    // Emitir evento después de la animación (600ms)
    setTimeout(() => {
      this.cardClick.emit();
      this.isOpening.set(false);
    }, 600);
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick();
    }
  }
}
