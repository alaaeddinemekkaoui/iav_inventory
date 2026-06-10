# Manuel d'utilisation - Inventaire IAV

## 1. Objectif de l'application

L'application Inventaire IAV permet de gérer le parc matériel localement, sans base de données externe. Elle sert à :

- enregistrer les articles et leurs codes barre ;
- suivre les affectations, mutations et réformes ;
- gérer les familles, sous-familles, structures et TVA ;
- calculer automatiquement les prix HT/TTC ;
- conserver l'historique des changements ;
- exporter les données d'inventaire et les codes barre.

Les données sont stockées localement dans le dossier `data/`.

## 2. Connexion

Au premier lancement, l'application demande de créer un compte Super Admin local.

Ensuite, l'utilisateur se connecte avec :

- `Username`
- `Mot de passe`

Les rôles disponibles sont :

- `USER` : consultation et opérations courantes ;
- `ADMIN` : modification de l'inventaire et des paramètres ;
- `SUPER_ADMIN` : gestion complète, y compris les utilisateurs.

## 3. Navigation principale

La barre de navigation donne accès aux pages suivantes :

- `Dashboard` : vue globale du parc ;
- `Inventaire` : liste des articles ;
- `Dispatch` : affectation d'un article ;
- `Mutation` : changement de local et de code local ;
- `Reforme` : réforme d'un article ;
- `Historique` : consultation des opérations ;
- `Parametres` : familles, structures, TVA, backups ;
- `Utilisateurs` : gestion des comptes, pour Super Admin.

## 4. Inventaire

La page `Inventaire` affiche la liste des articles.

Colonnes importantes :

- `Code barre`
- `Famille`
- `Sous-famille`
- `N serie`
- `Designation`
- `Quantite`
- `PU HT`
- `PU TTC`
- `PT HT`
- `PT TTC`
- `TVA`
- `Type amortissement`
- `Statut / action`
- `Direction / Filiere`
- `Division / Departement`
- `Service / Unite`
- `Local`
- `Code local`
- `Beneficiaire`

Le `Code local` est affiché séparément. Il ne fait pas partie du `Code barre`.

## 5. Ajouter un article ou un lot

Depuis la page `Inventaire`, cliquer sur `Nouveau lot`.

Les champs sont optionnels, sauf si une règle métier spécifique l'exige dans un autre flux.

Champs principaux :

- `Quantite du lot`
- `Famille`
- `Sous-famille`
- `N serie prefix`
- `Designation`
- `Marque`
- `Model`
- `PU HT`
- `TVA`
- `PU TTC`
- `PT HT`
- `PT TTC`
- `Date entree`
- `Duree`
- `Taux`
- `Type entree`
- `Type amortissement`
- `Origine`
- `Direction / Filiere`
- `Division / Departement`
- `Service / Unite`
- `Local`
- `Code local`
- `Accuse de reception`
- `MAR / BC`
- `FAC N`

### Calcul des prix

Les prix sont calculés automatiquement :

- `PU HT` = prix unitaire hors taxe ;
- `PU TTC` = `PU HT + TVA` ;
- `PT HT` = `PU HT * Quantite` ;
- `PT TTC` = `PT HT + TVA`.

La TVA est prise automatiquement depuis la famille sélectionnée. Par défaut, elle est de `20%`.

## 6. Modifier un article

Dans la page `Inventaire`, activer `Mode edition`, puis cliquer sur `Modifier`.

La fenêtre de modification permet de mettre à jour :

- le code barre ;
- la famille et sous-famille ;
- les informations générales ;
- les prix et la TVA ;
- la structure ;
- le local et le code local ;
- les informations administratives.

Chaque modification importante est enregistrée dans l'historique de l'article.

## 7. Changer le statut

Dans la liste d'inventaire, chaque article possède une action rapide `Changer statut`.

Selon le statut actuel, il est possible de :

- affecter un article ;
- muter un article ;
- réformer un article.

Lors d'un changement de statut, l'application enregistre :

- l'ancien statut ;
- le nouveau statut ;
- la date du changement ;
- les informations associées au mouvement.

Si l'article passe au statut `Réformé`, la date de réforme est conservée.

