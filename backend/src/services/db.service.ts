import { prismaPSQL } from "../prisma/client_psql";
import { decryptConnection, encryptConnection, isMaskedConnection, maskConnection } from "../utils/crypto";
import { Client } from "pg";

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
    let maskedConn: string | undefined;
    try {
      if (url_connection_db) {
        const plain = decryptConnection(String(url_connection_db));
        maskedConn = maskConnection(plain);
      }
    } catch {
      maskedConn = undefined;
    }
    return { ...rest, name_type_db: typeName, url_connection_db: maskedConn };
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
  let maskedConn: string | undefined;
  try {
    if (rawEnc) {
      const plain = decryptConnection(String(rawEnc));
      maskedConn = maskConnection(plain);
    }
  } catch {
    maskedConn = undefined;
  }
  const { url_connection_db, ...rest } = db as any;
  return { ...rest, name_type_db: typeName, url_connection_db: maskedConn } as any;
};

export const createDatabase = async (data: any, userId: any) => {
  const typeId = data.id_type_db ? Number(data.id_type_db) : undefined;
  const machineId = data.id_machine ? Number(data.id_machine) : undefined;
  
  let encryptedConn: string | undefined;
  if (data.url_connection_db) {
    encryptedConn = encryptConnection(String(data.url_connection_db));
  }

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

  let maskedConn: string | undefined;
  try {
    if (encryptedConn) {
      const plain = decryptConnection(encryptedConn);
      maskedConn = maskConnection(plain);
    }
  } catch {
    maskedConn = undefined;
  }

  const { url_connection_db, ...rest } = created as any;
  return { ...rest, name_type_db: typeName, url_connection_db: maskedConn } as any;
};

export const updateDatabase = async (id: any, data: any, userId: any) => {
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

  if (typeof data.url_connection_db === "string") {
    const trimmed = data.url_connection_db.trim();
    if (trimmed && !isMaskedConnection(trimmed)) {
      updateData.url_connection_db = encryptConnection(trimmed);
    }
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
  let maskedConn: string | undefined;
  try {
    if (rawEnc) {
      const plain = decryptConnection(String(rawEnc));
      maskedConn = maskConnection(plain);
    }
  } catch {
    maskedConn = undefined;
  }

  const { url_connection_db, ...rest } = updated as any;
  return { ...rest, name_type_db: typeName, url_connection_db: maskedConn } as any;
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

export const testConnectionString = async (plainDsn: string) => {
  const client = new Client({ connectionString: plainDsn });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return { ok: true };
  } finally {
    await client.end().catch(() => undefined);
  }
};
