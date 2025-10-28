-- Table: DIM_USER
DROP TABLE IF EXISTS "DIM_USER" CASCADE;
CREATE TABLE "DIM_USER" (
  "id_user"             BIGSERIAL PRIMARY KEY,
  "first_name"          VARCHAR(120),
  "last_name"           VARCHAR(120),
  "pseudo"              VARCHAR(120),
  "email"               VARCHAR(120),
  "password"            VARCHAR(255),
  "role"                VARCHAR(120),
  "id_service"          BIGINT,
  "deleted"             BOOLEAN DEFAULT FALSE
);

-- Comments for DIM_USER table columns
COMMENT ON COLUMN "DIM_USER"."id_user"        IS 'Unique user ID';
COMMENT ON COLUMN "DIM_USER"."pseudo"         IS 'User nickname or alias';
COMMENT ON COLUMN "DIM_USER"."first_name"     IS 'User''s first name';
COMMENT ON COLUMN "DIM_USER"."last_name"      IS 'User''s last name';
COMMENT ON COLUMN "DIM_USER"."email"          IS 'User''s email address';
COMMENT ON COLUMN "DIM_USER"."password"       IS 'User''s password';
COMMENT ON COLUMN "DIM_USER"."role"           IS 'Role or access level (e.g., admin, inspector)';
COMMENT ON COLUMN "DIM_USER"."deleted"        IS 'True if the user is deleted';

-- Table: REF_TYPE_SYSTEM
DROP TABLE IF EXISTS "REF_TYPE_SYSTEM" CASCADE;
CREATE TABLE "REF_TYPE_SYSTEM" (
  "id_type_sys"          BIGSERIAL PRIMARY KEY,
  "name_type_sys"        VARCHAR(120),
  "description_type_sys" TEXT,
  "deleted"              BOOLEAN DEFAULT FALSE,
  "creation_date"        TIMESTAMP,
  "user_creation"        BIGINT,
  "modification_date"    TIMESTAMP,
  "user_modification"    BIGINT
);
-- Comments for REF_TYPE_SYSTEM table columns
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."id_type_sys"           IS 'ID unique du type de système';
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."name_type_sys"         IS 'Nom du type de système (BDD, Application, Server WEB etc...)';
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."description_type_sys"  IS 'Description du type de système';
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."deleted"               IS 'True si le type de système est supprimé';
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."creation_date"         IS 'Date de création de la ligne';
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."user_creation"         IS 'Utilisateur qui a créé la ligne';
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."modification_date"     IS 'Date de modification de la ligne';
COMMENT ON COLUMN "REF_TYPE_SYSTEM"."user_modification"     IS 'Utilisateur qui a modifié la ligne';

-- Table: REF_SERVICE
DROP TABLE IF EXISTS "REF_SERVICE" CASCADE;
CREATE TABLE "REF_SERVICE" (
  "id_service"          BIGSERIAL PRIMARY KEY,
  "name_service"        VARCHAR(120),
  "description_service" TEXT,
  "deleted"             BOOLEAN DEFAULT FALSE,
  "creation_date"       TIMESTAMP,
  "user_creation"       BIGINT,
  "modification_date"   TIMESTAMP,
  "user_modification"   BIGINT
);
-- Comments for REF_SERVICE table columns
COMMENT ON COLUMN "REF_SERVICE"."id_service"            IS 'ID unique du service';
COMMENT ON COLUMN "REF_SERVICE"."name_service"          IS 'Nom du service (data, dev, appli etc...)';
COMMENT ON COLUMN "REF_SERVICE"."description_service"   IS 'Description du service';
COMMENT ON COLUMN "REF_SERVICE"."deleted"               IS 'True si le service est supprimé';
COMMENT ON COLUMN "REF_SERVICE"."creation_date"         IS 'Date de création de la ligne';
COMMENT ON COLUMN "REF_SERVICE"."user_creation"         IS 'Utilisateur qui a créé la ligne';
COMMENT ON COLUMN "REF_SERVICE"."modification_date"     IS 'Date de modification de la ligne';
COMMENT ON COLUMN "REF_SERVICE"."user_modification"     IS 'Utilisateur qui a modifié la ligne';


-- Table: REF_TYPE_MACHINE
DROP TABLE IF EXISTS "REF_TYPE_MACHINE" CASCADE;
CREATE TABLE "REF_TYPE_MACHINE" (
  "id_type_machine"           BIGSERIAL PRIMARY KEY,
  "name_type_machine"         VARCHAR(120),
  "description_type_machine"  TEXT,
  "deleted"                   BOOLEAN DEFAULT FALSE,
  "creation_date"             TIMESTAMP,
  "user_creation"             BIGINT,
  "modification_date"         TIMESTAMP,
  "user_modification"         BIGINT
);

