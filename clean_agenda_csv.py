# pour lancer le script, python clean_agenda_csv.py

# FORCER ENCODAGE UTF-8
import codecs

# Convertit le fichier source en UTF-8 si besoin
# Remplace 'latin1' par 'cp1252' si besoin
with codecs.open("agenda-culturel.csv", "r", encoding="latin1") as source:
    with codecs.open("agenda_utf8.csv", "w", encoding="utf-8") as target:
        for line in source:
            target.write(line)

# Puis traite "agenda_utf8.csv" dans pandas
fichier_source = "agenda_utf8.csv"


# CLEAN FICHIER POUR NE GARDER QUE LES COLONNES UTILES POUR L'AGENDA DU SITE INTERNET
import pandas as pd

# Chemin du fichier source
fichier_source = "agenda_utf8.csv"
# Chemin du fichier nettoyé
fichier_sortie = "agenda_site.csv"

# Liste des colonnes à garder (adapte selon tes besoins)
colonnes_a_garder = [
    "id", "category", "sub_category", "titre", "date", "heure", "date_debut", "date_fin", "description_courte", "description_longue", "duree", "lieu", "lieu_detail", "prix", "reservation", "contact", "contact_tel", "contact_url", "information", "reservation_url", "image"
]

# Lecture du CSV en sautant la ligne 1 (entête) - Précision encodage et séparateur
df = pd.read_csv(fichier_source, sep=";", encoding="utf-8", dtype={"contact_tel": str})

# Garde uniquement les colonnes utiles (et crée une copie explicite)
df_clean = df[colonnes_a_garder].copy()

# Afficher les infos de dates
def build_date_affichage(row):
    # Si la colonne date est remplie, on l'utilise
    if isinstance(row['date'], str) and row['date'].strip():
        return row['date']
    # Si date_debut et date_fin sont remplies
    elif row['date_debut'] and row['date_fin']:
        return f'Du {row["date_debut"]} au {row["date_fin"]}'
    # Si seulement date_debut
    elif row['date_debut']:
        return f'Dès le {row["date_debut"]}'
    # Si seulement date_fin
    elif row['date_fin']:
        return f'Jusqu\'au {row["date_fin"]}'
    else:
        return ""
    
    
# Ajoute la colonne d'affichage
df_clean['date_affichage'] = df_clean.apply(build_date_affichage, axis=1)

# Liste des colonnes texte où tu veux remplacer les sauts de ligne
colonnes_multiligne = ["description_courte", "description_longue", "lieu_detail", "information"]

# Remplacer les sauts de ligne par <br> dans ces colonnes
for col in colonnes_multiligne:
    if col in df_clean.columns:
        df_clean[col] = df_clean[col].astype('object')
        df_clean.loc[:, col] = df_clean[col].astype(str).str.replace('\r\n', '<br>').str.replace('\n', '<br>')
        # Remplace la chaîne "nan" par vide
        df_clean.loc[:, col] = df_clean[col].replace("nan", "")

# Remplacer tous les NaN par une chaîne vide
df_clean = df_clean.fillna("")

# Sauvegarde dans un nouveau fichier
df_clean.to_csv(fichier_sortie, sep=";", index=False, encoding="utf-8")

print(f"Fichier nettoyé enregistré sous : {fichier_sortie}")