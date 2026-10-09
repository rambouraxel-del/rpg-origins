# RPG ORIGINS — RÈGLES ET SYSTÈME DE JEU

**Version :** 0.1 — proposition de gameplay pour discussion  
**Date :** 9 octobre 2026  
**Document narratif associé :** `RPG_Origins_Bible_Narrative_v1.md`  
**Destination :** cadrage du jeu, puis spécification pour Claude Code après décisions éditoriales.

> Les demandes déjà établies sont rappelées dans la section 1. Les systèmes proposés ensuite sont de nouvelles recommandations ; ils ne sont pas présentés comme des choix qu'Axel aurait déjà validés. Cette version ne lance ni développement, ni génération d'images, ni dépense d'API.

## 1. Ce que tu avais demandé

| Sujet | Choix ou intention retrouvés | Statut |
| --- | --- | --- |
| Identité du projet | RPG Origins, indépendant de Chronica. | Établi. |
| Plateforme | Jeu PC dans le navigateur, avec déploiement envisagé sur GitHub Pages. | Établi. |
| Monde à parcourir | Écrans fixes : un décor par lieu, caméra immobile, personnage libre dans les zones autorisées, transitions aux sorties. | Établi. |
| Présentation | Vue de dessus légèrement inclinée / trois quarts, format 16:9. | Établi. |
| Commandes initiales | ZQSD / WASD / flèches pour se déplacer ; E pour interagir. | Établi dans le prototype. |
| Décors | Très beaux, cohérents, lisibles et réellement jouables : sols, obstacles et sorties compréhensibles. | Établi. |
| Direction artistique actuelle | Style n°9 et références du dépôt ; rendu peint, non pixel art. Les anciennes discussions pixel art ne remplacent pas cette direction plus récente. | Établi dans le cadrage actuel ; références à fournir au développeur. |
| Narration | Histoire centrale, rencontres, compagnons, choix, souvenirs et révélations progressives. | Établi. |
| Magie | Énergie de la planète vivante ; capacités découvertes grâce aux sanctuaires. | Établi. |
| Puits | Lieux de soin et de récupération d'énergie. | Établi. |
| Fins | Libérer le monde en acceptant sa disparition, ou rejoindre les ancêtres et préserver sa lignée par l'asservissement. | Établi. |
| Production | Privilégier les assets propres ; assets externes possibles si compatibles ; génération d'images strictement limitée. | Établi. |
| Code | Architecture envisagée Phaser / TypeScript / Vite, lieux et événements définis dans des données éditables. | Cadre envisagé. |
| Échelle des scènes | Tu avais envisagé des scènes davantage dézoomées, avec un personnage plus petit, tout en conservant le détail. | Piste évoquée, à comparer visuellement. |

Les sanctuaires précis, les sept pouvoirs nommés, les trois compagnons Nara/Soren/Tessa, leurs dialogues et les vingt-sept lieux viennent de la bible v1.0 que nous venons de rédiger. Ce sont des propositions narratives désormais documentées, pas des anciennes règles de combat validées séparément.

Nous n'avions pas arrêté un système complet de combat, de classes, de niveaux, d'équipement, de butin ou de gestion. Le goût pour la gestion exprimé dans les discussions initiales n'établit pas à lui seul un système de colonie dans RPG Origins. Les systèmes qui suivent remplissent ces espaces avec une proposition cohérente.

## 2. Le jeu que je propose

Un **RPG narratif d'exploration**, avec des combats courts en temps réel et une pause permettant de réfléchir, des pouvoirs qui transforment la manière de parcourir les lieux, des compagnons utiles et quelques projets concrets dans les communautés.

Le plaisir doit venir de cinq actions : comprendre un lieu ; découvrir un usage de la magie ; connaître quelqu'un ; résoudre un problème avec plusieurs savoirs ; voir le monde répondre à ce que l'on a fait. L'équipement et les affrontements soutiennent ces actions.

Cible de rythme proposée, à vérifier en test : environ 40 % d'exploration et d'énigmes, 30 % de narration et de relations, 20 % de combat ou d'infiltration, 10 % de services et de projets locaux. Ce sont des intentions de conception, pas des compteurs limitant une activité. La durée visée serait de 6 à 8 heures pour l'histoire et de 8 à 12 heures avec le contenu secondaire ; elle devra être mesurée sur le jeu réel.

Le joueur contrôle Elyan. Il choisit ses déplacements, ses interactions, son équipement et ses actions de combat. Les compagnons apportent leurs interventions et leurs avis, sans nécessiter le contrôle permanent de quatre personnages.

