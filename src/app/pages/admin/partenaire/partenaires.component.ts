import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartenaireService } from '../../../services/partenaire.service';
import { Partenaire } from '../../../models/models';
import { Router } from '@angular/router';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface Confirmation {
  titre: string;
  message: string;
  libelleConfirmer: string;
  danger: boolean;
  action: () => void;
}

@Component({
  selector: 'app-partenaires',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './partenaires.component.html',
  styleUrls: ['./partenaires.component.css']
})
export class PartenairesComponent implements OnInit {
  readonly service = inject(PartenaireService);

  afficherModal = false;
  partenaires: Partenaire[] = [];
  edition = false;
  idEdition: string | null = null;
  enregistrementEnCours = false;
  erreurFormulaire = '';

  toasts: Toast[] = [];
  private prochainToastId = 0;

  confirmation: Confirmation | null = null;

  partenaire: any = {
    nom: '',
    administrateur: '',
    email: '',
    telephone: '',
    pays: ''
  };

  ngOnInit(): void {
    this.charger();
  }

  ouvrirModal(): void {
    this.erreurFormulaire = '';
    this.afficherModal = true;
  }

  fermerModal(): void {

    this.afficherModal = false;
    this.edition = false;
    this.idEdition = null;
    this.erreurFormulaire = '';
    this.partenaire = { nom: '', administrateur: '', email: '', telephone: '', pays: '' };
  }

  enregistrer(): void {

  this.erreurFormulaire = '';
  const partenaire = {
    nom: this.partenaire.nom.trim(),
    email: this.partenaire.email.trim(),
    nomAdministrateur: this.partenaire.administrateur.trim(),
    telephone: this.partenaire.telephone.trim(),
    pays: this.partenaire.pays.trim()
  };

  if (!partenaire.nom || !partenaire.nomAdministrateur || !partenaire.email ||
      !partenaire.telephone || !partenaire.pays) {
    this.erreurFormulaire = 'Tous les champs sont obligatoires.';
    return;
  }

  if (this.enregistrementEnCours) return;
  this.enregistrementEnCours = true;

  if (this.edition) {

    this.service.update(this.idEdition!, partenaire).subscribe({
      next: () => {
        this.enregistrementEnCours = false;
        this.charger();
        this.fermerModal();
        this.notifier('success', `Partenaire « ${partenaire.nom} » modifié avec succès.`);
      },
      error: err => {
        console.error('Erreur modification:', err);
        this.enregistrementEnCours = false;
        this.erreurFormulaire = err?.error?.message || err?.statusText || 'Impossible de modifier le partenaire.';
      }
    });

  } else {

    this.service.create(partenaire).subscribe({
      next: () => {
        this.enregistrementEnCours = false;
        this.charger();
        this.fermerModal();
        this.notifier('success', `Partenaire « ${partenaire.nom} » créé avec succès.`);
      },
      error: err => {
        console.error('Erreur création:', err);
        this.enregistrementEnCours = false;
        this.erreurFormulaire = err?.error?.message ||
          (err?.status === 0 ? 'Impossible de se connecter au serveur. Vérifiez que le backend est lancé.' : err?.statusText) ||
          'Échec de la création du partenaire.';
      }
    });

  }

}

  notifier(type: 'success' | 'error', message: string): void {
    const id = ++this.prochainToastId;
    this.toasts.push({ id, type, message });
    setTimeout(() => this.fermerToast(id), 4000);
  }

  fermerToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  demanderConfirmation(confirmation: Confirmation): void {
    this.confirmation = confirmation;
  }

  annulerConfirmation(): void {
    this.confirmation = null;
  }

  validerConfirmation(): void {
    const action = this.confirmation?.action;
    this.confirmation = null;
    action?.();
  }

  charger(): void {
    this.service.getAll().subscribe({
      next: (data: Partenaire[]) => {
        this.partenaires = data;
      }
    });
  }

  modifier(p: Partenaire): void {
    this.edition = true;
    this.idEdition = p.id!;

    this.partenaire = {
      nom: p.nom,
      administrateur: '',
      email: p.email,
      telephone: '',
      pays: ''
    };

    this.afficherModal = true;
  }

  supprimer(p: Partenaire): void {
    this.demanderConfirmation({
      titre: 'Supprimer ce partenaire',
      message: `Voulez-vous vraiment supprimer « ${p.nom} » ? Cette action est irréversible.`,
      libelleConfirmer: 'Supprimer',
      danger: true,
      action: () => {
        this.service.supprimer(p.id!).subscribe({
          next: () => {
            this.charger();
            this.notifier('success', `Partenaire « ${p.nom} » supprimé avec succès.`);
          },
          error: (err: any) => this.notifier('error', err?.error?.message ?? 'Suppression impossible.')
        });
      }
    });
  }

  basculerActivation(p: Partenaire): void {
    const activer = !p.actif;
    this.demanderConfirmation({
      titre: activer ? 'Activer ce partenaire' : 'Désactiver ce partenaire',
      message: activer
        ? `« ${p.nom} » pourra à nouveau accéder à la plateforme. Continuer ?`
        : `« ${p.nom} » et ses agents perdront l'accès à la plateforme. Continuer ?`,
      libelleConfirmer: activer ? 'Activer' : 'Désactiver',
      danger: !activer,
      action: () => {
        this.service.activerDesactiver(p.id!).subscribe({
          next: () => {
            this.charger();
            this.notifier('success', activer
              ? `Partenaire « ${p.nom} » activé avec succès.`
              : `Partenaire « ${p.nom} » désactivé avec succès.`);
          },
          error: (err: any) => this.notifier('error', err?.error?.message ?? 'Opération impossible.')
        });
      }
    });
  }

  inviter(p: Partenaire): void {
    this.demanderConfirmation({
      titre: 'Renvoyer une invitation',
      message: `Envoyer un nouveau lien d'activation à l'administrateur de « ${p.nom} » ?`,
      libelleConfirmer: 'Envoyer',
      danger: false,
      action: () => {
        this.service.renvoyerInvitation(p.id!).subscribe({
          next: () => this.notifier('success', `Invitation envoyée à « ${p.nom} » avec succès.`),
          error: (err: any) => this.notifier('error',
            err?.error?.detail ?? err?.error?.message ?? "Échec de l'envoi de l'invitation.")
        });
      }
    });
  }
  private readonly router = inject(Router);
  voir(partenaire: Partenaire){

  this.router.navigate([
    '/admin/partenaires',
    partenaire.id
  ]);

}
}
