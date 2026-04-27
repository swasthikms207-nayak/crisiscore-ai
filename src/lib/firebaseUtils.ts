
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  sessionInfo: {
    name: string;
  }
}

/**
 * Handles Firestore errors by formatting them for tactical debugging.
 */
export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const saved = localStorage.getItem('crisis_tactical_session');
  let name = 'UNKNOWN';
  
  if (saved) {
    try {
      name = JSON.parse(saved).name;
    } catch (e) {}
  }
  
  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore Error',
    operationType,
    path,
    sessionInfo: {
      name
    }
  };

  const errorString = JSON.stringify(errorInfo, null, 2);
  console.error('[ CRISIS CORE ] Firestore Operation Failed:', errorString);
  throw new Error(errorString);
}