## 3. La boucle de jeu

1. Arriver dans un lieu et repérer ses sorties, ses personnes et son problème visible.
2. Explorer, dialoguer et examiner les indices accessibles.
3. Employer un pouvoir ou le savoir d'un compagnon pour ouvrir une possibilité.
4. Résoudre une énigme, éviter une patrouille ou livrer un affrontement court.
5. Obtenir une information, un objet utile, un lien ou une amélioration locale.
6. Revenir à un puits ou à une communauté pour se reposer et parler des conséquences.
7. Accéder au lieu ou au moment narratif suivant.

Une découverte doit produire une différence observable. Si l'eau revient, le moulin tourne. Si une archive est récupérée, Soren peut la discuter. Si une famille est évacuée, on la retrouve à Lisière. Une simple accumulation de marqueurs de quête n'est pas suffisante.

Les retours restent courts. Les lieux voisins se relient directement, et un déplacement rapide limité devient possible une fois les trajets réellement découverts. Les événements importants sur une route doivent être vus avant que le déplacement rapide puisse les contourner.

## 4. Exploration, déplacements et transitions

### 4.1. Caméra et zones

La caméra demeure fixe dans chaque lieu. Le décor n'est pas une immense carte avec défilement permanent. Les zones de marche et les obstacles sont définis séparément de l'image. Le point de contact du héros est à ses pieds ; l'ordre d'affichage lui permet de passer derrière une façade basse ou devant un équipement selon la profondeur.

Les sorties correspondent à des passages réellement dessinés : sentier, porte, pont, quai. Tous les bords de l'image ne sont pas des sorties. Un mur ou une forêt dense à la limite reste bloqué. La transition a lieu lorsque le héros entre dans la zone de sortie autorisée, avec un bref fondu et une position d'arrivée définie.

Le déplacement cardinal du prototype est conservé. Les diagonales sont une amélioration proposée ; si elles sont activées, leur vitesse est normalisée pour qu'elles n'accélèrent pas le héros. La représentation du personnage peut employer les huit vues disponibles, sans exiger une animation complète unique pour chaque action et direction dès le premier lot.

### 4.2. Interaction

Un seul objet proche est ciblé à la fois. La priorité va à un objet face au héros, puis au plus proche. Une petite indication affiche le nom de l'action, par exemple « E — Parler à Darel ». Elle doit être compréhensible sans couvrir le décor.

E sert à parler, examiner, prendre un objet, manipuler une commande ou utiliser une sortie qui demande confirmation. Les interactions de pouvoir apparaissent avec leur nom : « Tisser les racines », « Écouter le bassin ». Le joueur ne doit pas essayer les sept pouvoirs au hasard devant chaque pierre.

Les interactions importantes ont un accès évident. Les détails facultatifs peuvent être plus discrets. Une fonction d'aide peut montrer les points proches, mais elle ne révèle ni les objets derrière un obstacle ni les solutions d'énigme.

### 4.3. Carte

La carte représente les lieux découverts et leurs connexions. Elle ne montre pas une fausse géographie continue. Un lieu non visité reste un repère sans détails ou n'apparaît qu'après une indication crédible d'un PNJ.

Les sorties inaccessibles indiquent une raison connue : pont fermé, autorisation nécessaire, chemin dangereux. Une sortie nécessitant un pouvoir encore inconnu n'affiche pas le nom de ce pouvoir avant sa découverte. Après son acquisition, le journal peut rappeler les lieux où un usage a été observé.

## 5. Combat : temps réel avec pause de réflexion

### 5.1. Intention

Les combats sont lisibles, assez courts pour ne pas casser la narration et assez variés pour rendre les pouvoirs utiles. Je propose de commencer avec une arme de corps à corps, une esquive, deux pouvoirs de combat sélectionnables et une intervention de compagnon. Un affrontement ordinaire met un à trois adversaires actifs face au héros.

Pour respecter l’inventaire du prologue, Elyan commence sans arme de combat utilisable. Je propose qu’une arme simple lui soit prêtée lors du départ C02S05 ; cet ajout devra être reporté dans la bible s’il est retenu. Les premières scènes restent centrées sur le secours et l’exploration.

Les personnages humains sont désarmés ou mis hors d'état de combattre. La victoire générique n'ajoute pas une mort dans le scénario. Les automates peuvent être détruits. Les décès explicitement écrits dans la bible restent des événements narratifs particuliers.

