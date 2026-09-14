import { Component, OnInit, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

/**
 * Le changement de mot de passe « première connexion » est géré par Keycloak
 * lui-même : un mot de passe temporaire déclenche l'action requise
 * UPDATE_PASSWORD sur sa page hébergée, avant même que l'application ne se
 * charge. L'ancien endpoint /api/auth/premier-mot-de-passe n'existe plus.
 *
 * La route est conservée mais ne fait plus que renvoyer vers Keycloak.
 */
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [],
  template: `
    <div class="redirection">
      <p>Redirection vers la page sécurisée de mot de passe…</p>
    </div>
  `,
  styles: [`
    .redirection { min-height:60vh; display:flex; align-items:center; justify-content:center;
      font-family:'Manrope', sans-serif; color:#5A6270; font-size:15px; }
  `]
})
export class ChangePasswordComponent implements OnInit {
  private readonly keycloak = inject(KeycloakService);

  ngOnInit(): void {
    this.keycloak.login({ action: 'UPDATE_PASSWORD' });
  }
}
