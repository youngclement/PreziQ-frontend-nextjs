// Định nghĩa lại các interface để tránh circular import
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

export interface RankedParticipant extends SessionParticipant {
  realtimeRanking: number;
}

export interface RankingChangeData {
  participants: RankedParticipant[];
  changes: Record<string, RankingChange>;
  previousActivityId: string | null;
  currentActivityId: string | null;
  timestamp: number;
}

export interface HostRankingData {
  current: Record<string, number> | null;
  previous: Record<string, number> | null;
  initialized: boolean;
}

export interface RankingChange {
  previous: number | null;
  current: number;
  change: number;
  direction: 'up' | 'down' | 'same' | 'new';
}

export class LeaderboardCalculations {
  /**
   * Kiểm tra xem có sự thay đổi điểm số hoặc thứ hạng so với dữ liệu trước đó
   */
  static hasScoreChanges(
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

  /**
   * Xử lý và làm sạch dữ liệu người tham gia
   */
  static processParticipants(
    participants: SessionParticipant[],
    isHostParticipating: boolean
  ): RankedParticipant[] {
    // Lọc bỏ người dùng "Host" nếu host không tham gia
    let filteredParticipants = participants;
    if (!isHostParticipating) {
      filteredParticipants = participants.filter(
        (p) => p.displayName !== 'Host'
      );
      console.log(
        '[LeaderboardCalculations] Đã loại bỏ "Host" khỏi danh sách người tham gia.'
      );
    }

    const sanitizedParticipants = filteredParticipants.map((p) => ({
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

    return rankedParticipants;
  }

  /**
   * Tính toán thay đổi xếp hạng giữa hai activity
   */
  static calculateRankingChanges(
    participants: RankedParticipant[],
    rankingHistory: Record<string, RankedParticipant[]>,
    previousActivityId: string,
    currentActivityId: string
  ): {
    participants: RankedParticipant[];
    changes: Record<string, RankingChange>;
    previousActivityId: string | null;
    currentActivityId: string;
    timestamp: number;
  } {
    const result: Record<string, RankingChange> = {};

    // Lấy dữ liệu thứ hạng trước đó
    const previousRankings = rankingHistory[previousActivityId] || [];

    // Tạo map lưu trữ thứ hạng trước đó theo tên
    const previousRankMap: Record<string, number> = {};
    previousRankings.forEach((p) => {
      previousRankMap[p.displayName] = p.realtimeRanking;
    });

    // Tính toán thay đổi cho mỗi người tham gia hiện tại
    participants.forEach((p) => {
      const previousRank = previousRankMap[p.displayName];
      const currentRank = p.realtimeRanking;

      if (previousRank === undefined) {
        // Người chơi mới
        result[p.displayName] = {
          previous: null,
          current: currentRank,
          change: 0,
          direction: 'new',
        };
      } else {
        // Tính toán thay đổi và hướng
        const rankChange = previousRank - currentRank; // Nếu dương = tăng hạng, âm = giảm hạng
        let direction: 'up' | 'down' | 'same';

        if (rankChange > 0) {
          direction = 'up'; // Thứ hạng tăng (số thứ tự giảm)
        } else if (rankChange < 0) {
          direction = 'down'; // Thứ hạng giảm (số thứ tự tăng)
        } else {
          direction = 'same'; // Không thay đổi
        }

        result[p.displayName] = {
          previous: previousRank,
          current: currentRank,
          change: Math.abs(rankChange),
          direction,
        };
      }
    });

    return {
      participants,
      changes: result,
      previousActivityId,
      currentActivityId,
      timestamp: Date.now(),
    };
  }

  /**
   * Tính toán thay đổi xếp hạng cho host view
   */
  static calculateHostRankingChanges(
    participants: RankedParticipant[],
    hostRankingData: HostRankingData
  ): {
    participants: RankedParticipant[];
    changes: Record<string, RankingChange>;
  } {
    const changes: Record<string, RankingChange> = {};

    console.log(
      '[LeaderboardCalculations] calculateHostRankingChanges - Dữ liệu hiện tại:',
      {
        previous: hostRankingData.previous,
        current: hostRankingData.current,
        initialized: hostRankingData.initialized,
        participantCount: participants.length,
      }
    );

    // Sắp xếp người chơi theo điểm số giảm dần để đảm bảo thứ tự chính xác
    const sortedParticipants = [...participants].sort(
      (a, b) => b.realtimeScore - a.realtimeScore
    );

    // Kiểm tra dữ liệu hiện tại
    if (!hostRankingData.current) {
      // Nếu chưa có dữ liệu current, coi tất cả là mới
      sortedParticipants.forEach((p, index) => {
        changes[p.displayName] = {
          previous: null,
          current: index + 1, // Thứ hạng bắt đầu từ 1
          change: 0,
          direction: 'new',
        };
      });

      return {
        participants: sortedParticipants,
        changes,
      };
    }

    // Tính toán thay đổi cho mỗi người chơi
    sortedParticipants.forEach((p, currentIndex) => {
      const currentPosition = hostRankingData.current?.[p.displayName];
      const previousPosition = hostRankingData.previous?.[p.displayName];

      // currentIndex là vị trí hiện tại trong mảng đã sắp xếp (0-based)
      // currentPosition là vị trí được lưu trong hostRankingData (0-based)

      if (previousPosition === undefined) {
        // Người chơi mới
        changes[p.displayName] = {
          previous: null,
          current: currentIndex + 1, // Chuyển đổi sang 1-based ranking
          change: 0,
          direction: 'new',
        };
      } else if (currentPosition !== undefined) {
        // So sánh vị trí trong mảng (0-based)
        // previousPosition < currentIndex: thứ hạng giảm (từ vị trí cao lên vị trí thấp hơn)
        // previousPosition > currentIndex: thứ hạng tăng (từ vị trí thấp lên vị trí cao hơn)
        let direction: 'up' | 'down' | 'same';
        const positionChange = previousPosition - currentIndex;

        if (positionChange > 0) {
          direction = 'up'; // Thứ hạng tăng (vị trí index giảm)
        } else if (positionChange < 0) {
          direction = 'down'; // Thứ hạng giảm (vị trí index tăng)
        } else {
          direction = 'same'; // Không thay đổi
        }

        changes[p.displayName] = {
          previous: previousPosition + 1, // +1 để hiển thị thứ hạng từ 1
          current: currentIndex + 1, // +1 để hiển thị thứ hạng từ 1
          change: Math.abs(positionChange),
          direction,
        };

        console.log(`[LeaderboardCalculations] ${p.displayName}:`, {
          previousPosition,
          currentIndex,
          positionChange,
          direction,
          previousRank: previousPosition + 1,
          currentRank: currentIndex + 1,
        });
      }
    });

    return {
      participants: sortedParticipants,
      changes,
    };
  }

  /**
   * Tạo dữ liệu xếp hạng mặc định cho activity mới
   */
  static createDefaultRankingData(
    participants: RankedParticipant[],
    currentActivityId: string
  ): RankingChangeData {
    const changes: Record<string, RankingChange> = {};

    // Đánh dấu tất cả là người chơi mới
    participants.forEach((p) => {
      changes[p.displayName] = {
        previous: null,
        current: p.realtimeRanking,
        change: 0,
        direction: 'new',
      };
    });

    return {
      participants,
      changes,
      previousActivityId: null,
      currentActivityId,
      timestamp: Date.now(),
    };
  }

  /**
   * Tạo vị trí hiện tại cho mỗi người tham gia
   */
  static createCurrentPositions(
    participants: RankedParticipant[]
  ): Record<string, number> {
    const currentPositions: Record<string, number> = {};
    participants.forEach((p, index) => {
      currentPositions[p.displayName] = index;
    });
    return currentPositions;
  }

  /**
   * Tạo ranking từ participants đã sắp xếp
   */
  static createRankingFromParticipants(
    participants: RankedParticipant[]
  ): Record<string, number> {
    const ranking: Record<string, number> = {};

    // Sắp xếp người chơi theo điểm và gán thứ hạng
    const sortedParticipants = [...participants].sort(
      (a, b) => b.realtimeScore - a.realtimeScore
    );

    sortedParticipants.forEach((participant, index) => {
      ranking[participant.displayName] = index;
    });

    return ranking;
  }

  /**
   * Khởi tạo dữ liệu host ranking
   */
  static initializeHostRankingData(): HostRankingData {
    return {
      current: null,
      previous: null,
      initialized: true,
    };
  }

  /**
   * Cập nhật host ranking data khi kết thúc activity
   */
  static updateHostRankingData(
    hostRankingData: HostRankingData,
    currentRanking: Record<string, number>
  ): HostRankingData {
    if (hostRankingData.current === null) {
      // Đây là lần đầu tiên tổng kết quiz
      return {
        ...hostRankingData,
        current: currentRanking,
      };
    } else {
      // Đây là các lần tiếp theo
      // Gán current hiện tại thành previous
      // Cập nhật current với dữ liệu mới
      return {
        ...hostRankingData,
        previous: { ...hostRankingData.current },
        current: currentRanking,
      };
    }
  }
}
