import { Transfert } from '../../models/models';
 
/**
 * Ouvre le bordereau de soumission dans une fenêtre d'impression.
 * L'agent peut imprimer sur papier OU choisir « Enregistrer au format PDF »
 * dans la boîte de dialogue d'impression du navigateur.
 */
export function imprimerBordereau(t: Transfert): void {
  const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR');
  const ligne = (label: string, valeur: string) => `
      <tr>
        <td class="l">${label}</td>
        <td class="v">${valeur ?? '—'}</td>
      </tr>`;
 
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bordereau de soumission — ${t.referenceVerification ?? t.reference ?? ''}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI', Arial, sans-serif; color:#1a1c20; padding:40px; }
  .entete { display:flex; justify-content:space-between; align-items:flex-start;
            border-bottom:3px solid #d71920; padding-bottom:16px; margin-bottom:24px; }
  .titre { font-size:21px; font-weight:800; letter-spacing:-.3px; }
  .sous { font-size:12px; color:#6b7280; margin-top:4px; }
  .ref { text-align:right; font-size:12px; color:#6b7280; }
  .ref b { display:block; font-size:16px; color:#d71920; margin-top:2px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; }
  td { padding:11px 14px; border-bottom:1px solid #e8eaee; font-size:13.5px; }
  .l { width:42%; color:#6b7280; font-weight:600; font-size:11.5px;
       text-transform:uppercase; letter-spacing:.4px; }
  .v { font-weight:700; }
  .montant { background:#111318; }
  .montant .l { color:rgba(255,255,255,.55); border:none; }
  .montant .v { color:#fff; font-size:17px; border:none; }
  .statut { display:inline-block; padding:3px 12px; border:1.5px solid #d71920;
            border-radius:20px; color:#d71920; font-size:11.5px; font-weight:700; }
  .operateur { border-top:1.5px solid #1a1c20; margin-top:52px; padding-top:10px; text-align:center; }
  .operateur-label { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.4px; }
  .operateur-val { font-size:13.5px; font-weight:700; margin-top:3px; }
  .pied { margin-top:36px; font-size:10.5px; color:#9aa1ab; text-align:center; }
  @media print { body { padding:20px; } }
</style>
</head>
<body>
  <div class="entete">
    <div>
      <div class="titre">Bordereau de soumission</div>
      <div class="sous">Transfert international · ${t.canal ?? ''} · Agence ${t.agence ?? ''}</div>
    </div>
    <div class="ref">Référence de vérification<b>${t.referenceVerification ?? t.reference ?? '—'}</b></div>
  </div>
 
  <table>
    ${ligne('Nom du client', t.nomClient)}
    ${ligne('Date de naissance', t.dateNaissance)}
    ${ligne('Nature de la pièce', t.naturePiece)}
    ${ligne('N° de la pièce', t.numeroPiece)}
    <tr class="montant">
      <td class="l">Montant du transfert</td>
      <td class="v">${fmt(t.montant)} FCFA</td>
    </tr>
    ${ligne('Pays de destination', t.paysDestination)}
    ${ligne('Date du transfert', String(t.dateTransfert ?? ''))}
    ${ligne('Saisi par (agent)', (t.agentNom ?? '—') + ' — Agence ' + (t.agence ?? ''))}
    ${ligne('Cumul du mois (Hors CEMAC)', fmt(t.cumulMois) + ' FCFA')}
    <tr>
      <td class="l">Statut</td>
      <td class="v"><span class="statut">${t.statut ?? ''}</span></td>
    </tr>
    ${t.motif ? ligne('Motif', t.motif) : ''}
  </table>
 
  <div class="operateur">
    <div class="operateur-label">Opération réalisée par</div>
    <div class="operateur-val">${t.agentNom ?? '—'} — Agence ${t.agence ?? ''} — ${String(t.dateTransfert ?? '')}</div>
  </div>
 
  <div class="pied">
    Document généré le ${new Date().toLocaleString('fr-FR')} — Plateforme de suivi des transferts internationaux
  </div>
 
  <script>
    window.onload = function () { setTimeout(function () { window.print(); }, 600); };
  </script>
</body>
</html>`;
 
  // document.write() est déprécié : le document est servi via une URL blob, que
  // la fenêtre charge normalement — le <script> d'impression intégré s'exécute
  // donc comme avant. L'URL est libérée une fois le chargement terminé.
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const fenetre = window.open(url, '_blank', 'width=820,height=900');
  if (!fenetre) {
    URL.revokeObjectURL(url);
    alert("Veuillez autoriser les fenêtres pop-up pour imprimer le bordereau.");
    return;
  }
  fenetre.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
}
 
