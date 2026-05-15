/**
 * ============================================
 * 修仙版2048 - 游戏逻辑文件
 * 五阶五行 · 二十五境 · 渡劫飞升
 * ============================================
 */

// ============================================
// 游戏配置常量
// ============================================

/**
 * 境界名称数组 - 共25个等级
 * 从练气初期到真仙之境
 */
const TILE_NAMES = [
    '练气初期', '练气中期', '练气后期',
    '筑基初期', '筑基中期', '筑基后期',
    '结丹初期', '结丹中期', '结丹后期',
    '元婴初期', '元婴中期', '元婴后期',
    '化神初期', '化神中期', '化神后期',
    '炼虚初期', '炼虚中期', '炼虚后期',
    '合体初期', '合体中期', '合体后期',
    '大乘初期', '大乘中期', '大乘后期',
    '真仙之境'
];

/**
 * 游戏配置
 */
const CONFIG = {
    gridSize: 5,           // 5x5 网格
    startTiles: 3,         // 初始方块数量
    winScore: 0,           // 胜利分数（0表示不设置胜利条件）
    autoPlaySpeed: 100,    // 自动运行速度（毫秒）
    maxLeaderboardSize: 10 // 排行榜最大记录数
};

// ============================================
// 游戏状态管理
// ============================================

/**
 * 游戏主类
 * 负责管理游戏状态、渲染、用户交互等
 */
class Game2048 {
    /**
     * 构造函数 - 初始化游戏
     */
    constructor() {
        // 游戏棋盘数据 - 二维数组存储每个位置的等级 (0-24)
        this.grid = [];
        // 当前分数
        this.score = 0;
        // 最佳分数
        this.bestScore = 0;
        // 游戏是否结束
        this.gameOver = false;
        // 是否正在自动运行
        this.autoPlaying = false;
        // 自动运行定时器
        this.autoPlayTimer = null;
        // 是否暂停
        this.paused = false;
        
        // 初始化游戏
        this.init();
    }

    /**
     * 初始化游戏
     * 加载存档、绑定事件、开始新游戏
     */
    init() {
        // 加载最佳分数
        this.loadBestScore();
        // 绑定键盘事件
        this.bindKeyboardEvents();
        // 绑定按钮事件
        this.bindButtonEvents();
        // 渲染境界对照表
        this.renderTileLegend();
        // 更新排行榜显示
        this.updateLeaderboardDisplay();
        // 开始新游戏
        this.startNewGame();
    }

    /**
     * 开始新游戏
     * 重置棋盘和分数，添加初始方块
     */
    startNewGame() {
        // 清空棋盘
        this.grid = Array(CONFIG.gridSize).fill(null).map(() => 
            Array(CONFIG.gridSize).fill(0)
        );
        // 重置分数
        this.score = 0;
        // 重置游戏状态
        this.gameOver = false;
        this.paused = false;
        // 停止自动运行
        this.stopAutoPlay();
        // 隐藏游戏结束界面
        this.hideGameOver();
        // 添加初始方块
        this.addRandomTile();
        this.addRandomTile();
        this.addRandomTile();
        // 更新显示
        this.updateScoreDisplay();
        this.renderGrid();
        // 灵宠鼓励
        this.petMessage('开始修行吧！');
    }

