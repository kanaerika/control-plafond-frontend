import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { ProfilService } from '../../../services/profil.service';
import { ThemeService } from '../../../core/theme/theme.service';

const PARTENAIRE_AFRILAND = 'Afriland First Bank';

const CLE_TAILLE_TEXTE = 'admin-taille-texte';
const TAILLE_MIN = 90;
const TAILLE_MAX = 130;
const TAILLE_PAS = 10;
const TAILLE_DEFAUT = 110;

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {

  private readonly keycloak = inject(KeycloakService);
  private readonly profilService = inject(ProfilService);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  /**
   * Seul l'admin du partenaire Afriland First Bank onboarde d'autres
   * partenaires ; un admin d'un autre partenaire a le même rôle Keycloak
   * "ADMIN" — la distinction se fait donc sur le partenaire d'appartenance
   * (résolu via /v1/profil), pas sur le rôle. Même logique que afrilandGuard.
   */
  private readonly partenaireNom = signal<string | null>(null);

  constructor() {
    this.profilService.consulter().subscribe({
      next: p => this.partenaireNom.set(p.partenaireNom),
      error: () => this.partenaireNom.set(null)
    });
  }

  get estAdminAfriland(): boolean {
    return this.partenaireNom() === PARTENAIRE_AFRILAND;
  }

  // ---- Menu latéral repliable (bouton hamburger) ----
  sidebarOuvert = signal(true);

  basculerSidebar(): void {
    this.sidebarOuvert.update(v => !v);
  }

  // ---- Sous-menu "Transactions" (arborescence) ----
  transactionsOuvert = signal(false);

  basculerTransactions(): void {
    this.transactionsOuvert.update(v => !v);
  }

  // ---- Taille du texte ----
  taillePolice = signal<number>(this.chargerTaille());
  readonly tailleMin = TAILLE_MIN;
  readonly tailleMax = TAILLE_MAX;

  augmenterTexte(): void {
    this.taillePolice.update(v => Math.min(TAILLE_MAX, v + TAILLE_PAS));
    this.sauvegarderTaille();
  }

  diminuerTexte(): void {
    this.taillePolice.update(v => Math.max(TAILLE_MIN, v - TAILLE_PAS));
    this.sauvegarderTaille();
  }

  private chargerTaille(): number {
    const brut = Number(localStorage.getItem(CLE_TAILLE_TEXTE));
    return brut >= TAILLE_MIN && brut <= TAILLE_MAX ? brut : TAILLE_DEFAUT;
  }

  private sauvegarderTaille(): void {
    localStorage.setItem(CLE_TAILLE_TEXTE, String(this.taillePolice()));
  }

  // ---- Titre de section (uniquement pour l'espace Transactions, qui n'a pas d'entête propre) ----
  private readonly titresTransactions: Record<string, [string, string]> = {
    '/admin/transactions/verification':  ['Vérification du plafond', 'Contrôlez le plafond mensuel Hors CEMAC avant exécution'],
    '/admin/transactions/historique':    ['Historique des transferts', "Consultez l'ensemble des transferts enregistrés"],
    '/admin/transactions/bilan':         ['Bilan du jour', "Résumé de l'activité quotidienne des transferts"],
    '/admin/transactions/annulation':    ['Annulation & rejet', 'Annulez ou rejetez un transfert en attente'],
    '/admin/transactions/non-cloture':   ['Non clôturés', 'Transferts autorisés en attente de référence']
  };

  private entreeTitre(): [string, string] | undefined {
    const url = this.router.url;
    return Object.entries(this.titresTransactions).find(([k]) => url.startsWith(k))?.[1];
  }

  get titreSection(): string | null {
    return this.entreeTitre()?.[0] ?? null;
  }

  get sousTitreSection(): string {
    return this.entreeTitre()?.[1] ?? '';
  }

  deconnexion(): void {
    // keycloak.logout() termine la session Keycloak elle-même : sans ça, la
    // session SSO reste active et LoginComponent renvoie aussitôt
    // l'utilisateur sur /admin/dashboard au prochain accès à /connexion.
    this.keycloak.logout(window.location.origin);
  }
}
