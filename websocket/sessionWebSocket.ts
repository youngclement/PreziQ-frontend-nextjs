import { Client } from '@stomp/stompjs';
import { sessionsApi } from '@/api-client';
import { v4 as uuidv4 } from 'uuid';

export interface SessionParticipant {
  id: string;
  displayName: string;
  displayAvatar: string;
  realtimeScore: number;
  realtimeRanking: number;
  user?: {
    userId: string;
  };
}

export interface ActivitySubmission {
  sessionId?: string;
  sessionCode?: string;
  activityId: string;
  answerContent?: string;
}

export interface SessionSummary {
  sessionCode: string;
  status: string;
  currentActivityId?: string;
  sessionId: string;
  startTime: string;
  sessionStatus: string;
}

export interface EndSessionSummary {
  sessionParticipantId: string;
  displayName: string;
  displayAvatar: string;
  finalScore: number;
  finalRanking: number;
  finalCorrectCount: number;
  finalIncorrectCount: number;
}

export interface Achievement {
  achievementId: string;
  achievementName: string;
  achievementDescription: string;
  achievementIcon: string;
  timestamp: string;
  userId: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  meta: {
    timestamp: string;
    instance: string;
  };
}

export class SessionWebSocket {
  private client: Client;
  private sessionCode: string;
  private sessionId: string;
  private stompClientId: string;
  private onParticipantsUpdate?: (participants: SessionParticipant[]) => void;
  private onSessionStart?: (session: SessionSummary) => void;
  private onNextActivity?: (activity: any) => void;
  private onSessionEnd?: (session: SessionSummary) => void;
  private onSessionSummary?: (summaries: EndSessionSummary[]) => void;
  private onAchievement?: (achievement: Achievement) => void;
  private errorSubscription: any;
  private participantsSubscription: any;
  private isConnected: boolean = false;
  private onConnectionStatusChange?: (status: string) => void;
  private onError?: (error: string) => void;
  private connectionProcessing: boolean = false;
  private connecting: boolean = false;

