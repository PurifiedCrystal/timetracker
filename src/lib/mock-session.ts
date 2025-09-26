// TEMPORARY: Mock session storage for demo purposes
// This would normally be stored in a database or Redis

let activeSession: any = null;

export function getActiveSession() {
  return activeSession;
}

export function setActiveSession(session: any) {
  activeSession = session;
}

export function clearActiveSession() {
  activeSession = null;
}