# Eco Defender - Game Design Document

## 1. Kurzbeschreibung

Eco Defender ist ein modernes 2D-Browsergame im Stil eines Fixed-Shooter-Arcade-Spiels. Der Spieler steuert ein modulares Umweltschutz-Fahrzeug am unteren Bildschirmrand und bekämpft industrielle Umweltbedrohungen in unterschiedlichen Biomen: Kueste, Innenstadt, Wald, Wiesen, Fluesse, Gebirge, Arktis und Ozean.

Die technische Grundlogik ist bewusst klar und arcade-tauglich: Der Spieler bewegt sich hauptsaechlich horizontal, schiesst nach oben, weicht Projektilen aus und zerstoert Gegnerformationen. Die moderne Erweiterung liegt in der Umweltmechanik: Jedes Level hat eine Umweltanzeige, die wie ein sichtbarer Timer funktioniert. Wenn der Spieler zu langsam oder zu unpraezise handelt, verschmutzt, verbrennt, vergiftet oder kollabiert das Level.

Das Spiel soll nicht wie eine Kopie klassischer Weltraum-Shooter wirken, sondern wie ein eigenstaendiges, publishbares Browsergame mit Umweltschutz-Thema, Skill-System, Levelprogression, Bossen und moderner UI.

## 2. Zielplattform

- Browsergame fuer Desktop
- Spielbar mit Tastatur und Maus
- Primaere Technik: HTML5 Canvas mit Phaser
- Zielbild: schneller Start, kurze Level, klare Lesbarkeit, gute Performance
- Optional spaeter: mobil angepasste Touch-Steuerung, aber nicht Kernziel der ersten Veroeffentlichung

## 3. Zielgruppe

Das Spiel richtet sich an Spieler, die kurze Arcade-Runden, klare Progression und ein modernes Thema moegen. Die Umweltbotschaft soll sichtbar sein, aber nicht belehrend wirken. Der Spielspass entsteht aus Ausweichen, Priorisieren, Upgrades und dem Druck, die Umweltanzeige unter Kontrolle zu halten.

## 4. Designsaeulen

1. Sofort verstaendliche Arcade-Mechanik  
   Spieler unten, Gegner oben, klare Projektile, kurze Reaktionszeiten.

2. Umwelt statt abstrakter Timer  
   Zeitdruck entsteht durch sichtbare Umweltzerstoerung: Oel, Smog, Feuer, Gift, Muell, Wasserverlust oder Eisbruch.

3. Jede Bedrohung muss visuell eindeutig sein  
   Gegner sind nicht nur Ziele, sondern erkennbare Umweltsuender: Tanker verlieren Oel, Sprayer verspruehen Pestizide, Abholzungsroboter faellen Baeume, Smog-Tuerme verdunkeln die Stadt.

4. Skills schaffen echte Entscheidungen  
   Der Spieler waehlt zwischen Schaden, Reinigung, Schutz und Kontrolle.

5. Szenarien fuehlen sich unterschiedlich an  
   Die Grundsteuerung bleibt gleich, aber jedes Biom hat eigene Gefahren, Verlustbedingungen und Gegnerrollen.

## 5. Kernspiel

Der Spieler bewegt sich im unteren Bereich des Bildschirms. Gegner erscheinen oben oder seitlich, bewegen sich in Formationen oder Angriffsmustern und verursachen direkten Schaden oder Umweltschaden. Der Spieler gewinnt ein Level, wenn alle Hauptbedrohungen neutralisiert und die Umweltanzeige nicht vollstaendig gekippt ist.

Der Spieler verliert, wenn:
- die eigene Energie auf 0 faellt
- die jeweilige Umweltanzeige 100 Prozent Kollaps erreicht
- ein Schutzobjekt zerstoert wird, falls das Level ein Pflichtschutzobjekt besitzt

## 6. Steuerung

Tastatur:
- A / D oder Pfeiltasten: Bewegung links/rechts
- Leertaste: Primaerwaffe
- Shift: kurzer Boost oder Ausweichmanoeuvre
- Q / E / R: ausgeruestete aktive Skills
- Esc: Pause

