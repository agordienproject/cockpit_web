import { prismaPSQL } from "../prisma/client_psql";
import {
  decryptConnection,
  encryptConnection,
  parsePostgresConnection,
  buildPostgresConnection,
  PostgresConnectionParts,
} from "../utils/crypto";
import { Client } from "pg";
import sql from "mssql";
import mysql from "mysql2/promise";

const extractConnectionParts = (encrypted: any): PostgresConnectionParts | undefined => {
  if (!encrypted) return undefined;
  try {
    const plain = decryptConnection(String(encrypted));
    return parsePostgresConnection(plain);
  } catch {
    return undefined;
  }
};

const serialiseConnectionParts = (parts: PostgresConnectionParts | undefined) => {
  if (!parts) return undefined;
  return {
    host: parts.host,
    port: parts.port,
    database: parts.database,
    user: parts.user,
    hasPassword: Boolean(parts.password),
  };
};

const sanitizeConnectionInput = (input: any): PostgresConnectionParts => {
  const host = typeof input?.host === "string" ? input.host.trim() : "";
  const user = typeof input?.user === "string" ? input.user.trim() : "";
  const portValue = input?.port;
  const port = typeof portValue === "number"
    ? String(portValue)
    : typeof portValue === "string"
      ? portValue.trim()
      : undefined;
  const database = typeof input?.database === "string" && input.database.trim()
    ? input.database.trim()
    : undefined;
  const password = typeof input?.password === "string" && input.password.trim()
    ? input.password.trim()
    : undefined;
  return {
    host,
    port: port || undefined,
    database,
    user,
    password,
  };
};

const applyDefaultQueryParams = (dsn: string): string => {
  try {
    const url = new URL(dsn);
    const params = url.searchParams;
    if (!params.has("sslmode")) {
      params.set("sslmode", "disable");
    }
    url.search = params.toString() ? `?${params.toString()}` : "";
    return url.toString();
  } catch {
    return dsn.includes("?") ? `${dsn}&sslmode=disable` : `${dsn}?sslmode=disable`;
  }
};

// Databases
export const getAllDatabases = async () => {
  const rows: any[] = await prismaPSQL.dIM_DATABASE.findMany({ 
    where: { deleted: false } 
  });
  
  const dbTypeIds = [...new Set(rows.map(r => (r as any).id_type_db).filter(Boolean))];
  const dbTypeMap: Record<string, string> = {};
  
  if (dbTypeIds.length) {
    const dbTypeRefs: any[] = await prismaPSQL.rEF_TYPE_DB.findMany({ 
      where: { id_type_db: { in: dbTypeIds as any }, deleted: false } as any 
    });
    dbTypeRefs.forEach(ref => { 
      dbTypeMap[String(ref.id_type_db)] = ref.name_type_db || ''; 
    });
  }
  
  return rows.map(r => {
    const idType = (r as any).id_type_db;
    const typeName = idType ? dbTypeMap[String(idType)] : undefined;
    const { url_connection_db, ...rest } = r as any;
    const parts = extractConnectionParts(url_connection_db);
    return {
      ...rest,
      name_type_db: typeName,
      connection: serialiseConnectionParts(parts),
    };
  });
};

export const getDatabaseById = async (id: any) => {
  const db = await prismaPSQL.dIM_DATABASE.findFirst({ 
    where: { id_db: id, deleted: false } 
  });
  if (!db) throw new Error("Database not found");
  
  let typeName: string | undefined;
  const idType: any = (db as any).id_type_db;
  if (idType) {
    const typeRef: any = await prismaPSQL.rEF_TYPE_DB.findFirst({ 
      where: { id_type_db: Number(idType), deleted: false } as any 
    });
    typeName = typeRef?.name_type_db;
  }
  const rawEnc: any = (db as any).url_connection_db;
  const parts = extractConnectionParts(rawEnc);
  const { url_connection_db, ...rest } = db as any;
  return { ...rest, name_type_db: typeName, connection: serialiseConnectionParts(parts) } as any;
};