Les animaux ne constituent pas une réserve automatique d'expérience. Les créatures paisibles restent paisibles. Une scène avec un animal blessé peut se résoudre par l'observation et le secours prévus dans le récit.

### 5.2. Actions disponibles

| Action | Fonction | Règle proposée |
| --- | --- | --- |
| Attaque | Frappe courte dans une direction choisie. | Une animation lisible ; pas de longue chaîne de combos. |
| Esquive | Déplacement bref pour quitter une zone d'attaque. | Recharge courte ; direction impossible si obstacle. |
| Pouvoir actif | Employer un pouvoir appris dans son usage de combat. | Coût en énergie et recharge annoncés. |
| Intervention | Demander l'action du compagnon de soutien. | Une intervention par rencontre ordinaire. |
| Consommable | Se soigner ou récupérer un peu d'énergie. | Stock limité, usage empêché pendant une animation déjà engagée. |
| Pause de réflexion | Observer, choisir un pouvoir, une cible ou un objet. | Toute la simulation est suspendue. |

La pause n'est pas une conversion en combat au tour par tour. Le joueur peut l'utiliser autant qu'il le souhaite. La reprise exécute l'action choisie si la cible est encore valide et à portée ; elle ne téléporte pas le héros et ne lui invente pas un chemin à travers un mur.

Le joueur peut terminer un affrontement sans pause s'il préfère l'action. La fonction sert aussi à rendre les combats accessibles avec peu d'animations sophistiquées.

### 5.3. Télégraphie et terrain

Un adversaire prépare son attaque par un geste, une lumière ou une zone au sol avant de frapper. Les signes restent lisibles sur le décor peint. Les effets sonores renforcent l'information sans être son unique support.

Le terrain sert à se protéger et à créer des opportunités : une colonne bloque un tir, un support de racine peut immobiliser un automate, un canal refroidit une machine. Chaque terrain interactif possède des points prévus dans ses données ; aucun système de destruction universelle n'est nécessaire.

La fuite est possible dans les rencontres ordinaires si le joueur rejoint la sortie sûre. Certaines scènes principales ferment une sortie jusqu'à neutralisation de la menace ; la raison doit être visible et annoncée. Une fuite ne fait pas disparaître un document obligatoire ni mourir un compagnon. Une intervention déjà utilisée reste dépensée si le joueur revient dans la même rencontre non terminée ; traverser une sortie ne permet pas de la renouveler en boucle.

### 5.4. Quatre profils d'adversaires

| Profil | Comportement | Réponse attendue |
| --- | --- | --- |
| Automate de garde | Avance puis prépare une frappe proche. | Esquive et attaques sur sa fenêtre ouverte. |
| Sentinelle | Tire après une visée marquée. | Utiliser le couvert ou interrompre avec l'Onde. |
| Unité de pompage | Se protège par un circuit relié au terrain. | Identifier puis couper le circuit avant d'attaquer. |
| Soldat | Bloque frontalement et se repositionne. | Contourner, déséquilibrer, puis désarmer. |

Des variantes changent le rythme ou les associations, pas seulement la quantité de points de vie. Les derniers affrontements du cœur combinent des machines et des objectifs de circuit. Vaelor n'est pas transformé en monstre gigantesque nécessitant un nouveau système de combat.

### 5.5. Premières valeurs d'équilibrage

Ces chiffres sont une base de prototype, à ajuster après essai. Ils ne sont pas des décisions antérieures d'Axel.

| Paramètre | Point de départ |
| --- | --- |
| Vie d'Elyan au début | 100 |
| Énergie d'Elyan au début | 100 |
| Dégâts d'une frappe | 18 |
| Intervalle minimal entre frappes | 0,55 seconde |
| Vie d'un automate simple | 60 |
| Dégâts ordinaires subis | 10 à 18 |
| Préparation d'une attaque ennemie | Au moins 0,7 seconde pour les premières rencontres |
| Recharge d'esquive | 2 secondes |
| Coût d'un pouvoir de combat | 20 à 30 énergie selon le pouvoir |
| Recharge d'un pouvoir de combat | 6 à 10 secondes |
| Régénération d'énergie en combat | 6 par seconde après 2 secondes sans dépense |
| Régénération hors combat | 12 par seconde après 2 secondes sans dépense |
| Soin consommable | 35 vie ; maximum 5 exemplaires transportés |

L'esquive n'ajoute pas une troisième jauge d'endurance. Les chiffres finaux doivent être centralisés, pour modifier le rythme sans changer chaque scène. Les interactions narratives de pouvoir suivent des règles différentes, décrites ci-dessous.