    /**
     * 在随机空位置添加一个新方块
     * @returns {boolean} 是否成功添加
     */
    addRandomTile() {
        // 获取所有空位置
        const emptyCells = [];
        for (let row = 0; row < CONFIG.gridSize; row++) {
            for (let col = 0; col < CONFIG.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        // 如果没有空位置，返回false
        if (emptyCells.length === 0) return false;
        
        // 随机选择一个空位置
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const { row, col } = emptyCells[randomIndex];
        
        // 90%概率生成练气初期(0)，10%概率生成练气中期(1)
        const tileValue = Math.random() < 0.9 ? 0 : 1;
        this.grid[row][col] = tileValue;
        
        return true;
    }

    /**
     * 渲染游戏棋盘
     */
    renderGrid() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        
        // 计算格子大小和间距
        const gap = 8;
        const tileSize = 80;
        
        // 创建背景格子
        for (let i = 0; i < CONFIG.gridSize * CONFIG.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            board.appendChild(cell);
        }
        
        // 创建实际方块
        for (let row = 0; row < CONFIG.gridSize; row++) {
            for (let col = 0; col < CONFIG.gridSize; col++) {
                const value = this.grid[row][col];
                if (value > 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value} tile-new`;
                    tile.textContent = TILE_NAMES[value];
                    
                    // 计算位置
                    const left = gap + col * (tileSize + gap);
                    const top = gap + row * (tileSize + gap);
                    tile.style.left = `${left}px`;
                    tile.style.top = `${top}px`;
                    
                    board.appendChild(tile);
                }
            }
        }
    }

    /**
     * 移动方块
     * @param {string} direction - 移动方向：'up', 'down', 'left', 'right'
     * @returns {boolean} 是否有方块移动
     */
    move(direction) {
        if (this.gameOver || this.paused) return false;
        
        let moved = false;
        let scoreGain = 0;
        
        // 根据方向处理移动
        switch (direction) {
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
        }
        
        // 如果有移动，添加新方块并更新分数
        if (moved) {
            this.addRandomTile();
            this.score += scoreGain;
            this.updateScoreDisplay();
            this.renderGrid();
            
            // 检查游戏是否结束
            if (this.isGameOver()) {
                this.gameOver = true;
                this.showGameOver();
                this.saveScore();
                this.petMessage('修行结束了...');
            } else if (this.autoPlaying) {
                // 自动运行时继续
                this.autoPlayTimer = setTimeout(() => this.autoMove(), CONFIG.autoPlaySpeed);
            }
        }
        
        return moved;
    }

    /**
     * 向左移动
     * @returns {boolean} 是否有方块移动
     */
    moveLeft() {
        let moved = false;
        
        for (let row = 0; row < CONFIG.gridSize; row++) {
            // 提取非零元素
            const tiles = this.grid[row].filter(val => val !== 0);
            
            // 合并相同元素
            for (let i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] === tiles[i + 1]) {
                    tiles[i]++;
                    tiles.splice(i + 1, 1);
                    moved = true;
                }
            }
            
            // 补齐零
            while (tiles.length < CONFIG.gridSize) {
                tiles.push(0);
            }
            
            // 检查是否有变化
            if (tiles.join(',') !== this.grid[row].join(',')) {
                moved = true;
            }
            
            this.grid[row] = tiles;
        }
        
        return moved;
    }

    /**
     * 向右移动
     * @returns {boolean} 是否有方块移动
     */
    moveRight() {
        let moved = false;
        
        for (let row = 0; row < CONFIG.gridSize; row++) {
            // 提取非零元素
            const tiles = this.grid[row].filter(val => val !== 0);
            
            // 从右向左合并
            for (let i = tiles.length - 1; i > 0; i--) {
                if (tiles[i] === tiles[i - 1]) {
                    tiles[i]++;
                    tiles.splice(i - 1, 1);
                    moved = true;
                }
            }
            
            // 在前面补零
            while (tiles.length < CONFIG.gridSize) {
                tiles.unshift(0);
            }
            
            // 检查是否有变化
            if (tiles.join(',') !== this.grid[row].join(',')) {
                moved = true;
            }
            
            this.grid[row] = tiles;
        }
        
        return moved;
    }

    /**
     * 向上移动
     * @returns {boolean} 是否有方块移动
     */
    moveUp() {
        let moved = false;
        
        for (let col = 0; col < CONFIG.gridSize; col++) {
            // 提取该列的非零元素
            const tiles = [];
            for (let row = 0; row < CONFIG.gridSize; row++) {
                if (this.grid[row][col] !== 0) {
                    tiles.push(this.grid[row][col]);
                }
            }
            
            // 合并相同元素
            for (let i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] === tiles[i + 1]) {
                    tiles[i]++;
                    tiles.splice(i + 1, 1);
                    moved = true;
                }
            }
            
            // 补齐零
            while (tiles.length < CONFIG.gridSize) {
                tiles.push(0);
            }
            
            // 更新该列并检查变化
            for (let row = 0; row < CONFIG.gridSize; row++) {
                if (this.grid[row][col] !== tiles[row]) {
                    moved = true;
                }
                this.grid[row][col] = tiles[row];
            }
        }
        
        return moved;
    }

    /**
     * 向下移动
     * @returns {boolean} 是否有方块移动
     */
    moveDown() {
        let moved = false;
        
        for (let col = 0; col < CONFIG.gridSize; col++) {
            // 提取该列的非零元素
            const tiles = [];
            for (let row = 0; row < CONFIG.gridSize; row++) {
                if (this.grid[row][col] !== 0) {
                    tiles.push(this.grid[row][col]);
                }
            }
            
            // 从下向上合并
            for (let i = tiles.length - 1; i > 0; i--) {
                if (tiles[i] === tiles[i - 1]) {
                    tiles[i]++;
                    tiles.splice(i - 1, 1);
                    moved = true;
                }
            }
            
            // 在前面补零
            while (tiles.length < CONFIG.gridSize) {
                tiles.unshift(0);
            }
            
            // 更新该列并检查变化
            for (let row = 0; row < CONFIG.gridSize; row++) {
                if (this.grid[row][col] !== tiles[row]) {
                    moved = true;
                }
                this.grid[row][col] = tiles[row];
            }
        }
        
        return moved;
    }

    /**
     * 检查游戏是否结束
     * @returns {boolean} 游戏是否结束
     */
    isGameOver() {
        // 检查是否有空位
        for (let row = 0; row < CONFIG.gridSize; row++) {
            for (let col = 0; col < CONFIG.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // 检查是否可以合并
        for (let row = 0; row < CONFIG.gridSize; row++) {
            for (let col = 0; col < CONFIG.gridSize; col++) {
                const current = this.grid[row][col];
                
                // 检查右边
                if (col < CONFIG.gridSize - 1 && 
                    this.grid[row][col + 1] === current) {
                    return false;
                }
                
                // 检查下边
                if (row < CONFIG.gridSize - 1 && 
                    this.grid[row + 1][col] === current) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * 自动运行 - AI简单策略
     */
    autoMove() {
        if (!this.autoPlaying || this.gameOver || this.paused) return;
        
        // 简单的AI策略：优先选择能产生最多合并的方向
        const directions = ['left', 'right', 'up', 'down'];
        let bestDirection = 'left';
        let bestScore = -1;
        
        // 评估每个方向
        for (const dir of directions) {
            const score = this.evaluateMove(dir);
            if (score > bestScore) {
                bestScore = score;
                bestDirection = dir;
            }
        }
        
        // 执行最佳移动
        this.move(bestDirection);
    }

    /**
     * 评估移动的优劣
     * @param {string} direction - 移动方向
     * @returns {number} 评分
     */
    evaluateMove(direction) {
        // 克隆当前棋盘
        const originalGrid = JSON.parse(JSON.stringify(this.grid));
        let score = 0;
        
        // 模拟移动
        switch (direction) {
            case 'left':
                score = this.simulateMoveLeft();
                break;
            case 'right':
                score = this.simulateMoveRight();
                break;
            case 'up':
                score = this.simulateMoveUp();
                break;
            case 'down':
                score = this.simulateMoveDown();
                break;
        }
        
        // 恢复棋盘
        this.grid = originalGrid;
        
        return score;
    }

    /**
     * 模拟向左移动并评分
     * @returns {number} 评分
     */
    simulateMoveLeft() {
        let score = 0;
        for (let row = 0; row < CONFIG.gridSize; row++) {
            const tiles = this.grid[row].filter(val => val !== 0);
            for (let i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] === tiles[i + 1]) {
                    score += tiles[i] * 10; // 合并得分权重
                    tiles[i]++;
                    tiles.splice(i + 1, 1);
                }
            }
            // 偏好将大方块保持在左边
            for (let i = 0; i < tiles.length; i++) {
                score += tiles[i] * (CONFIG.gridSize - i);
            }
        }
        return score;
    }

    /**
     * 模拟向右移动并评分
     * @returns {number} 评分
     */
    simulateMoveRight() {
        let score = 0;
        for (let row = 0; row < CONFIG.gridSize; row++) {
            const tiles = this.grid[row].filter(val => val !== 0);
            for (let i = tiles.length - 1; i > 0; i--) {
                if (tiles[i] === tiles[i - 1]) {
                    score += tiles[i] * 10;
                    tiles[i]++;
                    tiles.splice(i - 1, 1);
                }
            }
            for (let i = 0; i < tiles.length; i++) {
                score += tiles[i] * (i + 1);
            }
        }
        return score;
    }

    /**
     * 模拟向上移动并评分
     * @returns {number} 评分
     */
    simulateMoveUp() {
        let score = 0;
        for (let col = 0; col < CONFIG.gridSize; col++) {
            const tiles = [];
            for (let row = 0; row < CONFIG.gridSize; row++) {
                if (this.grid[row][col] !== 0) {
                    tiles.push(this.grid[row][col]);
                }
            }
            for (let i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] === tiles[i + 1]) {
                    score += tiles[i] * 10;
                    tiles[i]++;
                    tiles.splice(i + 1, 1);
                }
            }
            for (let i = 0; i < tiles.length; i++) {
                score += tiles[i] * (CONFIG.gridSize - i);
            }
        }
        return score;
    }

    /**
     * 模拟向下移动并评分
     * @returns {number} 评分
     */
    simulateMoveDown() {
        let score = 0;
        for (let col = 0; col < CONFIG.gridSize; col++) {
            const tiles = [];
            for (let row = 0; row < CONFIG.gridSize; row++) {
                if (this.grid[row][col] !== 0) {
                    tiles.push(this.grid[row][col]);
                }
            }
            for (let i = tiles.length - 1; i > 0; i--) {
                if (tiles[i] === tiles[i - 1]) {
                    score += tiles[i] * 10;
                    tiles[i]++;
                    tiles.splice(i - 1, 1);
                }
            }
            for (let i = 0; i < tiles.length; i++) {
                score += tiles[i] * (i + 1);
            }
        }
        return score;
    }

    /**
     * 切换自动运行状态
     */
    toggleAutoPlay() {
        this.autoPlaying = !this.autoPlaying;
        const btn = document.getElementById('auto-play-btn');
        
        if (this.autoPlaying) {
            btn.innerHTML = '<i class="bi bi-stop-circle"></i> 停止自动';
            btn.classList.add('active');
            document.body.classList.add('auto-playing');
            this.petMessage('看我的！');
            this.autoMove();
        } else {
            btn.innerHTML = '<i class="bi bi-robot"></i> 自动运行';
            btn.classList.remove('active');
            document.body.classList.remove('auto-playing');
            clearTimeout(this.autoPlayTimer);
            this.petMessage('暂停休息~');
        }
    }

    /**
     * 停止自动运行
     */
    stopAutoPlay() {
        if (this.autoPlaying) {
            this.autoPlaying = false;
            clearTimeout(this.autoPlayTimer);
            const btn = document.getElementById('auto-play-btn');
            btn.innerHTML = '<i class="bi bi-robot"></i> 自动运行';
            btn.classList.remove('active');
            document.body.classList.remove('auto-playing');
        }
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        this.paused = !this.paused;
        const btn = document.getElementById('pause-btn');
        
        if (this.paused) {
            btn.innerHTML = '<i class="bi bi-play-circle"></i> 继续';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-success');
            if (this.autoPlaying) {
                clearTimeout(this.autoPlayTimer);
            }
            this.petMessage('休息一下~');
        } else {
            btn.innerHTML = '<i class="bi bi-pause-circle"></i> 暂停';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-secondary');
            if (this.autoPlaying && !this.gameOver) {
                this.autoMove();
            }
            this.petMessage('继续修行！');
        }
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
    }

    /**
     * 显示游戏结束界面
     */
    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('d-none');
    }

    /**
     * 隐藏游戏结束界面
     */
    hideGameOver() {
        document.getElementById('game-over').classList.add('d-none');
    }

    /**
     * 保存分数到本地存储
     */
    saveScore() {
        // 更新最佳分数
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
        
        // 保存到排行榜
        const leaderboard = this.getLeaderboard();
        const newRecord = {
            score: this.score,
            date: new Date().toLocaleString('zh-CN')
        };
        
        leaderboard.push(newRecord);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard.splice(CONFIG.maxLeaderboardSize);
        
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        this.updateLeaderboardDisplay();
    }

    /**
     * 加载最佳分数
     */
    loadBestScore() {
        this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
    }

    /**
     * 获取排行榜数据
     * @returns {Array} 排行榜数组
     */
    getLeaderboard() {
        return JSON.parse(localStorage.getItem('leaderboard')) || [];
    }

    /**
     * 更新排行榜显示
     */
    updateLeaderboardDisplay() {
        const leaderboard = this.getLeaderboard();
        const container = document.getElementById('leaderboard');
        
        if (leaderboard.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-muted">暂无记录</div>';
            return;
        }
        
        container.innerHTML = leaderboard.map((record, index) => `
            <div class="leaderboard-item">
                <div class="d-flex align-items-center">
                    <span class="rank-badge">${index + 1}</span>
                    <div class="ms-3">
                        <div class="fw-bold">${record.score}分</div>
                        <small class="text-muted">${record.date}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 清空排行榜
     */
    clearLeaderboard() {
        if (confirm('确定要清空排行榜吗？')) {
            localStorage.removeItem('leaderboard');
            this.updateLeaderboardDisplay();
            this.petMessage('重新开始！');
        }
    }

    /**
     * 渲染境界对照表
     */
    renderTileLegend() {
        const container = document.getElementById('tile-legend');
        
        container.innerHTML = TILE_NAMES.map((name, index) => `
            <div class="col-6 legend-item">
                <div class="legend-tile tile-${index}">
                    ${name}
                </div>
                <div class="legend-name">${name}</div>
            </div>
        `).join('');
    }

    /**
     * 灵宠显示消息
     * @param {string} message - 要显示的消息
     */
    petMessage(message) {
        const bubble = document.querySelector('.pet-bubble');
        const messageEl = document.getElementById('pet-message');
        
        messageEl.textContent = message;
        bubble.classList.remove('d-none');
        
        // 3秒后隐藏
        setTimeout(() => {
            bubble.classList.add('d-none');
        }, 3000);
    }

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // 防止方向键滚动页面
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            
            // 处理按键
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.move('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.move('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.move('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.move('right');
                    break;
            }
        });
    }

    /**
     * 绑定按钮事件
     */
    bindButtonEvents() {
        // 新游戏按钮
        document.getElementById('new-game-btn').addEventListener('click', () => {
            if (confirm('确定要开始新游戏吗？当前进度将丢失。')) {
                this.startNewGame();
            }
        });
        
        // 自动运行按钮
        document.getElementById('auto-play-btn').addEventListener('click', () => {
            this.toggleAutoPlay();
        });
        
        // 暂停按钮
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        // 重新开始按钮（游戏结束时）
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        // 清空排行榜按钮
        document.getElementById('clear-leaderboard').addEventListener('click', () => {
            this.clearLeaderboard();
        });
        
        // 灵宠点击事件
        document.querySelector('.pet-sprite').addEventListener('click', () => {
            const messages = [
                '加油！', '你可以的！', '继续努力！',
                '修行不易！', '坚持就是胜利！', '冲鸭！',
                '离真仙更近了！', '再接再厉！'
            ];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            this.petMessage(randomMsg);
        });
    }
}

// ============================================
// 启动游戏
// ============================================

/**
 * 页面加载完成后启动游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game2048();
});
