-- Seed a sample template
INSERT INTO templates (id, name, description, estimated_days, categories) VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Standard Inbetriebnahme',
    'Standardvorlage für die Inbetriebnahme von Flurförderzeugen',
    14,
    '[
      {
        "id": "cat-1",
        "name": "Allgemeine Prüfung",
        "tasks": [
          {"id": "task-1", "title": "Sichtprüfung durchgeführt", "type": "checkbox", "required": true},
          {"id": "task-2", "title": "Seriennummer überprüft", "type": "checkbox", "required": true},
          {"id": "task-3", "title": "Bemerkungen zur Sichtprüfung", "type": "text", "required": false}
        ]
      },
      {
        "id": "cat-2",
        "name": "Technische Prüfung",
        "tasks": [
          {"id": "task-4", "title": "Hydrauliksystem geprüft", "type": "checkbox", "required": true},
          {"id": "task-5", "title": "Elektrische Anlage geprüft", "type": "checkbox", "required": true},
          {"id": "task-6", "title": "Betriebsstunden", "type": "number", "required": true},
          {"id": "task-7", "title": "Technischer Bericht", "type": "file", "required": false}
        ]
      },
      {
        "id": "cat-3",
        "name": "Sicherheitsprüfung",
        "tasks": [
          {"id": "task-8", "title": "Notaus-Schalter getestet", "type": "checkbox", "required": true},
          {"id": "task-9", "title": "Bremsen geprüft", "type": "checkbox", "required": true},
          {"id": "task-10", "title": "Hupe funktioniert", "type": "checkbox", "required": true}
        ]
      }
    ]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
