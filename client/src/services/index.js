export { sendChatMessage } from './geminiService';
export { calculateDistance, getUserLocation } from './mapsService';
export { fetchPollingBooths, fetchElectionNews, fetchTimeline } from './searchService';
export { 
  auth, 
  db, 
  analytics, 
  logFirebaseEvent, 
  signInWithGoogle, 
  logout, 
  saveChatMessage 
} from './firebaseService';
