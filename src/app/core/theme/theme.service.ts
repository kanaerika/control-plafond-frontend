import { Injectable, signal } from '@angular/core';

export type Theme = 'clair' | 'sombre';

const CLE_THEME = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.themeInitial());

  constructor() {
    this.appliquer(this.theme());
  }

  basculer(): void {
    const suivant: Theme = this.theme() === 'clair' ? 'sombre' : 'clair';
    this.theme.set(suivant);
    this.appliquer(suivant);
    localStorage.setItem(CLE_THEME, suivant);
  }

  private themeInitial(): Theme {
    const stocke = localStorage.getItem(CLE_THEME);
    if (stocke === 'clair' || stocke === 'sombre') return stocke;
    // Thème clair par défaut (la maquette de l'espace agent est en clair) ;
    // l'utilisateur peut toujours basculer en sombre, son choix est mémorisé.
    return 'clair';
  }

  private appliquer(theme: Theme): void {
    document.documentElement.dataset['theme'] =
  theme === 'sombre' ? 'dark' : 'light';
  }
}
