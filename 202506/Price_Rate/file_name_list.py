import os

file_list = os.listdir(os.path.dirname( os.path.abspath(__file__) ))

file_name = []

for file in file_list:
    if file.count(".") == 1:
        name = file.split('.')[0]
        file_name.append(name)
    else:
        for k in range(len(file)-1,0,-1):
            if file[k] == '.':
                file_name.append(file[:k])
                break

print(file_name)