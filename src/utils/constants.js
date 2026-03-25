export const TIP_OPTIONS = {
  "NAC": "Načrt",
  "DOK": "Dokument",
  "FOT": "Fotografija",
  "SIT": "Situacija",
  "PRO": "Projekt",
  "DOP": "Dopis",
  "POR": "Poročilo",
  "PON": "Ponudba",
  "POG": "Pogodba",
  "NAR": "Naročilo",
  "RAC": "Račun",
  "KOI": "Kontrola",
  "TER": "Terminski plan",
  "SPE": "Specifikacija",
  "EVD": "Evidenca",
  "GAR": "Garancija",
  "WBS": "Work-Breakdown Structure",
  "ZAP": "Zapisnik"
};

export const FAZA_OPTIONS = {
  "PON": "Ponudba",
  "PRO": "Projektiranje",
  "DGD": "DGD",
  "PZI": "PZI",
  "PID": "PID",
  "IZV": "Izvedba",
  "ZAK": "Zaključek",
  "GAR": "Garancija",
  "SPL": "Splošno"
};

export const VLO_OPTIONS = {
  "NAR": "Naročnik",
  "IZV": "Izvajalec",
  "NAD": "Nadzornik",
  "PRO": "Projektant",
  "PDI": "Podizvajalec",
  "DOB": "Dobavitelj",
  "SKO": "Ostalo",
  "BAN": "Banka",
  "ZAV": "Zavarovalnica"
};

export const MAPNA_STRUKTURA = {
  "00_Navodila": [],
  "01_Pogodba_Admin": [
    "01_Ponudbe",
    "02_Pogodba",
    "03_Dodatki_Pogodbi",
    "04_Imenovanja",
    "05_Odlocbe",
    "06_Zavarovanja"
  ],
  "02_Projektna_dok": [
    "01_IDZ",
    "02_PGD",
    "03_PZI",
    "04_PID",
    "05_Soglasja"
  ],
  "03_Izvedbena_dok": [
    "01_Atesti",
    "02_Delavniski_Nacrti",
    "03_Izjave_Certifikati",
    "04_Tehnicna_Dok"
  ],
  "04_Planiranje": [
    "01_Terminski_Plan",
    "02_Fazni_Plan",
    "03_Sestanki"
  ],
  "05_Nabava": [
    "01_Narocila",
    "02_Podizvajalci",
    "03_Dobavnice",
    "04_Ponudbe_Dobav"
  ],
  "06_Financno": [
    "01_Situacije",
    "02_Dodatna_Dela",
    "03_Racuni",
    "04_Poravnave"
  ],
  "07_Gradnja": [
    "01_Gradbeni_Dnevnik",
    "02_Zapisniki",
    "03_Foto_Porocila",
    "04_Kontrole",
    "05_Meritve"
  ],
  "08_Korespondenca": [
    "01_Dopisi",
    "02_Odgovori",
    "03_Zahtevki",
    "04_Reklamacije"
  ],
  "09_Prevzem_garancije": [
    "01_PID_Izvedeno",
    "02_Tehnicni_Prevzem",
    "03_Uporabno_Dovoljenje",
    "04_Garancije",
    "05_Vzdrz_Navodila"
  ],
  "10_Interno": [
    "01_Interni_Zapiski",
    "02_Kolektor"
  ]
};

// Helper function to get all folder paths
export const getAllFolderPaths = () => {
  const paths = [];
  Object.entries(MAPNA_STRUKTURA).forEach(([main, subs]) => {
    paths.push(main);
    subs.forEach(sub => {
      paths.push(`${main}/${sub}`);
    });
  });
  return paths;
};