## 6. Pouvoirs : même magie, deux usages

Les sept pouvoirs suivent l'ordre de la bible. Leur acquisition est garantie par le récit principal, indépendamment des points d'amélioration. Les trois accords restent des réponses narratives ; ils ne sont pas dépensés comme des munitions.

| Pouvoir | Dans l'exploration | Dans le combat |
| --- | --- | --- |
| Écoute — chapitre 1 | Lire un signal, localiser une blessure ou un flux. | Montrer un point d'alimentation déjà présent dans les données de l'ennemi. |
| Tissage — chapitre 2 | Lier des supports existants, ouvrir une passerelle. | Immobilisation brève près d'un appui compatible. |
| Accord des eaux — chapitre 3 | Répartir un débit, ouvrir un canal. | Modifier un circuit ou refroidir une machine si le terrain le permet. |
| Voile — chapitre 4 | Passer une courte zone de détection. | Réduire momentanément le ciblage ; ne supprime pas une attaque déjà partie. |
| Onde — chapitre 5 | Désynchroniser un verrou identifié. | Interrompre et fragiliser un automate ; pas d'exécution magique d'humains. |
| Rémanence — chapitre 6 | Revoir et comparer des traces autorisées. | Analyse du cycle d'une machine : indication de sa prochaine fenêtre, sans arrêt du temps diégétique. |
| Lien — chapitre 7 | Coordonner les accords et créer un abri consenti. | Protection courte du groupe ; jamais contrôle de l'esprit des compagnons. |

En exploration, une interaction obligatoire ne consomme pas une réserve susceptible de bloquer l'histoire. Elle demande le pouvoir connu, une position correcte et, si nécessaire, la résolution de l'énigme. Le jeu peut afficher une courte fatigue visuelle ; il ne demande pas de chercher une potion pour ouvrir la seule sortie.

En combat, seuls les usages proposés au terrain et aux cibles sont activables. Deux pouvoirs sont affectés aux raccourcis ; la pause permet d'en choisir un autre parmi ceux appris. Écoute et Rémanence servent d'analyse contextuelle ; elles ne prennent pas forcément un emplacement de raccourci offensif. L'Accord des eaux est indisponible dans une pièce sans eau ni conduite.

L'énergie vide n'empêche pas l'attaque, le déplacement et l'esquive. Elle se régénère. Le système ne peut donc pas laisser le joueur enfermé dans une rencontre parce qu'il a essayé un pouvoir trop tôt.

Après la trahison finale, le Lien consenti avec les compagnons cesse. La scène B01 doit proposer les commandes techniques nécessaires à sa conclusion sans demander une coopération volontaire que ces personnages refusent désormais.

## 7. Progression et personnalisation

### 7.1. Progression par étapes

Je propose cinq paliers de progression, atteints par l'histoire : départ, fin du chapitre 3, fin du chapitre 5, fin du chapitre 7, fin du chapitre 9. Le joueur n'a pas besoin de tuer des adversaires en boucle pour être au niveau du scénario.

Chaque passage de palier donne +10 vie maximale, +5 énergie maximale et deux points d'amélioration. À l'entrée finale, un héros ayant suivi la progression principale possède donc 140 vie, 120 énergie et huit points à répartir. Les récompenses secondaires apportent surtout des objets, des relations et des améliorations locales.

Il n'y a pas de classe irréversible à choisir avant de comprendre les pouvoirs. Les points orientent la manière de jouer. La redistribution est gratuite au puits, pour permettre l'expérimentation et éviter qu'un mauvais choix précoce punisse toute la partie.

### 7.2. Trois orientations proposées

| Orientation | Quatre améliorations possibles, un point chacune |
| --- | --- |
| Gardien | Petite réduction des dégâts ; soin plus efficace ; récupération d'esquive légèrement plus rapide ; protection du Lien un peu plus longue. |
| Accordeur | Coûts d'énergie réduits ; Onde plus durable ; Tissage plus stable en combat ; durée du Voile légèrement accrue. |
| Voyageur | Sprint plus confortable ; portée d'aide à l'interaction élargie ; meilleure lecture des signes de terrain ; intervention de soutien améliorée. |

Les huit points ne permettent pas de tout obtenir. Les améliorations ne doivent pas verrouiller une énigme, un dialogue principal ou une fin. La lecture des signes ne révèle pas une vérité encore inconnue ; elle améliore le confort de perception de ce qui est déjà accessible.

Les gains restent modestes, par exemple 10 à 15 % selon l'effet, avec un plafond défini. Une amélioration ne doit pas rendre un pouvoir illimité ou supprimer toute anticipation des attaques.