Maus:
- Linksklick: Primaerwaffe
- Rechtsklick: aktiver Hauptskill
- Maus im Menue: Upgrades, Levelwahl, Ausruestung

Die Tastatursteuerung muss vollstaendig funktionieren. Maussteuerung ist eine Komfortoption.

## 7. Umweltanzeigen

Jedes Level nutzt eine eigene thematische Umweltanzeige. Mechanisch funktionieren sie aehnlich, visuell und inhaltlich unterscheiden sie sich.

- Kueste / Ozean: Meeresverschmutzung
- Innenstadt: Luftqualitaet
- Wiesen: Biodiversitaet
- Wald: Waldgesundheit
- Fluss / Feuchtgebiet: Wasserqualitaet
- Gebirge / Gletscher: Eis- und Hangstabilitaet
- Wuesten-/Solarzone: Wasserreserve
- Korallenriff: Riffgesundheit

Die Anzeige ersetzt den klassischen Timer. Sie steigt oder faellt durch Gegneraktionen, Verschmutzungsquellen und Spieler-Skills.

Beispiel Oeltanker:
- Solange der Tanker lebt, verliert er Oel.
- Oel breitet sich sichtbar auf dem Wasser aus.
- Drohnen lenken den Spieler ab.
- Bei 100 Prozent Meeresverschmutzung ist das Level verloren.
- Reinigungsskills koennen Oel reduzieren, loesen aber nicht das Hauptproblem.

## 8. Spielerprogression

Der Spieler startet mit einem Basisfahrzeug und einer einfachen Waffe. Ueber Levelbelohnungen erhaelt er Eco-Credits, Module und neue Skills.

Progression besteht aus:
- neuen aktiven Skills
- passiven Modulen
- Waffen-Upgrades
- Schild- und Bewegungsverbesserungen
- Reinigungseffizienz
- hoehere Score-Multiplikatoren fuer gute Umweltwerte

Zwischen Leveln gibt es ein Upgrade-Menue. Der Spieler kann nicht alles gleichzeitig ausruesten, damit Entscheidungen relevant bleiben.

## 9. Skill-System

Der Spieler hat:
- 1 Primaerwaffe
- bis zu 3 aktive Skills
- bis zu 3 passive Module

Aktive Skills:
- EMP-Welle: deaktiviert Drohnen kurzzeitig
- Reinigungspuls: reduziert lokale Verschmutzung
- Wasserloeschstrahl: loescht Feuer und verursacht leichten Schaden
- Solarstrahl: hoher gerader Schaden mit Cooldown
- Windbarriere: schiebt feindliche Projektile zurueck
- Recycling-Magnet: zieht Ressourcen und Muellfragmente an
- Schildkuppel: blockt Treffer fuer kurze Zeit
- Bio-Impuls: heilt Schutzobjekte leicht

Passive Module:
- Effizienter Akku: kuerzere Cooldowns
- Filterkern: Umweltanzeige steigt langsamer
- Bewegliche Duese: bessere Ausweichbewegung
- Doppelkanone: zwei Primaerschuesse
- Eco-Sammler: mehr Credits bei sauberem Abschluss
- Notfallreparatur: einmalige Rettung bei kritischer Energie

## 10. Gegnerrollen

Jeder Gegner braucht eine klare Silhouette und ein klares Umweltverhalten.

Basisgegner:
- Scout-Drohne: schnell, schwach, Formationseinheit
- Schuss-Drohne: feuert einfache Projektile
- Schild-Drohne: schuetzt andere Gegner
- Gift-Drohne: erzeugt Schadstoffzonen
- Muell-Drohne: laesst Barrieren fallen

Szenariogegner:
- Oeltanker: verliert Oel, mehrere Schwachpunkte
- Smog-Turm: verschlechtert Sicht und Luftqualitaet
- Pestizid-Sprayer: vergiftet Wiesenbereiche
- Abholzungsroboter: bewegt sich langsam nach unten und zerstoert Baeume
- Branddrohne: setzt Feuerpunkte
- Chemie-Rohr: spuckt Gift in Fluesse
- Bergbau-Bohrer: erzeugt Risse und Steinschlag
- Wasserraub-Pumpe: senkt Wasserreserve
- Schleppnetz-Drohne: zerstoert Korallenabschnitte
- Satellitenkontroller: markiert Ziele und ruft Wellen nach

