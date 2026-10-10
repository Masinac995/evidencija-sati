# Evidencija radnih sati — uputstvo

## Gde se čuvaju podaci

Aplikacija radi preko GitHub Pages bez plaćenog servera. Svi radnici, PIN-ovi i unosi čuvaju se lokalno u pregledaču na uređaju na kome koristite aplikaciju. Zato koristite jedan glavni računar i isti pregledač za administraciju.

GitHub Pages besplatno prikazuje aplikaciju, ali ne čuva evidenciju. Brisanje podataka pregledača, promena računara ili drugog pregledača uklanja lokalne podatke ako prethodno nije sačuvana JSON kopija.

## Prvo pokretanje

1. Otvorite aplikaciju i kliknite **Admin**.
2. Ako prelazite sa stare aplikacije, unesite postojeću admin lozinku stare baze. Ako nemate stare podatke, unesite novu lozinku od najmanje četiri znaka.
3. Pri prvom ulasku ta lozinka pravi lokalnu bazu. Aplikacija automatski pokušava da prebaci sve postojeće radnike i unose iz stare baze, uključujući prethodni mesec.
4. Zapamtite admin lozinku. Radnici nastavljaju da koriste iste četvorocifrene PIN kodove. Pri prvoj upotrebi svakog radnika postojeći PIN se proverava preko stare baze i bezbedno pamti u lokalnoj evidenciji.

Ako želite da ponovite prenos podataka iz stare centralne baze, u administraciji izaberite **Jednom uvezi staru centralnu bazu**. Postojeći PIN kodovi radnika ostaju isti.

## Svakodnevni unos

Radnik na strani **Unos** bira svoje ime, unosi PIN, datum, status i vreme dolaska/odlaska. Za isti datum i istog radnika novi unos ispravlja prethodni.

U **Moja kartica** radnik odmah vidi tekući mesec sa svim dnevnim unosima. Ispod toga stoji sažetak prethodnog završenog meseca: broj radnih dana, radni sati, godišnji odmor, bolovanje i slobodni dani.

## Mesečni presek

Admin bira mesec strelicama ili kalendarom. Svaki mesec ima zasebnu evidenciju i sažetak. Kada se aplikacija prvi put otvori u novom mesecu, svi raniji meseci automatski se pojavljuju u delu **Završeni meseci**.

Pregledač ne može sam da upiše fajl u proizvoljan folder dok je aplikacija zatvorena. Zato se arhiva pravi automatski unutar aplikacije. Dugme **Sačuvaj mesečnu evidenciju** jednim klikom preuzima ZIP paket sa Excelom, CSV tabelom i kompletnom JSON kopijom.

Prvi put kliknite **Poveži folder F:\Aplikacija radnih sati** i u prozoru izaberite taj folder na disku F. Posle toga dugme **Sačuvaj mesečnu evidenciju** direktno upisuje paket u `F:\Aplikacija radnih sati`, razvrstan po godini i mesecu. Pregledač može povremeno ponovo tražiti dozvolu za pristup folderu.

## Excel, CSV i JSON

- **Excel (.xlsx)** je konačna, pregledno formatirana mesečna tabela. Sadrži list „Mesečni sažetak” sa satima i obračunom svih radnika i list „Dnevni unosi” sa pojedinačnim evidencijama. Ovo je glavni fajl za čuvanje, štampu i knjigovođu.
- **CSV (.csv)** je jednostavna tabela bez boja, formula i više listova. Otvara se u Excelu i pogodna je za prenos podataka u drugi program.
- **JSON (.json)** je kompletna rezervna kopija baze, uključujući sve radnike, unose i mesečne arhive. Namenjen je vraćanju podataka preko dugmeta **Uvezi JSON kopiju**, a ne ručnom čitanju ili izmeni.

## Preporučeno čuvanje

Na kraju svakog meseca:

1. Izaberite završeni mesec.
2. Kliknite **Sačuvaj mesečnu evidenciju**.
3. Paket se automatski upisuje, na primer u `F:\Aplikacija radnih sati\2026\10 - oktobar\MASINAC-evidencija-2026-10.zip`.
4. Po želji kopirajte ZIP i na USB ili drugi disk.

JSON kopiju sačuvajte i posle većih izmena radnika ili ispravki evidencije.
