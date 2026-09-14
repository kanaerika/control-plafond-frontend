import { Component, OnInit, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { TraductionService } from '../../core/traduction/traduction.service';

/**
 * La réinitialisation du mot de passe est désormais gérée par Keycloak (lien
 * « Forgot Password ? » de sa page de connexion — le realm autorise
 * resetPasswordAllowed). L'ancien parcours OTP par SMS s'appuyait sur
 * /api/auth/** qui n'existe plus côté backend.
 *
 * Ce composant ne fait plus que rediriger vers Keycloak ; la route est
 * conservée pour ne pas casser les liens et marque-pages existants.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [],
  template: `
    <div class="redirection">
      <p>Redirection vers la page de connexion sécurisée…</p>
    </div>
  `,
  styles: [`
    .redirection { min-height:60vh; display:flex; align-items:center; justify-content:center;
      font-family:'Manrope', sans-serif; color:#5A6270; font-size:15px; }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  private readonly keycloak = inject(KeycloakService);
  readonly tr = inject(TraductionService);

  ngOnInit(): void {
    this.keycloak.login();
  }
}
