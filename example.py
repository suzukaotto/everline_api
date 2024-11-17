import time
import everline_api

api_instance = everline_api.EverlineAPI()

# api_instance.get_data()
# datas = api_instance.get_train_info()

for h in range(5, 24):
    for m in range(60):
        current_time = f"{h:02d}{m:02d}"
        print(current_time, everline_api.get_train_interval(current_time))
        time.sleep(0.1)