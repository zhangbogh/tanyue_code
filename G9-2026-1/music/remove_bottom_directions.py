import json

# 读取配置文件
with open('beats_config_level2.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# 可能的替代方向（除了bottom）
alternative_directions = ['top', 'left', 'right']

# 替换所有bottom方向
import random
for beat in config['beats']:
    if beat['direction'] == 'bottom':
        beat['direction'] = random.choice(alternative_directions)

# 保存修改后的配置
with open('beats_config_level2.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=4)

print('All bottom directions replaced successfully!')