## 8. Compagnons et relations

### 8.1. Présence narrative

Nara, Soren et Tessa suivent l'histoire et participent aux scènes où ils sont requis. Leur rôle ne dépend pas d'un système de recrutement aléatoire. Lorsqu'ils sont dans un lieu, ils peuvent avoir une position propre, examiner quelque chose ou intervenir dans un dialogue.

Pour contenir les besoins graphiques, je propose que les scènes calmes utilisent leurs sprites statiques et quelques mouvements courts. Hors scène scénarisée, un seul compagnon de soutien peut suivre Elyan visuellement ; les autres sont considérés proches et restent présents dans les conversations. Le choix de soutien ne supprime jamais un acteur indispensable au récit.

### 8.2. Soutien de combat

Avant une rencontre, le joueur choisit un soutien. L'intervention est disponible une fois par rencontre, puis revient à la suivante. Elle ne dépend pas d'un score de confiance maximal.

- **Nara :** détourne brièvement un adversaire et ouvre une possibilité de déplacement.
- **Soren :** révèle un cycle ou allonge brièvement une fenêtre de vulnérabilité déjà existante.
- **Tessa :** désactive temporairement un circuit artificiel ou diminue un bouclier mécanique.

Une rencontre sans machine propose à Tessa une action de terrain compatible, ou annonce que son intervention n'est pas pertinente avant le choix. Aucun compagnon ne peut contrôler l'esprit d'un humain ou révéler une information qu'il ne connaît pas.

### 8.3. Confiance

Les actes et les réponses construisent une confiance de 0 à 5, comme dans la bible. L'interface privilégie des mots et des signes de relation plutôt qu'un score affiché à chaque phrase. Les changements se produisent sur des engagements significatifs : vérité dite, promesse tenue, respect d'une limite.

Les confidences, variantes de dialogue et proximité affective utilisent cette confiance. Les compagnons continuent les secours nécessaires même si une relation est difficile. Ils refusent tous la domination finale. Une haute confiance n'en fait pas des partisans de l'esclavage.

La romance avec Nara est une proposition facultative héritée de la bible. Elle doit être explicite, réciproque et évitable. Aucun bonus de puissance ne récompense le joueur pour l'avoir choisie.

## 9. Objets, équipement et économie

### 9.1. Trois catégories séparées

**Objets narratifs :** sceau, lettres, preuves, cartes et accords. Ils sont dans un onglet dédié, sans poids ni limite. Ils ne peuvent pas être vendus, perdus ou consommés par erreur.

**Équipement :** trois emplacements proposés — arme, protection, talisman. Un objet améliore modestement une propriété. Il n'introduit pas automatiquement une nouvelle famille d'animations. L'arme principale reste compatible avec les actions du héros.

**Consommables et matériaux :** quelques soins, pièces, bois préparé et graines. Les stocks restent visibles et petits. La collecte intervient sur des points limités de lieux explorés ; elle ne demande pas des heures de récolte renouvelable.

### 9.2. Équipement sans inflation

Une douzaine d'objets d'équipement soignés suffisent pour une première version complète. Ils privilégient les compromis : un talisman réduit le coût des pouvoirs, un autre aide la protection ; une tenue légère favorise le déplacement, une autre limite les dégâts. Les équipements ne deviennent pas obsolètes à chaque chapitre.

Je propose des objets déterministes placés dans les quêtes ou les lieux. Les coffres ne tirent pas des armes au hasard. La durabilité et la réparation répétitive ne sont pas nécessaires à cette aventure.

### 9.3. Économie locale

Une monnaie simple sert aux consommables et services. Les preuves, les autorisations principales et les pouvoirs ne sont jamais vendus. Les communautés peuvent également accepter un échange prévu par une quête.

La quête principale doit être réalisable sans achat. Un joueur ayant dépensé sa monnaie conserve le soin au puits, l'énergie renouvelable et les outils nécessaires. Le journal explique les matériaux manquants d'un projet et leurs lieux possibles, sans révéler des zones encore inconnues.

## 10. Une part de gestion au service des communautés

Je propose une gestion légère par **projets locaux**, liée aux quêtes déjà écrites. Le joueur ne dirige pas toute la population et ne bâtit pas une ville case par case. Il apporte des moyens et participe aux décisions, puis voit les habitants réaliser les projets.

