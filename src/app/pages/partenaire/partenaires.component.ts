import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Partenaire } from '../../models/models';

/** SUPER ADMIN (Afriland) : gestion des partenaires et de leurs invitations. */
@Component({
  selector: 'app-partenaires',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="carte">
    <h3>{{ enEdition ? 'Modifier le partenaire' : 'Nouveau partenaire' }}</h3>
    <p class="aide">Le partenaire recevra une invitation par email : son administrateur
       activera lui-même son compte en choisissant son mot de passe.</p>
    <div class="form-grid">
      <label for="partenaire-nom-form" class="sr-only">Nom du partenaire</label>
      <input id="partenaire-nom-form" class="in" [(ngModel)]="form.nom" placeholder="Nom du partenaire (ex : Express Union)">
      <label for="partenaire-email-form" class="sr-only">Email de l'administrateur</label>
      <input id="partenaire-email-form" class="in" [(ngModel)]="form.email" type="email" placeholder="Email de l'administrateur">
      @if (!enEdition) {
        <label for="partenaire-nom-admin-form" class="sr-only">Nom de l'administrateur du partenaire</label>
        <input id="partenaire-nom-admin-form" class="in large" [(ngModel)]="form.nomAdministrateur" placeholder="Nom de l'administrateur du partenaire">
      }
    </div>
    @if (erreur) { <div class="err">{{ erreur }}</div> }
    @if (info) { <div class="ok">✓ {{ info }}</div> }
    <div class="actions">
      @if (enEdition) { <button class="navi btn-gris" (click)="annulerEdition()">Annuler</button> }
      <button class="lift btn" (click)="enregistrer()" [disabled]="chargement">
        {{ chargement ? 'Envoi…' : (enEdition ? 'Enregistrer' : "Créer et envoyer l'invitation") }}
      </button>
    </div>
  </div>

  <div class="carte">
    <h3>Partenaires ({{ partenaires.length }})</h3>
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>Partenaire</th><th>Email</th><th>Administrateur</th><th>État</th><th></th></tr></thead>
      <tbody>
        @for (p of partenaires; track p.id) {
          <tr [class.ligne-inactive]="!p.actif">
            <td class="nom">{{ p.nom }}</td>
            <td>{{ p.email }}</td>
            <td>
  <span
    class="badge"
    [class.badge-ok]="p.actif"
    [class.badge-attente]="!p.actif">

    {{ p.actif ? 'Administrateur actif' : 'Invitation en attente' }}

  </span>
</td>
            <td><span class="badge" [class.badge-ko]="!p.actif" [class.badge-ok]="p.actif">
              {{ p.actif ? 'Actif' : 'Désactivé' }}</span></td>
            <td class="droite"><div class="actions-cell">
              <button class="navi lien" (click)="editer(p)">Modifier</button>
              <button
    class="navi lien"
    (click)="reinviter(p)">

    Renvoyer l'invitation

</button>
              <button class="navi lien" [class.lien-danger]="p.actif" (click)="basculer(p)">
                {{ p.actif ? 'Désactiver' : 'Activer' }}
              </button>
            </div></td>
          </tr>
        }
      </tbody>
    </table></div>
  </div>
  `,
  styles: [`
    .carte { background:var(--surface); border:1px solid var(--bordure); border-radius:18px; padding:24px 26px; margin-bottom:22px; }
    h3 { margin:0 0 8px; font-size:16px; color:var(--texte); }
    .aide { font-size:12.5px; color:var(--gris); margin:0 0 16px; line-height:1.6; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .large { grid-column:1 / -1; }
    .actions { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; }
    .btn { border:none; cursor:pointer; padding:12px 22px; border-radius:12px; font-size:13.5px; font-weight:700; color:#fff; background:linear-gradient(135deg,var(--rouge),var(--rouge-fonce)); }
    .btn-gris { border:1px solid var(--bordure); cursor:pointer; padding:12px 20px; border-radius:12px; font-size:13px; font-weight:700; color:var(--encre); background:var(--surface); }
    .table-wrap { overflow-x:auto; }
    .tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
    .tbl th { text-align:left; font-size:11px; font-weight:700; letter-spacing:.6px; text-transform:uppercase; color:var(--gris-texte); padding:12px 16px; border-bottom:1px solid var(--bordure); }
    .tbl td { padding:15px 16px; border-bottom:1px solid var(--bordure); vertical-align:middle; color:var(--texte); }
    .nom { font-weight:700; white-space:nowrap; }
    .ligne-inactive { opacity:.55; }
    .badge { font-size:11px; font-weight:700; border-radius:20px; padding:4px 12px; background:var(--gris-clair); color:var(--texte); white-space:nowrap; }
    .badge-ok { background:var(--vert-fond); color:var(--vert); }
    .badge-ko { background:var(--rouge-fond); color:var(--rouge); }
    .badge-attente { background:var(--orange-fond); color:var(--orange); }
    .droite { text-align:right; }
    .actions-cell { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
    .lien { font-size:11.5px; font-weight:700; cursor:pointer; border:1px solid var(--bordure); background:var(--surface); color:var(--encre); padding:6px 12px; border-radius:8px; white-space:nowrap; }
    .lien-danger { color:var(--rouge); border-color:rgba(215,25,32,.3); }
    .err { color:var(--rouge); font-size:12.5px; font-weight:700; margin-top:10px; }
    .ok { color:var(--vert); background:var(--vert-fond); border-radius:9px; padding:9px 12px; font-size:12.5px; font-weight:700; margin-top:10px; }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  `]
})
export class PartenairesComponent implements OnInit {

  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl + '/superadmin/partenaires';

  partenaires: Partenaire[] = [];
  form = { nom: '', email: '', nomAdministrateur: '' };
  enEdition: Partenaire | null = null;
  erreur = ''; info = ''; chargement = false;

  ngOnInit(): void { this.charger(); }

  charger(): void {
    this.http.get<Partenaire[]>(this.api).subscribe({ next: p => this.partenaires = p });
  }

  enregistrer(): void {
    this.erreur = ''; this.info = '';
    if (!this.form.nom.trim() || !this.form.email.trim() || (!this.enEdition && !this.form.nomAdministrateur.trim())) {
      this.erreur = 'Tous les champs sont obligatoires.'; return;
    }
    this.chargement = true;
    const requete = this.enEdition
      ? this.http.put<Partenaire>(`${this.api}/${this.enEdition.id}`, { nom: this.form.nom.trim(), email: this.form.email.trim() })
      : this.http.post<Partenaire>(this.api, { ...this.form });
    requete.subscribe({
      next: () => {
        this.chargement = false;
        this.info = this.enEdition ? 'Partenaire modifié.' : "Partenaire créé — invitation envoyée à son administrateur.";
        this.annulerEdition(); this.charger();
      },
      error: err => { this.chargement = false; this.erreur = err?.error?.message ?? 'Opération impossible.'; }
    });
  }

  editer(p: Partenaire): void {
    this.enEdition = p;
    this.form = { nom: p.nom, email: p.email, nomAdministrateur: '' };
    this.info = ''; this.erreur = '';
  }

  annulerEdition(): void {
    this.enEdition = null;
    this.form = { nom: '', email: '', nomAdministrateur: '' };
  }

  basculer(p: Partenaire): void {
    this.http.patch<Partenaire>(`${this.api}/${p.id}/activation`, {}).subscribe({
      next: () => this.charger(),
      error: err => this.erreur = err?.error?.message ?? 'Opération impossible.'
    });
  }

  reinviter(p: Partenaire): void {
    this.info = ''; this.erreur = '';
    this.http.post<{ message: string }>(`${this.api}/${p.id}/invitation`, {}).subscribe({
      next: res => this.info = res.message,
      error: err => this.erreur = err?.error?.message ?? 'Envoi impossible.'
    });
  }
}