## 11. Levelstruktur

Das Spiel soll zur Veroeffentlichung mindestens 10 Level haben. Empfohlen sind 12 Level, damit jedes Szenario Luft bekommt und Bosslevel sauber verteilt werden koennen.

### Level 1: Kuestenalarm

Szenario: helle Kueste mit ersten Oelspuren und Drohnen.  
Umweltanzeige: Meeresverschmutzung.  
Bedrohung: Scout-Drohnen und kleine Leck-Boote.  
Ziel: Gegnerwellen stoppen und Oelspuren reinigen.  
Besonderheit: Tutorial fuer Bewegung, Schuss und Umweltanzeige.

### Level 2: Plastikflut

Szenario: Kueste mit Muellfeldern.  
Umweltanzeige: Meeresverschmutzung.  
Bedrohung: Muell-Drohnen, schwimmende Barrieren, kleine Frachter.  
Ziel: Muellquellen zerstoeren, bevor der untere Spielbereich blockiert wird.  
Besonderheit: Muell kann Schuesse blockieren und Bewegungsraum verkleinern.

### Level 3: Smog ueber der Innenstadt

Szenario: Strassenschluchten und Daecher einer Grossstadt.  
Umweltanzeige: Luftqualitaet.  
Bedrohung: Smog-Tuerme, Abgas-Drohnen, Schild-Drohnen.  
Ziel: Luftreiniger schuetzen und Smogquellen ausschalten.  
Besonderheit: Je schlechter die Luft, desto schlechter sichtbar werden Projektile.

### Level 4: Betonwelle

Szenario: Innenstadt am Rand eines Parks.  
Umweltanzeige: Stadtgruen.  
Bedrohung: Versiegelungsmaschinen und Beton-Drohnen.  
Ziel: Gruenzonen erhalten, Maschinen stoppen.  
Besonderheit: Gegner versuchen, sichere Zonen in blockierende Betonflaechen zu verwandeln.

### Level 5: Wiesensterben

Szenario: gruene Wiesen und Felder.  
Umweltanzeige: Biodiversitaet.  
Bedrohung: Pestizid-Sprayer, Monokultur-Maschinen, Giftwolken.  
Ziel: Blueten- und Bienenbereiche schuetzen.  
Besonderheit: Giftwolken bleiben liegen und muessen aktiv gereinigt werden.

### Level 6: Waldbrandlinie

Szenario: Waldgebiet mit Lichtungen.  
Umweltanzeige: Waldgesundheit.  
Bedrohung: Branddrohnen, Abholzungsroboter, Holztransporter.  
Ziel: Feuer loeschen und Abholzungsmaschinen stoppen.  
Besonderheit: Feuer breitet sich von Kachel zu Kachel aus, wenn es nicht geloescht wird.

### Level 7: Flussgift

Szenario: Flusslauf und Feuchtgebiet.  
Umweltanzeige: Wasserqualitaet.  
Bedrohung: Chemie-Rohre, Gift-Drohnen, Muellbarrieren.  
Ziel: Giftquellen schliessen, bevor die Stroemung Gift nach unten traegt.  
Besonderheit: Verschmutzung bewegt sich mit der Stroemung und veraendert Positionen.

### Level 8: Gletscherbruch

Szenario: Gebirge und Gletscher.  
Umweltanzeige: Eisstabilitaet.  
Bedrohung: Heizbohrer, Sprengdrohnen, Bergbau-Maschinen.  
Ziel: Bohrer stoppen und Risse stabilisieren.  
Besonderheit: Risse begrenzen Bewegungszonen und erzeugen Warnlinien.

### Level 9: Korallenriff

Szenario: farbiges Riff unter Wasser.  
Umweltanzeige: Riffgesundheit.  
Bedrohung: Schleppnetz-Drohnen, Mikroplastik-Schwaerme, Saeurefaesser.  
Ziel: Riffsegmente schuetzen und Schleppnetze zerstoeren.  
Besonderheit: Schutzobjekte sind zentral; perfekter Sieg erfordert erhaltene Riffsegmente.

