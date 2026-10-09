Tu es chargé de construire intégralement RPG Origins. Travaille dans le dépôt GitHub actuel de RPG Origins, sur une nouvelle branche indépendante, vide au départ. Je joins trois documents :

1. RPG_Origins_Bible_Narrative_v1.md
2. RPG_Origins_Regles_Gameplay_v0_1.md
3. RPG_Origins_Cahier_Technique_Production_v1.md

Lis-les entièrement avant la conception d'ensemble. Ce prompt autorise le développement et adopte les propositions de gameplay comme base de réalisation. Prends les décisions ordinaires nécessaires et avance jusqu'à un jeu complet. Documente les ajustements compatibles ; demande une clarification seulement si une information indispensable manque réellement. Ne t'arrête pas après un plan, une démo de forêt ou un premier chapitre.

## 1. Dépôt et branche vide : instruction prioritaire

Utilise le même dépôt distant que RPG Origins. Vérifie son identité et conserve son remote. Ne crée pas un nouveau dépôt.

Crée une branche orpheline nommée `claude/rpg-origins-complete`, sans parent et sans code de jeu hérité. Utilise de préférence un worktree distinct pour préserver l'espace et les modifications existants. Vérifie les possibilités de la version de Git avant la création. Une branche ordinaire créée depuis main ne satisfait pas la demande de départ vide.

Si cette branche contient déjà les fichiers de suivi de cette mission, reprends-la : ne la recrée pas, ne la vide pas et ne recommence pas. Si ce nom appartient à un travail différent, choisis un suffixe unique et enregistre le nom exact.

N'efface aucun travail existant. Ne modifie ni main, ni les autres branches, ni le site déjà publié. Aucun merge, rebase ou force-push des branches existantes. Je t'autorise à faire des commits et pushes ordinaires sur la seule branche de cette réalisation. Respecte le préfixe de branche autorisé par l'environnement si nécessaire, en conservant un nom identifiable.

Cette demande de branche vide prime sur la recommandation du cahier technique de faire évoluer l'ancien prototype. Lis l'ancien dépôt en référence, mais reconstruis le code du jeu sur cette branche.

Après création, importe uniquement les trois documents dans `docs/`, les références artistiques du style n°9, les assets déjà pertinents avec leur provenance, ainsi que le harnais de production et son historique financier. Pas de copie globale de l'ancien jeu. Le harnais, les données de dépense et les références sont les exceptions nécessaires au départ vide. Ne copie aucun secret. Note les commits sources des éléments importés.

Si une pièce jointe n'est pas accessible, indique son nom exact et le blocage ; ne reconstitue pas son contenu de mémoire. Une fois les documents intégrés au dépôt, une reprise ne doit plus dépendre de leurs pièces jointes originales.

## 2. Résultat attendu

Construis le jeu PC navigateur décrit dans les documents : Phaser / TypeScript / Vite, scènes fixes 16:9, déplacements libres, transitions, interactions, profondeur, dialogues, exploration, énigmes, infiltration, combat avec pause de réflexion, pouvoirs, compagnons, inventaire, équipement, progression, projets locaux, journal, carte et sauvegardes.

Réalise le prologue, les dix chapitres, les 61 scènes principales/finales, les douze quêtes secondaires et les deux épilogues. Une partie suit naturellement une seule route finale ; les deux routes doivent être présentes et vérifiées.

Conserve les identifiants, l'ordre des révélations et les conséquences. La fin A implique la disparition réelle d'Elyan. La fin B implique la trahison et l'asservissement. N'ajoute aucune troisième fin qui annule ce dilemme.

La narration doit être jouée par déplacements, rencontres, interactions et événements. Ne remplace pas l'aventure par un menu de chapitres ou une succession de résumés. Un même décor peut servir plusieurs scènes.

Adapte les dépendances après vérification de compatibilité ; utilise l'information de version du dépôt comme référence, sans importer son ancien moteur. Conserve les contenus et règles dans des données éditables. Prévois le mini-éditeur de zones décrit dans le cahier.

## 3. Assets et budget impératif

Observe réellement les références du style n°9, dont le personnage et le décor. Le rendu doit rester peint, non pixel art, cohérent en perspective, proportions, échelle, texture et lumière.

Les assets externes gratuits sont autorisés après vérification de leur source, licence, possibilité d'intégration au jeu et cohérence visuelle. Compare-les aux références et dans une capture du jeu à leur taille réelle. Inscris leur provenance et les adaptations dans le manifeste ; prépare les crédits. Privilégie des créations originales pour les personnages et éléments identitaires.

