import requests
import datetime
import time
import threading

# Station Name List
STATION_NAME = [
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
]

# Station Code List
STATION_CODE = {
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
}
STATION_CODE_UPWARD   = ["Y124", "Y123", "Y122", "Y121", "Y120", "Y119", "Y118", "Y117", "Y116", "Y115", "Y114", "Y113", "Y112", "Y111", "Y110"]
STATION_CODE_DOWNWARD = ["Y110", "Y111", "Y112", "Y113", "Y114", "Y115", "Y116", "Y117", "Y118", "Y119", "Y120", "Y121", "Y122", "Y123", "Y124"]

# Station Duration Time
STATION_DURATION_DOWN = [ 89, 74, 78, 83, 121, 147, 79, 77, 64, 71, 102, 110, 77, 179 ]; # 하행선 각 역 사이의 소요 시간
STATION_DURATION_UP = [ 96, 82, 77, 86, 122, 172, 79, 75, 62, 70, 76, 124, 85, 184 ];    # 상행선 각 역 사이의 소요 시간

# updownCode 
TRAIN_UPWARD   = "1" # 상행
TRAIN_DOWNWARD = "2" # 하행

# Status Code
TRAIN_RETURN = "1" # 열차 회송
TRAIN_STOP   = "2" # 열차 정차
TRAIN_START  = "3" # 열차 출발

class EverlineAPI:
    def __init__(self, req_url="https://everlinecu.com/api/api009.json"):
        self.req_url = req_url
        self.data = None
        self.last_update = None
        self.auto_update_thread = None
        
    def get_data(self, _time_out=3):
        response = requests.get(self.req_url, timeout=_time_out)
        if response.status_code == 200:
            self.data = response.json()
            self.last_update = datetime.datetime.now()
            return True
        
        print(f"Failed to get data: {response.status_code}")
        return False
        
    def auto_update(self, _interval=1):
        if self.auto_update_thread != None:
            return False
        def update():
            while True:
                self.get_data()
                print(f"Data updated at {self.last_update}")
                time.sleep(_interval)
        self.auto_update_thread = threading.Thread(target=update, daemon=True)
        self.auto_update_thread.start()
        return True
        
if __name__ == "__main__":
    api = EverlineAPI()
    api.auto_update()
    print("API started")
    time.sleep(10)
    print(api.data)
    