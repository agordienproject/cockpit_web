import csv
import random
import os
from datetime import datetime, timedelta

# Configuration
NUM_ROWS = 1000
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'FCT_VERIF_SYSTEM.csv')

# Distribution des statuts
STATUS_DISTRIBUTION = ['OK'] * 95 + ['WARN'] * 4 + ['ERROR'] * 1

# Date de fin = aujourd'hui, date de début = il y a 1000 jours
end_date = datetime.now()
start_date = end_date - timedelta(days=NUM_ROWS - 1)

# En-têtes du CSV
headers = [
    'id_verif',
    'id_worker',
    'id_sys',
    'id_machine',
    'status',
    'details',
    'deleted',
    'creation_date',
    'user_creation',
    'modification_date',
    'user_modification'
]

# Génération des données
rows = []
for i in range(1, NUM_ROWS + 1):
    # Choisir un statut aléatoire selon la distribution
    status = random.choice(STATUS_DISTRIBUTION)
    
    # Calculer la date (incrémente de 1 jour à chaque ligne)
    current_date = start_date + timedelta(days=i-1)
    date_str = current_date.strftime('%Y-%m-%d %H:%M:%S')
    
    row = {
        'id_verif': i,
        'id_worker': 1,
        'id_sys': 1,
        'id_machine': 1,
        'status': status,
        'details': f'Statut : {status}',
        'deleted': 'FALSE',
        'creation_date': date_str,
        'user_creation': 2,
        'modification_date': date_str,
        'user_modification': 2
    }
    rows.append(row)

# Écrire le fichier CSV avec séparateur point-virgule
with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers, delimiter=';')
    writer.writeheader()
    writer.writerows(rows)

print(f'✓ Fichier {OUTPUT_FILE} créé avec succès!')
print(f'  - {NUM_ROWS} lignes générées')
print(f'  - Distribution: ~{rows.count(lambda r: r["status"] == "OK")} OK, '
      f'~{sum(1 for r in rows if r["status"] == "WARN")} WARN, '
      f'~{sum(1 for r in rows if r["status"] == "ERROR")} ERROR')
