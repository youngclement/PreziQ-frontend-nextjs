import { Client } from '@stomp/stompjs';
import { v4 as uuidv4 } from 'uuid';
import {
  LeaderboardCalculations,
  HostRankingData,
  RankingChange,
  SessionParticipant,
  RankedParticipant,
  RankingChangeData,
} from './leaderboardCalculations';

// Re-export các interface và type từ leaderboardCalculations để không cần thay đổi import từ các file khác
export type {
  HostRankingData,
  RankingChange,
  SessionParticipant,
  RankedParticipant,
  RankingChangeData,
} from './leaderboardCalculations';

export interface ActivitySubmission {
  sessionId?: string;
  sessionCode?: string;
  activityId: string;
  type?: string;
  answerContent?: string; // Dùng cho tất cả loại quiz, bao gồm location (định dạng: "longitude,latitude")
  locationAnswers?: Array<{
    latitude: number;
    longitude: number;
    radius: number;
  }>; // Giữ lại để tương thích ngược
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
  private rankingHistory: Record<string, RankedParticipant[]> = {};
  private lastActivityId: string | null = null;
  private latestRankingChangeData: RankingChangeData | null = null;
  private rankingChangeSubscribers: Set<(data: RankingChangeData) => void> =
    new Set();
  private activityTransitionHistory: Record<
    string,
    {
      participants: RankedParticipant[];
      timestamp: number;
      previousPositions?: Record<string, number>;
    }
  > = {};
  private isHostParticipating: boolean = true;

  // Dữ liệu lưu trữ cho xếp hạng host
  private hostRankingData: HostRankingData = {
    current: null,
    previous: null,
    initialized: false,
  };

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

    // Sử dụng LeaderboardCalculations để xử lý participants
    const rankedParticipants = LeaderboardCalculations.processParticipants(
      latestUpdate,
      this.isHostParticipating
    );

