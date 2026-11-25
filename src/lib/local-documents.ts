export type LocalDocumentCategory = 'CONTRACT' | 'IDENTITY' | 'PROPERTY' | 'OTHER';
export type LocalDocument = {
  id: string;
  userId: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  category: LocalDocumentCategory;
  propertyId: string | null;
  customerId: string | null;
  transactionId?: string | null;
  savedAt: string;
  blob: Blob;
};

const databaseName = 'melkino-private-browser-documents';
const storeName = 'documents';

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('ذخیره‌سازی محلی این مرورگر در دسترس نیست.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        const store = database.createObjectStore(storeName, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('پایگاه اسناد مرورگر باز نشد.'));
    request.onblocked = () => reject(new Error('پایگاه اسناد در زبانهٔ دیگری در حال به‌روزرسانی است.'));
  });
}

export async function listLocalDocuments(userId: string): Promise<LocalDocument[]> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).index('userId').getAll(userId);
      request.onsuccess = () => resolve((request.result as LocalDocument[]).sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
      request.onerror = () => reject(request.error || new Error('فهرست اسناد خوانده نشد.'));
      transaction.onabort = () => reject(transaction.error || new Error('خواندن اسناد کامل نشد.'));
    });
  } finally {
    database.close();
  }
}

export async function saveLocalDocument(document: LocalDocument): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(document);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('ذخیرهٔ سند انجام نشد.'));
      transaction.onabort = () => reject(transaction.error || new Error('ذخیرهٔ سند لغو شد؛ فضای مرورگر را بررسی کنید.'));
    });
  } finally {
    database.close();
  }
}

export async function getLocalDocument(userId: string, id: string): Promise<LocalDocument | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).get(id);
      request.onsuccess = () => {
        const result = request.result as LocalDocument | undefined;
        resolve(result?.userId === userId ? result : null);
      };
      request.onerror = () => reject(request.error || new Error('سند خوانده نشد.'));
      transaction.onabort = () => reject(transaction.error || new Error('خواندن سند کامل نشد.'));
    });
  } finally {
    database.close();
  }
}

export async function deleteLocalDocument(userId: string, id: string): Promise<boolean> {
  const document = await getLocalDocument(userId, id);
  if (!document) return false;
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('حذف سند انجام نشد.'));
      transaction.onabort = () => reject(transaction.error || new Error('حذف سند لغو شد.'));
    });
    return true;
  } finally {
    database.close();
  }
}