| Projet | Quête associée | Effet visible et utile |
| --- | --- | --- |
| Dispensaire | Q01 | Pompe réparée, accueil et quelques soins disponibles. |
| Réserve du jardin | Q03 | Graines conservées, nouvelles plantations dans le lieu choisi. |
| Atelier partagé | Q05 | Moulin actif, service de petit équipement et dialogue entre les peuples. |
| Table commune | Q09 | Repas partagé, repos confortable et conversations supplémentaires. |
| Liaison des familles | Q10 | Courrier transmis, personnes retrouvées dans les bilans. |

Ces projets n'ajoutent pas cinq quêtes parallèles à accomplir après les quêtes existantes : leur avancement représente le contenu de ces quêtes. Les besoins viennent de la scène concernée. Une amélioration peut donner un petit avantage, mais ne conditionne pas l'évacuation ou l'accès au cœur.

Il n'y a pas de production hors ligne, de jauge de faim collective ou d'impôt à optimiser dans cette proposition. La valeur de la gestion est de rendre l'aide concrète. Une version future pourrait l'approfondir si ces projets sont une partie particulièrement appréciée des tests.

## 11. Quêtes, dialogues et choix

### 11.1. Journal

Le journal comporte histoire principale, quêtes secondaires, personnes, souvenirs et carte. Chaque quête possède une prochaine action claire et les faits déjà connus. Il ne décrit pas la vérité d'un retournement avant que le héros l'ait découvert.

Une tâche ne devient pas accomplie seulement parce que le joueur a ramassé quelque chose. Les conditions de restitution, de conversation ou d'action sont validées selon la scène. Répéter une interaction ne donne pas plusieurs récompenses.

Les douze quêtes de la bible restent le contenu secondaire de base. Le développeur ne doit pas ajouter une série de livraisons génériques pour gonfler artificiellement la durée.

### 11.2. Présentation des dialogues

Le texte apparaît progressivement, avec vitesse réglable. Un clic ou une touche affiche d'abord la phrase entière ; l'action suivante avance. Les choix demandent une sélection explicite et ne partent pas à cause du clic qui vient de finir la phrase.

Le portrait, s'il existe, identifie la personne qui parle. Sa création est une décision graphique soumise au budget ; le dialogue doit aussi fonctionner avec un nom et une mise en page propre.

Les conversations suspendent la simulation. Les temps de lecture ne font pas perdre une évacuation, une opportunité morale ou un compagnon. Les textes importants peuvent être relus dans un historique ou le journal.

### 11.3. Conséquences

Les choix locaux changent une relation, un détail de quête, une méthode d'approche ou un bilan. Les choix stratégiques importants sont annoncés avec des conséquences compréhensibles. Les deux routes finales reposent uniquement sur la sélection explicite de C10S05.

Il n'y a pas de score global de « bien » ou de « mal ». Le jeu retient ce qui a été fait. La confession minimisée d'Elyan baisse la confiance ; elle ne fait pas oublier aux compagnons les archives vues ensemble. Une relation amoureuse ne permet pas de contourner leurs convictions.

Les quêtes secondaires peuvent changer ce qui reste après le héros. Elles ne créent pas de talisman secret de résurrection et ne permettent pas une troisième fin sauvant tout gratuitement.

## 12. Énigmes et infiltration

Les énigmes utilisent les éléments présents : canaux, supports, inscriptions, traces et cycles de machines. La solution peut être déduite dans le jeu. Elle ne demande pas de connaissances historiques externes ni de reconnaissance d'un détail minuscule de l'image.

Trois niveaux d'aide sont proposés : rappel du but, indication de la contrainte, suggestion de la prochaine action. Le joueur les demande ; la dernière ne valide pas automatiquement l'énigme. Les premières erreurs réinitialisent les éléments manipulables, sans détruire une ressource unique.

L'infiltration s'appuie sur des zones de détection visibles, des rondes courtes et le Voile. Une détection ordinaire déclenche une confrontation récupérable ou un retour au point sûr. Elle ne tue pas automatiquement les réfugiés hors champ. Le chapitre des archives conserve un chemin après l'échec de discrétion, conformément à la bible.

Une énigme validée reste validée. Le retour dans un lieu ne demande pas de réparer à nouveau son pont, sauf événement narratif explicitement écrit.

## 13. Puits, sauvegardes et défaite

### 13.1. Puits

Un puits sain soigne, restaure l'énergie, permet de redistribuer les améliorations et ouvre les conversations de repos disponibles. Un puits contraint peut d'abord être examiné et devenir un objectif de libération. Son état provient de l'histoire, pas d'une usure provoquée par les visites ordinaires du joueur.