### Level 10: Mega-Tanker

Szenario: offener Ozean, Sturm, riesiger automatisierter Oeltanker.  
Umweltanzeige: Meeresverschmutzung.  
Bedrohung: Boss mit mehreren Lecks, Begleitdrohnen, Oelprojektilen.  
Ziel: Tanker stoppen, bevor das Meer kippt.  
Besonderheit: Mehrphasiger Bosskampf mit sichtbaren Leck-Schwachpunkten.

### Level 11: Arktische Bohrplattform

Szenario: Arktis, Eisflaechen, Bohrplattform.  
Umweltanzeige: Eis- und Habitatstabilitaet.  
Bedrohung: Bohrplattform, Schockwellen, Eisbrecher-Drohnen.  
Ziel: Plattform deaktivieren und Eisobjekte schuetzen.  
Besonderheit: Boss-nahe Arena mit zerbrechlichen Schutzobjekten.

### Level 12: Konzernkern

Szenario: automatisierte Steuerzentrale eines fiktiven Umweltzerstoerungsnetzwerks.  
Umweltanzeige: globale Stabilitaet.  
Bedrohung: Satellitenkontroller, Drohnenwellen aus allen vorherigen Szenarien, finales Kernsystem.  
Ziel: Kernsystem ueber mehrere Phasen abschalten.  
Besonderheit: Finale kombiniert Oel, Smog, Gift, Feuer und Schildmechaniken.

## 12. Bossdesign

Bosskaempfe sollen die Umweltmechanik besonders deutlich machen. Jeder Boss hat mindestens drei Phasen:

1. Einfuehrung der Hauptbedrohung
2. Eskalation mit staerkerer Umweltbelastung
3. Kritische Phase mit hohem Risiko und klaren Schwachpunkten

Boss 1: Mega-Tanker  
- verliert Oel in Intervallen
- hat linkes, mittleres und rechtes Leck
- Begleitdrohnen schuetzen Schwachpunkte
- bei niedrigem Leben breitet sich Oel schneller aus

Boss 2: Arktische Bohrplattform  
- erzeugt Schockwellen
- bricht Eisflaechen
- ruft Eisbrecher-Drohnen
- finale Phase mit zentralem Bohrkern

Finalboss: Konzernkern  
- simuliert Angriffe aus allen Biomen
- wechselt Umweltbedrohung pro Phase
- zwingt Spieler, Skills flexibel einzusetzen

## 13. Bewertung und Belohnung

Jedes Level endet mit einer Bewertung:

- S: sehr sauber, schnell, wenig Schaden
- A: gut, geringe Umweltbelastung
- B: bestanden mit mittlerem Schaden
- C: knapp bestanden
- Fail: Spieler zerstoert, Umweltkollaps oder Pflichtziel verloren

Bewertungsfaktoren:
- verbleibende Spielerenergie
- Umweltzustand am Ende
- gerettete Schutzobjekte
- Kombo und Trefferquote
- genutzte Reinigung
- Levelzeit nur intern, nicht als Hauptanzeige

Belohnungen:
- Eco-Credits
- Skillpunkte
- Modulfreischaltungen
- kosmetische Varianten
- Bonus fuer S-Rank

## 14. UI und Art Direction

Das Spiel bekommt eine moderne, klare Umwelt-Einsatz-UI.

HUD:
- oben links: Levelziel
- oben mittig: Umweltanzeige
- oben rechts: Score und Kombo
- unten links: Spielerenergie
- unten mittig: Skills mit Cooldowns
- unten rechts: Eco-Credits oder Ressourcen

Visuelle Sprache:
- Spieler: sauber, hell, gruen-weiss, cyanfarbene Energie
- Gegner: kantig, industriell, Warnfarben, dunkle Metalle
- Umweltgefahr: stark lesbar und thematisch eindeutig
- UI: technisch, aber nicht militaerisch

