import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { ProfilService } from '../../services/profil.service';
import { TraductionService } from '../../core/traduction/traduction.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="fond">
    <div class="cin coque" [class.reduit]="menuReduit()">

      <!-- ===== Sidebar ===== -->
      <nav class="sidebar">
        <div class="logo">
          <div class="logo-panel"><img src="assets/images/AFB.png" alt="Afriland First Bank"></div>
          <span class="logo-caption">TransFlow</span>
        </div>

        <div class="section">{{ tr.t('menu.titre') }}</div>
        <div class="menu">
          <a class="navi item" routerLink="/app/verification" routerLinkActive="actif">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <span>{{ tr.t('menu.verification') }}</span>
          </a>
          <a class="navi item" routerLink="/app/historique" routerLinkActive="actif">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
            <span>{{ tr.t('menu.historique') }}</span>
          </a>
          <a class="navi item" routerLink="/app/bilan" routerLinkActive="actif">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>{{ tr.t('menu.bilan') }}</span>
          </a>
          <a class="navi item" routerLink="/app/annulation" routerLinkActive="actif">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            <span>{{ tr.t('menu.annulation') }}</span>
          </a>
          <a class="navi item" routerLink="/app/non-cloture" routerLinkActive="actif">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{{ tr.t('menu.nonClotures') }}</span>
          </a>
          @if (estAdmin) {
            <a class="navi item" routerLink="/admin/dashboard">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>{{ tr.t('menu.espaceAdministration') }}</span>
            </a>
          }
        </div>

        <div class="bas">
          <button class="langue" (click)="tr.basculer()" title="Français / English">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span class="l-txt">{{ tr.langue() === 'fr' ? 'Français' : 'English' }}</span>
            <svg class="l-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div class="agent">
            <div class="ligne">
              <div class="avatar">{{ initiales }}</div>
              <div class="infos">
                <div class="anom">{{ nomAgent }}</div>
                <div class="acanal">{{ roleLabel }} · {{ canalLabel }}</div>
              </div>
              <button class="chevron-collapse" (click)="basculerMenu()" title="Réduire le menu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            </div>
            <button class="navi deco" (click)="deconnexion()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>{{ tr.t('menu.deconnexion') }}</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- ===== Zone principale ===== -->
      <div class="principal">
        <header>
          <div class="entete-gauche">
            <button class="burger" (click)="basculerMenu()" title="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div class="titre-bloc">
              <div class="titre-ic">
                @switch (routeIcone()) {
                  @case ('historique') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                  }
                  @case ('bilan') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  }
                  @case ('annulation') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                  }
                  @case ('noncloture') {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  }
                  @default {
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                }
              </div>
              <div class="titres">
                <div class="disp titre">{{ titre }}</div>
                <div class="soustitre">{{ sousTitre }}</div>
              </div>
            </div>
          </div>
          <div class="droite">
            <button class="ent-btn" title="Notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="pastille"></span>
            </button>
            <div class="datejour">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--rouge)" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
              <div class="dj-txt">
                <span class="dj-date">{{ dateLongue }}</span>
                <span class="dj-heure">{{ heureCourante }}</span>
              </div>
            </div>
            <button class="ent-btn" (click)="theme.basculer()" [title]="theme.theme() === 'sombre' ? 'Mode clair' : 'Mode sombre'">
              @if (theme.theme() === 'sombre') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
          </div>
        </header>

        <div class="contenu">
          <router-outlet />
        </div>
      </div>

    </div>
  </div>
  `,
  styles: [`
    :host { display:block; height:100vh; }
    .fond { height:100vh; background:var(--fond); }
    .coque { display:flex; height:100vh; width:100%; }

    /* ===== Sidebar ===== */
    .sidebar {
      width:300px; flex:none; position:fixed; top:0; left:0; bottom:0; z-index:20;
      background:var(--surface); border-right:1px solid var(--bordure);
      display:flex; flex-direction:column; padding:22px 16px;
      transition:width .22s ease, padding .22s ease;
    }
    /* Logo — même disposition que l'espace admin : bandeau pleine largeur + légende dessous */
    .logo { display:block; margin:0 6px 30px; }
    .logo-panel { display:flex; align-items:center; min-height:64px; padding:9px 12px; border-radius:12px; background:transparent; box-shadow:none; }
    .logo-panel img { display:block; width:100%; max-height:48px; object-fit:contain; }
    /* Le logo a un texte sombre non transparent : fond blanc en mode sombre pour rester lisible. */
    :host-context([data-theme="dark"]) .logo-panel { background:#fff; box-shadow:0 8px 18px rgba(0,0,0,.16); }
    .logo-caption { display:block; margin:8px 4px 0; color:var(--gris); font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; overflow:hidden; }

    .section { margin-top:8px; font-size:10px; font-weight:800; letter-spacing:1.4px; color:var(--texte-faible); padding:0 8px 10px; white-space:nowrap; overflow:hidden; }
    .menu { display:flex; flex-direction:column; gap:4px; }
    .item { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:11px; font-size:13.5px; font-weight:600; color:var(--gris); background:transparent; cursor:pointer; white-space:nowrap; }
    .item svg { flex:none; }
    .item:hover { color:var(--encre); background:var(--gris-clair); }
    .item.actif { color:#fff; background:linear-gradient(135deg,var(--rouge),var(--rouge-fonce)); font-weight:800; box-shadow:0 12px 22px -12px rgba(215,25,32,.8); }

    /* ===== Bas de sidebar ===== */
    .bas { margin-top:auto; display:flex; flex-direction:column; gap:12px; padding-top:14px; }
    .langue {
      display:flex; align-items:center; gap:10px; width:100%;
      border:1px solid var(--bordure); background:var(--surface); color:var(--gris);
      border-radius:11px; padding:10px 12px; font-size:12.5px; font-weight:700; cursor:pointer;
    }
    .langue:hover { border-color:var(--rouge); color:var(--rouge); }
    .langue .l-txt { flex:1; text-align:left; }
    .langue svg { flex:none; }

    .agent { background:var(--surface-2); border:1px solid var(--bordure); border-radius:14px; padding:12px; }
    .ligne { display:flex; align-items:center; gap:10px; }
    .avatar { width:36px; height:36px; flex:none; border-radius:50%; background:linear-gradient(135deg,var(--rouge),var(--rouge-fonce)); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:12.5px; }
    .infos { min-width:0; line-height:1.28; flex:1; }
    .anom { color:var(--encre); font-size:12.5px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .acanal { font-size:10.5px; color:var(--texte-faible); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chevron-collapse { flex:none; width:24px; height:24px; display:grid; place-items:center; border:none; background:transparent; color:var(--texte-faible); border-radius:7px; cursor:pointer; }
    .chevron-collapse:hover { background:var(--gris-clair); color:var(--encre); }
    .deco { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin-top:10px; border:none; background:var(--rouge-fond); color:var(--rouge); font-weight:800; font-size:12px; padding:9px; border-radius:9px; cursor:pointer; }
    .deco:hover { background:rgba(215,25,32,.2); }

    /* ===== Main ===== */
    .principal { flex:1; margin-left:300px; height:100vh; display:flex; flex-direction:column; min-width:0; transition:margin-left .22s ease; }
    header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 30px 16px; background:var(--surface); border-bottom:1px solid var(--bordure); position:relative; }
    header::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:linear-gradient(90deg,var(--rouge),var(--rouge-fonce) 38%,transparent); }
    .entete-gauche { display:flex; align-items:center; gap:16px; min-width:0; }
    .burger { flex:none; width:40px; height:40px; display:grid; place-items:center; border:1px solid var(--bordure); border-radius:11px; background:var(--surface); color:var(--gris); cursor:pointer; }
    .burger:hover { background:var(--gris-clair); color:var(--encre); }
    .titre-bloc { display:flex; align-items:center; gap:13px; min-width:0; }
    .titre-ic { flex:none; width:42px; height:42px; border-radius:12px; background:var(--rouge-fond); color:var(--rouge); display:grid; place-items:center; }
    .titres { min-width:0; }
    .titre { font-size:20px; font-weight:800; color:var(--encre); letter-spacing:-.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .soustitre { font-size:12.5px; color:var(--gris); font-weight:500; margin-top:2px; }
    .droite { display:flex; align-items:center; gap:10px; flex:none; }
    .ent-btn { position:relative; flex:none; display:flex; align-items:center; justify-content:center; width:38px; height:38px; border:1px solid var(--bordure); border-radius:11px; background:var(--surface); color:var(--gris); cursor:pointer; }
    .ent-btn:hover { background:var(--gris-clair); color:var(--rouge); }
    .pastille { position:absolute; top:8px; right:9px; width:7px; height:7px; border-radius:50%; background:var(--rouge); border:2px solid var(--surface); }
    .datejour { display:flex; align-items:center; gap:9px; padding:7px 13px; border:1px solid var(--bordure); border-radius:11px; background:var(--surface); }
    .dj-txt { display:flex; flex-direction:column; line-height:1.25; }
    .dj-date { font-size:12.5px; font-weight:700; color:var(--encre); white-space:nowrap; }
    .dj-heure { font-size:11px; color:var(--gris); white-space:nowrap; }
    .contenu { flex:1; overflow-y:auto; padding:22px 30px 28px; }

    /* ===== Mode réduit (hamburger) ===== */
    .coque.reduit .sidebar { width:78px; padding:22px 12px; }
    .coque.reduit .principal { margin-left:78px; }
    .coque.reduit .logo-caption,
    .coque.reduit .section,
    .coque.reduit .item span,
    .coque.reduit .langue .l-txt,
    .coque.reduit .langue .l-chev,
    .coque.reduit .agent .infos,
    .coque.reduit .agent .chevron-collapse,
    .coque.reduit .deco span { display:none; }
    .coque.reduit .logo { margin:0 0 22px; }
    .coque.reduit .logo-panel { padding:6px; }
    .coque.reduit .item { justify-content:center; gap:0; }
    .coque.reduit .langue { justify-content:center; }
    .coque.reduit .ligne { justify-content:center; }
    .coque.reduit .deco { gap:0; }

    @media (max-width:1180px) {
      .sidebar { width:78px; padding:22px 12px; }
      .principal { margin-left:78px; }
      .logo-caption, .section, .item span, .langue .l-txt, .langue .l-chev,
      .agent .infos, .agent .chevron-collapse, .deco span { display:none; }
      .logo { margin:0 0 22px; }
      .logo-panel { padding:6px; }
      .item { justify-content:center; gap:0; }
      .langue, .ligne { justify-content:center; }
      .deco { gap:0; }
      .coque.reduit .sidebar { width:300px; padding:22px 16px; }
      .coque.reduit .principal { margin-left:300px; }
      .coque.reduit .logo-caption, .coque.reduit .section, .coque.reduit .item span,
      .coque.reduit .langue .l-txt, .coque.reduit .langue .l-chev,
      .coque.reduit .agent .infos, .coque.reduit .agent .chevron-collapse,
      .coque.reduit .deco span { display:revert; }
      .coque.reduit .logo { margin:0 6px 30px; }
      .coque.reduit .logo-panel { padding:9px 12px; }
      .coque.reduit .item { justify-content:flex-start; gap:12px; }
      .coque.reduit .langue, .coque.reduit .ligne { justify-content:flex-start; }
    }
    @media (max-width:720px) {
      .dj-heure { display:none; }
      .soustitre { display:none; }
      .contenu { padding:18px 16px 24px; }
      header { padding:14px 16px 12px; }
    }
  `]
})
export class LayoutComponent implements OnDestroy {
  private readonly keycloak = inject(KeycloakService);
  private readonly profilService = inject(ProfilService);
  readonly tr = inject(TraductionService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly profil = signal<{ nomComplet: string; agence: string | null; partenaireNom: string } | null>(null);

  /** Sidebar réduite via le bouton hamburger. */
  readonly menuReduit = signal(false);
  /** Horloge de l'en-tête, rafraîchie chaque minute. */
  readonly maintenant = signal(new Date());
  private readonly horloge = setInterval(() => this.maintenant.set(new Date()), 30_000);

  constructor() {
    this.profilService.consulter().subscribe({
      next: p => this.profil.set(p),
      error: () => this.profil.set(null)
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.horloge);
  }

  basculerMenu(): void {
    this.menuReduit.update(v => !v);
  }

  get estAdmin(): boolean {
    const roles = this.keycloak.getUserRoles().map(r => r.toLowerCase());
    return roles.includes('admin') || roles.includes('realm-admin');
  }

  get nomAgent(): string { return this.profil()?.nomComplet ?? this.tr.t('layout.agentParDefaut'); }

  get roleLabel(): string { return this.estAdmin ? 'Admin' : this.tr.t('layout.agentParDefaut'); }

  /** Initiales pour l'avatar (2 lettres). */
  get initiales(): string {
    const nom = this.nomAgent.trim();
    if (!nom || nom === this.tr.t('layout.agentParDefaut')) return 'AG';
    const parties = nom.split(/\s+/).filter(Boolean);
    const a = parties[0]?.[0] ?? '';
    const b = parties[1]?.[0] ?? parties[0]?.[1] ?? '';
    return (a + b).toUpperCase();
  }

  get canalLabel(): string {
    const partenaire = this.profil()?.partenaireNom;
    if (partenaire && partenaire.trim() !== '') {
      return partenaire;
    }
    return 'Afriland First Bank';
  }

  /** Titres selon la route active (comme dans la maquette) */
  private titres: Record<string, [string, string]> = {
    '/app/verification':   ['layout.titreVerification', 'layout.sousTitreVerification'],
    '/app/historique':     ['layout.titreHistorique', 'layout.sousTitreHistorique'],
    '/app/bilan':          ['layout.titreBilan', 'layout.sousTitreBilan'],
    '/app/annulation':     ['layout.titreAnnulation', 'layout.sousTitreAnnulation'],
    '/app/non-cloture':    ['layout.titreNonClotures', 'layout.sousTitreNonClotures'],
    '/app/details':        ['layout.titreDetails', 'layout.sousTitreDetails']
  };

  get titre(): string {
    const cle = this.cle()?.[0];
    return cle ? this.tr.t(cle) : this.tr.t('layout.titreDefaut');
  }
  get sousTitre(): string {
    const cle = this.cle()?.[1];
    return cle ? this.tr.t(cle) : '';
  }
  private cle(): [string, string] | undefined {
    const url = this.router.url;
    const entree = Object.entries(this.titres).find(([k]) => url.startsWith(k));
    return entree?.[1];
  }

  /** Icône d'en-tête selon la route. */
  routeIcone(): 'transfert' | 'historique' | 'bilan' | 'annulation' | 'noncloture' {
    const url = this.router.url;
    if (url.startsWith('/app/historique')) return 'historique';
    if (url.startsWith('/app/bilan')) return 'bilan';
    if (url.startsWith('/app/annulation')) return 'annulation';
    if (url.startsWith('/app/non-cloture')) return 'noncloture';
    return 'transfert';
  }

  private get locale(): string { return this.tr.langue() === 'fr' ? 'fr-FR' : 'en-GB'; }

  get dateLongue(): string {
    return this.maintenant().toLocaleDateString(this.locale, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get heureCourante(): string {
    const d = this.maintenant();
    const jour = d.toLocaleDateString(this.locale, { weekday: 'short' }).replace('.', '');
    const heure = d.toLocaleTimeString(this.locale, { hour: '2-digit', minute: '2-digit' });
    return `${jour.charAt(0).toUpperCase()}${jour.slice(1)}. ${heure}`;
  }

  deconnexion(): void {
    // keycloak.logout() termine la session Keycloak elle-même (pas seulement
    // l'état local) : sans ça, la session SSO reste active et LoginComponent
    // renvoie aussitôt l'utilisateur sur sa page d'accueil au prochain accès
    // à /connexion, donnant l'impression que la déconnexion ne fonctionne pas.
    this.keycloak.logout(window.location.origin);
  }
}
