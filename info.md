# README – Interaktive 2D-/3D-Moschee mit Three.js

## Überblick

Diese Demo zeigt eine frei entworfene Moschee als interaktives 3D-Modell und schematischen 2D-Grundriss. Das Gebäude wurde vollständig programmatisch erzeugt, ohne externe 3D-Modelle, Texturen oder CAD-Software.

## Verwendete Technologien

- **Three.js (v0.170.0):** Erstellung und Darstellung der gesamten 3D-Geometrie.
- **OrbitControls (Three.js):** Interaktive Kamerasteuerung zum Drehen, Zoomen und Verschieben.
- **SVG:** Zeichnung des zweidimensionalen Grundrisses.
- **HTML/CSS:** Benutzeroberfläche, Layout und Schaltflächen.
- **JavaScript (ES Modules):** Erzeugung der Geometrie und Steuerung der verschiedenen Ansichten.

## Vorgehensweise

### 1. Gebäude konzipieren
Zunächst wurde eine vereinfachte Moschee mit typischen architektonischen Elementen entworfen:

- Rechteckiger Gebetssaal mit zentraler Kuppel
- Zwei Minarette mit umlaufenden Balkonen
- Säulen, Rundbögen, Fenster und Eingänge
- Innenhof mit Brunnen
- Mihrab als Orientierungselement im Grundriss

### 2. 3D-Geometrie erstellen
Alle Gebäudeteile wurden direkt mit den geometrischen Grundformen von Three.js konstruiert:

- `BoxGeometry` für Wände, Fundamente und Dächer
- `CylinderGeometry` für Säulen, Minarette und Kuppelunterbauten
- `SphereGeometry` für die halbkugelförmige Kuppel und dekorative Elemente
- `ConeGeometry` für die Turmspitzen

Die Objekte wurden durch Positionierung, Skalierung und Kombination zu einem zusammenhängenden Gebäude zusammengesetzt.

### 3. Materialien und Beleuchtung
Mit `MeshStandardMaterial` wurden Farben und Oberflächeneigenschaften definiert.

Für die Beleuchtung wurden `HemisphereLight` und `DirectionalLight` eingesetzt. Aktivierte Schatten sorgen für eine räumlichere Darstellung.

### 4. Interaktive Darstellung
Ein `WebGLRenderer` rendert die Szene im Browser. `PerspectiveCamera` und `OrbitControls` ermöglichen die freie Betrachtung.

Drei Ansichten wurden implementiert:

- **Außenansicht:** Vollständiges 3D-Gebäude
- **Innenansicht:** Dach und ausgewählte Wände werden ausgeblendet
- **Draufsicht:** Kamera oberhalb des Gebäudes

### 5. Zweidimensionaler Grundriss
Der Grundriss wurde separat mit SVG-Elementen (`rect`, `circle`, `path`, `text`) erstellt und beschriftet.

Er stellt dieselbe schematische Gebäudeanlage dar, wird aber noch nicht automatisch aus der 3D-Geometrie generiert.

## Technische Architektur

```text
HTML / CSS
    |
    +-- Benutzeroberfläche
    |
    +-- SVG-Grundriss (2D)
    |
    +-- Three.js (3D)
          |
          +-- Scene
          +-- Geometrien
          +-- Materialien
          +-- Licht und Schatten
          +-- PerspectiveCamera
          +-- OrbitControls
          +-- WebGLRenderer
```

## Mögliche Erweiterungen

- Gemeinsames Datenmodell für synchronisierte 2D-/3D-Ansichten
- Frei positionierbare horizontale und vertikale Gebäudeschnitte
- Parametrische Erstellung von Kuppeln, Gewölben und Bögen
- Anklickbare Bauteile mit erklärenden Informationen
- Export der Modelle als glTF/GLB
- Integration in interaktive LiaScript-Lernmaterialien

## Fazit

Die Demo zeigt, dass sich architektonische 3D-Visualisierungen allein mit Three.js und geometrischen Grundformen erstellen lassen. Für einfache bis mittelkomplexe Gebäude sind keine externen 3D-Modelle oder speziellen CAD-Bibliotheken erforderlich.

Für präzise Architekturmodelle und komplexe Schnitte kann die Lösung später um CAD- oder BIM-Komponenten erweitert werden.