## 8. Page détail article

Cliquer sur le `Code barre` d'un article ouvre sa page détail.

La page détail affiche :

- informations générales ;
- code barre ;
- famille et sous-famille ;
- localisation ;
- local et code local ;
- prix HT/TTC ;
- TVA ;
- statut actuel ;
- historique des modifications ;
- historique des statuts ;
- mutations et opérations liées.

## 9. Dispatch

La page `Dispatch` sert à affecter un article disponible en stock.

Le dispatch exige :

- le bénéficiaire ;
- le code local.

Après validation, l'article passe au statut affecté/dispatché et l'opération est enregistrée dans l'historique.

## 10. Mutation

La page `Mutation` sert à changer l'affectation ou la localisation d'un article déjà affecté.

Le formulaire mutation utilise :

- article concerné ;
- date ;
- bénéficiaire si nécessaire ;
- structure ;
- `Local` ;
- `Code local`.

Le `Local` et le `Code local` sont obligatoires pour une mutation.

Les champs `Numero de marche` et `Numero de decision` ne sont plus utilisés dans le module mutation.

## 11. Reforme

La page `Reforme` permet de sortir un article du parc actif.

Quand un article est réformé :

- son statut devient `Réformé` ;
- la date exacte est enregistrée ;
- l'ancien statut reste visible dans l'historique.

## 12. Filtres inventaire

La page inventaire permet de filtrer par :

- recherche globale ;
- statut ;
- direction / filière ;
- division / département ;
- service / unité ;
- famille ;
- sous-famille ;
- local ;
- code local ;
- bénéficiaire ;
- date d'entrée minimum ;
- date d'entrée maximum ;
- date minimum de changement de statut ;
- date maximum de changement de statut.

Les filtres sont appliqués aussi aux exports filtrés.

## 13. Exports

Depuis la page `Inventaire`, il est possible d'exporter :

- les données filtrées ;
- les colonnes sélectionnées ;
- les codes barre.

Les exports utilisent le libellé `Code barre`. Le `Code local` reste une colonne séparée.

## 14. Paramètres

La page `Parametres` permet de gérer :

- les backups JSON ;
- la structure organisationnelle ;
- les familles ;
- les sous-familles ;
- la TVA par famille ;
- la séquence des codes barre ;
- le partage LAN.

### TVA par famille

Chaque famille possède un taux de TVA.

Par défaut :

```txt
TVA = 20%
```

Lors de l'ajout d'un article, la TVA de la famille sélectionnée est appliquée automatiquement.

## 15. Backups

Un backup automatique est créé après chaque modification importante.

Depuis `Parametres`, il est possible de :

- télécharger le dernier backup ;
- créer un backup manuel ;
- consulter la liste des backups.

Les backups sont stockés dans :

```txt
data/backups/
```

## 16. Gestion des utilisateurs

La page `Utilisateurs` est accessible au Super Admin.

Elle permet de créer et gérer les comptes locaux.

Les comptes sont stockés dans :

```txt
data/auth.json
```

## 17. Bonnes pratiques

- Créer régulièrement un backup manuel avant une grande modification.
- Vérifier la famille avant de saisir les prix, car la TVA dépend de la famille.
- Utiliser le `Code local` pour localiser l'article sans l'intégrer au `Code barre`.
- Passer par la page détail pour consulter l'historique complet d'un article.
- Utiliser les filtres par date pour retrouver les changements récents.

## 18. Dépannage rapide

Si le serveur indique que le port est déjà utilisé, l'application choisit automatiquement le port suivant disponible.

Si les données semblent manquantes, vérifier le dossier configuré dans :

```txt
INVENTAIRE_DATA_DIR
```

Si aucun dossier n'est configuré, l'application utilise :

```txt
data/
```

## 19. Résumé des formules

```txt
PU HT  = Prix unitaire hors taxe
PU TTC = PU HT * (1 + TVA / 100)
PT HT  = PU HT * Quantite
PT TTC = PT HT * (1 + TVA / 100)
```

Exemple avec `PU HT = 100`, `Quantite = 3`, `TVA = 20%` :

```txt
PU TTC = 120
PT HT  = 300
PT TTC = 360
```
