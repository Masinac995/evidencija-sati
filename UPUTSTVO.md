# Uputstvo za evidenciju radnih sati

## Gde se podaci čuvaju

Aplikacija koristi tri dela:

1. **GitHub Pages** prikazuje aplikaciju na telefonu i računaru.
2. **Supabase** je centralna baza. Kada radnik sa telefona sačuva unos, isti podatak odmah postoji u zajedničkoj bazi i administrator ga vidi na računaru.
3. **Disk F** čuva dodatnu rezervnu kopiju. Folder se jednom povezuje dugmetom u administraciji.

Brisanje keša ili istorije pregledača ne briše radne sate iz Supabase baze. Postojeća imena radnika i PIN kodovi ostaju isti.

## Dnevni unos radnika

1. Otvorite aplikaciju.
2. Izaberite ime radnika.
3. Unesite postojeći PIN od četiri cifre.
4. Izaberite datum i status.
5. Za status **Radio** izaberite dolazak i odlazak.
6. Pritisnite **Sačuvaj unos**.

Godišnji odmor se računa kao osam obračunskih sati. Radnik može da unese samo broj dana godišnjeg odmora koji mu je administrator odobrio. Kada ih iskoristi, može da izabere bolovanje ili slobodan dan.

## Kartica radnika

U delu **Moja kartica** radnik unosi ime i PIN. Prikazuju se:

- tekući mesec i dnevni unosi;
- prethodni završeni mesec;
- stariji meseci po godinama i mesecima;
- iskorišćeni i preostali godišnji odmor;
- bolovanje i slobodni dani.

Radnik vidi samo svoju karticu jer je pristup zaštićen njegovim PIN-om.

## Administracija

Administrator unosi postojeću administratorsku lozinku i pritiska **Osveži bazu**. Može da:

- pregleda svaki mesec;
- otvori satnicu pojedinačnog radnika klikom na ime;
- doda ili ukloni radnika;
- promeni cenu rada i broj dana godišnjeg odmora;
- obriše pogrešan dnevni unos;
- preuzme Excel, CSV ili JSON;
- sačuva kompletan mesečni ZIP paket;
- obriše izabrani završeni mesec nakon pravljenja kopije.

Promena satnice ili godišnjeg odmora ne menja postojeći PIN radnika.

## Automatska kopija na disk F

1. Na administratorskom računaru otvorite administraciju.
2. Pritisnite **Poveži folder F:\Aplikacija radnih sati**.
3. Izaberite baš taj folder i dozvolite upis.

Fajl se čuva ovde:

`F:\Aplikacija radnih sati\AUTOMATSKE-KOPIJE\NAJNOVIJA-KOMPLETNA-KOPIJA.json`

Kopija se osvežava:

- pri uspešnom ulasku u administraciju;
- posle administratorske izmene;
- najkasnije oko 15 sekundi nakon novog unosa radnika, dok je administratorska stranica otvorena.

Ako je računar ugašen ili je administratorska stranica zatvorena, radnikov unos se i dalje bezbedno čuva u Supabase bazi. Kopija na F se osvežava sledeći put kada administrator otvori aplikaciju. Pregledač ponekad posle ponovnog pokretanja traži da ponovo dozvolite pristup folderu.

## Mesečni paket

Dugme **Sačuvaj mesečnu evidenciju — Excel + kopija** pravi ZIP u folderu godine i meseca. Paket sadrži:

- **Excel (.xlsx)** — lepo formatiran mesečni sažetak i svi dnevni unosi;
- **CSV (.csv)** — jednostavna tabela za Excel ili drugi program;
- **JSON (.json)** — potpuna rezervna kopija centralne evidencije;
- kratko tekstualno uputstvo.

## Šta znače CSV i JSON

**CSV** je obična tabela. Namenjen je pregledanju i obradi podataka u Excelu.

**JSON** je rezervna kopija za tehničko vraćanje podataka. Nije namenjen ručnom čitanju niti svakodnevnom radu.

## Brisanje starog meseca

U delu **Završeni meseci** izaberite mesec i prvo pritisnite **Sačuvaj sve**. Tek kada proverite da je ZIP sačuvan na disku F, pritisnite **Obriši mesec**. Brisanje uklanja sve unose tog meseca iz centralne baze i ne može se poništiti bez rezervne kopije.
