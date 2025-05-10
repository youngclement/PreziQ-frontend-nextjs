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
  type?: string;
  answerContent?: string;
  locationAnswers?: Array<{
    latitude: number;
    longitude: number;
    radius: number;
  }>;
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
  name: string;
  description: string;
  iconUrl: string;
  requiredPoints: number;
}

export interface UserAchievements {
  userId: string;
  totalPoints: number;
  newAchievements: Achievement[];
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  meta: {
    timestamp: string;
    instance: string;
  };
}

export interface RankedParticipant extends SessionParticipant {
  realtimeRanking: number;
}

export class LeaderboardManager {
  private static instance: LeaderboardManager;
  private participants: RankedParticipant[] = [];
  private subscribers: Set<(participants: RankedParticipant[]) => void> =
    new Set();
  private lastUpdateTime: number = Date.now();
  private updateCount: number = 0;
  private updateQueue: SessionParticipant[][] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  private updateThrottleMs: number = 300; // Giới hạn tốc độ cập nhật

  private constructor() {}

  public static getInstance(): LeaderboardManager {
    if (!LeaderboardManager.instance) {
      LeaderboardManager.instance = new LeaderboardManager();
    }
    return LeaderboardManager.instance;
  }

  public updateParticipants(participants: SessionParticipant[]) {
    if (!Array.isArray(participants)) {
      console.warn('[LeaderboardManager] Dữ liệu không hợp lệ:', participants);
      return;
    }

    // Thêm dữ liệu mới vào hàng đợi
    this.updateQueue.push(participants);

    // Sử dụng kỹ thuật throttle để giới hạn tần suất cập nhật UI
    if (!this.updateTimer) {
      this.processNextUpdate();

      // Đặt timer để xử lý các cập nhật tiếp theo sau khoảng thời gian throttle
      this.updateTimer = setTimeout(() => {
        this.updateTimer = null;
        // Nếu còn cập nhật trong hàng đợi, xử lý tiếp
        if (this.updateQueue.length > 0) {
          this.processNextUpdate();
        }
      }, this.updateThrottleMs);
    }
  }

  private processNextUpdate() {
    if (this.updateQueue.length === 0) return;

    // Lấy cập nhật mới nhất từ hàng đợi và xóa tất cả cập nhật cũ
    const latestUpdate = this.updateQueue.pop();
    this.updateQueue = [];

    if (!latestUpdate) return;

    const sanitizedParticipants = latestUpdate.map((p) => ({
      ...p,
      displayName: p.displayName || 'Unknown',
      displayAvatar:
        p.displayAvatar || 'https://api.dicebear.com/9.x/pixel-art/svg',
      realtimeScore: typeof p.realtimeScore === 'number' ? p.realtimeScore : 0,
    }));

    const sortedParticipants = [...sanitizedParticipants].sort(
      (a, b) => b.realtimeScore - a.realtimeScore
    );

    const rankedParticipants = sortedParticipants.map((participant, index) => ({
      ...participant,
      realtimeRanking: index + 1,
    }));

    this.updateCount++;
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Chỉ ghi log khi có sự thay đổi thực sự
    const hasChanges = this.hasScoreChanges(
      this.participants,
      rankedParticipants
    );

    if (hasChanges) {
      console.log(
        `[LeaderboardManager] Cập nhật #${this.updateCount}, sau ${timeSinceLastUpdate}ms:`,
        rankedParticipants.map((p) => ({
          name: p.displayName,
          score: p.realtimeScore,
          rank: p.realtimeRanking,
        }))
      );

      this.participants = rankedParticipants;
      this.notifySubscribers();
    } else {
      console.log('[LeaderboardManager] Bỏ qua cập nhật không có thay đổi.');
    }
  }

  // Kiểm tra xem có sự thay đổi điểm số hoặc thứ hạng so với dữ liệu trước đó
  private hasScoreChanges(
    oldParticipants: RankedParticipant[],
    newParticipants: RankedParticipant[]
  ): boolean {
    // Nếu số lượng người tham gia thay đổi, có sự thay đổi
    if (oldParticipants.length !== newParticipants.length) {
      return true;
    }

    // Tạo map điểm số cũ
    const oldScores = new Map<string, number>();
    const oldRanks = new Map<string, number>();

    oldParticipants.forEach((p) => {
      oldScores.set(p.displayName, p.realtimeScore);
      oldRanks.set(p.displayName, p.realtimeRanking);
    });

    // Kiểm tra từng người tham gia mới
    for (const newP of newParticipants) {
      const oldScore = oldScores.get(newP.displayName);
      const oldRank = oldRanks.get(newP.displayName);

      // Nếu người tham gia mới, có sự thay đổi
      if (oldScore === undefined) {
        return true;
      }

      // Nếu điểm hoặc thứ hạng thay đổi, có sự thay đổi
      if (oldScore !== newP.realtimeScore || oldRank !== newP.realtimeRanking) {
        return true;
      }
    }

    return false;
  }

