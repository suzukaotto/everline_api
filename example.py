import time
import everline_api

api_instance = everline_api.EverlineAPI()

api_instance.get_data()
datas = api_instance.get_train_info()

for data in datas:
    print(data['TrainNo'], end=" ")
    print("상행" if data["updownCode"] == everline_api.TRAIN_UPWARD else "하행", end=" ")
    print(f"{data['StCode']}", end=" ")
    print(data["driveRate"])