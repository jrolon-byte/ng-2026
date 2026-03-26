-- Migration: Fix contacts table with correct created_at dates from original MSSQL data
-- Deletes all existing contacts and re-inserts with correct DateAccountCreated timestamps

DELETE FROM contacts;

-- =============================================================================
-- ClientID 29 -> organization slug 'tonytouch'
-- =============================================================================

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maico bory', '+14073345368', '2019-10-31 14:15:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Miguel Carro', '+14079229996', '2019-10-31 14:42:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Cantante', '+14074841873', '2019-10-31 14:55:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Mecanico', '+13216829219', '2019-10-31 15:07:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juan Nissan', '+13474631676', '2019-10-31 15:08:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ruben Nisan', '+14074663877', '2019-10-31 15:09:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Robin 40', '+14079820255', '2019-10-31 15:10:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Luis Nisan', '+12012906968', '2019-10-31 15:11:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Junior Jairol New', '+14077935367', '2019-10-31 15:14:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cibao New', '+13214423357', '2019-10-31 15:16:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tailer Cibao', '+13219455749', '2019-10-31 15:18:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Will Cl', '+13214602165', '2019-10-31 15:21:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Daniel Nilo New', '+14077054842', '2019-10-31 15:22:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Colonbia Gm', '+14074353796', '2019-10-31 15:23:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Poinciana', '+13212450852', '2019-10-31 15:24:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Julio Cl', '+14077290915', '2019-10-31 15:25:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Mendy New', '+14074335563', '2019-10-31 15:26:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Lider Mena', '+18638520125', '2019-10-31 15:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Mar Hopital', '+14073610682', '2019-10-31 15:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Conputadora', '+14079688646', '2019-10-31 15:29:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Valentin Pl', '+14072832440', '2019-10-31 15:29:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Andy Nisan', '+13474238290', '2019-10-31 15:30:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jesy Mujer', '+14073509792', '2019-10-31 15:31:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Orlandito Ny', '+17189255410', '2019-10-31 15:39:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Luis', '+14073466656', '2019-10-31 15:40:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Toma Super Mercado', '+13216243284', '2019-10-31 15:41:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Mar Cl', '+16462604330', '2019-10-31 15:42:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Bory Gringo', '+14078732647', '2019-10-31 20:26:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ariel franklyn', '+14072320366', '2019-10-31 20:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Larami Soplay', '+13212294495', '2019-10-31 20:28:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jr Nuevo', '+13213520298', '2019-10-31 20:29:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'FRANK SALSA LATINA', '+14074608156', '2019-10-31 20:31:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rey Cristian', '+13212500499', '2019-10-31 20:32:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cristofer Cl', '+14076246292', '2019-10-31 20:33:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gio Cuba', '+14074055175', '2019-10-31 20:35:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cuba Yojan Sobrino', '+13219453771', '2019-10-31 20:36:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Dany Bory', '+14074912832', '2019-10-31 20:37:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Dario New 1', '+14073500162', '2019-10-31 20:38:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Deny Bravo', '+14074050236', '2019-10-31 20:40:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ruben Dominicana', '+14073017946', '2019-10-31 20:41:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Primo Eduardo', '+14073012630', '2019-10-31 20:43:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Elio', '+14077809223', '2019-10-31 20:45:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Engol Broder', '+16463342533', '2019-10-31 20:48:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Estiven 25', '+14073615433', '2019-10-31 20:50:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fauto Mendy', '+14079083036', '2019-10-31 20:51:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fran Martinez', '+14072345656', '2019-10-31 20:53:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gabriel Alfonbra', '+14075209136', '2019-10-31 20:54:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jonatan. Under Arma', '+14074606128', '2019-11-01 01:16:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Abraham Rolon', '+13216245081', '2019-11-01 01:18:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Yeyo 2 New', '+13863072025', '2019-11-01 01:19:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gim Cl', '+14073107205', '2019-11-01 01:20:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maiki Rey', '+19783907777', '2019-11-01 01:23:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juan Rey', '+14077498462', '2019-11-01 01:23:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Geraldo Mecanico', '+14073016398', '2019-11-01 01:25:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rafa Camionero', '+14079479696', '2019-11-01 01:26:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ramon Yankees', '+14074608970', '2019-11-01 01:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Miguel Viejo', '+14074602421', '2019-11-01 01:28:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Monty Gm', '+14077916202', '2019-11-01 01:29:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Antony Mou', '+14077666009', '2019-11-01 01:30:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Chelo New', '+14079701647', '2019-11-01 01:31:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cristian Rey', '+14073464625', '2019-11-01 01:33:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jerry Primo', '+14075309495', '2019-11-01 01:34:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jey 40', '+14074145989', '2019-11-01 01:35:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jinnet', '+14073507101', '2019-11-01 01:36:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Joel Alex Crepo', '+14074522918', '2019-11-01 01:36:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jordy Eduardo', '+14075419507', '2019-11-01 01:38:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Jose', '+14074538430', '2019-11-01 01:39:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Junta', '+14077803862', '2019-11-01 01:40:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Primo Cable', '+13477929495', '2019-11-01 01:41:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Julio', '+14079688384', '2019-11-01 01:43:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juvenal Cl', '+14074861773', '2019-11-01 01:44:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tasha', '+19173354457', '2019-11-01 01:45:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Daniel La Tore', '+19737764987', '2019-11-01 01:47:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Braian Estey Truper', '+14014997229', '2019-11-01 01:48:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Eduardo Unido', '+14073612063', '2019-11-01 01:49:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Savier Mariol', '+13219482778', '2019-11-01 01:50:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Savier Marco', '+14073342125', '2019-11-01 01:51:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Marsela Colombia', '+14076927755', '2019-11-01 01:52:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Medy Oceola', '+14076665658', '2019-11-01 01:54:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Papote Negocio', '+14072797692', '2019-11-01 01:55:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pedro Eletrisita', '+17874644442', '2019-11-01 01:57:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pi Ny', '+19173550415', '2019-11-01 01:58:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ilario Pelota', '+13216820561', '2019-11-01 01:59:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pelota 2', '+14077447983', '2019-11-01 01:59:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jaror Ekipito Pl', '+14076972261', '2019-11-01 02:00:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Yojan Nuevo 2', '+14076004247', '2019-11-01 02:02:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Wendel', '+13212396862', '2019-11-01 02:03:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fredy Jose Cl', '+14079225285', '2019-11-01 02:06:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Estiven Tony Nisan', '+14075522656', '2019-11-01 11:48:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Roberto Brasil', '+14073502121', '2019-11-01 11:49:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brandon Moreno', '+19417804521', '2019-11-01 11:56:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jeison Ny', '+14074747006', '2019-11-05 02:41:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Engol Bory New', '+14077736052', '2019-11-05 02:42:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jefri Cl', '+12127314718', '2019-11-05 02:44:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brandon Carlos', '+14074156665', '2019-11-05 02:45:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex', '+13214371152', '2019-11-06 10:53:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ivan Cl', '+14079528992', '2019-11-07 03:55:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alex Julio', '+14078857782', '2019-11-07 04:00:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alexis Nicola', '+14073344007', '2019-11-07 04:01:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose Cl', '+13478030112', '2019-11-07 09:23:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Alejandro Colonbia', '+13212766083', '2019-11-07 09:32:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Oscar El Paise', '+13214431368', '2019-11-07 09:33:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maiki Rey New', '+19787281779', '2019-11-08 22:29:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Sprint', '+19544104807', '2019-11-12 07:42:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Dori Cl', '+16316827433', '2019-12-12 03:36:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Gorgre Realetey', '+14079638816', '2019-12-12 03:38:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Caio Alex', '+14078371445', '2020-01-17 13:44:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Leito', '+13217329388', '2020-01-17 13:45:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Derek Black Gay', '+18324198769', '2020-01-17 13:47:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Many Cibao', '+16467970600', '2020-01-17 13:49:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 1228: Primo Eduardo with (407) 301-2630 — same phone as row 94 (+14073012630), will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Primo Eduardo', '+14073012630', '2020-01-17 13:52:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Cesar Barber Cl', '+14074529200', '2020-01-17 13:54:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rey Cl', '+14073425845', '2020-01-17 14:22:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 1231: Ivan Cl duplicate phone +14079528992 — will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ivan Cl', '+14079528992', '2020-02-20 14:53:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 1232: Tailer Cibao duplicate phone +13219455749 — will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tailer Cibao', '+13219455749', '2020-02-20 14:54:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 1233: Name is "(646) 296-2406", phone is "(646) 296-2406" — valid phone
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), '(646) 296-2406', '+16462962406', '2020-02-20 17:16:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Many Cl', '+14077290604', '2020-02-20 17:18:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 1238: Rey Cl duplicate phone +14073425845 — will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rey Cl', '+14073425845', '2020-03-24 09:39:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Vesino', '+14078641135', '2020-06-19 07:03:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Amaury Carlos', '+14078640986', '2020-06-19 07:03:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Carlos Carlos Domino', '+13473603762', '2020-06-19 07:04:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rony Joel New', '+14073501843', '2020-06-19 08:21:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Osia Amaury', '+14078794709', '2020-11-23 19:30:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Leny Amaury', '+14078733807', '2020-11-23 19:30:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Keny', '+14074147454', '2021-05-29 09:08:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Many contable', '+14073985805', '2021-05-29 09:11:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Oscar', '+14079294225', '2021-05-29 09:15:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jinet emely', '+16462444443', '2021-07-09 10:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Emely jinet', '+14072019986', '2021-07-09 10:28:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Moncho eduardo', '+14078812041', '2021-07-09 10:30:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Wilky eduardo', '+19295446265', '2021-07-09 10:30:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pablo', '+13219006300', '2021-09-14 10:29:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tony', '+14074524314', '2021-09-14 10:31:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose primo', '+14076982111', '2021-10-13 14:31:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Juan many', '+19175578037', '2021-10-13 14:33:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ramon 2', '+14074600223', '2021-10-13 14:38:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Ramon', '+14072720080', '2021-10-13 14:39:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 2939: tony with 4074524314 — duplicate of row 2928, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'tony', '+14074524314', '2021-10-13 19:45:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Elvis', '+14075725205', '2021-12-10 13:22:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Sexy', '+14074522734', '2022-04-06 07:36:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Eduardo ricardo', '+14077499855', '2022-04-14 07:32:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Luis cl', '+13213378720', '2022-04-14 07:33:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Leonel cl', '+14074060925', '2022-04-14 07:34:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Joy venesuela', '+19392603617', '2022-04-14 13:04:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rony apartamento', '+15086671599', '2022-04-14 20:22:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose ajomen', '+17183603050', '2022-04-14 20:22:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 3275: Maico with (407) 334-5368 — duplicate of row 51, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Maico', '+14073345368', '2022-04-14 20:23:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pire ny', '+13472712700', '2022-05-04 10:06:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Travi', '+14076558646', '2022-05-04 10:07:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jeronimo', '+14077589408', '2022-06-25 22:05:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Sesor', '+14075564753', '2022-09-01 20:15:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Papalote', '+14072358967', '2022-09-01 20:16:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Junior', '+16467126709', '2022-09-01 20:17:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Montana', '+13472913868', '2022-09-01 20:18:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brarly', '+14077805450', '2022-09-01 20:19:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pelotero', '+14077643043', '2022-09-01 20:19:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tiro', '+18635125580', '2022-09-01 20:20:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'test Customer', '+14074143023', '2022-11-16 13:46:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Eduin el pastor', '+17875290561', '2022-12-08 14:55:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jose 35', '+19084002373', '2022-12-08 14:55:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Brandon carlos', '+14078399861', '2022-12-08 15:03:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Victor', '+17815587433', '2022-12-15 21:03:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4465: Elvis with (407) 572-5205 — duplicate of row 2959, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Elvis', '+14075725205', '2023-01-06 13:12:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Bolivar', '+14073088134', '2023-02-02 09:51:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4485: Sesor with (407) 556-4753 — duplicate of row 3410, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Sesor', '+14075564753', '2023-08-31 09:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Fernando', '+14074609773', '2024-01-10 12:07:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Lef', '+14075048026', '2024-01-10 13:45:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rafael ny', '+16465009844', '2024-01-11 21:45:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Rely', '+14075201399', '2024-01-12 13:33:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Pedro ny sajoma', '+19179391258', '2024-02-06 14:14:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Deibi 80', '+14073387650', '2024-06-27 13:01:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Marco', '+14079734028', '2024-07-10 12:22:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Trnida', '+14078646173', '2024-08-08 21:07:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4498: Lara with 67676767 — SKIPPED: invalid phone (only 8 digits)

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Jey bravo', '+13213882425', '2024-10-02 18:41:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Tasha hijo', '+13474197594', '2024-10-02 18:42:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4502: name/phone swapped, phone field is "Joy" — SKIPPED: invalid phone

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Joel braian', '+13477562168', '2025-08-14 08:44:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Orlando', '+14077293442', '2025-08-19 14:33:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Manuel', '+14074706891', '2025-08-20 10:09:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Kikito', '+14072809805', '2025-08-21 16:26:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Kiko', '+14077299491', '2025-08-21 16:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Braian jose', '+13475834411', '2025-10-10 21:00:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Lewis bogui', '+19789024187', '2026-01-08 21:29:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Nelson', '+14079198259', '2026-02-21 12:56:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Hijo de juan', '+13212878414', '2026-02-21 12:58:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4513: Julio with (407) 729-0915 — duplicate of row 68, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'tonytouch'), 'Julio', '+14077290915', '2026-02-21 12:59:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- =============================================================================
-- ClientID 30 -> organization slug 'genybarber'
-- =============================================================================

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'james', '+14077548294', '2021-05-10 13:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14077548284', '2022-07-24 15:31:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Ramon', '+14074142834', '2022-07-24 16:36:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 3401: James with 4077548294 — duplicate of row 1638, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14077548294', '2022-07-24 16:37:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Dan', '+12019065646', '2022-07-24 18:02:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Teague', '+19803130356', '2023-02-13 11:27:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4481: James with 407548294 — SKIPPED: only 9 digits after cleanup

-- Row 4482: James with 4077548294 — duplicate of row 1638, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14077548294', '2023-03-21 22:23:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4483: Teague Dolezel with 9803130356 — duplicate of row 4480, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Teague Dolezel', '+19803130356', '2023-03-30 11:17:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Tommy', '+16313577010', '2023-04-23 14:03:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Fred', '+14126702285', '2024-02-20 23:12:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'Caleb', '+13044335242', '2024-05-03 15:14:00')
ON CONFLICT (org_id, phone) DO NOTHING;

-- Row 4493: james with 4077548294 — duplicate of row 1638, will be skipped by ON CONFLICT
INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'james', '+14077548294', '2024-05-03 15:14:00')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO contacts (org_id, first_name, phone, created_at) VALUES
  ((SELECT id FROM organizations WHERE slug = 'genybarber'), 'James', '+14072366630', '2024-05-03 15:15:00')
ON CONFLICT (org_id, phone) DO NOTHING;
