import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { KeycloakService } from 'keycloak-angular';
import { AgentService, AgentRequest } from '../../../services/agent.service';
import { ToastService } from '../../../core/ui/toast.service';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { Agent } from '../../../models/models';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css']
})
export class AgentsComponent implements OnInit {

  private readonly service = inject(AgentService);
  private readonly keycloak = inject(KeycloakService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);

  readonly agents = signal<Agent[]>([]);
  readonly chargement = signal(false);
  readonly recherche = signal('');
  readonly statutFiltre = signal<string | null>(null);

  readonly afficherModal = signal(false);
  readonly edition = signal(false);
  readonly enregistrementEnCours = signal(false);
  readonly erreur = signal('');

  private idEdition: number | null = null;

  agent: AgentRequest = this.agentVide();

  /** Rôle lu depuis le realm Keycloak (et non plus l'ancien AuthService JWT maison). */
  readonly estAdmin = signal(
    this.keycloak.getUserRoles().map(r => r.toLowerCase())
      .some(r => r === 'admin' || r === 'realm-admin')
  );
  readonly listeFiltree = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    const statut = this.statutFiltre();
    let liste = this.agents();
    if (statut) liste = liste.filter(a => this.classeStatut(a) === statut);
    if (!q) return liste;
    return liste.filter(a =>
      a.nomComplet.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.agence?.toLowerCase().includes(q) ?? false)
    );
  });

  ngOnInit(): void {
    if (!this.estAdmin()) {
      this.erreur.set('Cette page est réservée aux administrateurs de partenaire.');
      return;
    }
    this.statutFiltre.set(this.route.snapshot.queryParamMap.get('statut'));
    this.charger();
  }

  effacerFiltreStatut(): void {
    this.statutFiltre.set(null);
  }

  charger(): void {
    this.chargement.set(true);
    this.service.getAll().subscribe({
      next: data => {
        this.agents.set(data);
        this.chargement.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.chargement.set(false);
        this.toast.erreur(this.msg(err, 'Impossible de charger les agents.'));
      }
    });
  }

  // ---- Modal création / édition ----

  ouvrirCreation(): void {
    this.edition.set(false);
    this.idEdition = null;
    this.agent = this.agentVide();
    this.erreur.set('');
    this.afficherModal.set(true);
  }

  ouvrirEdition(a: Agent): void {
    this.edition.set(true);
    this.idEdition = a.id!;
    this.agent = {
      nomComplet: a.nomComplet,
      email: a.email,
      agence: a.agence ?? '',
      codeAgent: a.codeAgent ?? ''
    };
    this.erreur.set('');
    this.afficherModal.set(true);
  }

  fermerModal(): void {
    this.afficherModal.set(false);
    this.erreur.set('');
  }

  enregistrer(): void {
    if (this.enregistrementEnCours()) return;

    if (!this.agent.nomComplet.trim() || !this.agent.email.trim()) {
      this.erreur.set('Le nom complet et l\'email sont obligatoires.');
      return;
    }

    this.enregistrementEnCours.set(true);
    this.erreur.set('');

    const requete = this.edition()
      ? this.service.update(this.idEdition!, this.agent)
      : this.service.create(this.agent);

    requete.subscribe({
      next: () => {
        this.enregistrementEnCours.set(false);
        this.toast.succes(
          this.edition()
            ? 'Agent modifié avec succès.'
            : 'Agent créé. Une invitation lui a été envoyée par email.'
        );
        this.fermerModal();
        this.charger();
      },
      error: (err: HttpErrorResponse) => {
        this.enregistrementEnCours.set(false);
        this.erreur.set(this.msg(err, 'Enregistrement impossible.'));
      }
    });
  }

  // ---- Actions sur un agent ----

  async basculerActif(a: Agent): Promise<void> {
    const action = a.actif ? 'désactiver' : 'réactiver';
    const ok = await this.confirm.demander({
      titre: `${a.actif ? 'Désactiver' : 'Réactiver'} l'agent`,
      message: `Voulez-vous vraiment ${action} « ${a.nomComplet} » ?`,
      texteConfirmer: a.actif ? 'Désactiver' : 'Réactiver',
      danger: a.actif
    });
    if (!ok) return;

    this.service.basculerActif(a.id!).subscribe({
      next: () => {
        this.toast.succes(`Agent ${a.actif ? 'désactivé' : 'réactivé'} avec succès.`);
        this.charger();
      },
      error: (err: HttpErrorResponse) => this.toast.erreur(this.msg(err, 'Action impossible.'))
    });
  }

  async renvoyerInvitation(a: Agent): Promise<void> {
    const ok = await this.confirm.demander({
      titre: 'Renvoyer l\'invitation',
      message: `Un nouveau mot de passe temporaire et un nouveau lien seront envoyés à ${a.email}. L'ancien deviendra invalide. Continuer ?`,
      texteConfirmer: 'Renvoyer'
    });
    if (!ok) return;

    this.service.renvoyerInvitation(a.id!).subscribe({
      next: r => this.toast.succes(r.message ?? 'Invitation renvoyée.'),
      error: (err: HttpErrorResponse) => this.toast.erreur(this.msg(err, 'Envoi impossible.'))
    });
  }

  async reinitialiser(a: Agent): Promise<void> {
    const ok = await this.confirm.demander({
      titre: 'Réinitialiser le compte',
      message: `De nouveaux identifiants seront envoyés à ${a.email}. L'agent devra redéfinir son mot de passe. Continuer ?`,
      texteConfirmer: 'Réinitialiser',
      danger: true
    });
    if (!ok) return;

    this.service.reinitialiser(a.id!).subscribe({
      next: r => this.toast.succes(r.message ?? 'Nouveaux identifiants envoyés.'),
      error: (err: HttpErrorResponse) => this.toast.erreur(this.msg(err, 'Réinitialisation impossible.'))
    });
  }

  // ---- Utilitaires ----

  private agentVide(): AgentRequest {
    return { nomComplet: '', email: '', agence: '', codeAgent: '' };
  }

  private msg(err: HttpErrorResponse, defaut: string): string {
    if (err.status === 0) return 'Serveur injoignable. Vérifiez votre connexion.';
    // `detail` : réponses ProblemDetail (RFC 7807) du backend ; `message` :
    // réponses d'erreur Spring Boot par défaut.
    return err.error?.detail ?? err.error?.message ?? err.error?.error ?? defaut;
  }

  classeStatut(a: Agent): string {
    if (a.statut === 'Invitation en attente') return 'attente';
    if (a.statut === 'Mot de passe temporaire') return 'temporaire';
    return a.actif ? 'actif' : 'inactif';
  }
}