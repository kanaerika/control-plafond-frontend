import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TransfertService } from '../../services/transfert.service';
import { ClientConnu, Transfert, VerificationRequest, VerificationResponse } from '../../models/models';
import { imprimerBordereau } from '../../core/bordereau';
import { TraductionService } from '../../core/traduction/traduction.service';
import { ToastService } from '../../core/ui/toast.service';
import { ConfirmService } from '../../core/ui/confirm.service';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [FormsModule],
  template: `
  <!-- ================= ÉTAPES ================= -->
  <div class="cin etapes">
    @for (e of [1,2,3,4]; track e) {
      <div class="etape" [class.active]="etapeActuelle === e" [class.fait]="etapeActuelle > e">
        <div class="etape-rond">
          @if (etapeActuelle > e) { ✓ } @else { {{ e }} }
        </div>
        <div class="etape-libelle">{{ tr.t('verif.etape' + e) }}</div>
      </div>
      @if (e < 4) { <div class="etape-trait" [class.fait]="etapeActuelle > e"></div> }
    }
  </div>

  <!-- ================= SUCCÈS D'EXÉCUTION ================= -->
  @if (transfertExecute; as ok) {
    <div class="cin carte succes-carte">
      <div class="succes-anneau">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1f9d43" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="7.5 12.4 10.5 15.4 16.5 8.6"/></svg>
      </div>
      <div class="succes-titre">{{ tr.t('verif.succesTitre') }}</div>
      <div class="succes-sous">{{ tr.t('verif.succesSous') }}</div>

      <div class="succes-grid">
        <div class="scell"><div class="cl">{{ tr.t('verif.champNom') }}</div><div class="cv">{{ ok.nomClient }}</div></div>
        <div class="scell"><div class="cl">{{ tr.t('verif.champPays') }}</div><div class="cv">{{ ok.paysDestination }}</div></div>
        <div class="scell"><div class="cl">{{ tr.t('verif.champMontant') }}</div><div class="cv">{{ fmt(ok.montant) }} <span>FCFA</span></div></div>
        <div class="scell scell-ref">
          <div class="cl">{{ tr.t('verif.referenceVerification') }}</div>
          <div class="cv">{{ ok.referenceVerification || ok.reference }}</div>
        </div>
      </div>

      <div class="succes-actions">
        <button class="lift btn" (click)="imprimerRecu()">{{ tr.t('verif.imprimerBordereau') }}</button>
        <button class="navi btn-gris2" (click)="nouveau()">{{ tr.t('verif.nouveauTransfert') }}</button>
      </div>
    </div>
  }

  <!-- ================= FORMULAIRE ================= -->
  @if (!resultat && !recap && !transfertExecute) {
    <div class="cin carte">

      @if (formulaireRempli()) {
        <div class="entete-form">
          <button type="button" class="btn-effacer" (click)="effacerFormulaire()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
            Effacer tous les champs
          </button>
        </div>
      }

      <div class="section-titre"><span class="section-num">01</span> {{ tr.t('verif.sectionIdentite') }}</div>
      <div class="grid">
        <div class="champ champ-nom">
          <label for="champ-nom-verif">{{ tr.t('verif.labelNom') }} <span class="rouge">{{ tr.t('verif.labelNomSuffixe') }}</span></label>
          <div class="in-wrap">
            <span class="in-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></span>
            <input id="champ-nom-verif" class="in in-icone" [class.in-err]="manquants.includes('nom')" [ngModel]="form.nomClient"
                   (ngModelChange)="saisirNom($event)" autocomplete="off"
                   placeholder="{{ tr.t('verif.placeholderNom') }}" (keyup.enter)="verifier()"
                   (blur)="fermerSuggestionsBientot()">
          </div>
          <!-- Volet des clients connus -->
          @if (suggestions.length > 0) {
            <div class="volet">
              <div class="volet-titre">{{ tr.t('verif.clientConnu') }}</div>
              @for (c of suggestions; track c.numeroPiece) {
                <button type="button" class="volet-item" (mousedown)="choisirClient(c)">
                  <span class="vi-nom">{{ c.nomClient }}</span>
                  <span class="vi-infos">{{ c.dateNaissance }} · {{ c.naturePiece }} · {{ c.numeroPiece }}</span>
                </button>
              }
            </div>
          }
        </div>
        <div class="champ">
          <label for="champ-date-naissance-verif">{{ tr.t('verif.labelDateNaissance') }}</label>
          <div class="in-wrap">
            <span class="in-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg></span>
            <input id="champ-date-naissance-verif" class="in in-icone" [class.in-err]="manquants.includes('date')" [ngModel]="form.dateNaissance"
                   (ngModelChange)="formaterDate($event)" inputmode="numeric" maxlength="10"
                   placeholder="{{ tr.t('verif.placeholderDate') }}" (keyup.enter)="verifier()">
          </div>
        </div>
        <div class="champ">
          <label for="champ-nature-verif">{{ tr.t('verif.labelNature') }}</label>
          <select id="champ-nature-verif" class="in" [class.in-err]="manquants.includes('nature')" [(ngModel)]="form.naturePiece">
            <option value="">{{ tr.t('commun.selectionner') }}</option>
            @for (n of natures; track n) { <option [value]="n">{{ n }}</option> }
          </select>
        </div>
        <div class="champ">
          <label for="champ-numero-piece-verif">{{ tr.t('verif.labelNumeroPiece') }}</label>
          <div class="in-wrap">
            <span class="in-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4"/></svg></span>
            <input id="champ-numero-piece-verif" class="in in-icone" [class.in-err]="manquants.includes('piece')" [ngModel]="form.numeroPiece"
                   (ngModelChange)="saisirNumeroPiece($event)"
                   placeholder="{{ tr.t('verif.placeholderNumero') }}" (keyup.enter)="verifier()">
          </div>
          @if (cniAlerte) { <div class="alerte-champ">{{ cniAlerte }}</div> }
        </div>
      </div>

      <div class="section-titre section-titre-espace"><span class="section-num">02</span> {{ tr.t('verif.sectionDetails') }}</div>
      <div class="grid">
        <div class="champ">
          <label for="champ-montant-verif">{{ tr.t('verif.labelMontant') }}</label>
          <div class="in-wrap">
            <span class="in-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
            <input id="champ-montant-verif" class="in in-icone montant" [class.in-err]="manquants.includes('montant')" [ngModel]="montantSaisi"
                   (ngModelChange)="formaterMontant($event)" inputmode="numeric"
                   placeholder="{{ tr.t('verif.placeholderMontant') }}" (keyup.enter)="verifier()">
          </div>
          <div class="rapides">
            @for (m of montantsRapides; track m) {
              <button type="button" class="puce" (click)="formaterMontant('' + m)">{{ fmt(m) }}</button>
            }
          </div>
        </div>
        <div class="champ">
          <label for="champ-pays-verif">{{ tr.t('verif.labelPays') }}</label>
          <div class="in-wrap">
            <span class="in-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
            <input id="champ-pays-verif" class="in in-icone" [class.in-err]="manquants.includes('pays')" [(ngModel)]="form.paysDestination"
                   list="liste-pays" autocomplete="off"
                   placeholder="{{ tr.t('verif.selectionnerPays') }}" (keyup.enter)="verifier()">
            <datalist id="liste-pays">
              @for (p of pays; track p) { <option [value]="p"></option> }
            </datalist>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="navi btn-annuler-form" (click)="retour()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          {{ tr.t('commun.annuler') }}
        </button>
        <button class="lift btn" (click)="verifier()" [disabled]="chargement">
          {{ chargement ? tr.t('verif.verificationEnCours') : tr.t('verif.verifierPlafond') }}
        </button>
      </div>
    </div>
  }

  <!-- ================= RÉCAPITULATIF (confirmation) ================= -->
  @if (recap && !resultat) {
    <div class="cin carte recap-carte">
      <div class="recap-tete">
        <div class="recap-ic">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d71920" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div>
          <div class="disp recap-titre">{{ tr.t('verif.recapTitre') }}</div>
          <div class="recap-sous">{{ tr.t('verif.recapSous') }}</div>
        </div>
      </div>

      <div class="recap-grid">
        <div class="rcell"><div class="cl">{{ tr.t('verif.champNom') }}</div><div class="cv">{{ form.nomClient }}</div></div>
        <div class="rcell"><div class="cl">{{ tr.t('verif.champNaissance') }}</div><div class="cv">{{ form.dateNaissance }}</div></div>
        <div class="rcell"><div class="cl">{{ tr.t('verif.champNature') }}</div><div class="cv">{{ form.naturePiece }}</div></div>
        <div class="rcell"><div class="cl">{{ tr.t('verif.champNumero') }}</div><div class="cv">{{ form.numeroPiece }}</div></div>
        <div class="rcell montant-cell"><div class="cl">{{ tr.t('verif.champMontant') }}</div><div class="cv gros">{{ fmt(form.montant) }} <span>FCFA</span></div></div>
        <div class="rcell"><div class="cl">{{ tr.t('verif.champPays') }}</div><div class="cv">{{ form.paysDestination }}</div></div>
      </div>

      <div class="recap-actions">
        <button class="navi btn-modifier" (click)="modifier()" [disabled]="chargement">
          {{ tr.t('verif.modifier') }}
        </button>
        <button class="lift btn" (click)="valider()" [disabled]="chargement">
          {{ chargement ? tr.t('verif.verificationEnCours') : tr.t('verif.valider') }}
        </button>
      </div>
    </div>
  }

  <!-- ================= RÉSULTAT ================= -->
  @if (resultat; as r) {
    <div class="cin resultat">

      <!-- Colonne gauche : verdict -->
      <div class="carte verdict" [style.border-top]="'5px solid ' + couleur">
        <div class="motif-points motif-haut"></div>
        <div class="motif-points motif-bas"></div>
        <div class="anneau-ext" [style.background]="r.autorise ? 'rgba(215,25,32,.1)' : 'rgba(215,25,32,.08)'">
          <div class="anneau" [style.background]="couleur">
            @if (r.autorise) {
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            } @else {
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
        </div>
        <div class="disp verdict-titre" [style.color]="couleur">
          {{ r.autorise ? tr.t('verif.autorise') : tr.t('verif.refuse') }}
        </div>
        <div class="verdict-sous">{{ r.message }}</div>

        <div class="fiche">
          <div class="cell">
            <span class="cell-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <div><div class="cl">{{ tr.t('verif.client') }}</div><div class="cv">{{ form.nomClient }}</div></div>
          </div>
          <div class="cell">
            <span class="cell-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
            <div><div class="cl">{{ tr.t('verif.destination') }}</div><div class="cv">{{ form.paysDestination }}</div></div>
          </div>
          <div class="cell">
            <span class="cell-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
            <div><div class="cl">{{ tr.t('verif.naissance') }}</div><div class="cv">{{ form.dateNaissance }}</div></div>
          </div>
          <div class="cell">
            <span class="cell-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4"/></svg></span>
            <div><div class="cl">{{ tr.t('verif.numeroPiece') }}</div><div class="cv">{{ form.numeroPiece }}</div></div>
          </div>
        </div>
      </div>

      <!-- Colonne droite : jauge + exécution -->
      <div class="colonne">
        <div class="carte">
          <div class="bloc-titre"><span class="rouge">↻</span> {{ tr.t('verif.dernierTransfert') }}</div>
          <div class="dernier">
            <div class="dinfos">
              <div class="dnom">{{ r.dernierTransfert?.nomClient ?? form.nomClient }}</div>
              <div class="ddate">{{ r.dernierTransfert?.dateTransfert ?? '—' }} · {{ fmt(r.dernierTransfert?.montant ?? 0) }} FCFA</div>
              <div class="dstatut">{{ r.dernierTransfert?.statut ?? tr.t('verif.aucunTransfert') }}</div>
            </div>
            <div class="dfleche">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>
            </div>
          </div>

          <!-- Jauge sombre -->
          <div class="jauge">
            <div class="jhaut">
              <div>
                <div class="jl">{{ tr.t('verif.montantTransferable') }}</div>
                <div class="disp jv">{{ fmt(r.restant) }}<span> FCFA</span></div>
              </div>
              <div class="jplafond">
                <div class="jl2">{{ tr.t('verif.plafond') }}</div>
                <div class="disp jp">{{ fmt(r.plafond) }}</div>
              </div>
            </div>
            <div class="barre">
              <div class="hachure" [style.width.%]="r.autorise ? r.pourcentageApres : r.pourcentageUtilise"></div>
              <div class="pleine" [style.width.%]="r.pourcentageUtilise" [style.background]="couleur"></div>
            </div>
            <div class="jbas">
              <div class="legende">
                <span class="carre" [style.background]="couleur"></span>
                {{ tr.t('verif.dejaUtilise') }} {{ fmt(r.cumul) }}
              </div>
              <span class="pct" [style.color]="couleur">{{ tr.t('verif.pctPlafond', { pct: r.pourcentageUtilise }) }}</span>
            </div>
          </div>
        </div>

        <!-- Exécution (si autorisé) -->
        @if (r.autorise) {
          <div class="carte">
            <div class="consigne">
              {{ tr.t('verif.consigne') }}
            </div>
            <div class="in-wrap">
              <span class="in-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>
              <label for="champ-reference-execution" class="sr-only">{{ tr.t('verif.placeholderRef') }}</label>
              <input id="champ-reference-execution" class="in in-icone ref" [(ngModel)]="reference" placeholder="{{ tr.t('verif.placeholderRef') }}">
            </div>
            <div class="exec-actions">
              <button class="lift btn" (click)="executer()" [disabled]="chargement">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                {{ chargement ? tr.t('verif.envoiEnCours') : tr.t('verif.soumettre') }}
              </button>
              <button class="navi btn-annuler" (click)="annulerTransfertEnCours()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                {{ tr.t('commun.annuler') }}
              </button>
            </div>
          </div>
        } @else {
          <button class="lift btn-retour" (click)="retour()">{{ tr.t('verif.retourVerification') }}</button>
        }
      </div>
    </div>
  }

  <!-- ================= POPUP : justification en cas d'abandon ================= -->
  @if (annulationOuverte) {
    <div class="voile" (click)="fermerAnnulation()">
      <div class="popup" (click)="$event.stopPropagation()">
        <div class="popup-tete">
          <div class="popup-titre">{{ tr.t('verif.motifAbandonTitre') }}</div>
          <button class="popup-x" (click)="fermerAnnulation()">✕</button>
        </div>
        <label class="popup-label" for="motif-abandon">{{ tr.t('verif.motifAbandonLabel') }}</label>
        <textarea id="motif-abandon" class="in motif-zone" [(ngModel)]="motifAnnulation" rows="3"
                  placeholder="{{ tr.t('verif.motifAbandonPlaceholder') }}"></textarea>
        <div class="motif-compteur" [class.ok]="motifAnnulation.trim().length >= 10">
          {{ motifAnnulation.trim().length >= 10 ? tr.t('verif.motifValide') : tr.t('verif.motifCompteur', { n: motifAnnulation.trim().length }) }}
        </div>
        <div class="popup-actions">
          <button class="navi btn-gris" (click)="fermerAnnulation()">{{ tr.t('commun.retour') }}</button>
          <button class="lift btn btn-confirm" [disabled]="motifAnnulation.trim().length < 10 || chargement"
                  (click)="confirmerAnnulation()">
            {{ chargement ? tr.t('verif.envoiEnCours') : tr.t('verif.motifAbandonConfirmer') }}
          </button>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .carte { background:var(--surface); border:1px solid var(--bordure); border-radius:18px; padding:26px 28px; box-shadow:0 4px 20px -12px rgba(0,0,0,.25); }

    /* Étapes */
    .etapes { display:flex; align-items:center; padding:18px 28px; margin-bottom:20px; }
    .etape { display:flex; align-items:center; gap:10px; flex:none; }
    .etape-rond { width:30px; height:30px; border-radius:50%; background:var(--gris-clair); color:var(--gris-texte); font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; border:2px solid var(--bordure); transition:background .2s, border-color .2s, color .2s; }
    .etape-libelle { font-size:12.5px; font-weight:700; color:var(--gris-texte); white-space:nowrap; transition:color .2s; }
    .etape.active .etape-rond { background:linear-gradient(135deg,var(--rouge),var(--rouge-fonce)); color:#fff; border-color:transparent; box-shadow:0 6px 14px -6px rgba(215,25,32,.6); }
    .etape.active .etape-libelle { color:var(--encre); }
    .etape.fait .etape-rond { background:var(--vert); color:#fff; border-color:transparent; }
    .etape.fait .etape-libelle { color:var(--vert); }
    .etape-trait { flex:1; height:2px; background:var(--bordure); margin:0 10px; min-width:20px; transition:background .2s; }
    .etape-trait.fait { background:var(--vert); }
    @media (max-width:640px) {
      .etape-libelle { display:none; }
      .etapes { padding:16px 18px; }
    }
    .section-titre { display:flex; align-items:center; gap:10px; margin:0 0 18px; font-size:12px; font-weight:800; letter-spacing:.05em; color:var(--encre); }
    .section-titre::before { content:''; width:3px; height:16px; border-radius:2px; background:var(--rouge); }
    .section-titre-espace { margin-top:30px; }
    .section-num { color:var(--rouge); }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:18px 24px; }
    .champ { display:flex; flex-direction:column; gap:7px; }
    .in-wrap { position:relative; }
    .in-ic { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--texte-faible); display:flex; pointer-events:none; }
    .in-icone { padding-left:38px; }
    .in-err { border-color:var(--rouge) !important; background:var(--rouge-fond); }
    .alerte-champ { margin-top:7px; font-size:12px; font-weight:700; color:var(--rouge); line-height:1.4; }
    .montant { font-weight:700; letter-spacing:.5px; }
    .rapides { display:flex; gap:8px; flex-wrap:wrap; margin-top:2px; }
    .puce { border:1px solid var(--bordure); background:var(--surface-2); color:var(--texte); font-size:11.5px; font-weight:700; padding:5px 11px; border-radius:20px; cursor:pointer; }
    .puce:hover { border-color:var(--rouge); color:var(--rouge); }

    /* Volet d'auto-complétion clients connus */
    .champ-nom { position:relative; }
    .volet { position:absolute; top:100%; left:0; right:0; z-index:30; margin-top:6px; background:var(--surface); border:1px solid var(--bordure); border-radius:13px; box-shadow:0 18px 40px -14px rgba(0,0,0,.35); overflow:hidden; }
    .volet-titre { font-size:11px; font-weight:700; color:var(--gris); padding:10px 14px 7px; text-transform:uppercase; letter-spacing:.4px; }
    .volet-item { display:flex; flex-direction:column; gap:2px; width:100%; text-align:left; background:none; border:none; border-top:1px solid var(--bordure); padding:10px 14px; cursor:pointer; }
    .volet-item:hover { background:var(--rouge-fond); }
    .vi-nom { font-size:14px; font-weight:700; color:var(--encre); }
    .vi-infos { font-size:12px; color:var(--gris); }

    /* Récapitulatif */
    .recap-carte { max-width:640px; margin:0 auto; }
    .recap-tete { display:flex; align-items:flex-start; gap:14px; margin-bottom:22px; }
    .recap-ic { width:52px; height:52px; flex:none; border-radius:14px; background:var(--rouge-fond); display:flex; align-items:center; justify-content:center; }
    .recap-titre { font-size:20px; font-weight:700; letter-spacing:-.3px; }
    .recap-sous { font-size:13px; color:var(--gris); margin-top:4px; line-height:1.5; }
    .recap-grid { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
    .rcell { background:var(--surface-2); border:1px solid var(--bordure); border-radius:12px; padding:12px 14px; }
    .rcell .cv { word-break:break-word; }
    .montant-cell { background:#111318; border-color:#111318; }
    .montant-cell .cl { color:rgba(255,255,255,.5); }
    .montant-cell .gros { color:#fff; font-size:19px; }
    .montant-cell .gros span { font-size:12px; color:rgba(255,255,255,.55); }
    .recap-actions { display:flex; gap:12px; margin-top:24px; }
    .recap-actions .btn { flex:1; padding:14px; }
    .succes-carte { max-width:520px; margin:0 auto; text-align:center; border-top:4px solid #1f9d43; }
    .succes-anneau { width:76px; height:76px; margin:0 auto 18px; border-radius:50%; background:var(--vert-fond); display:flex; align-items:center; justify-content:center; }
    .succes-titre { font-size:20px; font-weight:800; letter-spacing:-.3px; }
    .succes-sous { font-size:13.5px; color:var(--gris); margin-top:8px; line-height:1.6; }
    .succes-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:26px; text-align:left; }
    .scell { background:var(--surface-2); border:1px solid var(--bordure); border-radius:12px; padding:12px 14px; }
    .scell .cv { word-break:break-word; }
    .scell .cv span { font-size:11.5px; color:var(--gris); font-weight:600; }
    .scell-ref { grid-column:1 / -1; background:#111318; border-color:#111318; }
    .scell-ref .cl { color:rgba(255,255,255,.5); }
    .scell-ref .cv { color:#fff; font-size:18px; font-weight:800; letter-spacing:1px; font-family:'SFMono-Regular',Consolas,monospace; }
    .succes-actions { display:flex; flex-direction:column; gap:10px; margin-top:24px; }
    .succes-actions .btn { padding:14px; }
    .btn-gris2 { border:1px solid var(--bordure); cursor:pointer; padding:13px; border-radius:12px; font-size:13.5px; font-weight:700; color:var(--encre); background:var(--surface); }
    .btn-modifier { flex:none; border:1px solid var(--bordure); cursor:pointer; padding:14px 22px; border-radius:13px; font-size:14px; font-weight:700; color:var(--texte); background:var(--surface); }
    .btn-modifier:hover { border-color:var(--gris-bordure); }
    label { font-size:12.5px; font-weight:700; color:var(--texte); }
    .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    .rouge { color:var(--rouge); }
    .entete-form { display:flex; justify-content:flex-end; margin-bottom:14px; }
    .btn-effacer { display:flex; align-items:center; gap:7px; padding:8px 14px; border:1.5px solid rgba(215,25,32,.3); border-radius:10px; background:var(--rouge-fond); color:var(--rouge); font-size:12px; font-weight:700; cursor:pointer; }
    .btn-effacer:hover { background:rgba(215,25,32,.18); border-color:var(--rouge); }
    .actions { display:flex; justify-content:flex-end; gap:12px; margin-top:22px; }
    .btn-annuler-form { display:flex; align-items:center; gap:8px; border:1px solid var(--bordure); background:var(--surface); color:var(--encre); cursor:pointer; padding:14px 22px; border-radius:13px; font-size:13.5px; font-weight:700; }
    .btn-annuler-form:hover { border-color:var(--gris-bordure); background:var(--gris-clair); }
    .btn { border:none; cursor:pointer; padding:14px 38px; border-radius:13px; font-size:14.5px; font-weight:700; color:#fff; background:linear-gradient(135deg,var(--rouge),var(--rouge-fonce)); box-shadow:0 14px 30px -12px rgba(215,25,32,.8); }
    .btn:disabled { opacity:.7; cursor:default; }

    /* Résultat */
    .resultat { display:grid; grid-template-columns:1.05fr .95fr; gap:20px; align-items:start; }
    .verdict { position:relative; text-align:center; overflow:hidden; padding-bottom:34px; }
    .motif-points { position:absolute; width:110px; height:110px; pointer-events:none; background-image:radial-gradient(rgba(215,25,32,.15) 1.6px, transparent 1.6px); background-size:12px 12px; }
    .motif-haut { top:-10px; right:-10px; }
    .motif-bas { bottom:-10px; left:-10px; }
    .anneau-ext { position:relative; z-index:1; width:96px; height:96px; margin:0 auto; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .anneau { width:66px; height:66px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 22px -10px rgba(0,0,0,.4); }
    .verdict-titre { position:relative; z-index:1; margin-top:16px; font-size:19px; font-weight:700; }
    .verdict-sous { position:relative; z-index:1; margin-top:6px; font-size:13.5px; color:var(--gris); line-height:1.5; }
    .fiche { position:relative; z-index:1; display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:22px; text-align:left; }
    .cell { display:flex; align-items:flex-start; gap:10px; background:var(--surface-2); border:1px solid var(--bordure); border-radius:12px; padding:11px 13px; }
    .cell-ic { flex:none; width:28px; height:28px; border-radius:50%; background:var(--rouge-fond); color:var(--rouge); display:flex; align-items:center; justify-content:center; }
    .cl { font-size:10.5px; color:var(--gris-texte); font-weight:700; letter-spacing:.4px; }
    .cv { font-size:13px; font-weight:700; margin-top:2px; color:var(--encre); }
    .colonne { display:flex; flex-direction:column; gap:16px; }
    .colonne .carte { padding:20px; }
    .bloc-titre { display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:700; color:var(--texte); margin-bottom:13px; }
    .bloc-titre .rouge { font-size:15px; }
    .dernier { display:flex; align-items:center; justify-content:space-between; background:var(--surface-2); border:1px solid var(--bordure); border-radius:13px; padding:13px 15px; }
    .dnom { font-weight:700; font-size:14px; color:var(--encre); }
    .ddate { font-size:12px; color:var(--gris); }
    .dstatut { font-size:11.5px; color:var(--rouge); font-weight:700; margin-top:1px; }
    .dfleche { width:38px; height:38px; border-radius:10px; background:#111318; display:flex; align-items:center; justify-content:center; }
    .jauge { margin-top:16px; padding:18px; border-radius:15px; background:#111318; }
    .jhaut { display:flex; align-items:flex-start; justify-content:space-between; }
    .jl { font-size:11px; font-weight:700; letter-spacing:.6px; color:rgba(255,255,255,.5); }
    .jv { font-size:34px; font-weight:700; color:#fff; line-height:1.1; margin-top:6px; }
    .jv span { font-size:14px; font-weight:600; color:rgba(255,255,255,.5); }
    .jplafond { text-align:right; flex:none; }
    .jl2 { font-size:11px; font-weight:700; color:rgba(255,255,255,.4); }
    .jp { font-size:15px; font-weight:700; color:rgba(255,255,255,.75); margin-top:3px; }
    .barre { margin-top:16px; height:10px; border-radius:6px; background:rgba(255,255,255,.1); position:relative; overflow:hidden; }
    .hachure { position:absolute; left:0; top:0; bottom:0; background:repeating-linear-gradient(45deg,rgba(255,255,255,.14),rgba(255,255,255,.14) 5px,transparent 5px,transparent 10px); }
    .pleine { position:absolute; left:0; top:0; bottom:0; border-radius:6px; }
    .jbas { display:flex; align-items:center; justify-content:space-between; margin-top:11px; }
    .legende { display:flex; align-items:center; gap:7px; font-size:11.5px; color:rgba(255,255,255,.6); font-weight:600; }
    .carre { width:9px; height:9px; border-radius:3px; display:inline-block; }
    .pct { font-size:11.5px; font-weight:700; }
    .consigne { font-size:12.5px; font-weight:600; color:var(--texte); line-height:1.5; margin-bottom:12px; }
    .ref { letter-spacing:1px; font-weight:600; border-color:var(--rouge) !important; }
    .exec-actions { display:flex; gap:12px; margin-top:15px; }
    .exec-actions .btn { flex:1; padding:13px; display:flex; align-items:center; justify-content:center; gap:8px; }
    .btn-annuler { flex:none; display:flex; align-items:center; gap:8px; border:1px solid var(--bordure); cursor:pointer; padding:13px 20px; border-radius:12px; font-size:14px; font-weight:600; color:var(--texte); background:var(--surface); }
    .btn-retour { border:1px solid var(--bordure); cursor:pointer; padding:14px; border-radius:13px; font-size:14px; font-weight:700; color:var(--encre); background:var(--surface); }

    /* Popup de justification d'abandon */
    .voile { position:fixed; inset:0; z-index:100; background:rgba(12,14,18,.55); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:20px; }
    .popup { background:var(--surface); border-radius:18px; width:100%; max-width:460px; padding:26px 28px; box-shadow:0 30px 70px -20px rgba(0,0,0,.5); animation:pop .18s ease-out; }
    @keyframes pop { from { transform:scale(.94); opacity:0; } to { transform:scale(1); opacity:1; } }
    .popup-tete { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
    .popup-titre { font-size:18px; font-weight:800; letter-spacing:-.3px; color:var(--rouge); }
    .popup-x { border:none; background:var(--gris-clair); width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:13px; color:var(--gris); }
    .popup-x:hover { background:var(--bordure); }
    .popup-label { display:block; font-size:13px; font-weight:700; margin-bottom:7px; }
    .motif-zone { width:100%; resize:vertical; font-family:inherit; background:var(--surface); color:var(--texte); }
    .motif-compteur { font-size:11.5px; color:var(--rouge); font-weight:700; margin-top:6px; }
    .motif-compteur.ok { color:var(--vert); }
    .popup-actions { display:flex; gap:12px; margin-top:20px; }
    .popup-actions .btn-confirm { flex:1; }
    .btn-gris { border:1px solid var(--bordure); cursor:pointer; padding:11px 20px; border-radius:12px; font-size:13px; font-weight:700; color:var(--encre); background:var(--surface); }
  `]
})
export class VerificationComponent implements OnInit {
  private readonly transferts = inject(TransfertService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly tr = inject(TraductionService);

  natures: string[] = [];
  pays: string[] = [];

  form: VerificationRequest = this.vide();
  montantSaisi = '';
  montantsRapides = [50_000, 100_000, 250_000, 500_000, 1_000_000];
  recap = false;
  manquants: string[] = [];
  suggestions: ClientConnu[] = [];
  private timerSuggestions: ReturnType<typeof setTimeout> | undefined;
  cniAlerte = '';
  private timerCni: ReturnType<typeof setTimeout> | undefined;
  resultat: VerificationResponse | null = null;
  reference = '';
  transfertExecute: Transfert | null = null;
  chargement = false;

  annulationOuverte = false;
  motifAnnulation = '';
  private resoudreQuitter: ((valeur: boolean) => void) | null = null;

  ngOnInit(): void {
    this.transferts.referentiel().subscribe({
      next: ref => { this.natures = ref.naturesPiece; this.pays = ref.pays; },
      error: () => {
        this.natures = ["Carte Nationale d'Identité", 'Récépissé CNI', 'Passeport', 'Carte de séjour', 'Permis de conduire'];
        this.pays = ['France', 'Belgique', 'Canada', 'États-Unis', 'Samoa américaines', 'Chine', 'Sénégal', 'Nigéria'];
      }
    });
  }

  get couleur(): string {
    return this.resultat?.autorise ? '#1f9d43' : '#d71920';
  }

  /** Étape courante du parcours (1 = informations … 4 = reçu), affichée dans le bandeau d'étapes. */
  get etapeActuelle(): number {
    if (this.transfertExecute) return 4;
    if (this.resultat) return 3;
    if (this.recap) return 2;
    return 1;
  }

  fmt(n: number): string {
    return Number(n || 0).toLocaleString('fr-FR');
  }

  /** Saisie du nom : MAJUSCULES automatiques + recherche des clients connus. */
  saisirNom(valeur: string): void {
    // MAJUSCULES + un seul espace entre les noms
    this.form.nomClient = (valeur || '').toUpperCase().replace(/\s{2,}/g, ' ');
    clearTimeout(this.timerSuggestions);
    if (this.form.nomClient.trim().length < 2) {
      this.suggestions = [];
      return;
    }
    // Petite pause (250 ms) pour ne pas interroger le serveur à chaque lettre
    this.timerSuggestions = setTimeout(() => {
      this.transferts.clientsConnus(this.form.nomClient.trim()).subscribe({
        next: cs => this.suggestions = cs,
        error: () => this.suggestions = []
      });
    }, 250);
    this.verifierPlafondCni();
  }

  /** L'agent clique sur un client connu : tout se remplit automatiquement. */
  choisirClient(c: ClientConnu): void {
    this.form.nomClient = c.nomClient.toUpperCase();
    this.form.dateNaissance = c.dateNaissance;
    this.form.naturePiece = c.naturePiece;
    this.form.numeroPiece = c.numeroPiece;
    this.suggestions = [];
    this.verifierPlafondCni();
  }

  /** Saisie du n° de pièce : relance le contrôle live du plafond dès que les 3 champs sont là. */
  saisirNumeroPiece(valeur: string): void {
    this.form.numeroPiece = valeur;
    this.manquants = this.manquants.filter(m => m !== 'piece');
    this.cniAlerte = '';
    this.verifierPlafondCni();
  }

  /**
   * Contrôle en lecture seule : si ce client (nom + n° de pièce + date de naissance) a déjà
   * atteint son plafond mensuel, bloque la saisie avec un message sous le champ CNI.
   */
  private verifierPlafondCni(): void {
    clearTimeout(this.timerCni);
    this.cniAlerte = '';
    const f = this.form;
    if (!f.nomClient.trim() || !f.numeroPiece.trim() || f.dateNaissance.replace(/\D/g, '').length < 8) {
      return;
    }
    this.timerCni = setTimeout(() => {
      this.transferts.plafondClient(f.nomClient.trim(), f.numeroPiece.trim(), f.dateNaissance).subscribe({
        next: res => {
          if (res.depasse) {
            this.cniAlerte = this.tr.t('verif.erreurPlafondAtteint', { cumul: this.fmt(res.cumul), plafond: this.fmt(res.plafond) });
            if (!this.manquants.includes('piece')) this.manquants.push('piece');
          }
        },
        error: () => {}
      });
    }, 300);
  }

  fermerSuggestionsBientot(): void {
    // Laisse le temps au clic sur une suggestion de s'exécuter avant de fermer
    setTimeout(() => this.suggestions = [], 200);
  }

  /** Vérifie la cohérence du n° de pièce selon sa nature. */
  private validerPiece(nature: string, numero: string): string {
    if (!/^[A-Za-z0-9]+$/.test(numero)) {
      return this.tr.t('verif.erreurPieceFormat');
    }
    if (nature === "Carte Nationale d'Identité") {
      const nouvelleCarte = /^[A-Za-z]{2}\d{8}$/.test(numero);
      const ancienneCarte = /^\d{18}$/.test(numero);
      if (!nouvelleCarte && !ancienneCarte) {
        return this.tr.t('verif.erreurCniFormat');
      }
      return '';
    }
    const min = nature === 'Passeport' ? 7 : 6;
    if (numero.length < min) {
      return this.tr.t('verif.erreurPieceCourt', { nature, min });
    }
    return '';
  }

  /** Formate le montant pendant la frappe : 250000 → "250 000" */
  formaterMontant(valeur: string): void {
    const chiffres = (valeur || '').replace(/\D/g, '').slice(0, 12);
    this.montantSaisi = chiffres ? Number(chiffres).toLocaleString('fr-FR') : '';
  }

  /** Insère les tirets automatiquement : 01011990 → "01-01-1990" */
  formaterDate(valeur: string): void {
    const c = (valeur || '').replace(/\D/g, '').slice(0, 8);
    let out = c;
    if (c.length > 4) out = `${c.slice(0, 2)}-${c.slice(2, 4)}-${c.slice(4)}`;
    else if (c.length > 2) out = `${c.slice(0, 2)}-${c.slice(2)}`;
    this.form.dateNaissance = out;
    this.verifierPlafondCni();
  }

  verifier(): void {
    if (this.cniAlerte) {
      this.toast.erreur(this.cniAlerte);
      return;
    }
    this.form.montant = Number.parseInt(this.montantSaisi.replace(/\D/g, ''), 10) || 0;
    const f = this.form;

    // Validation précise : chaque champ manquant est nommé et encadré en rouge
    this.manquants = [];
    const libelles: string[] = [];
    if (!f.nomClient.trim())     { this.manquants.push('nom');     libelles.push(this.tr.t('verif.libelleNom')); }
    if (f.dateNaissance.replace(/\D/g, '').length < 8)
                                 { this.manquants.push('date');    libelles.push(this.tr.t('verif.libelleDate')); }
    if (!f.naturePiece)          { this.manquants.push('nature');  libelles.push(this.tr.t('verif.libelleNature')); }
    if (!f.numeroPiece.trim())   { this.manquants.push('piece');   libelles.push(this.tr.t('verif.libellePiece')); }
    else {
      const erreurPiece = this.validerPiece(f.naturePiece, f.numeroPiece.trim());
      if (erreurPiece) {
        this.manquants.push('piece');
        this.toast.erreur(erreurPiece);
        return;
      }
    }
    if (!f.montant)              { this.manquants.push('montant'); libelles.push(this.tr.t('verif.libelleMontant')); }
    if (!f.paysDestination)      { this.manquants.push('pays');    libelles.push(this.tr.t('verif.libellePays')); }

    if (libelles.length > 0) {
      this.toast.erreur(this.tr.t('verif.erreurRenseigner', { champs: libelles.join(', ') }));
      return;
    }
    this.recap = true; // → page de confirmation "Le formulaire est-il bien rempli ?"
  }

  /** L'agent confirme le récapitulatif → appel du backend. */
  valider(): void {
    this.chargement = true;
    this.transferts.verifier(this.form).subscribe({
      next: res => { this.resultat = res; this.recap = false; this.chargement = false; },
      error: (err) => {
        this.chargement = false;
        if (err.status === 0) {
          this.toast.erreur(this.tr.t('verif.erreurServeur'));
        } else if (err.status === 401 || err.status === 403) {
          this.toast.erreur(this.tr.t('verif.erreurSession'));
        } else {
          this.toast.erreur(err?.error?.message ?? this.tr.t('verif.erreurVerification', { code: err.status }));
        }
      }
    });
  }

  /** Retour au formulaire en conservant les valeurs saisies. */
  modifier(): void {
    this.recap = false;
  }

  executer(): void {
    if (!this.reference.trim()) {
      this.toast.erreur(this.tr.t('verif.erreurReference'));
      return;
    }
    this.chargement = true;
   this.transferts.executer({
  reference: this.reference,
  nomClient: this.form.nomClient,
  dateNaissance: this.form.dateNaissance,
  naturePiece: this.form.naturePiece,
  numeroPiece: this.form.numeroPiece,
  montant: this.form.montant,
  paysDestination: this.form.paysDestination,
  canal: localStorage.getItem('canal') ?? '',
  transfertId: this.resultat?.transfertId ?? null
}).subscribe({
  next: t => {
    this.transfertExecute = t;
    this.chargement = false;
    this.resultat = null;
    this.reference = '';
  },
  error: err => {
    this.toast.erreur(err?.error?.message ?? this.tr.t('verif.erreurExecution'));
    this.chargement = false;
  }
});
  }

  imprimerRecu(): void {
    if (this.transfertExecute) imprimerBordereau(this.transfertExecute);
  }

  nouveau(): void {
    this.transfertExecute = null;
    this.retour();
  }

  retour(): void {
    this.resultat = null;
    this.recap = false;
    this.reference = '';
    this.form = this.vide();
    this.montantSaisi = '';
    this.manquants = [];
    this.cniAlerte = '';
  }

  /**
   * Appelé par le garde de navigation (canDeactivate). Un pop-up prévient l'agent
   * dès qu'un transfert est commencé mais pas terminé :
   *  - vérification autorisée, pas encore exécutée → transfert réservé côté serveur :
   *    confirmation + justification d'abandon obligatoire (rejette la réservation) ;
   *  - récapitulatif en cours (formulaire rempli, non vérifié) → simple confirmation,
   *    les saisies non enregistrées seront perdues.
   */
  async peutQuitter(): Promise<boolean> {
    // Transfert terminé (reçu affiché) : rien à retenir.
    if (this.transfertExecute) return true;

    // Vérification autorisée mais non exécutée : transfert réservé côté serveur.
    if (this.resultat?.autorise) {
      const continuer = await this.confirm.demander({
        titre: this.tr.t('verif.quitterTitre'),
        message: this.tr.t('verif.quitterMessage'),
        texteConfirmer: this.tr.t('verif.quitterContinuer'),
        texteAnnuler: this.tr.t('commun.annuler')
      });
      if (continuer) return false; // reste sur la page, transfert toujours en cours
      return this.demanderMotifAnnulation();
    }

    // Récapitulatif en cours : opération commencée, non enregistrée.
    if (this.recap) {
      return this.confirm.demander({
        titre: this.tr.t('verif.quitterTitre'),
        message: this.tr.t('verif.quitterBrouillonMessage'),
        texteConfirmer: this.tr.t('verif.quitterQuandMeme'),
        texteAnnuler: this.tr.t('commun.annuler')
      });
    }

    return true;
  }

  /** Bouton « Annuler » à côté de « Soumettre » : mêmes règles, sans navigation. */
  annulerTransfertEnCours(): void {
    this.demanderMotifAnnulation().then(confirme => { if (confirme) this.retour(); });
  }

  private demanderMotifAnnulation(): Promise<boolean> {
    this.annulationOuverte = true;
    this.motifAnnulation = '';
    return new Promise<boolean>(resoudre => { this.resoudreQuitter = resoudre; });
  }

  fermerAnnulation(): void {
    this.annulationOuverte = false;
    this.motifAnnulation = '';
    this.resoudreQuitter?.(false);
    this.resoudreQuitter = null;
  }

  confirmerAnnulation(): void {
    if (this.motifAnnulation.trim().length < 10) return;
    const id = this.resultat?.transfertId;
    if (!id) {
      this.annulationOuverte = false;
      this.resoudreQuitter?.(true);
      this.resoudreQuitter = null;
      return;
    }
    this.chargement = true;
    this.transferts.rejeter(id, this.motifAnnulation.trim()).subscribe({
      next: () => {
        this.chargement = false;
        this.annulationOuverte = false;
        this.resoudreQuitter?.(true);
        this.resoudreQuitter = null;
      },
      error: err => {
        this.chargement = false;
        this.toast.erreur(err?.error?.message ?? "Impossible d'annuler ce transfert.");
      }
    });
  }

  /** Un champ au moins a été saisi : affiche la barre « Effacer tous les champs ». */
  formulaireRempli(): boolean {
    const f = this.form;
    return !!(f.nomClient.trim() || f.dateNaissance || f.naturePiece || f.numeroPiece.trim()
      || this.montantSaisi || f.paysDestination);
  }

  effacerFormulaire(): void {
    this.form = this.vide();
    this.montantSaisi = '';
    this.manquants = [];
    this.suggestions = [];
    this.cniAlerte = '';
  }

  private vide(): VerificationRequest {
    return { nomClient: '', dateNaissance: '', naturePiece: '', numeroPiece: '', montant: 0, paysDestination: '' };
  }
}
