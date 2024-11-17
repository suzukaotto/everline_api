// Everline API Module
// 용인 에버라인 실시간 열차 정보 API 모듈
// Github: https://github.com/suzukaotto/everline_api.git

import requests from 'requests';
import datetime from 'datetime';
import time from 'time';
import threading from 'threading';

// Station Name List
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

// Station Code List
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

const STATION_CODE_UPWARD = ["Y124", "Y123", "Y122", "Y121", "Y120", "Y119", "Y118", "Y117", "Y116", "Y115", "Y114", "Y113", "Y112", "Y111", "Y110"];   // 상행선 역 코드
const STATION_CODE_DOWNWARD = ["Y110", "Y111", "Y112", "Y113", "Y114", "Y115", "Y116", "Y117", "Y118", "Y119", "Y120", "Y121", "Y122", "Y123", "Y124"]; // 하행선 역 코드

// Station Duration Time
const STATION_DURATION_UP = [96, 82, 77, 86, 122, 172, 79, 75, 62, 70, 76, 124, 85, 184];    // 상행선 각 역 사이의 소요 시간
const STATION_DURATION_DOWN = [89, 74, 78, 83, 121, 147, 79, 77, 64, 71, 102, 110, 77, 179]; // 하행선 각 역 사이의 소요 시간

// updownCode
const TRAIN_UPWARD   = "1"; // 상행
const TRAIN_DOWNWARD = "2"; // 하행

// Status Code
const TRAIN_RETURN = "1"; // 열차 회송
const TRAIN_STOP   = "2"; // 열차 정차
const TRAIN_START  = "3"; // 열차 출발

// Train Intervals
const TRAIN_INTERVALS = {
    "Weekday": [
        { "start": 0, "end": 459, "interval": null },
        { "start": 530, "end": 659, "interval": 10 },
        { "start": 700, "end": 859, "interval": 3 },
        { "start": 900, "end": 1659, "interval": 6 },
        { "start": 1700, "end": 1959, "interval": 4 },
        { "start": 2000, "end": 2059, "interval": 6 },
        { "start": 2100, "end": 2159, "interval": 6 },
        { "start": 2200, "end": 2359, "interval": 10 },
    ],
    "Weekend": [
        { "start": 0, "end": 459, "interval": null },
        { "start": 530, "end": 659, "interval": 10 },
        { "start": 700, "end": 2059, "interval": 6 },
        { "start": 2100, "end": 2359, "interval": 10 },
    ],
};

function get_train_interval(_current_time, _is_weekend = false) {
    // current_time: 현재 시간(HHMM 형식, 예: 1543)
    // is_weekend: 주말 여부(True면 주말 / 공휴일, False면 평일)
    const schedule = _is_weekend ? TRAIN_INTERVALS["Weekend"] : TRAIN_INTERVALS["Weekday"];

    _current_time = parseInt(_current_time);
    const current_minutes = Math.floor(_current_time / 100) * 60 + (_current_time % 100);

    for (const time_range of schedule) {
        const start_minutes = Math.floor(time_range["start"] / 100) * 60 + (time_range["start"] % 100);
        const end_minutes = Math.floor(time_range["end"] / 100) * 60 + (time_range["end"] % 100) + 1;

        if (start_minutes <= current_minutes && current_minutes < end_minutes) {
            return time_range["interval"];
        }
    }

    return null;
}

function cal_percent(_part, _whole, _round = 2, _max = 100) {
    if (_whole === 0) {
        return 0;
    }
    let cal_val = Math.round((_part / _whole) * 100, _round);
    if (cal_val > _max) {
        return _max;
    }
    return cal_val;
}

class EverlineAPI {
    // Everline API Class
    // Methods
    constructor(req_url = "https://everlinecu.com/api/api009.json") {
        this.req_url = req_url;
        this.data = null;
        this.last_update = null;
        this.auto_update_thread = null;
        this.auto_update_enabled = true;
    }

    async get_data(_time_out = 3) {
        try {
            const response = await requests.get(this.req_url, { timeout: _time_out });
            if (response.status === 200) {
                this.data = await response.json();
                this.last_update = new Date();
                return true;
            }
        } catch (error) {
            console.error(error);
        }
        return false;
    }

    auto_update(_interval = 1) {
        // Start auto update thread
        if (this.auto_update_thread !== null) {
            return false;
        }

        const update = async() => {
            while (true) {
                if (!this.auto_update_enabled) {
                    this.auto_update_thread = null;
                    break;
                }

                await this.get_data();
                console.log(`Data updated at ${this.last_update}`);
                await new Promise(resolve => setTimeout(resolve, _interval * 1000));
            }
        };

        this.auto_update_enabled = true;
        this.auto_update_thread = new threading.Thread(update, { daemon: true });
        this.auto_update_thread.start();
        return true;
    }

    stop_auto_update() {
        if (this.auto_update_thread === null) {
            return false;
        }
        this.auto_update_enabled = false;
        return true;
    }

    get_train_count() {
        if (this.data === null) {
            return null;
        }

        const train_count = this.data["data"];
        if (train_count === null) {
            return null;
        }
        return train_count.length;
    }

    get_train_info() {
        if (this.data === null) {
            return null;
        }

        const train_infos = this.data["data"];
        if (train_infos === null) {
            return null;
        }

        // Add driving completion rate (0~100%)
        for (const [index, train_info] of train_infos.entries()) {
            const train_updown = train_info["updownCode"];
            const train_time = parseInt(train_info["time"]);
            const train_status = train_info["StatusCode"];
            const train_stcode = train_info["StCode"];
            const train_destcode = train_info["DestCode"];

            let train_now_stindex, train_duration;
            if (train_updown === TRAIN_UPWARD) {
                train_now_stindex = STATION_CODE_UPWARD.indexOf(train_stcode);
                train_duration = STATION_DURATION_UP[train_now_stindex];
                if (train_stcode !== train_destcode) {
                    train_duration = STATION_DURATION_UP[train_now_stindex];
                } else {
                    train_duration = 0;
                }
            } else {
                train_now_stindex = STATION_CODE_DOWNWARD.indexOf(train_stcode);
                train_duration = STATION_DURATION_DOWN[train_now_stindex];
                if (train_stcode !== train_destcode) {
                    train_duration = STATION_DURATION_DOWN[train_now_stindex];
                } else {
                    train_duration = 0;
                }
            }

            // Train driving completion rate
            const train_rate = cal_percent(train_time, train_duration);

            // Info insert
            train_infos[index]["driveRate"] = train_rate;
        }

        return train_infos;
    }
}