Avant une génération : inventaire, réemploi, adaptation locale, recherche externe compatible, puis GPT Image si le besoin demeure. Utilise uniquement le harnais ; complète ses protections au besoin. Pas d'appel direct contournant ses règles.

Plafond GPT Image : 15 € pour ce jeu, toutes sessions et branches confondues, avec 12 € de production planifiée et 3 € de protection compris dans ce total. Consolide les dépenses déjà affectées au jeu ; le départ sur une branche vide n'efface aucun coût. Applique les conversions, frais, coûts de références et réservations du cahier.

Avant tout appel payant, réserve durablement sa borne de coût. Un résultat par appel en règle générale ; une demande initiale et au plus une correction payante motivée par besoin logique. Pas de relance automatique. Une requête envoyée dont l'issue est inconnue conserve sa réservation et n'est pas rejouée après reprise.

Continue par code, réemploi et assets compatibles lorsque les générations ne sont pas autorisées ou que le budget ne suffit plus. Ne dégrade pas arbitrairement le style et ne prétends pas avoir fini un asset manquant. Aucune clé dans le dépôt, le build ou le navigateur ; aucune génération pendant le jeu ni dans les tests. N'active aucun achat tiers ou crédit Claude payant supplémentaire.

## 4. Mémoire persistante à créer dès le premier lot

Crée un `CLAUDE.md` concis à la racine qui impose, à chaque démarrage ou reprise, la lecture de `production/RESUME.md`, de l'état courant et du registre d'images avant toute mutation. Il rappelle la branche autorisée, les trois sources, le plafond financier et la définition de terminé.

Crée les fichiers suivants, ou leurs équivalents déjà fiables en conservant un point d'entrée unique :

- `production/STATE.json` : dépôt et branche exacts, référence source, phase, tâche courante, état de vérification, bloqueurs et prochaine action.
- `production/RESUME.md` : point de reprise court et autonome, fichiers concernés, commandes nécessaires, derniers contrôles et trois prochaines actions concrètes.
- `production/TASKS.md` : lots et tâches avec états à faire / en cours / vérifié / bloqué.
- `production/COVERAGE.csv` : chaque scène et quête, ses données, assets, implémentation et vérification réelle.
- `production/DECISIONS.md` : choix techniques et ajustements avec raisons.
- `production/TESTS.md` : commandes et résultats réellement obtenus, avec dates et version testée.
- `production/ASSETS.json` : inventaire, provenance, licences, usages et acceptation visuelle.
- `production/IMAGE_BUDGET.json` et `production/IMAGE_REQUESTS.jsonl` : plafond, coûts, réservations, appels, tentatives et états incertains, selon le harnais.

Le suivi reflète le code réel. Une tâche n'est « vérifiée » qu'après contrôle. Les empreintes de commit proviennent de Git ; ne les invente pas. Lorsqu'un fichier de suivi renvoie vers un autre registre, conserve une source financière unique, pas deux totaux divergents.

Fais immédiatement un premier commit de préparation et pousse-le sur la branche dédiée. La documentation et l'état doivent être récupérables depuis le dépôt si l'environnement cloud disparaît.

## 5. Protection contre les interruptions et limites Claude

Le projet doit rester reprenable après limite d'utilisation, changement de conversation, compactage, erreur réseau ou fermeture de l'environnement. Ne suppose pas qu'une coupure donnera le temps d'un dernier message.

Travaille par tâches courtes. Actualise le suivi après chaque étape significative, à chaque résultat de contrôle et avant une opération externe. Cible des points de reprise espacés d'environ 5 à 10 minutes de travail actif ; évite les blocs monolithiques qui n'écrivent rien pendant longtemps.

Après chaque unité cohérente, fais un commit et un push sur la branche dédiée. Si une tâche est encore partielle, sauvegarde honnêtement un checkpoint WIP, avec les erreurs et étapes restantes, sans le qualifier de validé. Ne commite aucun secret ni fichier étranger à la mission.

Pour une génération payante, l'ordre est strict : intention et réservation écrites, checkpoint financier poussé, requête envoyée, réponse et fichiers conservés, registre rapproché, nouveau checkpoint poussé. Si la sauvegarde distante préalable échoue, ne fais pas cet appel. Les résultats utiles doivent également être sauvegardés durablement, avec un mécanisme compatible avec les fichiers du projet.

Une seule file payante travaille sur ce jeu. Si plusieurs clones existent, n'effectue pas de générations concurrentes avec des registres copiés. Une réservation restée ouverte interdit de considérer cet argent disponible après redémarrage.

