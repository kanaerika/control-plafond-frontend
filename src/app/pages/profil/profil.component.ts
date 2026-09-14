import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KeycloakService } from 'keycloak-angular';
import { ProfilService } from '../../services/profil.service';
import { ProfilResponse } from '../../models/models';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.css'
})
export class ProfilComponent implements OnInit {

  private readonly keycloak = inject(KeycloakService);
  private readonly profilService = inject(ProfilService);

  /** Identité résolue via /v1/profil (claim email du JWT Keycloak côté backend). */
  private readonly profil = signal<ProfilResponse | null>(null);

  readonly nomComplet = computed(() => this.profil()?.nomComplet ?? '');
  readonly role = computed(() => this.profil()?.role ?? '');
  readonly partenaireNom = computed(() => this.profil()?.partenaireNom ?? 'Afriland First Bank');
  readonly agence = computed(() => this.profil()?.agence ?? '—');
  readonly email = computed(() => this.profil()?.email ?? '');

  readonly libelleRole = computed(() => {
    switch (this.role()) {
      case 'ADMIN': return 'Administrateur';
      case 'AGENT': return 'Agent';
      default: return this.role();
    }
  });

  ngOnInit(): void {
    this.profilService.consulter().subscribe({
      next: p => this.profil.set(p),
      error: () => this.profil.set(null)
    });
  }

  /**
   * Le mot de passe est géré par Keycloak : on ouvre sa page hébergée
   * « Update Password » plutôt qu'un formulaire maison (l'endpoint
   * /api/auth/changer-mot-de-passe n'existe plus).
   */
  ouvrirGestionMotDePasse(): void {
    this.keycloak.login({ action: 'UPDATE_PASSWORD' });
  }
}
