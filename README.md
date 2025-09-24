# Premiers pas (Débutant)

1. Ouvre le dossier du projet dans Visual Studio Code.
2. Ouvre le fichier `index.html` dans ton navigateur.
3. Pour voir la carte hors ligne, clique sur “Extraire les données” (en ligne).
4. Utilise la barre du bas pour tester les modes “En ligne”, “Hors ligne simulé”, etc.
5. Consulte ce fichier README pour comprendre l’organisation du projet et les prochaines étapes.

Besoin d’aide ? Pose tes questions dans Copilot Chat ou ajoute-les ici pour t’en souvenir !

# Carte OSM - PWA

Application web affichant une carte OSM avec des couches ESRI, compatible PWA et mode hors-ligne.

## Structure du projet

- `index.html` : Page principale, inclut la carte et la barre d’état PWA
- `css/style.css` : Styles de la page
- `js/app.js` : Logique principale de la carte et des couches ESRI
- `js/esri2maplibre.js` : Conversion ESRI JSON → GeoJSON et symbologie MapLibre
- `js/esri_query.js` : Requêtes ESRI REST
- `js/pwa/service-worker.js` : Service worker pour le mode hors-ligne
- `js/pwa/pwa-connection-bar.js` : WebComponent pour la gestion de l’état de connexion et des boutons PWA
- `data/appConfig.json` : Configuration principale de l’application
- `data/pwa.Config.json` : Configuration spécifique PWA (libellés, limites, etc.)
- `icons/` : Icônes pour le manifest PWA

## Fonctionnalités

- Affichage d’une carte OSM avec couches ESRI dynamiques
- PWA installable (manifest, service worker, icônes)
- Gestion de l’état de connexion (en ligne, hors ligne, simulé)
- Extraction des tuiles OSM pour le mode hors-ligne (en cours)
- Interface réactive avec WebComponent

## TODO

- Implémenter le téléchargement et le cache réel des tuiles OSM
- Ajouter la gestion du cache pour les données ESRI
- Améliorer l’interface utilisateur (sélecteur de thème, légende, etc.)

## Lancement

Ouvrir `index.html` dans un navigateur compatible PWA (Chrome, Edge, etc.).

---

N’hésite pas à compléter ce fichier au fil de tes avancées !
