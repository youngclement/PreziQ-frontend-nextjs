import { Client } from '@stomp/stompjs';
import { sessionsApi } from '@/api-client';

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
  sessionId: string;
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
  participantId: string;
  participantName: string;
  totalScore: number;
  finalRanking: number;
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
  private onParticipantsUpdate?: (participants: SessionParticipant[]) => void;
  private onSessionStart?: (session: SessionSummary) => void;
  private onNextActivity?: (activity: any) => void;
  private onSessionEnd?: (session: SessionSummary) => void;
  private onSessionSummary?: (summaries: EndSessionSummary[]) => void;
  private errorSubscription: any;
  private participantsSubscription: any;
  private isConnected: boolean = false;
  private onConnectionStatusChange?: (status: string) => void;
  private onError?: (error: string) => void;

  constructor(sessionCode: string, sessionId: string = '') {
    this.sessionCode = sessionCode;
    this.sessionId = sessionId;
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (str.startsWith('>>> MESSAGE')) {
          console.log('Received WebSocket Message:', str);
        } else if (str.startsWith('>>> SEND')) {
          console.log('Sending WebSocket Message:', str);
        } else if (str.startsWith('>>> SUBSCRIBE')) {
          console.log('Subscribing to WebSocket Topic:', str);
        } else {
          console.log('WebSocket Debug:', str);
        }
      },
      onConnect: (frame) => {
        console.log('Connected to WebSocket with frame:', frame);
        this.isConnected = true;
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('Connected');
        }

        const websocketSessionId = frame.headers['user-name'] || 'default';
        this.errorSubscription = this.client.subscribe(
          `/client/${websocketSessionId}/private/errors`,
          (message) => {
            try {
              console.log('Received error message:', message);
              const errorData = JSON.parse(message.body);
              const errorMessage =
                errorData.errors?.[0]?.message || 'An error occurred';
              if (this.onError) {
                this.onError(errorMessage);
              }
              console.error('WebSocket error:', errorMessage);
            } catch (e) {
              if (this.onError) {
                this.onError('Failed to process error message');
              }
              console.error('Error parsing error message:', e);
            }
          },
          { id: 'error-subscription' }
        );

        if (this.sessionCode) {
          this.subscribeToAllTopics();
        }
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        this.isConnected = false;
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('Disconnected');
        }
        this.cleanupSubscriptions();
      },
      onStompError: (frame) => {
        const errorMessage = `WebSocket connection error: ${
          frame.body || 'Unknown error'
        }. Please try again.`;
        if (this.onError) {
          this.onError(errorMessage);
        }
        if (this.onConnectionStatusChange) {
          this.onConnectionStatusChange('Connection error');
        }
        console.error('STOMP error:', frame);
      },
      onWebSocketError: (evt) => {
        if (!this.isConnected) {
          const errorMessage =
            'Failed to connect to WebSocket. Please check your network and try again.';
          if (this.onError) {
            this.onError(errorMessage);
          }
          if (this.onConnectionStatusChange) {
            this.onConnectionStatusChange('Failed to connect');
          }
          console.error('WebSocket error:', evt);
        }
      },
    });
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
      `/public/session/${this.sessionCode}/summary`,
      (message) => {
        try {
          console.log('Received session summary message:', message);
          const response = JSON.parse(message.body);
          if (this.onSessionSummary) {
            this.onSessionSummary(response.data);
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

  public async joinSession(participantName: string) {
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

    const message = {
      sessionCode: this.sessionCode,
      displayName: participantName,
      displayAvatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${Math.random()
        .toString(36)
        .substring(7)}`,
    };
    console.log('Sending join session message:', message);
    this.client.publish({
      destination: '/server/session/join',
      body: JSON.stringify(message),
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
      return;
    }

    this.client.publish({
      destination: '/server/session/submit',
      body: JSON.stringify(submission),
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
        sessionId,
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
    if (!this.client.connected) {
      await this.client.activate();
    }
  }

  public disconnect() {
    this.cleanupSubscriptions();
    if (this.client.connected) {
      this.client.deactivate();
    }
  }
}
