import json
import random

# 读取配置文件
with open('beats_config_level2.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# 可能的方向
possible_directions = ['top', 'bottom', 'left', 'right']

# 打乱每个节拍的方向
for beat in config['beats']:
    beat['direction'] = random.choice(possible_directions)

# 保存修改后的配置
with open('beats_config_level2.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=4)

print('Directions shuffled successfully!')