  public subscribe(callback: (participants: RankedParticipant[]) => void) {
    this.subscribers.add(callback);

    if (this.participants.length > 0) {
      callback(this.participants);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.participants);
      } catch (error) {
        console.error('[LeaderboardManager] Lỗi khi gọi callback:', error);
      }
    });
  }

  public getParticipants(): RankedParticipant[] {
    return [...this.participants];
  }

  public getUpdateCount(): number {
    return this.updateCount;
  }

  // Cho phép điều chỉnh thời gian throttle
  public setUpdateThrottle(ms: number) {
    if (ms > 0) {
      this.updateThrottleMs = ms;
    }
  }
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
  private onAchievement?: (achievement: UserAchievements) => void;
  private errorSubscription: any;
  private participantsSubscription: any;
  private isConnected: boolean = false;
  private onConnectionStatusChange?: (status: string) => void;
  private onError?: (error: string) => void;
  private connectionProcessing: boolean = false;
  private connecting: boolean = false;
  private participantsEventCount: number = 0;
  private currentActivityId: string | null = null;
  private totalParticipantsCount: number = 0;

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
            // Xử lý định dạng thành tựu từ server
            const achievementData = response.data;

            // Đảm bảo newAchievements là một mảng
            if (achievementData.newAchievements === undefined) {
              achievementData.newAchievements = [];
            }

            if (this.onAchievement) {
              this.onAchievement(achievementData);
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
          console.log('[WebSocket] Nhận message participants:', message);
          const response = JSON.parse(message.body);
          console.log('[WebSocket] Parsed response:', response);
          const participantsData = response.data || [];
          console.log(
            '[WebSocket] Participants data trước khi gửi:',
            participantsData
          );

          if (Array.isArray(participantsData)) {
            // Cập nhật tổng số người tham gia
            this.totalParticipantsCount = participantsData.length;

            participantsData.forEach((participant, index) => {
              console.log(`[WebSocket] Participant ${index}:`, {
                id: participant.id,
                displayName: participant.displayName,
                realtimeScore: participant.realtimeScore,
              });
            });
          }

          // Tăng bộ đếm sự kiện participants
          this.participantsEventCount++;
          console.log(
            `[WebSocket] Số lần nhận sự kiện participants: ${this.participantsEventCount}/${this.totalParticipantsCount}`
          );

          LeaderboardManager.getInstance().updateParticipants(participantsData);

          if (this.onParticipantsUpdate) {
            this.onParticipantsUpdate(participantsData);
          }
        } catch (e) {
          console.error('[WebSocket] Error parsing participants:', e);
          if (this.onError) {
            this.onError('Failed to process participants data');
          }
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

  public onAchievementHandler(
    callback: (achievement: UserAchievements) => void
  ) {
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

    // Reset bộ đếm khi chuyển hoạt động mới
    this.participantsEventCount = 0;
    this.currentActivityId = activityId || null;
    // Giữ nguyên totalParticipantsCount để duy trì tổng số người tham gia
    console.log(
      `[WebSocket] Reset bộ đếm sự kiện participants khi chuyển hoạt động mới, tổng số người tham gia: ${this.totalParticipantsCount}`
    );

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

  public getParticipantsEventCount(): number {
    return this.participantsEventCount;
  }

  public getTotalParticipantsCount(): number {
    return this.totalParticipantsCount;
  }

  public getParticipantsEventRatio(): {
    count: number;
    total: number;
    percentage: number;
  } {
    const total = Math.max(1, this.totalParticipantsCount); // Tránh chia cho 0
    const percentage = Math.min(
      100,
      Math.round((this.participantsEventCount / total) * 100)
    );
    return {
      count: this.participantsEventCount,
      total: this.totalParticipantsCount,
      percentage,
    };
  }

  public getCurrentActivityId(): string | null {
    return this.currentActivityId;
  }

  public resetParticipantsEventCount(): void {
    this.participantsEventCount = 0;
    // Không reset totalParticipantsCount để giữ nguyên tổng số người tham gia
    console.log(
      `[WebSocket] Đã reset bộ đếm sự kiện participants về 0/${this.totalParticipantsCount}`
    );
  }
}