  constructor(sessionCode: string, sessionId: string = '') {
    this.sessionCode = sessionCode;
    this.sessionId = sessionId;
    this.stompClientId = uuidv4();

    this.client = new Client({
      // brokerURL: 'ws://localhost:8080/ws',
      brokerURL: 'wss://preziq.duckdns.org/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        stompClientId: this.stompClientId,
      },
      debug: (str) => {
        if (str.startsWith('>>> MESSAGE')) {
          console.log('Received WebSocket Message:', str);
        } else if (str.startsWith('>>> SEND')) {
          console.log('Sending WebSocket Message:', str);
        } else if (str.startsWith('>>> SUBSCRIBE')) {
          console.log('Subscribing to WebSocket Topic:', str);
        } else if (str.includes('Web Socket Opened')) {
          console.log('WebSocket connection opened');
        } else if (str.includes('Web Socket Closed')) {
          console.log('WebSocket connection closed');
          this.isConnected = false;
          if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange('Disconnected');
          }
        } else {
          console.log('WebSocket Debug:', str);
        }
      },
      onConnect: (frame) => {
        console.log('Connected to WebSocket with frame:', frame);
        console.log('Connected with stompClientId:', this.stompClientId);
        this.isConnected = true;
        this.connectionProcessing = false;
        this.connecting = false;
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('Connected');
        }

        this.subscribeToErrorsChannel();
        this.subscribeToAchievementChannel();

        if (this.sessionCode) {
          setTimeout(() => {
            this.subscribeToAllTopics();
          }, 500);
        }
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        this.isConnected = false;
        this.connectionProcessing = false;
        this.connecting = false;
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('Disconnected');
        }
        this.cleanupSubscriptions();
      },
      onStompError: (frame) => {
        const errorMessage = `WebSocket connection error: ${
          frame.body || 'Unknown error'
        }. Please try again.`;
        this.isConnected = false;
        this.connectionProcessing = false;
        this.connecting = false;
        if (this.onError) {
          this.onError(errorMessage);
        }
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('Connection error');
        }
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (evt) => {
        const errorMessage =
          'Failed to connect to WebSocket. Please check your network and try again.';
        this.isConnected = false;
        this.connectionProcessing = false;
        this.connecting = false;
        if (this.onError) {
          this.onError(errorMessage);
        }
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('Failed to connect');
        }
        console.error('WebSocket error:', evt);
      },
    });
  }

  private subscribeToErrorsChannel() {
    if (!this.client.connected) {
      console.warn('Cannot subscribe to errors: client not connected');
      return;
    }

    this.errorSubscription = this.client.subscribe(
      `/client/private/errors`,
      (message) => {
        try {
          console.log('Received error message:', message);
          console.log('Raw message body:', message.body);
          const apiResponse = JSON.parse(message.body);
          console.log('Parsed API response:', apiResponse);

          if (
            !apiResponse.success &&
            apiResponse.errors &&
            apiResponse.errors.length > 0
          ) {
            const errorDetail = apiResponse.errors[0];
            const errorMessage = `Error: ${errorDetail.message} (Code: ${errorDetail.code})`;
            if (this.onError) {
              this.onError(errorMessage);
            }
            console.error('WebSocket error:', errorMessage);
          } else {
            const errorMessage = 'An error occurred';
            if (this.onError) {
              this.onError(errorMessage);
            }
            console.error(
              'WebSocket error with unexpected format:',
              apiResponse
            );
          }
        } catch (e) {
          if (this.onError) {
            this.onError('Failed to process error message');
          }
          console.error('Error parsing error message:', e);
        }
      },
      { id: 'error-subscription' }
    );
  }

  private subscribeToAchievementChannel() {
    if (!this.client.connected) {
      console.warn('Cannot subscribe to achievements: client not connected');
      return;
    }

    this.client.subscribe(
      `/client/private/achievement`,
      (message) => {
        try {
          console.log('Received achievement message:', message);
          console.log('Raw achievement body:', message.body);
          const response = JSON.parse(message.body);
          console.log('Parsed achievement response:', response);

          if (response.success && response.data) {
            if (this.onAchievement) {
              this.onAchievement(response.data);
            }
          } else {
            console.error('Invalid achievement format:', response);
          }
        } catch (e) {
          console.error('Error parsing achievement message:', e);
        }
      },
      { id: 'achievement-subscription' }
    );
  }

  private cleanupSubscriptions() {
    if (this.errorSubscription) {
      this.errorSubscription.unsubscribe();
      this.errorSubscription = null;
    }
    if (this.participantsSubscription) {
      this.participantsSubscription.unsubscribe();
      this.participantsSubscription = null;
    }
  }

  private subscribeToAllTopics() {
    if (!this.sessionCode || !this.client.connected) {
      console.warn(
        'Cannot subscribe: sessionCode is empty or client not connected'
      );
      return;
    }

    console.log('Subscribing to topics for session:', this.sessionCode);

    this.participantsSubscription = this.client.subscribe(
      `/public/session/${this.sessionCode}/participants`,
      (message) => {
        try {
          console.log('Received participants message:', message);
          const response = JSON.parse(message.body);
          const participantsData = response.data || [];
          console.log('Participants data:', participantsData);
          if (this.onParticipantsUpdate) {
            this.onParticipantsUpdate(participantsData);
          }
        } catch (e) {
          if (this.onError) {
            this.onError('Failed to process participants data');
          }
          console.error('Error parsing participants:', e);
        }
      },
      { id: 'participants-subscription' }
    );

    console.log(
      'Subscribing to start topic:',
      `/public/session/${this.sessionCode}/start`
    );
    this.client.subscribe(
      `/public/session/${this.sessionCode}/start`,
      (message) => {
        try {
          console.log('Received session start message:', message);
          const response = JSON.parse(message.body);
          console.log('Parsed session start response:', response);
          if (this.onSessionStart) {
            this.onSessionStart(response.data);
          }
        } catch (e) {
          if (this.onError) {
            this.onError('Failed to process session start data');
          }
          console.error('Error parsing session start:', e);
        }
      },
      { id: 'session-start-subscription' }
    );

    this.client.subscribe(
      `/public/session/${this.sessionCode}/nextActivity`,
      (message) => {
        try {
          console.log('Received next activity message:', message);
          const response = JSON.parse(message.body);
          if (this.onNextActivity) {
            this.onNextActivity(response.data);
          }
        } catch (e) {
          if (this.onError) {
            this.onError('Failed to process next activity data');
          }
          console.error('Error parsing next activity:', e);
        }
      },
      { id: 'next-activity-subscription' }
    );

    this.client.subscribe(
      `/public/session/${this.sessionCode}/end`,
      (message) => {
        try {
          console.log('Received session end message:', message);
          const response = JSON.parse(message.body);
          if (this.onSessionEnd) {
            this.onSessionEnd(response.data);
          }
        } catch (e) {
          if (this.onError) {
            this.onError('Failed to process session end data');
          }
          console.error('Error parsing session end:', e);
        }
      },
      { id: 'session-end-subscription' }
    );

    this.client.subscribe(
      `/client/private/summary`,
      (message) => {
        try {
          console.log('Received session summary message:', message);
          const response = JSON.parse(message.body);
          console.log('Parsed summary response:', response);

          if (response.success && response.data) {
            // Đảm bảo data là một mảng
            const summaries = Array.isArray(response.data)
              ? response.data
              : [response.data];
            if (this.onSessionSummary) {
              this.onSessionSummary(summaries);
            }
          } else {
            console.error('Invalid summary format:', response);
            if (this.onError) {
              this.onError('Failed to process session summary data');
            }
          }
        } catch (e) {
          if (this.onError) {
            this.onError('Failed to process session summary data');
          }
          console.error('Error parsing session summary:', e);
        }
      },
      { id: 'session-summary-subscription' }
    );
  }

  public onParticipantsUpdateHandler(
    callback: (participants: SessionParticipant[]) => void
  ) {
    this.onParticipantsUpdate = callback;
  }

  public onConnectionStatusChangeHandler(callback: (status: string) => void) {
    this.onConnectionStatusChange = callback;
  }

  public onErrorHandler(callback: (error: string) => void) {
    this.onError = callback;
  }

  public onSessionStartHandler(callback: (session: SessionSummary) => void) {
    this.onSessionStart = callback;
  }

  public onNextActivityHandler(callback: (activity: any) => void) {
    this.onNextActivity = callback;
  }

  public onSessionEndHandler(callback: (session: SessionSummary) => void) {
    this.onSessionEnd = callback;
  }

  public onSessionSummaryHandler(
    callback: (summaries: EndSessionSummary[]) => void
  ) {
    this.onSessionSummary = callback;
  }

  public onAchievementHandler(callback: (achievement: Achievement) => void) {
    this.onAchievement = callback;
  }

  public async joinSession(
    participantName: string,
    userId: string | null = null,
    displayAvatar?: string
  ) {
    if (!this.sessionCode) {
      if (this.onError) {
        this.onError('Session code is required');
      }
      return;
    }

    if (!this.isConnected || !this.client.connected) {
      if (this.onError) {
        this.onError(
          'WebSocket not connected. Please wait or refresh the page.'
        );
      }
      return;
    }

    let avatarToUse = displayAvatar;
    if (!avatarToUse) {
      const randomSeed = Math.random().toString(36).substring(2, 10);
      avatarToUse = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${randomSeed}`;
    }

    const message = {
      sessionCode: this.sessionCode,
      displayName: participantName,
      displayAvatar: avatarToUse,
      userId: userId,
    };

    console.log('Sending join session message:', message);

    this.client.publish({
      destination: '/server/session/join',
      body: JSON.stringify(message),
    });

    if (this.onConnectionStatusChange) {
      this.onConnectionStatusChange(`Joining session as: ${participantName}`);
    }

    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }

  public async leaveSession() {
    if (!this.isConnected || !this.client.connected) {
      if (this.onError) {
        this.onError(
          'WebSocket not connected. Please wait or refresh the page.'
        );
      }
      return;
    }

    this.client.publish({
      destination: '/server/session/leave',
      body: JSON.stringify({
        sessionCode: this.sessionCode,
      }),
    });

    this.cleanupSubscriptions();
  }

  public async startSession() {
    if (!this.isConnected || !this.client.connected) {
      if (this.onError) {
        this.onError(
          'WebSocket not connected. Please wait or refresh the page.'
        );
      }
      return;
    }

    this.client.publish({
      destination: '/server/session/start',
      body: JSON.stringify({
        sessionId: this.sessionId,
      }),
    });
  }

  public async submitActivity(submission: ActivitySubmission) {
    if (!this.isConnected || !this.client.connected) {
      if (this.onError) {
        this.onError(
          'WebSocket not connected. Please wait or refresh the page.'
        );
      }
      throw new Error('WebSocket not connected');
    }

    console.log('Sending activity submission:', submission);

    this.client.publish({
      destination: '/server/session/submit',
      body: JSON.stringify({
        sessionCode: this.sessionCode,
        activityId: submission.activityId,
        answerContent: submission.answerContent,
      }),
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }

  public async nextActivity(sessionId: string, activityId?: string) {
    console.log('nextActivity called with sessionId:', sessionId);
    console.log(
      'WebSocket connection status:',
      this.isConnected,
      this.client.connected
    );

    if (!this.isConnected || !this.client.connected) {
      if (this.onError) {
        this.onError(
          'WebSocket not connected. Please wait or refresh the page.'
        );
      }
      return;
    }

    const payload: any = {
      sessionId: sessionId,
    };

    if (activityId) {
      payload.activityId = activityId;
    }

    console.log('Sending nextActivity payload:', payload);

    this.client.publish({
      destination: '/server/session/nextActivity',
      body: JSON.stringify(payload),
    });
  }

  public async endSession(sessionId: string) {
    if (!this.isConnected || !this.client.connected) {
      if (this.onError) {
        this.onError(
          'WebSocket not connected. Please wait or refresh the page.'
        );
      }
      return;
    }

    this.client.publish({
      destination: '/server/session/complete',
      body: JSON.stringify({
        sessionId: sessionId,
      }),
    });
  }

  public updateSessionCode(newSessionCode: string) {
    if (!newSessionCode) {
      if (this.onError) {
        this.onError('Session code is required');
      }
      return;
    }
    this.sessionCode = newSessionCode;
    this.subscribeToAllTopics();
  }

  public updateSessionId(newSessionId: string) {
    if (!newSessionId) {
      if (this.onError) {
        this.onError('Session ID is required');
      }
      return;
    }
    this.sessionId = newSessionId;
  }

  public async connect() {
    if (this.client.connected) {
      console.log('WebSocket already connected');
      this.isConnected = true;
      if (this.onConnectionStatusChange) {
        this.onConnectionStatusChange('Connected');
      }
      return;
    }

    if (this.connectionProcessing || this.connecting) {
      console.log('Connection already in progress');
      return;
    }

    this.connectionProcessing = true;
    this.connecting = true;

    if (this.onConnectionStatusChange) {
      this.onConnectionStatusChange('Connecting...');
    }

    try {
      await this.client.activate();
    } catch (err: any) {
      this.connectionProcessing = false;
      this.connecting = false;
      this.isConnected = false;
      console.error('Connection failed:', err);
      if (this.onError) {
        this.onError('Connection failed: ' + (err.message || 'Unknown error'));
      }
      if (this.onConnectionStatusChange) {
        this.onConnectionStatusChange('Failed to connect');
      }
      throw err;
    }
  }

  public disconnect() {
    this.cleanupSubscriptions();
    this.isConnected = false;
    if (this.client.connected) {
      this.client.deactivate();
    }
  }

  public isClientConnected(): boolean {
    const clientConnected = this.client && this.client.connected;
    console.log('isClientConnected check:', {
      internalState: this.isConnected,
      clientState: clientConnected,
      result: this.isConnected && clientConnected,
    });
    return this.isConnected && clientConnected;
  }

  public getSessionCode(): string {
    return this.sessionCode;
  }
}