Si une limite Claude approche ou est atteinte et que tu peux encore agir : termine seulement le petit checkpoint en cours, mets à jour la reprise et les réservations, sauvegarde et annonce précisément la branche, la dernière étape conservée et la prochaine action. Ne commence pas un nouveau lot ou une génération payante. N'invente pas d'heure de réinitialisation ; note celle indiquée par la plateforme si elle est disponible.

Ne tente pas de contourner une limite par un autre compte ou un paiement supplémentaire. Ne maintiens pas une boucle de relance pendant des heures. Si la session s'arrête, le prochain lancement doit reprendre le travail depuis le dépôt. Ne promets pas un redémarrage automatique que l'environnement ne fournit pas.

Une coupure brutale peut empêcher l'enregistrement du dernier geste ; les checkpoints fréquents doivent en limiter la perte. Si un push a échoué, indique clairement ce qui n'est conservé que localement. Ne prétends pas que toute la session est sauvegardée à distance.

## 6. Protocole obligatoire de reprise

Lorsqu'on te dit « Reprends », ou lorsque tu détectes cette mission déjà commencée :

1. Vérifie le remote, la branche et les modifications locales. Retrouve la branche enregistrée ; ne crée pas une nouvelle branche vide.
2. Lis `CLAUDE.md`, `production/RESUME.md`, `STATE.json`, les tâches et le budget. Relis les seules sections des documents nécessaires à la tâche courante, sans oublier les invariants.
3. Confronte le dernier checkpoint à Git, aux fichiers présents, aux résultats de test et au remote. Les écritures partielles peuvent être plus récentes que le résumé.
4. Préserve les modifications utiles ; ne lance pas de reset, nettoyage général ou réinstallation destructive pour repartir proprement.
5. Rapproche les appels payants en cours ou inconnus. Ne régénère pas un asset déjà produit ou potentiellement payé parce qu'un fichier manque.
6. Relance les contrôles pertinents pour l'étape interrompue, termine-la, actualise l'état puis poursuis la prochaine tâche.
7. Continue jusqu'à la définition de terminé. Un redémarrage ne réinitialise ni budget, ni liste de tâches, ni critères de qualité.

Si l'environnement possède un mécanisme réel de continuation, utilise-le. Sinon, reste prêt à reprendre lorsque je relancerai avec : « Reprends RPG Origins sur la branche enregistrée. Lis production/RESUME.md, vérifie l'état et poursuis sans recommencer. »

## 7. Ordre de construction et qualité

Suis les lots du cahier : inspection et imports ciblés ; moteur neuf et scène témoin ; systèmes communs ; prologue et chapitres 1 à 3 ; chapitres 4 à 7 ; chapitres 8 à 10 et routes finales ; contenu secondaire, audio et finition ; livraison.

La scène témoin doit vérifier tôt personnage, décor, collision, profondeur et mouvement avant de multiplier les images. Les éléments provisoires sont identifiés dans le manifeste et remplacés ou acceptés explicitement avant la livraison.

Contrôle TypeScript, build, données, transitions, dialogues, récompenses uniques, combats, pouvoirs, sauvegardes, export/import et reprise après interruption. Le contrôle financier utilise des simulations, jamais de vrais appels payants de test.

Vérifie l'histoire entière et les deux routes avec leurs conditions réelles, les douze quêtes, le refus d'Ilyra, les quêtes laissées ouvertes et les variantes de clémence B. Inspecte réellement les captures des lieux majeurs et des interfaces. Ne présente pas un test simulé comme un parcours manuel du jeu.

## 8. Livraison et fin de mission

Livre le code, les données, les assets acceptés, les licences et crédits, le build statique, les instructions de lancement, la configuration de déploiement GitHub Pages, la couverture, les contrôles et le bilan de dépenses et réservations.

Ne remplace pas le site actuel du dépôt. Prépare une version déployable et une démonstration dans l'environnement disponible ; une publication qui remplacerait l'existant attend une destination explicitement autorisée. N'effectue aucun merge vers main.

Déclare « terminé » uniquement lorsque l'aventure complète fonctionne, se sauvegarde et permet d'atteindre les deux épilogues selon le choix. Signale les blocages réels et garde une prochaine action précise si un obstacle ou quota impose un arrêt. Ne livre pas un prototype en l'appelant jeu complet.

Commence maintenant par lire les trois documents et inspecter le dépôt. Prépare la branche orpheline, la mémoire persistante et le premier checkpoint distant, puis construis le jeu de manière autonome jusqu'à sa livraison complète.
