export interface AuthResponse {
  token: string;
  agentId: number;
  nomComplet: string;
  codeAgent: string;
  role: string;
  partenaireNom: string;
  firstLogin: boolean;
}

 
export interface Referentiel {
  naturesPiece: string[];
  pays: string[];
  roles: string[];
  canaux: { nom: string; description: string }[];
  plafond: number;
}
 
export interface VerificationRequest {
  nomClient: string;
  dateNaissance: string;
  naturePiece: string;
  numeroPiece: string;
  montant: number;
  paysDestination: string;
}
 
export interface VerificationResponse {
  autorise: boolean;
  message: string;
  plafond: number;
  cumul: number;
  montant: number;
  restant: number;
  pourcentageUtilise: number;
  pourcentageApres: number;
  transfertId?: number | null;
  // Champs non (encore) renvoyés par le backend — gardés optionnels pour l'UI.
  motif?: string;
  agentNom?: string;
  dernierTransfert?: {
    nomClient: string;
    dateTransfert: string;
    montant: number;
    statut: string;
  } | null;
}
 
export interface Transfert {
  id: number;
  nomClient: string;
  dateNaissance: string;
  naturePiece: string;
  numeroPiece: string;
  montant: number;
  paysDestination: string;
  statut: string;
  reference: string;
  referenceVerification?: string;
  agence: string;
  canal: string;
  dateTransfert: string;
  cumulMois: number;
  motif?: string;
  partenaireId?: number;
  agentId?: number;
  // Le backend renvoie agentId ; le nom de l'agent n'est pas (encore) exposé.
  agentNom?: string;
}

export interface PlafondClient {
  cumul: number;
  plafond: number;
  depasse: boolean;
}

export interface Bilan {
  jour: string;
  executes: number;
  rejetes: number;
  annules: number;
  nonClotures: number;
  total: number;
  lignes: Transfert[];
}
export interface ClientConnu {
  nomClient: string;
  dateNaissance: string;
  naturePiece: string;
  numeroPiece: string;
}

export interface Partenaire {
  id?: string;
  nom: string;
  email: string;
  actif: boolean;
}

export interface Agent {
  id?: number;
  nomComplet: string;
  email: string;
  role: string;
  codeAgent?: string;
  agence?: string;
  partenaireNom?: string;
  actif: boolean;
  statut?: string;
}
 
export interface DashboardStats {
  partenaires: number;
  agents: number;
  transfertsJour: number;
  montantJour: number;
}

export interface DashboardResume {
  partenairesActifs: number;
  partenairesInactifs: number;
  agentsActifs: number;
  agentsInactifs: number;
  transfertsValides: number;
  transfertsAnnules: number;
  montantTotal: number;
}

export interface InvitationRequest {
  nom: string;
  email: string;
  nomAdministrateur: string;
}

export interface DashboardActivity {
  titre: string;
  description: string;
  date: string;
}

export interface MessageResponse {
  message: string;
}

export interface PremierMotDePasseRequest {
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

export interface ChangementMotDePasseRequest {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

export interface ProfilResponse {
  nomComplet: string;
  email: string;
  agence: string | null;
  role: string;
  partenaireNom: string;
}

export interface StatKpi {
  libelle: string;
  valeur: number;
  variante: string;
}

export interface StatPart {
  libelle: string;
  valeur: number;
  couleur: string;
}

export interface StatPoint {
  periode: string;
  valeur: number;
}

export interface StatClassement {
  id: number;
  nom: string;
  total: number;
}

export interface StatTransfertResume {
  id: number;
  nomClient: string;
  montant: number;
  statut: string;
  date: string;
  agentNom: string;
}

export interface StatistiquesResponse {
  portee: 'PLATEFORME' | 'PARTENAIRE' | 'AGENT';
  kpis: StatKpi[];
  repartitionOperations: StatPart[];
  evolution: StatPoint[];
  classement: StatClassement[];
  activiteRecente: StatTransfertResume[];
}

export interface ConfigurationResponse {
  plafondMensuel: number;
  modifiePar: string;
  modifieLe: string;
}