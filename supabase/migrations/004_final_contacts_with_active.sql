-- Migration 004: Final corrected contacts with active flag
-- Re-inserts ALL contacts from legacy data with correct active status,
-- normalized E.164 phones, and proper created_at timestamps.
-- Skips invalid entries: row 4498 (8-digit phone), 4502 (swapped data), 4481 (9-digit phone).

BEGIN;

-- Clear dependent tables first
DELETE FROM message_logs;
DELETE FROM campaigns;
DELETE FROM contacts;

-- ============================================================
-- ClientID 29 → org slug 'tonytouch'
-- ============================================================

-- OldId 51
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maico bory', '+14073345368', false, '2019-10-31 14:15:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 52
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Miguel Carro', '+14079229996', true, '2019-10-31 14:42:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 53
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Cantante', '+14074841873', true, '2019-10-31 14:55:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 55
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Mecanico', '+13216829219', true, '2019-10-31 15:07:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 56
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juan Nissan', '+13474631676', true, '2019-10-31 15:08:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 57
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ruben Nisan', '+14074663877', true, '2019-10-31 15:09:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 58
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Robin 40', '+14079820255', true, '2019-10-31 15:10:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 59
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Luis Nisan', '+12012906968', true, '2019-10-31 15:11:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 60
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Junior Jairol New', '+14077935367', true, '2019-10-31 15:14:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 62
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cibao New', '+13214423357', true, '2019-10-31 15:16:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 63
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tailer Cibao', '+13219455749', true, '2019-10-31 15:18:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 64
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Will Cl', '+13214602165', false, '2019-10-31 15:21:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 65
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Daniel Nilo New', '+14077054842', false, '2019-10-31 15:22:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 66
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Colonbia Gm', '+14074353796', true, '2019-10-31 15:23:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 67
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Poinciana', '+13212450852', false, '2019-10-31 15:24:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 68
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Julio Cl', '+14077290915', false, '2019-10-31 15:25:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 69
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Mendy New', '+14074335563', true, '2019-10-31 15:26:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 70
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Lider Mena', '+18638520125', true, '2019-10-31 15:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 71
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Mar Hopital', '+14073610682', true, '2019-10-31 15:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 72
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Conputadora', '+14079688646', false, '2019-10-31 15:29:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 73
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Valentin Pl', '+14072832440', true, '2019-10-31 15:29:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 74
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Andy Nisan', '+13474238290', true, '2019-10-31 15:30:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 75
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jesy Mujer', '+14073509792', false, '2019-10-31 15:31:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 76
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Orlandito Ny', '+17189255410', false, '2019-10-31 15:39:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 77
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Luis', '+14073466656', true, '2019-10-31 15:40:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 78
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Toma Super Mercado', '+13216243284', true, '2019-10-31 15:41:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 79
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Mar Cl', '+16462604330', true, '2019-10-31 15:42:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 81
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Bory Gringo', '+14078732647', true, '2019-10-31 20:26:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 82
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ariel franklyn', '+14072320366', true, '2019-10-31 20:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 83
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Larami Soplay', '+13212294495', true, '2019-10-31 20:28:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 84
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jr Nuevo', '+13213520298', true, '2019-10-31 20:29:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 85
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'FRANK SALSA LATINA', '+14074608156', true, '2019-10-31 20:31:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 86
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rey Cristian', '+13212500499', true, '2019-10-31 20:32:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 87
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cristofer Cl', '+14076246292', true, '2019-10-31 20:33:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 88
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gio Cuba', '+14074055175', true, '2019-10-31 20:35:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 89
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cuba Yojan Sobrino', '+13219453771', false, '2019-10-31 20:36:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 90
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Dany Bory', '+14074912832', true, '2019-10-31 20:37:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 91
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Dario New 1', '+14073500162', true, '2019-10-31 20:38:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 92
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Deny Bravo', '+14074050236', true, '2019-10-31 20:40:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 93
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ruben Dominicana', '+14073017946', true, '2019-10-31 20:41:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 94
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Primo Eduardo', '+14073012630', true, '2019-10-31 20:43:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 95
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Elio', '+14077809223', true, '2019-10-31 20:45:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 96
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Engol Broder', '+16463342533', true, '2019-10-31 20:48:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 97
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Estiven 25', '+14073615433', true, '2019-10-31 20:50:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 98
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fauto Mendy', '+14079083036', true, '2019-10-31 20:51:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 99
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fran Martinez', '+14072345656', false, '2019-10-31 20:53:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 100
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gabriel Alfonbra', '+14075209136', true, '2019-10-31 20:54:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 101
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jonatan. Under Arma', '+14074606128', true, '2019-11-01 01:16:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 102
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Abraham Rolon', '+13216245081', true, '2019-11-01 01:18:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 103
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Yeyo 2 New', '+13863072025', true, '2019-11-01 01:19:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 104
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gim Cl', '+14073107205', true, '2019-11-01 01:20:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 106
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maiki Rey', '+19783907777', true, '2019-11-01 01:23:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 107
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juan Rey', '+14077498462', true, '2019-11-01 01:23:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 108
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Geraldo Mecanico', '+14073016398', true, '2019-11-01 01:25:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 109
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rafa Camionero', '+14079479696', true, '2019-11-01 01:26:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 110
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ramon Yankees', '+14074608970', true, '2019-11-01 01:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 111
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Miguel Viejo', '+14074602421', false, '2019-11-01 01:28:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 112
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Monty Gm', '+14077916202', false, '2019-11-01 01:29:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 113
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Antony Mou', '+14077666009', true, '2019-11-01 01:30:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 114
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Chelo New', '+14079701647', true, '2019-11-01 01:31:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 115
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cristian Rey', '+14073464625', true, '2019-11-01 01:33:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 116
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jerry Primo', '+14075309495', true, '2019-11-01 01:34:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 117
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jey 40', '+14074145989', false, '2019-11-01 01:35:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 118
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jinnet', '+14073507101', true, '2019-11-01 01:36:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 119
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Joel Alex Crepo', '+14074522918', false, '2019-11-01 01:36:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 120
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jordy Eduardo', '+14075419507', true, '2019-11-01 01:38:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 121
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Jose', '+14074538430', true, '2019-11-01 01:39:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 122
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Junta', '+14077803862', true, '2019-11-01 01:40:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 123
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Primo Cable', '+13477929495', true, '2019-11-01 01:41:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 124
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Julio', '+14079688384', false, '2019-11-01 01:43:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 125
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juvenal Cl', '+14074861773', true, '2019-11-01 01:44:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 126
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tasha', '+19173354457', true, '2019-11-01 01:45:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 127
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Daniel La Tore', '+19737764987', false, '2019-11-01 01:47:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 128
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Braian Estey Truper', '+14014997229', false, '2019-11-01 01:48:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 129
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Eduardo Unido', '+14073612063', true, '2019-11-01 01:49:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 130
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Savier Mariol', '+13219482778', true, '2019-11-01 01:50:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 131
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Savier Marco', '+14073342125', false, '2019-11-01 01:51:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 132
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Marsela Colombia', '+14076927755', true, '2019-11-01 01:52:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 133
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Medy Oceola', '+14076665658', false, '2019-11-01 01:54:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 134
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Papote Negocio', '+14072797692', true, '2019-11-01 01:55:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 135
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pedro Eletrisita', '+17874644442', true, '2019-11-01 01:57:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 136
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pi Ny', '+19173550415', false, '2019-11-01 01:58:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 137
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ilario Pelota', '+13216820561', true, '2019-11-01 01:59:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 138
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pelota 2', '+14077447983', true, '2019-11-01 01:59:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 139
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jaror Ekipito Pl', '+14076972261', true, '2019-11-01 02:00:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 140
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Yojan Nuevo 2', '+14076004247', true, '2019-11-01 02:02:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 141
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Wendel', '+13212396862', true, '2019-11-01 02:03:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 142
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fredy Jose Cl', '+14079225285', true, '2019-11-01 02:06:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 143
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Estiven Tony Nisan', '+14075522656', true, '2019-11-01 11:48:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 144
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Roberto Brasil', '+14073502121', false, '2019-11-01 11:49:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 145
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brandon Moreno', '+19417804521', true, '2019-11-01 11:56:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 149
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jeison Ny', '+14074747006', true, '2019-11-05 02:41:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 150
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Engol Bory New', '+14077736052', false, '2019-11-05 02:42:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 151
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jefri Cl', '+12127314718', false, '2019-11-05 02:44:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 152
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brandon Carlos', '+14074156665', false, '2019-11-05 02:45:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 157
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex', '+13214371152', true, '2019-11-06 10:53:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 158
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ivan Cl', '+14079528992', true, '2019-11-07 03:55:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 161
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Julio', '+14078857782', true, '2019-11-07 04:00:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 162
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alexis Nicola', '+14073344007', false, '2019-11-07 04:01:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 163
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Cl', '+13478030112', true, '2019-11-07 09:23:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 164
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alejandro Colonbia', '+13212766083', false, '2019-11-07 09:32:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 165
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Oscar El Paise', '+13214431368', true, '2019-11-07 09:33:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 166
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maiki Rey New', '+19787281779', true, '2019-11-08 22:29:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 167
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Sprint', '+19544104807', false, '2019-11-12 07:42:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 170
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Dori Cl', '+16316827433', true, '2019-12-12 03:36:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 171
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gorgre Realetey', '+14079638816', true, '2019-12-12 03:38:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1224
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Caio Alex', '+14078371445', false, '2020-01-17 13:44:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1225
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Leito', '+13217329388', false, '2020-01-17 13:45:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1226
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Derek Black Gay', '+18324198769', false, '2020-01-17 13:47:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1227
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Many Cibao', '+16467970600', true, '2020-01-17 13:49:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1228 (dup phone of OldId 94 +14073012630 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Primo Eduardo', '+14073012630', true, '2020-01-17 13:52:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1229
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cesar Barber Cl', '+14074529200', true, '2020-01-17 13:54:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1230
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rey Cl', '+14073425845', true, '2020-01-17 14:22:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1231 (dup phone of OldId 158 +14079528992 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ivan Cl', '+14079528992', true, '2020-02-20 14:53:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1232 (dup phone of OldId 63 +13219455749 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tailer Cibao', '+13219455749', true, '2020-02-20 14:54:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1233 (name is a phone number — inserting as-is)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), '(646) 296-2406', '+16462962406', true, '2020-02-20 17:16:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1234
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Many Cl', '+14077290604', true, '2020-02-20 17:18:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1238 (dup phone of OldId 1230 +14073425845 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rey Cl', '+14073425845', true, '2020-03-24 09:39:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1271
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Vesino', '+14078641135', false, '2020-06-19 07:03:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1272
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Amaury Carlos', '+14078640986', true, '2020-06-19 07:03:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1273
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Carlos Domino', '+13473603762', true, '2020-06-19 07:04:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1274
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rony Joel New', '+14073501843', true, '2020-06-19 08:21:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1275
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Osia Amaury', '+14078794709', true, '2020-11-23 19:30:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1276
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Leny Amaury', '+14078733807', true, '2020-11-23 19:30:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1644
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Keny', '+14074147454', true, '2021-05-29 09:08:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1645
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Many contable', '+14073985805', true, '2021-05-29 09:11:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1646
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Oscar', '+14079294225', true, '2021-05-29 09:15:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1647
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jinet emely', '+16462444443', true, '2021-07-09 10:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1648
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Emely jinet', '+14072019986', false, '2021-07-09 10:28:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1649
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Moncho eduardo', '+14078812041', true, '2021-07-09 10:30:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 1650
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Wilky eduardo', '+19295446265', true, '2021-07-09 10:30:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2927
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pablo', '+13219006300', false, '2021-09-14 10:29:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2928
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tony', '+14074524314', true, '2021-09-14 10:31:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2934
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose primo', '+14076982111', false, '2021-10-13 14:31:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2935
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juan many', '+19175578037', true, '2021-10-13 14:33:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2936
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ramon 2', '+14074600223', true, '2021-10-13 14:38:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2937
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ramon', '+14072720080', false, '2021-10-13 14:39:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2939 (dup phone of OldId 2928 +14074524314 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'tony', '+14074524314', false, '2021-10-13 19:45:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 2959
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Elvis', '+14075725205', true, '2021-12-10 13:22:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3245
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Sexy', '+14074522734', false, '2022-04-06 07:36:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3269
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Eduardo ricardo', '+14077499855', true, '2022-04-14 07:32:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3270
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Luis cl', '+13213378720', true, '2022-04-14 07:33:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3271
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Leonel cl', '+14074060925', false, '2022-04-14 07:34:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3272
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Joy venesuela', '+19392603617', true, '2022-04-14 13:04:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3273
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rony apartamento', '+15086671599', true, '2022-04-14 20:22:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3274
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose ajomen', '+17183603050', true, '2022-04-14 20:22:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3275 (dup phone of OldId 51 +14073345368 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maico', '+14073345368', true, '2022-04-14 20:23:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3305
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pire ny', '+13472712700', true, '2022-05-04 10:06:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3306
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Travi', '+14076558646', true, '2022-05-04 10:07:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3382
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jeronimo', '+14077589408', false, '2022-06-25 22:05:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3410
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Sesor', '+14075564753', true, '2022-09-01 20:15:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3411
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Papalote', '+14072358967', true, '2022-09-01 20:16:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3412
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Junior', '+16467126709', true, '2022-09-01 20:17:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3413
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Montana', '+13472913868', true, '2022-09-01 20:18:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3414
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brarly', '+14077805450', true, '2022-09-01 20:19:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3415
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pelotero', '+14077643043', true, '2022-09-01 20:19:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3416
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tiro', '+18635125580', true, '2022-09-01 20:20:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3428
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'test Customer', '+14074143023', false, '2022-11-16 13:46:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4455
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Eduin el pastor', '+17875290561', true, '2022-12-08 14:55:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4456
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose 35', '+19084002373', true, '2022-12-08 14:55:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4457
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brandon carlos', '+14078399861', true, '2022-12-08 15:03:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4458
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Victor', '+17815587433', true, '2022-12-15 21:03:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4465 (dup phone of OldId 2959 +14075725205 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Elvis', '+14075725205', true, '2023-01-06 13:12:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4475
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Bolivar', '+14073088134', true, '2023-02-02 09:51:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4485 (dup phone of OldId 3410 +14075564753 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Sesor', '+14075564753', false, '2023-08-31 09:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4486
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fernando', '+14074609773', true, '2024-01-10 12:07:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4487
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Lef', '+14075048026', true, '2024-01-10 13:45:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4488
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rafael ny', '+16465009844', true, '2024-01-11 21:45:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4489
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rely', '+14075201399', true, '2024-01-12 13:33:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4490
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pedro ny sajoma', '+19179391258', true, '2024-02-06 14:14:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4495
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Deibi 80', '+14073387650', true, '2024-06-27 13:01:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4496
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Marco', '+14079734028', true, '2024-07-10 12:22:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4497
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Trnida', '+14078646173', true, '2024-08-08 21:07:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4498: SKIPPED — invalid phone (67676767, only 8 digits)

-- OldId 4499
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jey bravo', '+13213882425', true, '2024-10-02 18:41:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4500
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tasha hijo', '+13474197594', true, '2024-10-02 18:42:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4502: SKIPPED — swapped data (phone field is "Joy", name field is a phone number)

-- OldId 4504
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Joel braian', '+13477562168', true, '2025-08-14 08:44:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4505
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Orlando', '+14077293442', true, '2025-08-19 14:33:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4506
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Manuel', '+14074706891', true, '2025-08-20 10:09:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4507
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Kikito', '+14072809805', true, '2025-08-21 16:26:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4508
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Kiko', '+14077299491', true, '2025-08-21 16:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4509
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Braian jose', '+13475834411', true, '2025-10-10 21:00:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4510
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Lewis bogui', '+19789024187', true, '2026-01-08 21:29:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4511
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Nelson', '+14079198259', true, '2026-02-21 12:56:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4512
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Hijo de juan', '+13212878414', true, '2026-02-21 12:58:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4513 (dup phone of OldId 68 +14077290915 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Julio', '+14077290915', true, '2026-02-21 12:59:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- ============================================================
-- ClientID 30 → org slug 'genybarber'
-- ============================================================

-- OldId 1638
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'james', '+14077548294', false, '2021-05-10 13:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3399
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14077548284', false, '2022-07-24 15:31:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3400
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Ramon', '+14074142834', false, '2022-07-24 16:36:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3401 (dup phone of OldId 1638 +14077548294 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14077548294', false, '2022-07-24 16:37:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 3402
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Dan', '+12019065646', false, '2022-07-24 18:02:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4480
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Teague', '+19803130356', false, '2023-02-13 11:27:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4481: SKIPPED — invalid phone (407548294, only 9 digits)

-- OldId 4482 (dup phone of OldId 1638 +14077548294 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14077548294', false, '2023-03-21 22:23:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4483 (dup phone of OldId 4480 +19803130356 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Teague Dolezel', '+19803130356', false, '2023-03-30 11:17:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4484
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Tommy', '+16313577010', false, '2023-04-23 14:03:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4491
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Fred', '+14126702285', false, '2024-02-20 23:12:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4492
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Caleb', '+13044335242', true, '2024-05-03 15:14:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4493 (dup phone of OldId 1638 +14077548294 — will be skipped by ON CONFLICT)
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'james', '+14077548294', false, '2024-05-03 15:14:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

-- OldId 4494
INSERT INTO contacts (org_id, first_name, phone, active, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14072366630', true, '2024-05-03 15:15:00')
  ON CONFLICT (org_id, phone) DO NOTHING;

COMMIT;