Le repos ne déclenche pas un massacre parce qu'un certain nombre d'heures de jeu aurait passé. Les ellipses et les urgences de la bible avancent aux événements définis. La relation à Eïra demeure représentée par les gestes et les dialogues, sans piège où sauvegarder trop souvent abîmerait le monde.

### 13.2. Sauvegardes

Je propose trois emplacements manuels, une sauvegarde automatique de progression et une sauvegarde dédiée avant le seuil du chapitre 10. Le format doit pouvoir être exporté et importé par fichier, utile pour un jeu navigateur joué sur plusieurs machines.

L'interface indique où la partie est enregistrée. Une sauvegarde locale n'est pas présentée comme une synchronisation de compte. Le jeu ne demande pas de connexion utilisateur pour la première version.

La reprise restaure la scène, l'étape de dialogue, les objets, les pouvoirs, les quêtes, les relations et les conséquences déjà validées. Une récompense ne peut pas être multipliée en rechargeant au bon moment.

### 13.3. Défaite et reprise

Une défaite en combat propose recommencer la rencontre ou reprendre la dernière sauvegarde. Elle ne retire ni équipement rare ni expérience définitivement. Le redémarrage de rencontre restaure son état initial complet, y compris objets consommés et conséquences locales, pour éviter les duplications et les dépenses répétées involontaires.

La décision finale enregistrée reste celle de la route actuelle lors d'une reprise interne. Pour explorer l'autre fin, le joueur recharge explicitement la sauvegarde du seuil. Ce rechargement n'est pas un pouvoir d'Elyan et n'est pas connu des personnages.

## 14. Commandes, interface et confort

| Commande proposée | Action |
| --- | --- |
| ZQSD / WASD / flèches | Déplacement ; touches reconfigurables. |
| Maj | Sprint hors combat, si la zone permet de courir. |
| E | Interaction ciblée. |
| Clic gauche | Attaque en combat. |
| Espace | Esquive en combat. |
| Clic droit | Pouvoir actif sélectionné. |
| 1 et 2 | Sélection des deux pouvoirs de raccourci. |
| Tab | Ouvrir/fermer la pause de réflexion en combat. |
| I | Inventaire et équipement. |
| J | Journal. |
| M | Carte des lieux. |
| Échap | Menu pause. |

La souris indique une cible ou une direction lorsque le joueur l'utilise ; le mode clavier garde la dernière direction du héros. Les menus sont navigables au clavier. Une manette est une extension possible après validation du jeu clavier/souris, sans modifier le récit.

Le HUD montre vie, énergie, pouvoirs sélectionnés et intervention disponible. La quête suivie peut être masquée. L'indication d'interaction apparaît seulement à proximité. Les informations de budget d'images, de code et d'API ne sont jamais exposées dans l'interface du jeu.

Les options comprennent volume par catégorie, vitesse du texte, taille du texte, réduction des effets lumineux et reconfiguration des touches. Les signaux utiles ne reposent pas seulement sur une couleur. La pause de réflexion et l'aide aux énigmes demeurent disponibles dans toutes les difficultés.

Deux difficultés initiales suffisent : Histoire, avec dégâts reçus réduits, et Aventure, avec les valeurs de base. Les dialogues, pouvoirs, quêtes et fins sont identiques. La difficulté peut changer hors d'une rencontre, sans recommencer la partie.

## 15. Exemple d'une séquence complète

**Séquence : la rivière, chapitre 3.**

Le joueur découvre le moulin arrêté et le puits clôturé. Il parle au meunier et apprend qu'une ouverture brutale ferait courir un risque aux deux rives. L'Écoute identifie la pression ; le Tissage permet d'atteindre le canal de décharge. Il entre au relais avec Nara et Soren.

Il rencontre Tessa et Ilan, puis examine les trois preuves de l'accident. Aucun compteur de vitesse ne pénalise la lecture. Le sanctuaire présente les trois bassins. Après une tentative, le joueur comprend qu'il doit laisser l'eau atteindre le dernier. Il obtient l'Accord des eaux.

Une cloison tombe sur les ouvriers. La scène combine des manipulations et, si une machine menace le passage, une brève neutralisation compatible avec les capacités déjà apprises. L'Onde n'est pas disponible au chapitre 3 et ne doit pas être invoquée ici. Le héros utilise les supports et l'eau ; les compagnons apportent leurs savoirs.

