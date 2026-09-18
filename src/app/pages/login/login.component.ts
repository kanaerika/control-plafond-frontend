import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { TraductionService } from '../../core/traduction/traduction.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
  <div class="cin page-photo">
    <div class="carte-connexion">

      <div class="logo-carte">
        <img src="assets/images/AFB.png" alt="Afriland First Bank">
      </div>

      <h1 class="titre-carte">
        {{ tr.t('login.retourTitre1') }}<br>
        <span class="accent">{{ tr.t('login.retourTitre2') }}</span>
      </h1>
      <p class="desc-carte">{{ tr.t('login.pitch') }}</p>

      <div class="badge-securise">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        {{ tr.t('login.accesSecurise') }}
      </div>

      <label for="champ-email-connexion">{{ tr.t('login.email') }}</label>

        <div class="fld m16">
          <span class="ic">
            <svg width="18" height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">

              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>

          <input
            id="champ-email-connexion"
            class="fin"
            [(ngModel)]="email"
            type="email"
            autocomplete="email"
            placeholder="nom@entreprise.com"
            (keyup.enter)="connexion()">
        </div>

        <p class="desc-carte" style="margin:-6px 0 18px;">
          Vous serez redirigé vers la page de connexion sécurisée pour saisir votre mot de passe.
        </p>

        @if (erreur) {
          <div class="err">{{ erreur }}</div>
        }

        <button
          class="lift btn"
          (click)="connexion()"
          [disabled]="chargement">

          @if (chargement) {
            <span class="spin"></span>
          }
          {{ chargement ? tr.t('login.connexionEnCours') : tr.t('login.bouton') }}

        </button>

        <div class="pied-carte">
          <a routerLink="/">{{ tr.t('login.retourAccueil') }}</a>
          <a class="lien-oubli" (click)="motDePasseOublie()">{{ tr.t('login.oubli') }}</a>
        </div>

        <div class="copyright-carte">{{ tr.t('commun.copyright') }}</div>

    </div>          <!-- fin .carte-connexion -->
  </div>            <!-- fin .page-photo -->