export const createDatabase = async (data: any, userId: any) => {
  const typeId = data.id_type_db ? Number(data.id_type_db) : undefined;
  const machineId = data.id_machine ? Number(data.id_machine) : undefined;

  if (!data.connection) {
    throw new Error("Connection payload is required");
  }
  const connection = sanitizeConnectionInput(data.connection);
  if (!connection.host || !connection.user || !connection.password) {
    throw new Error("Connection host, user and password are required");
  }
  const connectionString = applyDefaultQueryParams(buildPostgresConnection(connection));
  const encryptedConn = encryptConnection(connectionString);

  const created = await prismaPSQL.dIM_DATABASE.create({
    data: {
      name_db: data.name_db,
      id_type_db: typeId,
      id_machine: machineId,
      version_db: data.version_db,
      description_db: data.description_db,
      url_connection_db: encryptedConn,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
  
  let typeName: string | undefined;
  const idType: any = (created as any).id_type_db;
  if (idType) {
    const typeRef: any = await prismaPSQL.rEF_TYPE_DB.findFirst({ 
      where: { id_type_db: Number(idType), deleted: false } as any 
    });
    typeName = typeRef?.name_type_db;
  }

  const parts = extractConnectionParts((created as any).url_connection_db);

  const { url_connection_db, ...rest } = created as any;
  return { ...rest, name_type_db: typeName, connection: serialiseConnectionParts(parts) } as any;
};

export const updateDatabase = async (id: any, data: any, userId: any) => {
  const current = await prismaPSQL.dIM_DATABASE.findFirst({ where: { id_db: id, deleted: false } });
  if (!current) throw new Error("Database not found");
  const existingParts = extractConnectionParts((current as any).url_connection_db);

  const typeId = data.id_type_db ? Number(data.id_type_db) : undefined;
  const machineId = data.id_machine ? Number(data.id_machine) : undefined;

  const updateData: any = {
    name_db: data.name_db,
    id_type_db: typeId,
    id_machine: machineId,
    version_db: data.version_db,
    description_db: data.description_db,
    modification_date: new Date(),
    user_modification: userId ? parseInt(userId) : undefined,
  };

  if (data.connection) {
    const rawConnection = data.connection as PostgresConnectionParts & { passwordChanged?: boolean };
    const passwordChanged = Boolean(rawConnection.passwordChanged);
    const sanitized = sanitizeConnectionInput(rawConnection);
    const password = passwordChanged ? sanitized.password : existingParts?.password;

    if (!password) {
      throw new Error("Existing password missing; please provide a new one");
    }

    const toBuild: PostgresConnectionParts = {
      host: sanitized.host || existingParts?.host || "",
      port: sanitized.port || existingParts?.port,
      database: sanitized.database || existingParts?.database,
      user: sanitized.user || existingParts?.user || "",
      password,
    };

    if (!toBuild.host || !toBuild.user) {
      throw new Error("Connection host and user are required");
    }

    const built = applyDefaultQueryParams(buildPostgresConnection(toBuild));
    updateData.url_connection_db = encryptConnection(built);
  }

  const updated = await prismaPSQL.dIM_DATABASE.update({
    where: { id_db: id },
    data: updateData,
  });

  let typeName: string | undefined;
  const idType: any = (updated as any).id_type_db;
  if (idType) {
    const typeRef: any = await prismaPSQL.rEF_TYPE_DB.findFirst({ 
      where: { id_type_db: Number(idType), deleted: false } as any 
    });
    typeName = typeRef?.name_type_db;
  }

  const rawEnc: any = (updated as any).url_connection_db;
  const parts = extractConnectionParts(rawEnc);

  const { url_connection_db, ...rest } = updated as any;
  return { ...rest, name_type_db: typeName, connection: serialiseConnectionParts(parts) } as any;
};

export const deleteDatabase = async (id: any, userId: any) => {
  const updated = await prismaPSQL.dIM_DATABASE.update({
    where: { id_db: id },
    data: {
      deleted: true,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
  return convertBigIntToString(updated);
};

// Database Type Referential
export const getAllRefDatabaseTypes = async () => {
  return await prismaPSQL.rEF_TYPE_DB.findMany({ where: { deleted: false } });
};

export const getRefDatabaseTypeById = async (id: any) => {
  const ref = await prismaPSQL.rEF_TYPE_DB.findFirst({ 
    where: { id_type_db: id, deleted: false } 
  });
  if (!ref) throw new Error("Database type not found");
  return ref;
};

export const createRefDatabaseType = async (data: any, userId: any) => {
  return await prismaPSQL.rEF_TYPE_DB.create({
    data: {
      name_type_db: data.name_type_db,
      description_type_db: data.description_type_db,
      creation_date: new Date(),
      user_creation: userId ? parseInt(userId) : undefined,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
};

export const updateRefDatabaseType = async (id: any, data: any, userId: any) => {
  return await prismaPSQL.rEF_TYPE_DB.update({
    where: { id_type_db: id },
    data: {
      name_type_db: data.name_type_db,
      description_type_db: data.description_type_db,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
};

export const deleteRefDatabaseType = async (id: any, userId: any) => {
  return await prismaPSQL.rEF_TYPE_DB.update({
    where: { id_type_db: id },
    data: {
      deleted: true,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
};

export const getAllDisabledRefDatabaseTypes = async () => {
  return await prismaPSQL.rEF_TYPE_DB.findMany({ where: { deleted: true } });
};

export const activateRefDatabaseType = async (id: any, userId: any) => {
  return await prismaPSQL.rEF_TYPE_DB.update({
    where: { id_type_db: id },
    data: {
      deleted: false,
      modification_date: new Date(),
      user_modification: userId ? parseInt(userId) : undefined,
    } as any,
  });
};

// Helper function
const convertBigIntToString = (obj: any) => {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  ));
};

export const testConnection = async (connection: PostgresConnectionParts, typeId?: number | string) => {
  console.log("Testing connection with typeId:", typeId);
  const sanitized = sanitizeConnectionInput(connection);
  if (!sanitized.password) {
    throw new Error("Password is required for connection test");
  }

  let typeName = "PostgreSQL";
  if (typeId) {
    const typeRef: any = await prismaPSQL.rEF_TYPE_DB.findFirst({
      where: { id_type_db: Number(typeId), deleted: false } as any
    });
    if (typeRef?.name_type_db) {
      console.log("Found type name:", typeRef.name_type_db);
      typeName = typeRef.name_type_db;
    }
  }

  if (typeName === "PostgreSQL") {
    const plainDsn = applyDefaultQueryParams(buildPostgresConnection(sanitized));
    const client = new Client({ connectionString: plainDsn });
    try {
      await client.connect();
      await client.query("SELECT 1");
      return { ok: true };
    } finally {
      await client.end().catch(() => undefined);
    }
  } else if (typeName === "SQL Server") {
    const config = {
      user: sanitized.user!,
      password: sanitized.password,
      server: sanitized.host || 'localhost',
      port: Number(sanitized.port) || 1433,
      database: sanitized.database || 'master',
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    };
    const pool = await new sql.ConnectionPool(config).connect();
    try {
      await pool.request().query('SELECT 1');
      return { ok: true };
    } finally {
      await pool.close();
    }
  } else if (typeName === "MySQL" || typeName === "MariaDB") {
    const connection = await mysql.createConnection({
      host: sanitized.host || 'localhost',
      user: sanitized.user,
      password: sanitized.password,
      database: sanitized.database,
      port: Number(sanitized.port) || 3306
    });
    try {
      await connection.execute('SELECT 1');
      return { ok: true };
    } finally {
      await connection.end();
    }
  } else {
    throw new Error(`Connection test not implemented for database type: ${typeName}`);
  }
};
