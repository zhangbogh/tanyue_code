import re

# Read the file
with open('rhythm_game_level2.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add game over screen HTML before </div> after feedback div
old_html = '''        <div id="progressBar"></div>
        <div id="feedback"></div>
    </div>'''

new_html = '''        <div id="progressBar"></div>
        <div id="feedback"></div>
        
        <!-- 游戏结束界面 -->
        <div id="gameOverScreen" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); flex-direction: column; align-items: center; justify-content: center; z-index: 100;">
            <h1 style="color: #00d4ff; font-size: 36px; margin-bottom: 20px; text-shadow: 0 0 20px #00d4ff;">🎵 游戏结束!</h1>
            <p style="color: #aaa; font-size: 16px; margin-bottom: 30px; text-align: center; line-height: 1.8;">
                最终得分: <strong style="color: #00ff88; font-size: 36px;">0</strong><br><br>
                最大连击: <strong style="color: #ffcc00;">0</strong>
            </p>
            <div style="display: flex; gap: 20px;">
                <button id="restartBtn" style="padding: 15px 50px; font-size: 20px; background: linear-gradient(145deg, #00d4ff, #0099cc); border: none; border-radius: 30px; color: #fff; cursor: pointer;">再来一次</button>
                <button id="continueBtn" style="padding: 15px 50px; font-size: 20px; background: linear-gradient(145deg, #00ff88, #009966); border: none; border-radius: 30px; color: #fff; cursor: pointer;">继续游戏</button>
            </div>
        </div>
    </div>'''

content = content.replace(old_html, new_html)

# Update endGame function
old_endgame = '''        function endGame() {
            isPlaying = false;
            cancelAnimationFrame(animationId);
            
            beatCircles.forEach(circle => {
                if (circle.element.parentNode) {
                    circle.element.parentNode.removeChild(circle.element);
                }
            });
            beatCircles = [];
            
            alert(`游戏结束！\\n最终得分: ${Math.floor(score)}\\n最大连击: ${maxCombo}`);
            
            location.reload();
        }'''

new_endgame = '''        function endGame() {
            isPlaying = false;
            cancelAnimationFrame(animationId);
            
            beatCircles.forEach(circle => {
                if (circle.element.parentNode) {
                    circle.element.parentNode.removeChild(circle.element);
                }
            });
            beatCircles = [];
            
            // 显示游戏结束界面
            const gameOverScreen = document.getElementById('gameOverScreen');
            gameOverScreen.style.display = 'flex';
            
            // 更新得分显示
            gameOverScreen.querySelector('p').innerHTML = `
                最终得分: <strong style="color: #00ff88; font-size: 36px;">${Math.floor(score)}</strong><br><br>
                最大连击: <strong style="color: #ffcc00;">${maxCombo}</strong>
            `;
            
            // 再来一次按钮
            document.getElementById('restartBtn').addEventListener('click', () => {
                location.reload();
            });
            
            // 继续游戏按钮 - 可以添加第三关或其他功能
            document.getElementById('continueBtn').addEventListener('click', () => {
                alert('恭喜完成第二关！更多关卡敬请期待！');
                location.reload();
            });
        }'''

content = content.replace(old_endgame, new_endgame)

# Write the file
with open('rhythm_game_level2.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
