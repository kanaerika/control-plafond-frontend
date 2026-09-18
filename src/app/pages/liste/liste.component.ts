import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TransfertService } from '../../services/transfert.service';
import { Transfert } from '../../models/models';
import { imprimerBordereau } from '../../core/bordereau';
import { ToastService } from '../../core/ui/toast.service';
 
type Mode = 'historique' | 'annulation' | 'non-cloture';
 
@Component({
  selector: 'app-liste',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="cin carte">
    <div class="recherche">
      <div class="fld">
        <span class="ic">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <label for="recherche-liste" class="sr-only">Rechercher un client, une référence</label>
        <input id="recherche-liste" class="fin" [(ngModel)]="recherche" (keyup.enter)="charger()" placeholder="Rechercher un client, une référence…">
      </div>
      <button class="lift btn" (click)="charger()">Rechercher</button>
    </div>
 
    @if (transferts.length === 0) {
      <div class="vide">Aucun transfert à afficher.</div>
    }
 
    @if (transferts.length > 0) {
      <div class="table-wrap"><table class="tbl">
        <thead>
          <tr>
            <th>Client</th>
            <th>Destination</th>
            <th>Montant</th>
            <th>Canal</th>
            <th>Référence</th>
            <th>Saisi par</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Motif</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (t of transferts; track t.id) {
            <tr>
              <td class="nom">
                <div class="client">
                  <div class="avatar">{{ initiales(t.nomClient) }}</div>
                  <span>{{ t.nomClient }}</span>
                </div>
              </td>
              <td class="no-coupe">{{ t.paysDestination }}</td>
              <td class="no-coupe"><b>{{ fmt(t.montant) }}</b> FCFA</td>
              <td class="no-coupe">{{ t.canal }}</td>
              <td class="no-coupe">{{ t.reference || '—' }}</td>
              <td class="saisi"><b>{{ t.agentNom || '—' }}</b>{{ t.agence }}</td>
              <td class="no-coupe">{{ t.dateTransfert }}</td>
              <td class="no-coupe"><span [class]="statutClasse(t.statut)">{{ t.statut }}</span></td>
              <td class="motif-col">{{ t.motif || '—' }}</td>
              <td class="acts"><div class="actions-cell">
                <button class="navi lien" (click)="voirDetails(t)">Détails</button>
                <button class="navi lien" (click)="imprimer(t)">Bordereau</button>
                @if (mode === 'annulation') {
                  <button class="navi lien lien-danger" (click)="ouvrirMotif(t, 'annulation')">Annuler</button>
                  <button class="navi lien lien-danger" (click)="ouvrirMotif(t, 'rejet')">Rejeter</button>
                }
                @if (mode === 'non-cloture') {
                  <button class="navi lien lien-danger" (click)="ouvrirCloture(t)">Clôturer</button>
                }
              </div></td>
            </tr>
          }
        </tbody>
      </table></div>
    }
 
    <!-- Popup de saisie du motif (annulation ou rejet) -->
    @if (cible) {
      <div class="voile" (click)="fermerMotif()">
        <div class="popup" (click)="$event.stopPropagation()">
          <div class="popup-tete">
            <div class="popup-titre">
              {{ action === 'annulation' ? 'Annuler ce transfert' : 'Rejeter ce transfert' }}
            </div>
            <button class="popup-x" (click)="fermerMotif()">✕</button>
          </div>
 
          <div class="popup-resume">
            <div class="pr-ligne"><span>Client</span><b>{{ cible.nomClient }}</b></div>
            <div class="pr-ligne"><span>Montant</span><b>{{ fmt(cible.montant) }} FCFA</b></div>
            <div class="pr-ligne"><span>Destination</span><b>{{ cible.paysDestination }}</b></div>
            <div class="pr-ligne"><span>Référence</span><b>{{ cible.reference }}</b></div>
          </div>
 
          <label for="motif-annulation-rejet" class="popup-label">Motif de {{ action === 'annulation' ? "l'annulation" : 'du rejet' }} <span class="oblig">— obligatoire</span></label>
          <textarea id="motif-annulation-rejet" class="in motif-zone" [(ngModel)]="motif" rows="3"
                    placeholder="Expliquez pourquoi cette opération est {{ action === 'annulation' ? 'annulée' : 'rejetée' }} (au moins 10 caractères)…"></textarea>
          <div class="motif-compteur" [class.ok]="motif.trim().length >= 10">
            {{ motif.trim().length >= 10 ? '✓ Motif valide' : motif.trim().length + '/10 caractères minimum' }}
          </div>
          @if (erreurMotif) { <div class="err">{{ erreurMotif }}</div> }
 
          <div class="popup-actions">
            <button class="navi btn-gris" (click)="fermerMotif()">Retour</button>
            <button class="lift btn btn-confirm" [disabled]="motif.trim().length < 10 || envoi"
                    (click)="confirmer()">
              {{ envoi ? 'Envoi…' : (action === 'annulation' ? "Confirmer l'annulation" : 'Confirmer le rejet') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Popup de clôture d'un transfert non clôturé -->
    @if (cibleCloture; as cc) {
      <div class="voile" (click)="fermerCloture()">
        <div class="popup" (click)="$event.stopPropagation()">
          <div class="popup-tete">
            <div class="popup-titre">Clôturer ce transfert</div>
            <button class="popup-x" (click)="fermerCloture()">✕</button>
          </div>

          <div class="popup-resume">
            <div class="pr-ligne"><span>Client</span><b>{{ cc.nomClient }}</b></div>
            <div class="pr-ligne"><span>Montant</span><b>{{ fmt(cc.montant) }} FCFA</b></div>
            <div class="pr-ligne"><span>Destination</span><b>{{ cc.paysDestination }}</b></div>
          </div>

          <label for="reference-cloture" class="popup-label">Référence de la plateforme externe <span class="oblig">— obligatoire</span></label>
          <input id="reference-cloture" class="in" [(ngModel)]="referenceCloture" placeholder="Référence saisie sur la plateforme…">

          <label for="canal-cloture" class="popup-label" style="margin-top:14px;">Canal</label>
          <select id="canal-cloture" class="in" [(ngModel)]="canalCloture">
            <option value="">{{ cc.canal || 'Non précisé' }}</option>
            @for (c of canaux; track c.nom) { <option [value]="c.nom">{{ c.nom }}</option> }
          </select>

          @if (erreurCloture) { <div class="err">{{ erreurCloture }}</div> }

          <div class="popup-actions">
            <button class="navi btn-gris" (click)="fermerCloture()">Retour</button>
            <button class="lift btn btn-confirm" [disabled]="!referenceCloture.trim() || envoi"
                    (click)="confirmerCloture()">
              {{ envoi ? 'Envoi…' : 'Confirmer la clôture' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Popup de détail d'un transfert -->
    @if (detailsCible; as d) {
      <div class="voile" (click)="fermerDetails()">
        <div class="popup popup-details" (click)="$event.stopPropagation()">
          <div class="popup-tete">
            <div class="popup-titre">Détail du transfert</div>
            <button class="popup-x" (click)="fermerDetails()">✕</button>
          </div>

          <div class="fiche">
            <div class="cell"><div class="cl">CLIENT</div><div class="cv">{{ d.nomClient }}</div></div>
            <div class="cell"><div class="cl">NAISSANCE</div><div class="cv">{{ d.dateNaissance }}</div></div>
            <div class="cell"><div class="cl">NATURE PIÈCE</div><div class="cv">{{ d.naturePiece }}</div></div>
            <div class="cell"><div class="cl">N° PIÈCE</div><div class="cv">{{ d.numeroPiece }}</div></div>
            <div class="cell"><div class="cl">DESTINATION</div><div class="cv">{{ d.paysDestination }}</div></div>
            <div class="cell"><div class="cl">MONTANT</div><div class="cv">{{ fmt(d.montant) }} FCFA</div></div>
            <div class="cell"><div class="cl">CANAL</div><div class="cv">{{ d.canal || '—' }}</div></div>
            <div class="cell"><div class="cl">AGENCE</div><div class="cv">{{ d.agence || '—' }}</div></div>
            <div class="cell"><div class="cl">RÉFÉRENCE DE TRANSACTION</div><div class="cv">{{ d.reference || '—' }}</div></div>
            <div class="cell"><div class="cl">RÉFÉRENCE DE VÉRIFICATION</div><div class="cv">{{ d.referenceVerification || '—' }}</div></div>
            <div class="cell"><div class="cl">DATE DU TRANSFERT</div><div class="cv">{{ d.dateTransfert }}</div></div>
            <div class="cell"><div class="cl">STATUT</div><div class="cv">{{ d.statut }}</div></div>
            <div class="cell"><div class="cl">CUMUL DU MOIS</div><div class="cv">{{ fmt(d.cumulMois) }} FCFA</div></div>
            <div class="cell"><div class="cl">FAIT PAR (AGENT)</div><div class="cv">{{ d.agentNom || '—' }}</div></div>
            @if (d.motif) {
              <div class="cell motif"><div class="cl">MOTIF ({{ d.statut }})</div><div class="cv">{{ d.motif }}</div></div>
            }
          </div>

          <div class="popup-actions">
            <button class="navi btn-gris" (click)="fermerDetails()">Fermer</button>
            <button class="lift btn btn-confirm" (click)="imprimer(d)">Imprimer le bordereau (PDF)</button>
          </div>
        </div>
      </div>
    }
  </div>
  `,
  styles: [`
    .carte { background:var(--surface); border:1px solid var(--bordure); border-radius:18px; padding:22px 24px; box-shadow:0 4px 20px -12px rgba(0,0,0,.25); }
    .recherche { display:flex; gap:12px; margin-bottom:20px; }
    .recherche .fld { flex:1; }
    .recherche .fin { width:100%; }
    .btn { border:none; cursor:pointer; padding:12px 24px; border-radius:12px; font-size:13.5px; font-weight:700; color:#fff; background:linear-gradient(135deg,var(--rouge),var(--rouge-fonce)); box-shadow:0 10px 24px -12px rgba(215,25,32,.8); white-space:nowrap; }
    .err { text-align:center; color:var(--rouge); font-size:13px; font-weight:700; margin:20px 0; }
    .vide { text-align:center; color:var(--gris); font-size:13.5px; padding:30px 0; }
    .tbl { width:100%; border-collapse:collapse; font-size:13.5px; }
    .tbl th { text-align:left; font-size:11px; font-weight:700; letter-spacing:.6px; text-transform:uppercase; color:var(--gris-texte); padding:12px 18px; border-bottom:1px solid var(--bordure); white-space:nowrap; background:var(--surface-2); }
    .tbl td { padding:14px 18px; border-bottom:1px solid var(--bordure); color:var(--encre); }
    .tbl tbody tr { transition:background .12s ease; }
    .tbl tbody tr:hover { background:var(--gris-clair); }
    .tbl tbody tr:last-child td { border-bottom:none; }
    .nom { white-space:nowrap; }
    .client { display:flex; align-items:center; gap:10px; }
    .avatar { flex:none; width:32px; height:32px; border-radius:50%; background:var(--gris-clair); color:var(--texte); font-size:11px; font-weight:800; letter-spacing:.2px; display:flex; align-items:center; justify-content:center; }
    .pill { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:700; white-space:nowrap; }
    .pill::before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; flex:none; }
    .st-ok { background:var(--vert-fond); color:var(--vert); }
    .st-rej { background:var(--rouge-fond); color:var(--rouge); }
    .st-ann { background:var(--gris-clair); color:var(--gris-texte); }
    .st-attente { background:var(--orange-fond); color:var(--orange); }
    .acts { display:flex; gap:14px; white-space:nowrap; }
    .lien { font-size:11.5px; font-weight:700; cursor:pointer; border:1px solid var(--bordure); background:var(--surface); color:var(--encre); padding:6px 12px; border-radius:8px; white-space:nowrap; text-decoration:none; display:inline-block; }
    .lien:hover { border-color:var(--gris-bordure); background:var(--gris-clair); }
    .lien-danger { color:var(--rouge); border-color:rgba(215,25,32,.3); }
    .lien-danger:hover { background:var(--rouge-fond); border-color:var(--rouge); }
    .table-wrap { overflow-x:auto; }
    .actions-cell { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; min-width:290px; }
    .lien-danger { color:var(--rouge); }
    .motif-col { color:var(--rouge); font-weight:600; font-size:12px; min-width:170px; max-width:240px; line-height:1.5; }
    .no-coupe { white-space:nowrap; }
    .saisi { font-size:12px; color:var(--gris); white-space:nowrap; }
    .saisi b { display:block; color:var(--encre); font-size:12.5px; }
    .voile { position:fixed; inset:0; z-index:100; background:rgba(12,14,18,.55); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:20px; }
    .popup { background:var(--surface); border-radius:18px; width:100%; max-width:480px; padding:26px 28px; box-shadow:0 30px 70px -20px rgba(0,0,0,.5); animation:pop .18s ease-out; }
    @keyframes pop { from { transform:scale(.94); opacity:0; } to { transform:scale(1); opacity:1; } }
    .popup-details { max-width:660px; max-height:88vh; overflow-y:auto; }
    .fiche { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .cell { background:var(--surface-2); border:1px solid var(--bordure); border-radius:12px; padding:12px 14px; }
    .cl { font-size:10.5px; color:var(--gris-texte); font-weight:700; letter-spacing:.4px; }
    .cv { font-size:13.5px; font-weight:700; margin-top:3px; color:var(--encre); word-break:break-word; }
    .motif { grid-column:1 / -1; border-color:var(--rouge); background:var(--rouge-fond); }
    .popup-tete { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
    .popup-titre { font-size:18px; font-weight:800; letter-spacing:-.3px; color:var(--rouge); }
    .popup-x { border:none; background:var(--gris-clair); width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:13px; color:var(--gris); }
    .popup-x:hover { background:var(--bordure); }
    .popup-resume { background:var(--surface-2); border:1px solid var(--bordure); border-radius:12px; padding:6px 16px; margin-bottom:18px; }
    .pr-ligne { display:flex; justify-content:space-between; align-items:center; padding:9px 0; font-size:13px; }
    .pr-ligne + .pr-ligne { border-top:1px solid var(--bordure); }
    .pr-ligne span { color:var(--gris); }
    .popup-label { display:block; font-size:13px; font-weight:700; margin-bottom:7px; }
    .oblig { color:var(--rouge); font-weight:600; font-size:12px; }
    .popup-actions { display:flex; gap:12px; margin-top:20px; }
    .popup-actions .btn-confirm { flex:1; }
    .motif-zone { width:100%; resize:vertical; font-family:inherit; background:var(--surface); color:var(--texte); }
    .motif-compteur { font-size:11.5px; color:var(--rouge); font-weight:700; margin-top:6px; }
    .motif-compteur.ok { color:var(--vert); }
    .motif-actions { display:flex; gap:12px; justify-content:flex-end; margin-top:14px; }
    .btn-gris { border:1px solid var(--bordure); cursor:pointer; padding:11px 20px; border-radius:12px; font-size:13px; font-weight:700; color:var(--encre); background:var(--surface); }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  `]
})
export class ListeComponent implements OnInit {
  private readonly transferts_ = inject(TransfertService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  mode: Mode = 'historique';
  transferts: Transfert[] = [];
  recherche = '';
  cible: Transfert | null = null;
  detailsCible: Transfert | null = null;
  action: 'annulation' | 'rejet' = 'annulation';
  motif = '';
  erreurMotif = '';
  envoi = false;

  canaux: { nom: string; description: string }[] = [];
  cibleCloture: Transfert | null = null;
  referenceCloture = '';
  canalCloture = '';
  erreurCloture = '';

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as Mode) ?? 'historique';
    this.transferts_.referentiel().subscribe({ next: ref => this.canaux = ref.canaux, error: () => {} });
    this.charger();
  }

  /** Un mode = un endpoint. Ternaire imbrique remplace par une correspondance explicite. */
  private fluxDuMode() {
    switch (this.mode) {
      case 'annulation':  return this.transferts_.annulables(this.recherche);
      case 'non-cloture': return this.transferts_.nonClotures(this.recherche);
      default:            return this.transferts_.historique(this.recherche);
    }
  }

  charger(): void {
    const flux = this.fluxDuMode();

    flux.subscribe({
      next: liste => { this.transferts = liste; },
      error: () => this.toast.erreur('Erreur lors du chargement des transferts.')
    });
  }

  ouvrirCloture(t: Transfert): void {
    this.cibleCloture = t;
    this.referenceCloture = '';
    this.canalCloture = '';
    this.erreurCloture = '';
  }

  fermerCloture(): void {
    this.cibleCloture = null;
    this.referenceCloture = '';
    this.erreurCloture = '';
  }

  confirmerCloture(): void {
    if (!this.cibleCloture) return;
    if (!this.referenceCloture.trim()) {
      this.erreurCloture = 'La référence est obligatoire.';
      return;
    }
    this.envoi = true;
    this.erreurCloture = '';
    this.transferts_.cloturer(this.cibleCloture.id, this.referenceCloture.trim(), this.canalCloture)
      .subscribe({
        next: () => { this.envoi = false; this.fermerCloture(); this.charger(); },
        error: err => {
          this.envoi = false;
          this.erreurCloture = err?.error?.message ?? "Impossible de clôturer ce transfert.";
        }
      });
  }
 
  voirDetails(t: Transfert): void {
    this.detailsCible = t;
  }

  fermerDetails(): void {
    this.detailsCible = null;
  }

  ouvrirMotif(t: Transfert, action: 'annulation' | 'rejet'): void {
    this.cible = t;
    this.action = action;
    this.motif = '';
    this.erreurMotif = '';
  }
 
  fermerMotif(): void {
    this.cible = null;
    this.motif = '';
    this.erreurMotif = '';
  }
 
  confirmer(): void {
    if (!this.cible) return;
    if (this.motif.trim().length < 10) {
      this.erreurMotif = 'Le motif doit contenir au moins 10 caractères.';
      return;
    }
    this.envoi = true;
    this.erreurMotif = '';
    const flux = this.action === 'annulation'
      ? this.transferts_.annuler(this.cible.id, this.motif.trim())
      : this.transferts_.rejeter(this.cible.id, this.motif.trim());
    flux.subscribe({
      next: () => { this.envoi = false; this.fermerMotif(); this.charger(); },
      error: err => {
        this.envoi = false;
        this.erreurMotif = err?.error?.message ?? "Impossible d'effectuer cette opération.";
      }
    });
  }
 
  imprimer(t: Transfert): void {
    imprimerBordereau(t);
  }
 
  fmt(n: number): string {
    return Number(n || 0).toLocaleString('fr-FR');
  }

  initiales(nom: string): string {
    return (nom || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(mot => mot.charAt(0).toUpperCase())
      .join('');
  }

  statutClasse(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s.includes('exécut')) return 'pill st-ok';
    if (s.includes('rejet')) return 'pill st-rej';
    if (s.includes('annul')) return 'pill st-ann';
    if (s.includes('attente') || s.includes('justificatif') || s.includes('clôtur')) return 'pill st-attente';
    return 'pill st-ann';
  }
}
 
