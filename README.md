# Damroki — analiza działek

Scenariusz zakupu: jeden dom wolnostojący i ogród na obu parcelach.

Publiczny raport dotyczący działek 768/136 i 768/137 w Chwaszczynie. Stan danych: 15 października 2026 r.

Strona: https://patrykmilewski.github.io/dzialki-damroki/

Statyczna strona HTML/CSS/JavaScript bez procesu budowania i bez bibliotek wykonywanych po stronie klienta. Publikacja przez GitHub Pages z głównego katalogu gałęzi `main`.

Uruchomienie lokalne: `python3 -m http.server 8765` w katalogu repozytorium.

Mapa korzysta z zapisanej geometrii ULDK GUGiK w `assets/parcels.json`. Nie jest mapą do celów projektowych. Oryginalny fragment rysunku MPZP pochodzi z urzędowej uchwały wskazanej w raporcie. Nie naniesiono na niego obecnych granic parceli.

Dane transakcyjne odczytano z Działkopedii. Prawdopodobne transakcje pakietowe oznaczono osobno. Wnioski, deklaracje sprzedającego i braki dokumentów opisano bez utożsamiania ich z urzędowym potwierdzeniem.

Lista kontrolna przechowuje wyłącznie identyfikatory zaznaczonych punktów w localStorage. Brak analityki, formularzy, kont i transmisji danych z listy. Fonty pobierane są z Google Fonts; pozostałe zasoby strony są lokalne.