-- Comments for REF_TYPE_MACHINE table columns
COMMENT ON COLUMN "REF_TYPE_MACHINE"."id_type_machine"            IS 'ID unique du type de la machine';
COMMENT ON COLUMN "REF_TYPE_MACHINE"."name_type_machine"          IS 'Nom du type de la machine (VM, SERVEUR, DOCKER etc...)';
COMMENT ON COLUMN "REF_TYPE_MACHINE"."description_type_machine"   IS 'Description du type de la machine';
COMMENT ON COLUMN "REF_TYPE_MACHINE"."deleted"                    IS 'True si le type de la machine est supprimé';
COMMENT ON COLUMN "REF_TYPE_MACHINE"."creation_date"              IS 'Date de création de la ligne';
COMMENT ON COLUMN "REF_TYPE_MACHINE"."user_creation"              IS 'Utilisateur qui a créé la ligne';
COMMENT ON COLUMN "REF_TYPE_MACHINE"."modification_date"          IS 'Date de modification de la ligne';
COMMENT ON COLUMN "REF_TYPE_MACHINE"."user_modification"          IS 'Utilisateur qui a modifié la ligne';


-- Table: DIM_MACHINE
DROP TABLE IF EXISTS "DIM_MACHINE" CASCADE;
CREATE TABLE "DIM_MACHINE" (
  "id_machine"          BIGSERIAL PRIMARY KEY,
  "name_machine"        VARCHAR(120),
  "id_type_machine"     BIGINT,
  "os_machine"          VARCHAR(120),
  "version_machine"     VARCHAR(120),
  "description_machine" TEXT,
  "deleted"             BOOLEAN DEFAULT FALSE,
  "creation_date"       TIMESTAMP,
  "user_creation"       BIGINT,
  "modification_date"   TIMESTAMP,
  "user_modification"   BIGINT
);

