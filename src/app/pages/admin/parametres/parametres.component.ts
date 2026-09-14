import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { KeycloakService } from 'keycloak-angular';
import { ProfilService } from '../../../services/profil.service';
import { ConfigurationService } from '../../../services/configuration.service';
import { ToastService } from '../../../core/ui/toast.service';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ProfilResponse, ConfigurationResponse } from '../../../models/models';

type Onglet = 'profil' | 'securite' | 'plafond';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.css']
})
export class ParametresComponent implements OnInit {

  private readonly profilService = inject(ProfilService);
  private readonly configService = inject(ConfigurationService);
  private readonly keycloak = inject(KeycloakService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly onglet = signal<Onglet>('profil');
  /** Rôle lu depuis le realm Keycloak. */
  readonly estAdmin = signal(
    this.keycloak.getUserRoles().map(r => r.toLowerCase())
      .some(r => r === 'admin' || r === 'realm-admin')
  );
  /**
   * Le plafond est partagé par tous les partenaires : seul l'admin du partenaire
   * fondateur (Afriland) le configure. La distinction se fait sur le partenaire
   * d'appartenance (résolu via /v1/profil), pas sur un rôle Keycloak.
   */
  readonly estAdminAfriland = computed(() =>
    this.estAdmin()
      && (this.profil()?.partenaireNom ?? '').trim().toLowerCase() === 'afriland first bank'
  );

  // ---- Profil ----
  readonly profil = signal<ProfilResponse | null>(null);
  formProfil = { nomComplet: '', email: '', agence: '' };
  readonly sauvProfil = signal(false);

  // ---- Plafond ----
  readonly config = signal<ConfigurationResponse | null>(null);
  plafondSaisi = signal<number>(0);
  readonly sauvPlafond = signal(false);

  ngOnInit(): void {
    this.profilService.consulter().subscribe({
      next: p => {
        this.profil.set(p);
        this.formProfil = { nomComplet: p.nomComplet, email: p.email, agence: p.agence ?? '' };
        // estAdminAfriland dépend du profil : on charge la config une fois qu'il est connu.
        if (this.estAdminAfriland()) {
          this.configService.lire().subscribe({
            next: c => { this.config.set(c); this.plafondSaisi.set(c.plafondMensuel); },
            error: () => this.toast.erreur('Impossible de charger la configuration.')
          });
        }
      },
      error: () => this.toast.erreur('Impossible de charger le profil.')
    });
  }

  // ---- Profil ----
  enregistrerProfil(): void {
    if (this.sauvProfil() || !this.formProfil.nomComplet.trim() || !this.formProfil.email.trim()) return;
    this.sauvProfil.set(true);
    this.profilService.modifier(this.formProfil).subscribe({
      next: p => { this.profil.set(p); this.sauvProfil.set(false); this.toast.succes('Profil mis à jour.'); },
      error: (e: HttpErrorResponse) => { this.sauvProfil.set(false); this.toast.erreur(this.msg(e)); }
    });
  }

  // ---- Sécurité ----
  /**
   * L'authentification est déléguée à Keycloak : le changement de mot de passe
   * se fait sur sa page « Update Password » hébergée, pas via un endpoint maison
   * (l'ancien /api/auth/changer-mot-de-passe n'existe plus).
   */
  ouvrirGestionMotDePasse(): void {
    this.keycloak.login({ action: 'UPDATE_PASSWORD' });
  }

  // ---- Plafond ----
  async enregistrerPlafond(): Promise<void> {
    const valeur = Number(this.plafondSaisi());
    if (!valeur || valeur <= 0) {
      this.toast.erreur('Le plafond doit être un montant positif.');
      return;
    }
    const actuel = this.config()?.plafondMensuel ?? 0;
    if (valeur === actuel) {
      this.toast.info('Aucune modification : le plafond est identique.');
      return;
    }

    const ok = await this.confirm.demander({
      titre: 'Modifier le plafond mensuel',
      message: `Le plafond passera de ${this.format(actuel)} à ${this.format(valeur)} FCFA. Ce changement s'applique immédiatement à tous les contrôles de transfert. Continuer ?`,
      texteConfirmer: 'Modifier le plafond',
      danger: true
    });
    if (!ok) return;

    this.sauvPlafond.set(true);
    this.configService.modifierPlafond(valeur).subscribe({
      next: c => {
        this.config.set(c);
        this.plafondSaisi.set(c.plafondMensuel);
        this.sauvPlafond.set(false);
        this.toast.succes('Plafond mensuel mis à jour.');
      },
      error: (e: HttpErrorResponse) => { this.sauvPlafond.set(false); this.toast.erreur(this.msg(e)); }
    });
  }

  format(m: number): string {
    return new Intl.NumberFormat('fr-FR').format(m);
  }

  initiales(nom?: string | null): string {
    return (nom || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(mot => mot.charAt(0).toUpperCase())
      .join('') || '?';
  }

  private msg(e: HttpErrorResponse): string {
    if (e.status === 0) return 'Serveur injoignable.';
    return e.error?.message ?? e.error?.error ?? 'Une erreur est survenue.';
  }
}