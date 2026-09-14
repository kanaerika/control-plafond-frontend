import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ActivationService } from '../../services/activation.services';

type Etat = 'chargement' | 'formulaire' | 'succes' | 'erreur';

const LONGUEUR_MINIMALE = 8;

@Component({
  selector: 'app-invitation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './invitation.component.html',
  styleUrl: './invitation.component.css'
})
export class InvitationComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly activation = inject(ActivationService);

  readonly etat = signal<Etat>('chargement');
  readonly message = signal<string>('');
  readonly email = signal<string>('');
  readonly enCours = signal<boolean>(false);
  readonly compteARebours = signal<number>(5);

  motDePasse = '';
  confirmation = '';

  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.echouer("Lien d'invitation invalide : aucun jeton fourni.");
      return;
    }

    this.activation.verifierToken(this.token).subscribe({
      next: res => {
        this.email.set(res.email);
        this.etat.set('formulaire');
      },
      error: (err: HttpErrorResponse) => this.echouer(this.extraireMessage(err))
    });
  }

  valider(): void {
    if (this.motDePasse.length < LONGUEUR_MINIMALE) {
      this.message.set(`Le mot de passe doit contenir au moins ${LONGUEUR_MINIMALE} caractères.`);
      return;
    }
    if (this.motDePasse !== this.confirmation) {
      this.message.set('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    this.message.set('');
    this.enCours.set(true);

    this.activation.activerCompte(this.token, this.motDePasse).subscribe({
      next: res => {
        this.enCours.set(false);
        this.message.set(res.message);
        this.etat.set('succes');
        this.demarrerRedirection();
      },
      error: (err: HttpErrorResponse) => {
        this.enCours.set(false);
        // 410 : le lien a expiré ou a déjà servi — inutile de garder le formulaire.
        if (err.status === 410) {
          this.echouer(this.extraireMessage(err));
        } else {
          this.message.set(this.extraireMessage(err));
        }
      }
    });
  }

  allerAConnexion(): void {
    this.router.navigate(['/connexion']);
  }

  private demarrerRedirection(): void {
    const timer = setInterval(() => {
      const restant = this.compteARebours() - 1;
      this.compteARebours.set(restant);
      if (restant <= 0) {
        clearInterval(timer);
        this.allerAConnexion();
      }
    }, 1000);
  }

  private echouer(msg: string): void {
    this.etat.set('erreur');
    this.message.set(msg);
  }

  private extraireMessage(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Serveur injoignable. Vérifiez votre connexion.';
    }
    // `detail` : ProblemDetail (RFC 7807) ; `message` : erreur Spring Boot par défaut.
    return err.error?.detail
      ?? err.error?.message
      ?? err.error?.error
      ?? "Ce lien d'invitation est invalide ou a déjà été utilisé.";
  }
}
