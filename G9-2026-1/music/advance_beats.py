import json

# 读取配置文件
with open('beats_config_level2.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# 每个节拍时间减少8000毫秒
for beat in config['beats']:
    beat['time'] -= 8000
    # 确保时间不为负数
    if beat['time'] < 0:
        beat['time'] = 0

# 保存修改后的配置
with open('beats_config_level2.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=4)

print('All beat times advanced by 8000ms successfully!')
