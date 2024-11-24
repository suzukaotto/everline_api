// Everline API Module
// 용인 에버라인 실시간 열차 정보 API 모듈
// Github: https://github.com/suzukaotto/everline_api.git

const STATION_NAME = [
  ['기흥', 'Giheung'],
  ['강남대', 'KANGNAM UNIV.'],
  ['지석', 'JISEOK'],
  ['어정', 'EOJEONG'],
  ['동백', 'DONGBAEK'],
  ['초당', 'CHODANG'],
  ['삼가', 'SAMGA'],
  ['시청·용인대', 'Cityhall·Yongin Univ'],
  ['명지대', 'MYONGJI UNIV.'],
  ['김량장', 'GIMYANGJANG'],
  ['용인중앙시장', 'Yongin Jungang Market'],
  ['고진', 'GOJIN'],
  ['보평', 'BOPYEONG'],
  ['둔전', 'DUNJEON'],
  ['전대·에버랜드', 'JEONDAE·EVERLAND']
];

const STATION_CODE = {
  "Y110": "기흥",
  "Y111": "강남대",
  "Y112": "지석",
  "Y113": "어정",
  "Y114": "동백",
  "Y115": "초당",
  "Y116": "삼가",
  "Y117": "시청·용인대",
  "Y118": "명지대",
  "Y119": "김량장",
  "Y120": "용인중앙시장",
  "Y121": "고진",
  "Y122": "보평",
  "Y123": "둔전",
  "Y124": "전대·에버랜드"
};

const STATION_CODE_UPWARD = ["Y124", "Y123", "Y122", "Y121", "Y120", "Y119", "Y118", "Y117", "Y116", "Y115", "Y114", "Y113", "Y112", "Y111", "Y110"];
const STATION_CODE_DOWNWARD = ["Y110", "Y111", "Y112", "Y113", "Y114", "Y115", "Y116", "Y117", "Y118", "Y119", "Y120", "Y121", "Y122", "Y123", "Y124"];

const STATION_DURATION_UP = [96, 82, 77, 86, 122, 172, 79, 75, 62, 70, 76, 124, 85, 100];
const STATION_DURATION_DOWN = [89, 74, 78, 83, 121, 147, 79, 77, 64, 71, 102, 110, 77, 100];

const TRAIN_UPWARD = "1"; // 상행
const TRAIN_DOWNWARD = "2"; // 하행

const TRAIN_RETURN = "1"; // 열차 회송
const TRAIN_STOP = "2";   // 열차 정차
const TRAIN_START = "3";  // 열차 출발

const TRAIN_INTERVALS = {
  Weekday: [
    { start: 0, end: 459, interval: null },
    { start: 530, end: 659, interval: 10 },
    { start: 700, end: 859, interval: 3 },
    { start: 900, end: 1659, interval: 6 },
    { start: 1700, end: 1959, interval: 4 },
    { start: 2000, end: 2059, interval: 6 },
    { start: 2100, end: 2159, interval: 6 },
    { start: 2200, end: 2359, interval: 10 },
  ],
  Weekend: [
    { start: 0, end: 459, interval: null },
    { start: 530, end: 659, interval: 10 },
    { start: 700, end: 2059, interval: 6 },
    { start: 2100, end: 2359, interval: 10 },
  ],
};

// Calculate percentage
function calPercent(part, whole, round = 2, max = 100) {
  if (whole === 0) return 0;
  let calVal = Math.round((part / whole) * 100 * Math.pow(10, round)) / Math.pow(10, round);
  return Math.min(calVal, max);
}

// Get train interval
function getTrainInterval(currentTime, isWeekend = false) {
  const schedule = isWeekend ? TRAIN_INTERVALS.Weekend : TRAIN_INTERVALS.Weekday;

  currentTime = parseInt(currentTime, 10);
  const currentMinutes = Math.floor(currentTime / 100) * 60 + (currentTime % 100);

  for (const timeRange of schedule) {
    const startMinutes = Math.floor(timeRange.start / 100) * 60 + (timeRange.start % 100);
    const endMinutes = Math.floor(timeRange.end / 100) * 60 + (timeRange.end % 100) + 1;

    if (startMinutes <= currentMinutes && currentMinutes < endMinutes) {
      return timeRange.interval;
    }
  }
  return null;
}

// EverlineAPI Class
class EverlineAPI {
  constructor(reqUrl = "https://everlinecu.com/api/api009.json") {
    this.reqUrl = reqUrl;
    this.data = null;
    this.lastUpdate = null;
    this.autoUpdateInterval = null;
  }

  async getData(timeout = 3000) {
    try {
      const response = await fetch(this.reqUrl, { timeout });
      if (response.ok) {
        this.data = await response.json();
        this.lastUpdate = new Date();
        return true;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    return false;
  }

  startAutoUpdate(interval = 1000) {
    if (this.autoUpdateInterval) return false;

    this.autoUpdateInterval = setInterval(async () => {
      try {
        await this.getData();
      } catch (error) {
        console.error("Auto-update failed:", error);
      }
    }, interval);
    return true;
  }

  stopAutoUpdate() {
    if (!this.autoUpdateInterval) return false;

    clearInterval(this.autoUpdateInterval);
    this.autoUpdateInterval = null;
    return true;
  }

  getTrainCount() {
    if (!this.data) return null;
    return this.data.data?.length || 0;
  }

  getTrainInfo() {
    if (!this.data) return null;

    const trainInfos = this.data.data || [];
    return trainInfos.map((trainInfo) => {
      const { updownCode, time, StatusCode, StCode, DestCode } = trainInfo;
      const trainTime = parseInt(time, 10);
      const trainNowIndex = updownCode === TRAIN_UPWARD
        ? STATION_CODE_UPWARD.indexOf(StCode)
        : STATION_CODE_DOWNWARD.indexOf(StCode);
      const trainDuration = updownCode === TRAIN_UPWARD
        ? STATION_DURATION_UP[trainNowIndex]
        : STATION_DURATION_DOWN[trainNowIndex];

      trainInfo.driveRate = calPercent(trainTime, trainDuration);
      return trainInfo;
    });
  }
}

export default EverlineAPI;
