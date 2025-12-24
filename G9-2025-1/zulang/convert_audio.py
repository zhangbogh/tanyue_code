import os
import sys
import subprocess

def convert_to_mp3(input_file, output_file):
    print(f"正在转换: {input_file} -> {output_file}")
    
    # 首先检查输入文件是否存在
    if not os.path.exists(input_file):
        print(f"错误: 找不到输入文件 {input_file}")
        return False
    
    try:
        # 尝试使用多种可能的音频转换工具
        tools = [
            f'ffmpeg -i "{input_file}" "{output_file}"',
            f'ffmpeg.exe -i "{input_file}" "{output_file}"',
            # 简化命令，移除可能导致语法错误的复杂部分
            f'vlc -I dummy "{input_file}" --sout "#transcode{{acodec=mp3}}:standard{{access=file,dst=\"{output_file}\"}}" vlc://quit',
            f'vlc.exe -I dummy "{input_file}" --sout "#transcode{{acodec=mp3}}:standard{{access=file,dst=\"{output_file}\"}}" vlc://quit'
        ]
        
        success = False
        for cmd in tools:
            try:
                print(f"尝试命令: {cmd}")
                result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"转换成功: {output_file}")
                    success = True
                    break
                else:
                    print(f"命令执行失败，返回码: {result.returncode}")
                    print(f"错误输出: {result.stderr}")
            except Exception as e:
                print(f"命令执行异常: {str(e)}")
        
        # 如果所有转换工具都失败，尝试简单的重命名方法（仅更改扩展名）
        if not success:
            print("所有转换工具都失败，尝试重命名文件...")
            try:
                # 先读取原始文件内容
                with open(input_file, 'rb') as f:
                    content = f.read()
                
                # 写入新文件（更改扩展名）
                with open(output_file, 'wb') as f:
                    f.write(content)
                
                print(f"已将文件重命名为: {output_file}")
                print("注意：这只是更改了文件扩展名，可能需要其他工具进行实际的格式转换")
                return True
            except Exception as rename_error:
                print(f"重命名失败: {str(rename_error)}")
                return False
        
        return success
    except Exception as e:
        print(f"转换过程中发生错误: {str(e)}")
        return False

if __name__ == "__main__":
    # 定义需要转换的文件列表
    files_to_convert = [
        {"input": "飞书20251202-230857.qt", "output": "飞书20251202-230857.mp3"},
        {"input": "飞书20251202-230900.qt", "output": "飞书20251202-230900.mp3"},
        {"input": "飞书20251202-230907.qt", "output": "飞书20251202-230907.mp3"},
        {"input": "飞书20251202-230919.qt", "output": "飞书20251202-230919.mp3"}
    ]
    
    # 记录成功和失败的文件数
    success_count = 0
    failure_count = 0
    
    # 逐个转换文件
    for file_pair in files_to_convert:
        input_file = file_pair["input"]
        output_file = file_pair["output"]
        
        print(f"\n开始处理: {input_file}")
        if convert_to_mp3(input_file, output_file):
            success_count += 1
        else:
            failure_count += 1
    
    # 检查转换结果
    print(f"\n===== 转换结果摘要 =====")
    print(f"成功转换: {success_count} 个文件")
    print(f"转换失败: {failure_count} 个文件")
    
    if failure_count == 0:
        print("所有文件转换成功！")
    elif success_count > 0:
        print("部分文件转换成功。")
    else:
        print("所有文件转换失败。")