`,
  styles: [`
    .page-photo {
      min-height:100vh;
      width:100%;
      display:flex;
      align-items:center;
      justify-content:flex-end;
      padding:40px clamp(24px, 6vw, 90px);
      background:
        linear-gradient(100deg, rgba(255,255,255,.12), rgba(255,255,255,0) 45%),
        url('/assets/images/landing-bg.jpg') center/cover no-repeat;
    }

    .carte-connexion {
      width:440px;
      max-width:100%;
      background:var(--surface);
      border-radius:22px;
      box-shadow:0 30px 70px -25px rgba(15,17,20,.5);
      padding:40px 40px 32px;
    }

    .logo-carte { display:inline-flex; border-radius:14px; background:var(--surface); border:1px solid var(--bordure); padding:8px 12px; box-shadow:0 8px 18px -8px rgba(215,25,32,.35); margin-bottom:22px; }
    .logo-carte img { display:block; height:46px; width:auto; object-fit:contain; }

    .titre-carte { font-size:28px; font-weight:800; line-height:1.18; letter-spacing:-.4px; color:var(--encre); margin:0 0 10px; font-family:'Sora','Manrope',sans-serif; }
    .titre-carte .accent { color:var(--rouge); }
    .desc-carte { color:var(--gris); font-size:14px; line-height:1.6; margin:0 0 18px; max-width:360px; }

    .badge-securise { display:inline-flex; align-items:center; gap:6px; background:var(--rouge-fond); color:var(--rouge-fonce); font-size:11.5px; font-weight:700; letter-spacing:.2px; padding:6px 12px; border-radius:100px; margin-bottom:24px; }

    label { font-size:12.5px; font-weight:700; color:var(--texte); display:block; margin-bottom:7px; }
    .m16 { margin-bottom:16px; } .m10 { margin-bottom:10px; }

    .fld .fin.avec-oeil { padding-right:42px; }
    .oeil { position:absolute; right:10px; top:50%; transform:translateY(-50%); border:none; background:none; color:var(--texte-faible); cursor:pointer; display:flex; padding:6px; border-radius:8px; }
    .oeil:hover { color:var(--rouge); background:var(--rouge-fond); }

    .ligne { display:flex; align-items:center; margin:6px 0 20px; }
    .souvenir { display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:500; color:var(--gris-texte); cursor:pointer; margin:0; }
    .souvenir input { accent-color:var(--rouge); width:15px; height:15px; }
    .err { text-align:center; color:var(--rouge); background:var(--rouge-fond); border-radius:10px; padding:10px; font-size:13px; font-weight:700; margin:0 0 16px; }

    .btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; border:none; background:linear-gradient(135deg,var(--rouge),var(--rouge-fonce)); color:#fff; font-weight:700; font-size:15px; padding:15px; border-radius:14px; cursor:pointer; box-shadow:0 16px 32px -12px rgba(215,25,32,.85); }
    .btn:disabled { opacity:.75; cursor:default; }
    .spin { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; animation:tourne .7s linear infinite; }
    @keyframes tourne { to { transform:rotate(360deg); } }

    .pied-carte { display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:18px; border-top:1px solid var(--bordure); }
    .pied-carte a { font-size:12.5px; font-weight:700; color:var(--gris); cursor:pointer; }
    .pied-carte a:hover { color:var(--rouge); }

    .copyright-carte { text-align:center; margin-top:16px; font-size:11.5px; color:var(--texte-faible); }

    @media (max-width:640px){
      .page-photo {
        justify-content:center;
        padding:22px;
        background:
          linear-gradient(rgba(255,255,255,.6), rgba(255,255,255,.6)),
          url('/assets/images/landing-bg.jpg') center/cover no-repeat;
      }
      .carte-connexion { padding:30px 24px 26px; }
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly keycloak = inject(KeycloakService);
  private readonly router = inject(Router);
  readonly tr = inject(TraductionService);

  email = '';
  erreur = '';
  chargement = false;

  ngOnInit(): void {
    // Keycloak renvoie ici (redirectUri = /connexion) après un login réussi.
    // Sans cette vérification, un utilisateur déjà authentifié resterait
    // bloqué sur le formulaire de connexion au lieu d'atteindre son espace.
    if (this.keycloak.isLoggedIn()) {
      this.router.navigate([this.routeAccueil()]);
    }
  }

  private routeAccueil(): string {
    const roles = new Set(this.keycloak.getUserRoles().map(r => r.toLowerCase()));
    const isAdmin = roles.has('admin') || roles.has('realm-admin');
    return isAdmin ? '/admin/dashboard' : '/app/verification';
  }

  connexion(): void {

    if (!this.email.trim()) {
      this.erreur = "Veuillez renseigner votre adresse e-mail.";
      return;
    }

    this.erreur = '';
    this.chargement = true;

    // L'authentification est déléguée à Keycloak : le mot de passe n'est plus
    // saisi ici. On redirige vers l'écran de connexion Keycloak en pré-remplissant
    // l'email (loginHint).
    this.keycloak.login({ loginHint: this.email }).catch(() => {
      this.chargement = false;
      this.erreur = "Impossible de contacter le service d'authentification.";
    });
  }

  /**
   * La réinitialisation du mot de passe est gérée par Keycloak (lien
   * « Forgot Password ? » de sa page de connexion — le realm autorise
   * resetPasswordAllowed). On y redirige en pré-remplissant l'email s'il est
   * saisi ; l'ancien flux OTP maison (/api/auth/**) n'existe plus.
   */
  motDePasseOublie(): void {
    this.keycloak.login(this.email.trim() ? { loginHint: this.email.trim() } : {});
  }
}
