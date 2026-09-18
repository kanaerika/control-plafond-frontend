import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { StatistiquesService } from '../../../services/statistiques.service';
import { PartenaireService } from '../../../services/partenaire.service';
import { StatistiquesResponse, Partenaire } from '../../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  private readonly service = inject(StatistiquesService);
  private readonly partenaireService = inject(PartenaireService);

  /** Pipe `date` évité : sans locale enregistrée, Angular affichait « 14 September ». */
  readonly aujourdhui = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  readonly data = signal<StatistiquesResponse | null>(null);
  readonly partenaires = signal<Partenaire[]>([]);
  readonly chargement = signal(true);
  readonly erreur = signal('');

  /**
   * Portée renvoyée par le backend, qui résout le rôle depuis le JWT. L'ancien
   * test lisait la session de l'AuthService maison, jamais remplie depuis le
   * passage à Keycloak : l'admin Afriland ne voyait jamais ses partenaires.
   */
  readonly estAdminAfriland = computed(() => this.data()?.portee === 'PLATEFORME');

  ngOnInit(): void {
    this.service.charger().subscribe({
      next: d => {
        this.data.set(d);
        this.chargement.set(false);
        if (d.portee === 'PLATEFORME') {
          this.partenaireService.getAll().subscribe({ next: liste => this.partenaires.set(liste) });
        }
      },
      error: (e: HttpErrorResponse) => {
        this.chargement.set(false);
        this.erreur.set(
          e.status === 0 ? 'Serveur injoignable.' : (e.error?.message ?? 'Impossible de charger les statistiques.')
        );
      }
    });
  }

  private kpi(libelle: string): string {
    const trouve = this.data()?.kpis.find(k => k.libelle === libelle);
    return trouve ? new Intl.NumberFormat('fr-FR').format(trouve.valeur) : '—';
  }

  readonly nombreAgents = computed(() => this.kpi('Agents'));
  readonly nombreTransferts = computed(() => this.kpi('Transferts'));
  readonly nombreBloques = computed(() => this.kpi('Bloqués'));
  readonly nombrePartenaires = computed(() => String(this.partenaires().length));
  readonly derniersPartenaires = computed(() => this.partenaires().slice(-5).reverse());

  libelleStatut(s: string): string {
    switch (s) {
      case 'EXECUTE': return 'Exécuté';
      case 'NON_CLOTURE': return 'Non clôturé';
      case 'ANNULE': return 'Annulé';
      case 'REJETE': return 'Rejeté';
      case 'EN_COURS': return 'En cours';
      case 'REFUSE_PLAFOND': return 'Refusé (plafond)';
      default: return s;
    }
  }

  classeStatut(s: string): string {
    switch (s) {
      case 'REJETE':
      case 'REFUSE_PLAFOND': return 'danger';
      case 'ANNULE':
      case 'EN_COURS':
      case 'NON_CLOTURE': return 'warning';
      default: return '';
    }
  }

  formatMontant(m: number): string {
    return new Intl.NumberFormat('fr-FR').format(m) + ' FCFA';
  }
}