-- Comments for DIM_MACHINE table columns
COMMENT ON COLUMN "DIM_MACHINE"."id_machine"            IS 'ID unique de la machine';
COMMENT ON COLUMN "DIM_MACHINE"."name_machine"          IS 'Nom de la machine (VSLNAP1, VMDWHTOUL1 etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."id_type_machine"       IS 'ID du type de la machine (VM, SERVEUR, DOCKER etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."os_machine"            IS 'Système d exploitation de la machine (Windows, Linux etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."version_machine"       IS 'Version de la machine (Windows 11, Linux Debian 12 etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."description_machine"   IS 'Description de la machine';
COMMENT ON COLUMN "DIM_MACHINE"."deleted"               IS 'True si la machine est supprimée';
COMMENT ON COLUMN "DIM_MACHINE"."creation_date"         IS 'Date de création de la ligne';
COMMENT ON COLUMN "DIM_MACHINE"."user_creation"         IS 'Utilisateur qui a créé la ligne';
COMMENT ON COLUMN "DIM_MACHINE"."modification_date"     IS 'Date de modification de la ligne';
COMMENT ON COLUMN "DIM_MACHINE"."user_modification"     IS 'Utilisateur qui a modifié la ligne';

-- Table: DIM_SYSTEM
DROP TABLE IF EXISTS "DIM_SYSTEM" CASCADE;
CREATE TABLE "DIM_SYSTEM" (
  "id_sys"              BIGSERIAL PRIMARY KEY,
  "name_sys"            VARCHAR(120),
  "version_sys"         VARCHAR(120),
  "id_type_sys"         BIGINT,
  "description_sys"     TEXT,
  "id_service_sys"      BIGINT,
  "id_machine_sys"      BIGINT,
  "deleted"             BOOLEAN DEFAULT FALSE,
  "creation_date"       TIMESTAMP,
  "user_creation"       BIGINT,
  "modification_date"   TIMESTAMP,
  "user_modification"   BIGINT
);

-- Comments for DIM_SYSTEM table columns
COMMENT ON COLUMN "DIM_SYSTEM"."id_sys"               IS 'ID unique du système';
COMMENT ON COLUMN "DIM_SYSTEM"."name_sys"             IS 'Nom du système';
COMMENT ON COLUMN "DIM_SYSTEM"."version_sys"          IS 'Version du système';
COMMENT ON COLUMN "DIM_SYSTEM"."id_type_sys"          IS 'ID du type du système (BDD, APPLI, SERVER etc...)';
COMMENT ON COLUMN "DIM_SYSTEM"."description_sys"      IS 'Description du système';
COMMENT ON COLUMN "DIM_SYSTEM"."id_service_sys"       IS 'ID du service relié à ce système';
COMMENT ON COLUMN "DIM_SYSTEM"."id_machine_sys"       IS 'ID de la machine qui fait tourner ce système';
COMMENT ON COLUMN "DIM_SYSTEM"."deleted"              IS 'True si le système est supprimé';
COMMENT ON COLUMN "DIM_SYSTEM"."creation_date"        IS 'Date de création de la ligne';
COMMENT ON COLUMN "DIM_SYSTEM"."user_creation"        IS 'Utilisateur qui a créé la ligne';
COMMENT ON COLUMN "DIM_SYSTEM"."modification_date"    IS 'Date de modification de la ligne';
COMMENT ON COLUMN "DIM_SYSTEM"."user_modification"    IS 'Utilisateur qui a modifié la ligne';

-- Table: DIM_WORKER
DROP TABLE IF EXISTS "DIM_WORKER" CASCADE;
CREATE TABLE "DIM_WORKER" (
  "id_worker"           BIGSERIAL PRIMARY KEY,
  "name_worker"         VARCHAR(120),
  "id_sys"              BIGINT,
  "id_machine"          BIGINT,
  "description_worker"  TEXT,
  "creds_worker"        VARCHAR(255),
  "deleted"             BOOLEAN DEFAULT FALSE,
  "creation_date"       TIMESTAMP,
  "user_creation"       BIGINT,
  "modification_date"   TIMESTAMP,
  "user_modification"   BIGINT
);

-- Comments for DIM_WORKER table columns
COMMENT ON COLUMN "DIM_WORKER"."id_worker"            IS 'Unique ID du worker';
COMMENT ON COLUMN "DIM_WORKER"."name_worker"          IS 'Nom du worker';
COMMENT ON COLUMN "DIM_WORKER"."id_sys"               IS 'ID du sytème sur lequel le worker va travailler';
COMMENT ON COLUMN "DIM_WORKER"."id_machine"           IS 'ID de la machine sur lequel le worker est exécuté';
COMMENT ON COLUMN "DIM_WORKER"."description_worker"   IS 'Description du worker';
COMMENT ON COLUMN "DIM_WORKER"."creds_worker"         IS 'Clé API pour le worker';
COMMENT ON COLUMN "DIM_WORKER"."deleted"              IS 'True si le worker est supprimé';
COMMENT ON COLUMN "DIM_WORKER"."creation_date"        IS 'Date de création de la ligne';
COMMENT ON COLUMN "DIM_WORKER"."user_creation"        IS 'Utilisateur qui a créé la ligne';
COMMENT ON COLUMN "DIM_WORKER"."modification_date"    IS 'Date de modification de la ligne';
COMMENT ON COLUMN "DIM_WORKER"."user_modification"    IS 'Utilisateur qui a modifié la ligne';

-- Table: FCT_VERIF_SYSTEM
DROP TABLE IF EXISTS "FCT_VERIF_SYSTEM" CASCADE;
CREATE TABLE "FCT_VERIF_SYSTEM" (
  "id_verif"            BIGSERIAL PRIMARY KEY,
  "id_worker"           BIGINT,
  "id_sys"              BIGINT,
  "id_machine"          BIGINT,
  "status"              VARCHAR(120),
  "details"             TEXT,
  "deleted"             BOOLEAN DEFAULT FALSE,
  "creation_date"       TIMESTAMP,
  "user_creation"       BIGINT,
  "modification_date"   TIMESTAMP,
  "user_modification"   BIGINT
);

-- Comments for DIM_MACHINE table columns
COMMENT ON COLUMN "DIM_MACHINE"."id_machine"            IS 'ID unique de la machine';
COMMENT ON COLUMN "DIM_MACHINE"."name_machine"          IS 'Nom de la machine (VSLNAP1, VMDWHTOUL1 etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."id_type_machine"       IS 'ID du type de la machine (VM, SERVEUR, DOCKER etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."os_machine"            IS 'Système d exploitation de la machine (Windows, Linux etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."version_machine"       IS 'Version de la machine (Windows 11, Linux Debian 12 etc...)';
COMMENT ON COLUMN "DIM_MACHINE"."description_machine"   IS 'Description de la machine';
COMMENT ON COLUMN "DIM_MACHINE"."description_machine"   IS 'True si la machine est supprimée';