    this.updateCount++;
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Chỉ ghi log khi có sự thay đổi thực sự
    const hasChanges = LeaderboardCalculations.hasScoreChanges(
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

  public saveCurrentRankingSnapshot(activityId: string): void {
    if (!activityId) return;

    // Sao chép participants hiện tại để lưu vào history
    this.rankingHistory[activityId] = [...this.participants];

    // Lưu thứ hạng hiện tại để sử dụng cho lần tiếp theo
    const currentRanks: Record<string, { position: number; ranking: number }> =
      {};
    this.participants.forEach((p, index) => {
      currentRanks[p.displayName] = {
        position: index,
        ranking: p.realtimeRanking,
      };
    });

    console.log(
      `[LeaderboardManager] Đã lưu snapshot thứ hạng cho activity: ${activityId}`,
      this.rankingHistory[activityId].map((p) => ({
        name: p.displayName,
        rank: p.realtimeRanking,
        score: p.realtimeScore,
      }))
    );

    // Nếu có activityId trước đó, tính toán thay đổi thứ hạng
    if (this.lastActivityId && this.lastActivityId !== activityId) {
      const rankingChanges = LeaderboardCalculations.calculateRankingChanges(
        this.participants,
        this.rankingHistory,
        this.lastActivityId,
        activityId
      );
      this.latestRankingChangeData = {
        ...rankingChanges,
        previousActivityId: this.lastActivityId,
        currentActivityId: activityId,
        timestamp: Date.now(),
      };

      // Thông báo cho subscribers
      this._notifyRankingChangeSubscribers();
    }

    this.lastActivityId = activityId;
  }

  private _notifyRankingChangeSubscribers() {
    if (!this.latestRankingChangeData) return;

    this.rankingChangeSubscribers.forEach((callback) => {
      try {
        callback(this.latestRankingChangeData!);
      } catch (error) {
        console.error(
          '[LeaderboardManager] Lỗi khi gọi ranking change callback:',
          error
        );
      }
    });
  }

  public getRankingChanges(currentActivityId: string): RankingChangeData {
    // Nếu không có lưu trữ trước đó, trả về dữ liệu hiện tại không có so sánh
    if (!this.lastActivityId || this.lastActivityId === currentActivityId) {
      return LeaderboardCalculations.createDefaultRankingData(
        this.participants,
        currentActivityId
      );
    }

    // Tính toán thay đổi
    const rankingChanges = LeaderboardCalculations.calculateRankingChanges(
      this.participants,
      this.rankingHistory,
      this.lastActivityId,
      currentActivityId
    );

    return {
      ...rankingChanges,
      previousActivityId: this.lastActivityId,
      currentActivityId,
      timestamp: Date.now(),
    };
  }

  public getLatestRankingChangeData(): RankingChangeData | null {
    return this.latestRankingChangeData;
  }

  public getRankingPositionData(activityId: string): {
    current: Record<string, number>;
    previous: Record<string, number> | null;
  } {
    // Đảm bảo participants được sắp xếp theo điểm số giảm dần
    const sortedParticipants = [...this.participants].sort(
      (a, b) => b.realtimeScore - a.realtimeScore
    );

    // Nếu đã khởi tạo dữ liệu bảng xếp hạng host, ưu tiên sử dụng
    if (this.hostRankingData.initialized) {
      // Nếu current chưa được thiết lập, tạo từ danh sách hiện tại đã sắp xếp
      if (this.hostRankingData.current === null) {
        const currentPositions =
          LeaderboardCalculations.createCurrentPositions(sortedParticipants);

        console.log(
          '[LeaderboardManager] Tạo currentPositions từ participants đã sắp xếp:',
          {
            participantCount: sortedParticipants.length,
            currentPositions,
            sortedParticipants: sortedParticipants.map((p, idx) => ({
              name: p.displayName,
              score: p.realtimeScore,
              position: idx,
            })),
          }
        );

        return {
          current: currentPositions,
          previous: null,
        };
      }

      return {
        current: this.hostRankingData.current,
        previous: this.hostRankingData.previous,
      };
    }

    // Nếu không, sử dụng logic cũ với participants đã sắp xếp
    const currentPositions =
      LeaderboardCalculations.createCurrentPositions(sortedParticipants);

    console.log(
      `[LeaderboardManager] Yêu cầu lấy dữ liệu vị trí cho activity: ${activityId}`,
      {
        currentPositionCount: Object.keys(currentPositions).length,
        participantCount: sortedParticipants.length,
        sortedParticipants: sortedParticipants.map((p, idx) => ({
          name: p.displayName,
          score: p.realtimeScore,
          position: idx,
        })),
      }
    );

    // Chỉ trả về current, previous = null đối với trường hợp sử dụng cũ
    return {
      current: currentPositions,
      previous: null,
    };
  }

  public subscribeToRankingChanges(
    callback: (data: RankingChangeData) => void
  ) {
    this.rankingChangeSubscribers.add(callback);

    // Nếu đã có dữ liệu, gửi ngay lập tức
    if (this.latestRankingChangeData) {
      callback(this.latestRankingChangeData);
    }

    return () => {
      this.rankingChangeSubscribers.delete(callback);
    };
  }

  public getRankingHistoryForActivity(
    activityId: string
  ): RankedParticipant[] | null {
    return this.rankingHistory[activityId] || null;
  }

  public clearRankingHistory(): void {
    this.rankingHistory = {};
    this.lastActivityId = null;
    console.log('[LeaderboardManager] Đã xóa toàn bộ lịch sử thứ hạng');
  }

  // Thêm phương thức để lưu danh sách người tham gia tại thời điểm chuyển sang activity mới
  public saveParticipantsAtTransition(activityId: string): void {
    if (!activityId) return;

    // Trước khi ghi đè, hãy lưu lại dữ liệu hiện tại của activityId cũ (nếu có)
    const previousActivityId = this.lastActivityId;
    if (previousActivityId && previousActivityId !== activityId) {
      // Sao chép toàn bộ dữ liệu về vị trí người tham gia hiện tại
      // vào activityId mới với tư cách là dữ liệu vị trí trước đó
      const currentPositions = LeaderboardCalculations.createCurrentPositions(
        this.participants
      );

      // Lưu dữ liệu vị trí hiện tại vào activity mới
      this.activityTransitionHistory[activityId] = {
        participants: [...this.participants],
        timestamp: Date.now(),
        previousPositions: currentPositions,
      };

      console.log(
        `[LeaderboardManager] Đã lưu danh sách người tham gia từ activity cũ (${previousActivityId}) như dữ liệu previous cho activity mới: ${activityId}`
      );
    } else {
      // Lưu snapshot dữ liệu người tham gia khi chuyển sang activity mới
      this.activityTransitionHistory[activityId] = {
        participants: [...this.participants],
        timestamp: Date.now(),
      };

      console.log(
        `[LeaderboardManager] Đã lưu danh sách người tham gia tại thời điểm chuyển sang activity: ${activityId}`
      );
    }
  }

  // Cập nhật phương thức publishRankingDataImmediately
  public publishRankingDataImmediately(activityId: string): RankingChangeData {
    if (!activityId) {
      console.error(
        '[LeaderboardManager] ActivityId không được trống khi publish bảng xếp hạng.'
      );
      // Tạo dữ liệu mặc định nếu không có activityId
      const currentActivityId = this.getCurrentActivityId() || 'unknown';
      return LeaderboardManager.getInstance().publishRankingDataImmediately(
        currentActivityId
      );
    }

    // Đảm bảo participants được sắp xếp trước khi lưu snapshot
    const sortedParticipants = [...this.participants].sort(
      (a, b) => b.realtimeScore - a.realtimeScore
    );

    // Lưu snapshot hiện tại với participants đã sắp xếp
    this.rankingHistory[activityId] = [...sortedParticipants];

    // Nếu đã khởi tạo bảng xếp hạng host, sử dụng logic mới
    if (this.hostRankingData.initialized) {
      // Kiểm tra xem đã hoàn thành finishActivity chưa
      // Nếu chưa, đảm bảo dữ liệu vị trí được cập nhật chính xác
      if (!this.hostRankingData.current) {
        // Nếu current chưa được thiết lập, đảm bảo cập nhật nó với participants đã sắp xếp
        const currentPositions =
          LeaderboardCalculations.createCurrentPositions(sortedParticipants);

        this.hostRankingData.current = currentPositions;
        console.log(
          '[LeaderboardManager] Đã cập nhật current trong publishRankingDataImmediately:',
          {
            currentPositions,
            sortedParticipants: sortedParticipants.map((p, idx) => ({
              name: p.displayName,
              score: p.realtimeScore,
              position: idx,
            })),
          }
        );
      }

      // Tính toán thay đổi xếp hạng dựa trên dữ liệu host với participants đã sắp xếp
      const rankingChangeData =
        LeaderboardCalculations.calculateHostRankingChanges(
          sortedParticipants,
          this.hostRankingData
        );

      // Cập nhật dữ liệu mới nhất
      this.latestRankingChangeData = {
        ...rankingChangeData,
        previousActivityId: this.lastActivityId,
        currentActivityId: activityId,
        timestamp: Date.now(),
      };

      // Thông báo cho subscribers
      this._notifyRankingChangeSubscribers();

      console.log(
        `[LeaderboardManager] Đã publish dữ liệu xếp hạng host cho activity: ${activityId}`,
        {
          rankingChangeData: this.latestRankingChangeData,
          participantCount: sortedParticipants.length,
        }
      );

      return this.latestRankingChangeData;
    }

    // Nếu không sử dụng logic cũ với participants đã sắp xếp
    const rankingData = LeaderboardCalculations.createDefaultRankingData(
      sortedParticipants,
      activityId
    );

    // Cập nhật dữ liệu mới nhất và ID activity cuối cùng
    this.latestRankingChangeData = rankingData;
    this.lastActivityId = activityId;

    // Thông báo cho tất cả subscribers
    this._notifyRankingChangeSubscribers();

    console.log(
      `[LeaderboardManager] Đã publish dữ liệu xếp hạng ngay lập tức cho activity: ${activityId}`,
      rankingData
    );

    return rankingData;
  }

  // Phương thức khởi tạo bảng xếp hạng host
  public initializeHostRanking(): void {
    this.hostRankingData = LeaderboardCalculations.initializeHostRankingData();
    console.log('[LeaderboardManager] Đã khởi tạo dữ liệu bảng xếp hạng host.');
  }

  // Phương thức gọi khi kết thúc một quiz/activity
  public finishActivity(activityId: string): void {
    if (!activityId) return;

    console.log(
      `[LeaderboardManager] Bắt đầu finishActivity cho ${activityId}`
    );
    console.log('[LeaderboardManager] Trạng thái ban đầu:', {
      current: this.hostRankingData.current,
      previous: this.hostRankingData.previous,
      initialized: this.hostRankingData.initialized,
    });

    // Đảm bảo participants được sắp xếp theo điểm số giảm dần
    const sortedParticipants = [...this.participants].sort(
      (a, b) => b.realtimeScore - a.realtimeScore
    );

    // Tạo ranking từ participants đã sắp xếp
    const currentRanking =
      LeaderboardCalculations.createRankingFromParticipants(sortedParticipants);

    // Kiểm tra xem đã được khởi tạo chưa, nếu chưa thì khởi tạo
    if (!this.hostRankingData.initialized) {
      this.initializeHostRanking();
    }

    // Cập nhật host ranking data
    this.hostRankingData = LeaderboardCalculations.updateHostRankingData(
      this.hostRankingData,
      currentRanking
    );

    console.log(`[LeaderboardManager] Tổng kết quiz:`, {
      previous: this.hostRankingData.previous,
      current: this.hostRankingData.current,
      participantCount: Object.keys(currentRanking).length,
      sortedParticipants: sortedParticipants.map((p, idx) => ({
        name: p.displayName,
        score: p.realtimeScore,
        position: idx,
      })),
    });

    // Lưu lại vào rankingHistory cho activity này
    this.rankingHistory[activityId] = [...sortedParticipants];
    this.lastActivityId = activityId;

    // Tính toán thay đổi xếp hạng sử dụng participants đã sắp xếp
    const rankingChangeData =
      LeaderboardCalculations.calculateHostRankingChanges(
        sortedParticipants,
        this.hostRankingData
      );

    // Cập nhật dữ liệu thay đổi xếp hạng mới nhất
    this.latestRankingChangeData = {
      ...rankingChangeData,
      currentActivityId: activityId,
      previousActivityId: this.lastActivityId,
      timestamp: Date.now(),
    };

    // In log để debug
    console.log(
      `[LeaderboardManager] Hoàn thành finishActivity cho ${activityId}:`,
      {
        previous: this.hostRankingData.previous,
        current: this.hostRankingData.current,
        changes: Object.keys(this.latestRankingChangeData.changes).map(
          (name) => ({
            name,
            ...this.latestRankingChangeData.changes[name],
          })
        ),
      }
    );

    // Thông báo cho subscribers
    this._notifyRankingChangeSubscribers();
  }

  // Phương thức lấy dữ liệu xếp hạng cho host view
  public getHostRankingData(): {
    current: Record<string, number> | null;
    previous: Record<string, number> | null;
  } {
    return {
      current: this.hostRankingData.current,
      previous: this.hostRankingData.previous,
    };
  }

  // Phương thức xoá bảng xếp hạng host
  public clearHostRanking(): void {
    this.hostRankingData = {
      current: null,
      previous: null,
      initialized: false,
    };
    console.log('[LeaderboardManager] Đã xoá dữ liệu bảng xếp hạng host.');
  }

  // Thêm phương thức để cài đặt chế độ tham gia của host
  public setHostParticipating(isParticipating: boolean): void {
    this.isHostParticipating = isParticipating;
    console.log(
      `[LeaderboardManager] Đã cập nhật chế độ tham gia của host: ${
        isParticipating ? 'Có tham gia' : 'Không tham gia'
      }`
    );
  }

  // Thêm phương thức để kiểm tra chế độ tham gia của host
  public isHostParticipatingMode(): boolean {
    return this.isHostParticipating;
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
  private isHostParticipating: boolean = true;

  constructor(sessionCode: string, sessionId: string = '') {
    this.sessionCode = sessionCode;
    this.sessionId = sessionId;
    this.stompClientId = uuidv4();

    this.client = new Client({
      // brokerURL: 'ws://localhost:8080/ws',
      brokerURL: 'wss://preziq.duckdns.org/ws',
      reconnectDelay: 3000,
      heartbeatIncoming: 3000,
      heartbeatOutgoing: 3000,
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
            '[WebSocket] Participants data trước khi xử lý:',
            participantsData
          );

          if (Array.isArray(participantsData)) {
            // Kiểm tra host có tham gia hay không và ghi log thông tin
            const hasHost = participantsData.some(
              (p) => p.displayName === 'Host'
            );
            console.log(
              `[WebSocket] Có người dùng 'Host' trong danh sách: ${
                hasHost ? 'Có' : 'Không'
              }`
            );
            console.log(
              `[WebSocket] Chế độ tham gia của host: ${
                this.isHostParticipating ? 'Có tham gia' : 'Không tham gia'
              }`
            );

            // Luôn lọc bỏ người dùng 'Host' khỏi danh sách
            let filteredParticipants = participantsData;
            if (hasHost) {
              const originalCount = participantsData.length;
              filteredParticipants = participantsData.filter(
                (p) => p.displayName !== 'Host'
              );
              console.log(
                `[WebSocket] Đã loại bỏ người dùng Host khỏi danh sách người tham gia. Trước: ${originalCount}, Sau: ${filteredParticipants.length}`
              );
            }

            // Cập nhật tổng số người tham gia sau khi đã lọc host
            this.totalParticipantsCount = filteredParticipants.length;

            // Log danh sách người tham gia sau khi đã lọc
            console.log(
              '[WebSocket] Participants data sau khi lọc:',
              filteredParticipants
            );
            filteredParticipants.forEach((participant, index) => {
              console.log(`[WebSocket] Participant ${index}:`, {
                id: participant.id,
                displayName: participant.displayName,
                realtimeScore: participant.realtimeScore,
              });
            });

            // Tăng bộ đếm sự kiện participants - nhưng đảm bảo không vượt quá tổng số
            this.participantsEventCount++;

            // Đảm bảo giá trị participantsEventCount không vượt quá totalParticipantsCount
            if (this.participantsEventCount > this.totalParticipantsCount) {
              this.participantsEventCount = this.totalParticipantsCount;
            }

            console.log(
              `[WebSocket] Số lần nhận sự kiện participants: ${this.participantsEventCount}/${this.totalParticipantsCount}`
            );

            // Sử dụng danh sách đã lọc để cập nhật LeaderboardManager
            LeaderboardManager.getInstance().updateParticipants(
              filteredParticipants
            );

            // Sử dụng danh sách đã lọc cho onParticipantsUpdate callback
            if (this.onParticipantsUpdate) {
              this.onParticipantsUpdate(filteredParticipants);
            }
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

            // Lọc bỏ người dùng "Host" khỏi session summary
            const filteredSummaries = summaries.filter(
              (summary: EndSessionSummary) => summary.displayName !== 'Host'
            );

            console.log(
              `[WebSocket] Đã lọc session summary: Trước: ${summaries.length}, Sau: ${filteredSummaries.length}`
            );

            if (this.onSessionSummary) {
              this.onSessionSummary(filteredSummaries);
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

    // Cập nhật trạng thái tham gia của host dựa trên tên hiển thị
    if (participantName === 'Host') {
      this.isHostParticipating = false;
      LeaderboardManager.getInstance().setHostParticipating(false);
      console.log('[SessionWebSocket] Host tham gia với vai trò chỉ quan sát');
    } else {
      this.isHostParticipating = true;
      LeaderboardManager.getInstance().setHostParticipating(true);
      console.log('[SessionWebSocket] Host tham gia với vai trò người chơi');
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

    // Khởi tạo bảng xếp hạng host khi bắt đầu phiên
    LeaderboardManager.getInstance().initializeHostRanking();

    // Cập nhật giá trị isHostParticipating từ LeaderboardManager
    this.isHostParticipating =
      LeaderboardManager.getInstance().isHostParticipatingMode();
    console.log(
      `[SessionWebSocket] Bắt đầu phiên với chế độ tham gia của host: ${
        this.isHostParticipating ? 'Có tham gia' : 'Không tham gia'
      }`
    );

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

    console.log('[SessionWebSocket] Nhận activity submission:', submission);

    // Tạo payload cơ bản
    const payload: any = {
      sessionCode: this.sessionCode,
      activityId: submission.activityId,
    };

    // Thêm answerContent nếu có (ưu tiên cho tất cả loại quiz)
    if (submission.answerContent) {
      payload.answerContent = submission.answerContent;
      console.log(
        '[SessionWebSocket] Sử dụng answerContent:',
        submission.answerContent
      );
    }

    // Chỉ thêm locationAnswers nếu không có answerContent và có locationAnswers (để tương thích ngược)
    if (
      !submission.answerContent &&
      submission.locationAnswers &&
      submission.locationAnswers.length > 0
    ) {
      payload.locationAnswers = submission.locationAnswers;
      console.log(
        '[SessionWebSocket] Sử dụng locationAnswers (tương thích ngược):',
        submission.locationAnswers
      );
    }

    // Thêm type nếu có
    if (submission.type) {
      payload.type = submission.type;
    }

    console.log('[SessionWebSocket] Payload cuối cùng được gửi:', payload);

    this.client.publish({
      destination: '/server/session/submit',
      body: JSON.stringify(payload),
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

    // Xoá dữ liệu bảng xếp hạng host khi kết thúc phiên
    LeaderboardManager.getInstance().clearHostRanking();

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
    // Chỉ đọc và trả về giá trị bộ đếm hiện tại, KHÔNG reset
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
    const total = Math.max(1, this.totalParticipantsCount);
    const percentage = Math.min(
      100,
      Math.round((this.participantsEventCount / total) * 100)
    );

    return {
      count: this.participantsEventCount,
      total: total,
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

  public subscribeToRankingChanges(
    callback: (data: RankingChangeData) => void
  ): () => void {
    return LeaderboardManager.getInstance().subscribeToRankingChanges(callback);
  }

  public requestRankingUpdate(activityId: string): void {
    LeaderboardManager.getInstance().saveCurrentRankingSnapshot(activityId);
  }

  public getRankingPositionData(activityId?: string): {
    current: Record<string, number>;
    previous: Record<string, number> | null;
  } {
    return LeaderboardManager.getInstance().getRankingPositionData(
      activityId || this.currentActivityId || ''
    );
  }

  public getLatestRankingChangeData(): RankingChangeData | null {
    return LeaderboardManager.getInstance().getLatestRankingChangeData();
  }

  public saveCurrentRankingSnapshot(activityId: string): void {
    LeaderboardManager.getInstance().saveCurrentRankingSnapshot(activityId);
  }

  public getRankingChanges(currentActivityId: string): RankingChangeData {
    return LeaderboardManager.getInstance().getRankingChanges(
      currentActivityId
    );
  }

  public getRankingHistoryForActivity(
    activityId: string
  ): RankedParticipant[] | null {
    return LeaderboardManager.getInstance().getRankingHistoryForActivity(
      activityId
    );
  }

  public clearRankingHistory(): void {
    LeaderboardManager.getInstance().clearRankingHistory();
  }

  // Thêm phương thức để publish dữ liệu xếp hạng ngay lập tức
  public publishRankingData(activityId: string): RankingChangeData {
    // Đảm bảo có activityId
    if (!activityId) {
      console.error(
        '[SessionWebSocket] Không thể publish dữ liệu xếp hạng: activityId bị thiếu'
      );
      // Tạo dữ liệu mặc định nếu không có activityId
      const currentActivityId = this.getCurrentActivityId() || 'unknown';
      return LeaderboardManager.getInstance().publishRankingDataImmediately(
        currentActivityId
      );
    }

    // Gọi finishActivity trước khi publish để đảm bảo dữ liệu đã được cập nhật
    try {
      console.log(
        `[SessionWebSocket] Chuẩn bị gọi finishActivity cho ${activityId} từ publishRankingData`
      );
      LeaderboardManager.getInstance().finishActivity(activityId);
      console.log(
        `[SessionWebSocket] Đã gọi finishActivity cho ${activityId} thành công`
      );
    } catch (error) {
      console.error(`[SessionWebSocket] Lỗi khi gọi finishActivity: ${error}`);
    }

    // Gọi phương thức của LeaderboardManager để publish dữ liệu ngay lập tức
    const rankingData =
      LeaderboardManager.getInstance().publishRankingDataImmediately(
        activityId
      );

    // Debug log
    const leaderboardManager = LeaderboardManager.getInstance();
    const hostRankingData = leaderboardManager.getHostRankingData();
    console.log(`[SessionWebSocket] Kiểm tra dữ liệu sau publishRankingData:`, {
      activityId,
      hostRankingData,
      returnedData: rankingData,
    });

    return rankingData;
  }

  // Phương thức gọi khi hoàn thành một activity/quiz
  public finishActivity(activityId: string): void {
    if (!activityId) {
      console.error(
        '[SessionWebSocket] ActivityId không được trống khi kết thúc hoạt động.'
      );
      return;
    }

    // Cập nhật dữ liệu bảng xếp hạng host
    LeaderboardManager.getInstance().finishActivity(activityId);

    console.log(`[SessionWebSocket] Đã hoàn thành activity: ${activityId}`);
  }

  // Phương thức lấy dữ liệu bảng xếp hạng host
  public getHostRankingData(): {
    current: Record<string, number> | null;
    previous: Record<string, number> | null;
  } {
    return LeaderboardManager.getInstance().getHostRankingData();
  }

  // Phương thức xoá dữ liệu bảng xếp hạng host
  public clearHostRanking(): void {
    LeaderboardManager.getInstance().clearHostRanking();
  }

  // Thêm phương thức để kiểm tra chế độ tham gia của host
  public isHostParticipatingMode(): boolean {
    return this.isHostParticipating;
  }
}
