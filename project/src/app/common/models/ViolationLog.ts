export interface ViolationLog {
  violationId: number;
  violationType: 'EYE_GAZE' | 'VOICE' | 'FACE_PRESENCE';
  message: string;
  timestamp: string;
  sessionId: string;
}