Les captifs et les ouvriers sortent. Le moulin reprend. Tessa rejoint l'aventure et raconte l'Aube Basse. Le joueur peut terminer Q05 pour réparer la roue, puis revenir au puits : nouvelle conversation avec Nara, sauvegarde et prochaine destination Miral.

La séquence donne exploration, énigme, secours, relation et conséquence locale. Elle n'exige pas un nouveau sous-jeu ni des dizaines d'images uniques.

## 16. Cohérence avec la bible narrative

| Exigence du récit | Conséquence dans les règles |
| --- | --- |
| L'amnésie masque la personne, pas tous ses savoirs. | Le héros sait marcher et parler, et retrouve des gestes de combat à la remise de son arme ; le nom visible évolue après C06S02. |
| Les pouvoirs viennent des rencontres avec Eïra. | Acquisition principale garantie ; les points personnalisent sans bloquer. |
| Les compagnons gardent leurs convictions. | Confiance et soutien ne contrôlent pas leur choix moral. |
| Les secours demandent plusieurs savoirs. | Interactions contextuelles, plutôt que statistiques obligatoires d'un compagnon. |
| La magie ne fabrique pas une nouvelle origine. | Soin, niveau et équipement ne peuvent pas sauver Elyan en route A. |
| Le temps du récit est scénarisé. | Pas de chronomètre global déclenchant l'extermination pendant l'exploration. |
| Les chemins servent à évacuer puis peuvent être trahis. | Les routes et objets importants gardent leurs états jusqu'au choix final. |
| Le héros peut quitter le monde avant de disparaître. | A02 conserve les interactions finales ; la disparition avance au geste prévu. |
| La route B implique une réelle trahison. | Les compagnons cessent le soutien ; les commandes finales restent réalisables sans leur consentement. |
| Les fins doivent être relisibles. | Sauvegarde de seuil séparée ; pas de nouvelle quête annulant l'épilogue. |

Ce document ajoute des règles de jeu à la bible ; il ne remplace pas les scènes. Si une mécanique contredit une condition narrative, la correction doit apparaître dans les deux documents avant intégration.

## 17. Cadre graphique et technique à conserver

Le format logique de 960 × 540 et le pipeline de réduction d'assets 1536 × 864 ont été évoqués dans les travaux précédents. Ils constituent une base de cadrage, à confronter aux fichiers et paramètres actuels du dépôt avant production. Les textes et menus doivent rester lisibles lors du changement de taille de fenêtre.

Les vingt-sept lieux de la bible ne sont pas vingt-sept autorisations de génération. Les images existantes, les variants par lumière, les éléments réutilisables et les animations simples doivent être inventoriés avant tout nouveau besoin.

Les garde-fous retrouvés pour le harnais précédent mentionnent un plafond de 100 images par session, 5 par appel, un budget de 10 dollars avec une marge de 20 %, un registre persistant et une inspection de l'inventaire. Leur configuration actuelle doit être lue dans le dépôt : ces souvenirs ne remplacent pas ses protections effectives. Le document de gameplay n'augmente aucun plafond et ne définit pas la façon de calculer cette marge.

Une clé présente dans l'environnement n'autorise pas le développeur à ignorer les protections propres au dépôt. Les règles détaillées de génération, de licence des assets et de publication seront fournies comme consignes de réalisation séparées.

Pour la première version complète, les besoins prioritaires sont un héros cohérent, une marche lisible, une frappe, une esquive, quelques effets de magie, les trois compagnons et les quatre profils d'adversaires. Le nombre exact de fichiers dépend des références et de la méthode d'animation. Il ne doit pas être déduit du nombre de scènes.

## 18. Points proposés pour notre discussion

Les quatre choix qui orientent le plus le jeu sont les suivants :

1. **Combat :** temps réel avec pause de réflexion libre, ou préférence pour un système entièrement au tour par tour. La proposition actuelle prend la première direction.
2. **Gestion :** projets locaux reliés aux quêtes, ou volonté d'ajouter une véritable économie de village. La proposition actuelle reste sur les projets.
3. **Compagnons :** un soutien visible et des interventions contextuelles, ou contrôle d'une équipe complète. La proposition actuelle privilégie Elyan et un soutien.
4. **Personnalisation :** cinq paliers et trois orientations ouvertes, ou classes d'armes beaucoup plus spécialisées. La proposition actuelle évite une classe irréversible.

Les détails numériques, raccourcis et quantités d'équipement peuvent évoluer après ces décisions. Les invariants narratifs — ordre des révélations, consentement des compagnons, coût de la fin A et portée de la fin B — restent ceux de la bible.

**Fin de la proposition de règles — version 0.1.**
