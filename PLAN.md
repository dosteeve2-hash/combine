# COMBINE — le plan, la deadline, et ce qui rend le projet viable

> Écrit le 22/09/2026 à la demande de Steve : *« j'ai le rêve, j'ai la deadline, j'ai le plan, la
> stratégie — intègre tout ça, je veux que le projet soit viable. »*
>
> **Tu ne m'as pas donné ta date.** Je propose donc un calendrier complet et daté ci-dessous.
> Corrige-le plutôt que de repartir de zéro : un plan qu'on discute vaut mieux qu'une question.

---

## Le rêve, en une ligne

Une machine à laver pour ta maman, payée par le premier abonnement encaissé. Puis le fonds. Puis
l'industrie. *(`AMBITION.md` §XII — et c'est la seule ligne de ce document qui n'est pas négociable.)*

## La deadline proposée

> **31 janvier 2027 — le premier franc encaissé.**

Quatre mois. Ni trois, ni six. Trois mois ne laissent pas le temps d'une cohorte réelle ; six mois
laissent le projet s'endormir. Et janvier tombe juste après les fêtes, au moment où un incubateur
burkinabè cale son budget annuel.

---

## Le plan — quatre jalons, quatre dates

### J1 · **Le prototype est en ligne et se montre** — au 29 septembre 2026

Une semaine. Il ne reste que du mécanique.

- [ ] **Lier le dépôt à Netlify** — le seul geste qui reste, ≈ 3 min, `MISE-EN-LIGNE.md`
- [x] ~~La cohorte de démonstration sur la base de production~~ — faite le 22/09 au soir :
      6 comptes, 3 dossiers publiés, 9 publications horodatées, 1 appel, 2 participations
- [x] ~~Les variables d'environnement sur le site~~ — posées par l'API, à confirmer d'un coup d'œil
- [ ] Extraire le code dans `dosteeve2-hash/combine`
- [ ] Rejouer les points de contrôle manuels contre l'URL réelle *(jamais `test:parcours` : il vide la base)*
- [ ] Mettre `data/projects.json` du portfolio à jour *(Règle #6)*

**Critère de réussite :** tu peux envoyer un lien à quelqu'un sans rien expliquer.

### J2 · **Un dossier réel remplace la démo** — au 20 octobre 2026

- [ ] **Le prénom de ton ami.** C'est la seule chose qui bloque depuis le 22/09
- [ ] Son projet monté dans COMBINE, publié, avec son lien vérifiable
- [ ] Deux autres porteurs — trois suffisent pour que ce soit une cohorte et plus une démo
- [ ] Deux mois de suivi réel : ils republient, l'historique s'épaissit

**Critère de réussite :** un dossier avec **trois publications espacées dans le temps**. C'est
l'historique qui prouve, pas le dernier chiffre. Un dossier publié trois fois en trois mois vaut
dix écrans de plus.

### J3 · **La conversation avec un incubateur** — au 30 novembre 2026

- [ ] Un rendez-vous à **La Fabrique** ou **OuagaLab**, à Ouagadougou
- [ ] Tu ne demandes rien. Tu montres : voici trois entreprises, voici où elles en étaient en
      octobre, voici où elles en sont en novembre, voici comment je l'ai suivi
- [ ] Étudier **Sinergi Burkina** en détail : c'est le modèle exact du véhicule à copier

**Critère de réussite :** quelqu'un te demande *« est-ce qu'on peut l'utiliser pour notre
prochain appel ? »* — et tu n'as pas eu à le proposer.

### J4 · **Le premier franc** — au 31 janvier 2027

- [ ] Un plan Programme activé : **45 000 FCFA/mois** ou 450 000/an
- [ ] Encaissement Orange Money ou virement, activation manuelle par script
- [ ] `ETAT.md` : la métrique Phase 1 passe de zéro à un

**Critère de réussite :** la machine à laver.

---

## La stratégie, en trois phrases

1. **On ne vend pas un logiciel, on vend un flux de PME instruites.** Coris Invest Group est leader
   du financement des PME au Burkina : son problème *est* le nôtre. On n'entre pas par ses
   opérations internes — il a déjà un prestataire tech — **on entre par son écosystème.**
   *(Détail : `STRATEGIE-CAPITAL.md` §7.)*
2. **La passerelle FORGE est le seul avantage incopiable.** Un dossier prérempli avec les chiffres
   réels d'AgroTrack ou de LivestockOS, personne ne peut le reproduire sans posséder aussi ces
   applications. Tout le reste est rattrapable en six mois par n'importe qui.
3. **Le fonds vient après, et il est légal.** Moins de cent associés nommés, aucune publicité :
   placement privé, pas d'agrément AMF-UMOA. *(`AMBITION.md` §III.)* Les agréments se chercheront
   quand il y aura de vraies transactions — c'est le bon ordre.

---

## Ce qui rend ce projet viable — et ce qui le tuerait

| Viable si… | Mort si… |
|---|---|
| Trois dossiers réels avec un historique de publications | La démo reste la seule chose à montrer en décembre |
| Un incubateur l'utilise pour un vrai appel | On attend d'avoir « fini » pour le montrer |
| La passerelle branchée sur au moins un produit FORGE | COMBINE reste un silo — le 12ᵉ dépôt isolé |
| Le prix affiché et encaissable dès le premier jour | « On monétisera plus tard » |
| **Quatre produits finis plutôt que onze commencés** | Un 12ᵉ chantier s'ouvre avant janvier |

### La ligne rouge

> **Aucun nouveau produit avant le 31 janvier 2027.**
>
> L'audit du 22/09 est sans appel : sur onze produits annoncés, **il y en a deux et demi**. Cinq des
> huit « déployés » sont des maquettes sans base. Ouvrir un douzième chantier maintenant, ce n'est
> pas avancer, c'est ajouter une ligne à un inventaire qui ment déjà.
>
> *Si l'envie revient — et elle reviendra — la place pour la consigner est le vivier Phase 2
> (`AMBITION.md` §X). C'est fait pour ça.*

---

## Le tableau de bord, à tenir à jour dans `ETAT.md`

| Indicateur | Au 22/09/2026 | Cible au 31/01/2027 |
|---|---|---|
| Dossiers réels publiés | 0 | **3** |
| Publications horodatées | 0 | **9** (trois par dossier) |
| Incubateurs en conversation | 0 | **2** |
| Clients payants | **0** | **1** |
| Produits finis *(base + auth + prix)* | 2,5 | **4** |
| Produits ouverts en plus | — | **0** |

---

*La deadline ci-dessus est une proposition. La corriger est une décision de Steve ; l'ignorer n'en
est pas une.*