Wichtig: Bedrohungen muessen auch ohne Text verstanden werden. Ein Oeltanker muss Oel verlieren. Ein Smogturm muss Rauch ausstossen. Eine Pestiziddrohne muss Giftwolken spruehen.

## 15. Tonalitaet

Die Sprache soll kurz, aktiv und motivierend sein. Keine langen Belehrungen, keine reale Parteipolitik, keine echten Firmen. Das Spiel nutzt fiktive Konzerne und Maschinen.

Beispieltexte:
- "Oelleck entdeckt"
- "Luftqualitaet kritisch"
- "Riffsegment gerettet"
- "Brandlinie gestoppt"
- "Umweltkollaps verhindert"

## 16. Technische Architektur

Empfohlene Szenen:
- BootScene: Setup, Asset-Laden
- MainMenuScene: Startmenue
- LevelSelectScene: Levelauswahl und Fortschritt
- LoadoutScene: Skill- und Modulwahl
- GameScene: Hauptspiel
- UIScene: HUD
- UpgradeScene: Belohnungen und Upgrades
- ResultsScene: Bewertung nach Levelende
- PauseScene: Pausemenue

Datengetriebene Konfiguration:
- Leveldefinitionen als JSON oder TypeScript-Objekte
- Gegnerwerte zentral konfigurierbar
- Skillwerte zentral konfigurierbar
- Umweltmechaniken pro Level als Parameter

Zentrale Systeme:
- PlayerSystem
- EnemySystem
- ProjectileSystem
- PollutionSystem
- ObjectiveSystem
- SkillSystem
- UpgradeSystem
- ScoringSystem
- SaveSystem

## 17. Speicherstand

Der Fortschritt wird lokal im Browser gespeichert.

Gespeichert werden:
- freigeschaltete Level
- beste Bewertung pro Level
- Eco-Credits
- freigeschaltete Skills
- freigeschaltete Module
- Settings wie Lautstaerke und Steuerungsoptionen

## 18. Audio

Audio ist wichtig fuer die Veroeffentlichungsqualitaet.

Soundeffekte:
- Schuss
- Treffer
- Schild
- Reinigung
- Oelleck
- Feuer
- Gift
- Warnalarm
- Bossphasenwechsel
- Levelabschluss

Musik:
- pro Biom leicht andere Stimmung
- Bossmusik intensiver
- Menue ruhig und technisch

## 19. Produktionsumfang fuer Veroeffentlichung

Mindestumfang:
- 12 Level
- 3 Bosskaempfe
- 12 bis 16 Gegnertypen
- 8 aktive Skills
- 6 passive Module
- Levelauswahl
- Upgrade- und Loadout-System
- lokaler Speicherstand
- Soundeffekte und Musik
- Tastatur- und Maussteuerung
- Ergebnisbildschirm mit Bewertung
- Pausenmenue

Nicht im ersten Release:
- Online-Multiplayer
- Account-System
- Echtgeld-Shop
- mobile Touch-Optimierung
- User Generated Content

## 20. Offene Entscheidungen

Diese Punkte koennen vor oder waehrend der Umsetzung finalisiert werden:

- finaler Spielname
- genaue visuelle Stilrichtung der Sprites
- ob die Progression linear oder ueber Weltkarte erfolgt
- ob Skills permanent gekauft oder pro Level ausgewaehlt werden
- ob es kosmetische Fahrzeugvarianten gibt
- ob Musik extern bezogen oder spaeter generiert/komponiert wird

## 21. Empfehlung

Die erste Entwicklungsphase sollte nicht als kleiner MVP, sondern als vertikaler Grundbau fuer das vollstaendige Spiel starten:

1. Phaser-Projekt erstellen
2. Core-Gameplay mit Spieler, Gegnern, Projektilen und Umweltanzeige bauen
3. Ein vollwertiges Level ausarbeiten: Kuestenalarm
4. Danach die Systeme so erweitern, dass die restlichen Level datengetrieben entstehen koennen
5. Bosslogik fuer Mega-Tanker entwickeln
6. Menues, Upgrades, Speicherstand und Polish ergaenzen

So entsteht frueh ein spielbarer Kern, ohne den Veroeffentlichungsanspruch aus den Augen zu verlieren.
