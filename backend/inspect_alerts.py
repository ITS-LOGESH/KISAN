import sqlite3
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

con = sqlite3.connect('krishinet.db')
con.row_factory = sqlite3.Row
cur = con.cursor()
cur.execute('SELECT * FROM alerts ORDER BY id')
rows = [dict(r) for r in cur.fetchall()]

print(f"Total alerts: {len(rows)}")
types = set(r['type'] for r in rows)
severities = set(r['severity'] for r in rows)
sources = set(r['source'] for r in rows)
print("Types:", types)
print("Severities:", severities)
print("Sources:", sources)

print("\n--- ALL ALERTS ---")
for r in rows:
    print(f"ID {r['id']} | Field {r['field_id']} | Type: {r['type']} | Sev: {r['severity']} | Read: {r['is_read']}")
    print(f"  Title:   {r['title']}")
    print(f"  Message: {r['message']}")
    print(f"  Action:  {r['action']}")
    print(f"  Source:  {r['source']}")
    print(f"  Fingerprint: {r['fingerprint']}")
    print()

con.close()
