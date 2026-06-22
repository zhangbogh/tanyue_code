from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os
import socket
import time


PORT = 2500
START_PAGE = "intro.html"


def is_port_available(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    if not os.path.exists(START_PAGE):
        print(f"错误：当前目录下找不到 {START_PAGE}")
        return

    port = PORT
    while not is_port_available(port):
        print(f"端口 {port} 已被占用，尝试 {port + 1}")
        port += 1

    url = f"http://127.0.0.1:{port}/{START_PAGE}"

    print("本地服务器已启动：")
    print(url)
    print()
    print("按 Ctrl + C 停止服务器")

    time.sleep(0.5)
    webbrowser.open(url)

    server = ThreadingHTTPServer(("127.0.0.1", port), SimpleHTTPRequestHandler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。")
        server.server_close()


if __name__ == "__main__":
    main()