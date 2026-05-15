/**
 * 修仙版 2048 - 游戏逻辑文件
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

const CONFIG = { 
    gridSize: 5, 
    startTiles: 2, 
    autoPlaySpeed: 300, 
    maxLeaderboardSize: 10 
};

class Game2048 {
    constructor() {
        this.grid = []; this.score = 0; this.bestScore = 0;
        this.gameOver = false; this.autoPlaying = false;
        this.autoPlayTimer = null; this.paused = false;
        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        this.loadBestScore(); 
        this.bindKeyboardEvents();
        this.bindButtonEvents(); 
        this.renderTileLegend();
        this.updateLeaderboardDisplay(); 
        this.initBGM();
        this.startNewGame();
    }

    /**
     * 开始新游戏
     */
    startNewGame() {
        this.grid = Array(CONFIG.gridSize).fill(null).map(() => Array(CONFIG.gridSize).fill(0));
        this.score = 0; 
        this.gameOver = false; 
        this.paused = false;
        this.stopAutoPlay(); 
        this.hideGameOver();
        // 初始化时只添加两个方块，且只能是练气初期、中期或后期（索引 0,1,2）
        this.addRandomTile(true); 
        this.addRandomTile(true);
        this.updateScoreDisplay(); 
        this.renderGrid();
        this.petMessage('开始修行吧！');
    }

    /**
     * 添加随机方块
     * @param {boolean} isInit - 是否为初始化阶段（只生成练气初期/中期/后期）
     */
    addRandomTile(isInit = false) {
        const emptyCells = [];
        for (let r = 0; r < CONFIG.gridSize; r++) {
            for (let c = 0; c < CONFIG.gridSize; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({row: r, col: c});
                }
            }
        }
        if (emptyCells.length === 0) return false;
        
        const idx = Math.floor(Math.random() * emptyCells.length);
        const {row, col} = emptyCells[idx];
        
        // 初始化时只生成练气初期、中期或后期（索引 0,1,2）
        if (isInit) {
            this.grid[row][col] = Math.floor(Math.random() * 3); // 0, 1, or 2
        } else {
            const rand = Math.random();
            this.grid[row][col] = rand < 0.7 ? 0 : (rand < 0.95 ? 1 : 2);
        }
        return true;
    }

    /**
     * 渲染游戏网格
     */
    renderGrid() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        
        // 获取 CSS 变量值用于计算位置
        const style = getComputedStyle(document.documentElement);
        const tileSize = parseInt(style.getPropertyValue('--tile-base-size')) || 70;
        const gap = parseInt(style.getPropertyValue('--tile-gap')) || 10;
        
        // 创建背景格子
        for (let i = 0; i < CONFIG.gridSize * CONFIG.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            board.appendChild(cell);
        }
        
        // 创建方块
        for (let r = 0; r < CONFIG.gridSize; r++) {
            for (let c = 0; c < CONFIG.gridSize; c++) {
                const value = this.grid[r][c];
                if (value > 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value} tile-new`;
                    tile.textContent = TILE_NAMES[value];
                    tile.style.left = (gap + c * (tileSize + gap)) + 'px';
                    tile.style.top = (gap + r * (tileSize + gap)) + 'px';
                    board.appendChild(tile);
                }
            }
        }
    }

    /**
     * 执行移动操作
     * @param {string} dir - 移动方向 (left/right/up/down)
     */
    move(dir) {
        if (this.gameOver || this.paused) return false;
        
        // 保存移动前的状态用于判断是否真的移动了
        const oldGrid = JSON.stringify(this.grid);
        let moved = false;
        
        if (dir === 'left') moved = this.moveLeft();
        else if (dir === 'right') moved = this.moveRight();
        else if (dir === 'up') moved = this.moveUp();
        else if (dir === 'down') moved = this.moveDown();
        
        if (moved) {
            // 只有真正移动后才添加新方块
            this.addRandomTile(false);
            this.updateScoreDisplay();
            this.renderGrid();
            
            // 检查游戏是否结束（25 个格子都满了且无法合并）
            if (this.isGameOver()) {
                this.gameOver = true;
                this.showGameOver();
                this.saveScore();
                this.stopAutoPlay();
                this.petMessage('修行结束了...');
            } else if (this.autoPlaying) {
                // 自动模式下，每隔 0.3 秒执行一次
                this.autoPlayTimer = setTimeout(() => this.autoMove(), CONFIG.autoPlaySpeed);
            }
        }
        return moved;
    }

    /**
     * 向左移动
     */
    moveLeft() {
        let moved = false;
        for (let r = 0; r < CONFIG.gridSize; r++) {
            // 提取非零元素
            let row = this.grid[r].filter(v => v !== 0);
            // 合并相同元素
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i]++;
                    row.splice(i + 1, 1);
                    this.score += Math.pow(2, row[i]) * 10;
                    moved = true;
                }
            }
            // 补齐零
            while (row.length < CONFIG.gridSize) {
                row.push(0);
            }
            // 检查是否有变化
            if (row.join(',') !== this.grid[r].join(',')) {
                moved = true;
            }
            this.grid[r] = row;
        }
        return moved;
    }

    /**
     * 向右移动
     */
    moveRight() {
        let moved = false;
        for (let r = 0; r < CONFIG.gridSize; r++) {
            // 提取非零元素
            let row = this.grid[r].filter(v => v !== 0);
            // 从右往左合并
            for (let i = row.length - 1; i > 0; i--) {
                if (row[i] === row[i - 1]) {
                    row[i]++;
                    row.splice(i - 1, 1);
                    this.score += Math.pow(2, row[i]) * 10;
                    moved = true;
                }
            }
            // 前面补零
            while (row.length < CONFIG.gridSize) {
                row.unshift(0);
            }
            // 检查是否有变化
            if (row.join(',') !== this.grid[r].join(',')) {
                moved = true;
            }
            this.grid[r] = row;
        }
        return moved;
    }

    /**
     * 向上移动
     */
    moveUp() {
        let moved = false;
        for (let c = 0; c < CONFIG.gridSize; c++) {
            // 提取列中非零元素
            let col = [];
            for (let r = 0; r < CONFIG.gridSize; r++) {
                if (this.grid[r][c] !== 0) {
                    col.push(this.grid[r][c]);
                }
            }
            // 合并相同元素
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i]++;
                    col.splice(i + 1, 1);
                    this.score += Math.pow(2, col[i]) * 10;
                    moved = true;
                }
            }
            // 补齐零
            while (col.length < CONFIG.gridSize) {
                col.push(0);
            }
            // 更新列并检查变化
            for (let r = 0; r < CONFIG.gridSize; r++) {
                if (this.grid[r][c] !== col[r]) {
                    moved = true;
                }
                this.grid[r][c] = col[r];
            }
        }
        return moved;
    }

    /**
     * 向下移动
     */
    moveDown() {
        let moved = false;
        for (let c = 0; c < CONFIG.gridSize; c++) {
            // 提取列中非零元素
            let col = [];
            for (let r = 0; r < CONFIG.gridSize; r++) {
                if (this.grid[r][c] !== 0) {
                    col.push(this.grid[r][c]);
                }
            }
            // 从下往上合并
            for (let i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i - 1]) {
                    col[i]++;
                    col.splice(i - 1, 1);
                    this.score += Math.pow(2, col[i]) * 10;
                    moved = true;
                }
            }
            // 前面补零
            while (col.length < CONFIG.gridSize) {
                col.unshift(0);
            }
            // 更新列并检查变化
            for (let r = 0; r < CONFIG.gridSize; r++) {
                if (this.grid[r][c] !== col[r]) {
                    moved = true;
                }
                this.grid[r][c] = col[r];
            }
        }
        return moved;
    }

    /**
     * 检查游戏是否结束
     * @returns {boolean} - 游戏是否结束
     */
    isGameOver() {
        // 检查是否有空格子
        for (let r = 0; r < CONFIG.gridSize; r++) {
            for (let c = 0; c < CONFIG.gridSize; c++) {
                if (this.grid[r][c] === 0) {
                    return false;
                }
            }
        }
        
        // 检查是否有可合并的相邻方块
        for (let r = 0; r < CONFIG.gridSize; r++) {
            for (let c = 0; c < CONFIG.gridSize; c++) {
                const current = this.grid[r][c];
                // 检查右边
                if (c < CONFIG.gridSize - 1 && this.grid[r][c + 1] === current) {
                    return false;
                }
                // 检查下边
                if (r < CONFIG.gridSize - 1 && this.grid[r + 1][c] === current) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * 自动移动（AI 智能决策）
     */
    autoMove() {
        if (!this.autoPlaying || this.gameOver || this.paused) return;
        
        const directions = ['left', 'right', 'up', 'down'];
        let bestDirection = 'left';
        let bestScore = -1;
        
        // 评估每个方向，选择最优解
        for (const dir of directions) {
            const score = this.evaluateMove(dir);
            if (score > bestScore) {
                bestScore = score;
                bestDirection = dir;
            }
        }
        
        this.move(bestDirection);
    }

    /**
     * 评估移动方向的得分
     * @param {string} dir - 移动方向
     * @returns {number} - 评估分数
     */
    evaluateMove(dir) {
        // 保存当前状态
        const originalGrid = JSON.parse(JSON.stringify(this.grid));
        const originalScore = this.score;
        
        let score = 0;
        
        // 模拟移动
        if (dir === 'left') score = this.simulateLeft();
        else if (dir === 'right') score = this.simulateRight();
        else if (dir === 'up') score = this.simulateUp();
        else if (dir === 'down') score = this.simulateDown();
        
        // 恢复原始状态
        this.grid = originalGrid;
        this.score = originalScore;
        
        return score;
    }

    /**
     * 模拟向左移动的评分
     */
    simulateLeft() { 
        let score = 0; 
        for (let r = 0; r < CONFIG.gridSize; r++) {
            let row = this.grid[r].filter(v => v !== 0);
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    score += Math.pow(2, row[i]) * 10;
                    row[i]++;
                    row.splice(i + 1, 1);
                }
            }
            // 优先考虑靠边的位置
            for (let i = 0; i < row.length; i++) {
                score += row[i] * (CONFIG.gridSize - i);
            }
        }
        return score; 
    }

    /**
     * 模拟向右移动的评分
     */
    simulateRight() { 
        let score = 0; 
        for (let r = 0; r < CONFIG.gridSize; r++) {
            let row = this.grid[r].filter(v => v !== 0);
            for (let i = row.length - 1; i > 0; i--) {
                if (row[i] === row[i - 1]) {
                    score += Math.pow(2, row[i]) * 10;
                    row[i]++;
                    row.splice(i - 1, 1);
                }
            }
            // 优先考虑靠边的位置
            for (let i = 0; i < row.length; i++) {
                score += row[i] * (i + 1);
            }
        }
        return score; 
    }

    /**
     * 模拟向上移动的评分
     */
    simulateUp() { 
        let score = 0; 
        for (let c = 0; c < CONFIG.gridSize; c++) {
            let col = [];
            for (let r = 0; r < CONFIG.gridSize; r++) {
                if (this.grid[r][c] !== 0) col.push(this.grid[r][c]);
            }
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    score += Math.pow(2, col[i]) * 10;
                    col[i]++;
                    col.splice(i + 1, 1);
                }
            }
            // 优先考虑靠边的位置
            for (let i = 0; i < col.length; i++) {
                score += col[i] * (CONFIG.gridSize - i);
            }
        }
        return score; 
    }

    /**
     * 模拟向下移动的评分
     */
    simulateDown() { 
        let score = 0; 
        for (let c = 0; c < CONFIG.gridSize; c++) {
            let col = [];
            for (let r = 0; r < CONFIG.gridSize; r++) {
                if (this.grid[r][c] !== 0) col.push(this.grid[r][c]);
            }
            for (let i = col.length - 1; i > 0; i--) {
                if (col[i] === col[i - 1]) {
                    score += Math.pow(2, col[i]) * 10;
                    col[i]++;
                    col.splice(i - 1, 1);
                }
            }
            // 优先考虑靠边的位置
            for (let i = 0; i < col.length; i++) {
                score += col[i] * (i + 1);
            }
        }
        return score; 
    }

    /**
     * 切换自动运行模式
     */
    toggleAutoPlay() {
        this.autoPlaying = !this.autoPlaying;
        const btn = document.getElementById('auto-play-btn');
        
        if (this.autoPlaying) {
            btn.innerHTML = '<i class="bi bi-stop-circle"></i> 停止自动';
            btn.classList.add('active');
            document.body.classList.add('auto-playing');
            this.petMessage('看我的！');
            // 立即执行一次
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
            if (btn) {
                btn.innerHTML = '<i class="bi bi-robot"></i> 自动运行';
                btn.classList.remove('active');
            }
            document.body.classList.remove('auto-playing');
        }
    }

    /**
     * 初始化背景音乐
     */
    initBGM() {
        this.bgmAudio = document.getElementById('bgm-audio');
        this.bgmEnabled = false;
        this.bgmAudio.volume = 0.3; // 设置音量为 30%
    }

    /**
     * 切换背景音乐开关
     */
    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        const btn = document.getElementById('bgm-btn');
        
        if (this.bgmEnabled) {
            btn.innerHTML = '<i class="bi bi-music-note-beamed"></i> BGM: 开';
            btn.classList.remove('btn-info');
            btn.classList.add('btn-success');
            this.bgmAudio.play().catch(e => {
                console.log('BGM 播放失败:', e);
                this.bgmEnabled = false;
                btn.innerHTML = '<i class="bi bi-music-note"></i> BGM: 关';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-info');
            });
            this.petMessage('音乐响起~');
        } else {
            btn.innerHTML = '<i class="bi bi-music-note"></i> BGM: 关';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-info');
            this.bgmAudio.pause();
            this.petMessage('安静修行~');
        }
    }

    togglePause() {
        this.paused = !this.paused;
        const btn = document.getElementById('pause-btn');
        if (this.paused) {
            btn.innerHTML = '<i class="bi bi-play-circle"></i> 继续';
            btn.classList.remove('btn-secondary'); btn.classList.add('btn-success');
            if (this.autoPlaying) clearTimeout(this.autoPlayTimer);
            this.petMessage('休息一下~');
        } else {
            btn.innerHTML = '<i class="bi bi-pause-circle"></i> 暂停';
            btn.classList.remove('btn-success'); btn.classList.add('btn-secondary');
            if (this.autoPlaying && !this.gameOver) this.autoMove();
            this.petMessage('继续修行！');
        }
    }

    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
    }

    showGameOver() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('d-none');
    }

    hideGameOver() { document.getElementById('game-over').classList.add('d-none'); }

    saveScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
        const lb = this.getLeaderboard();
        lb.push({score:this.score, date:new Date().toLocaleString('zh-CN')});
        lb.sort((a,b)=>b.score-a.score);
        lb.splice(10);
        localStorage.setItem('leaderboard', JSON.stringify(lb));
        this.updateLeaderboardDisplay();
    }

    loadBestScore() { this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0; }
    getLeaderboard() { return JSON.parse(localStorage.getItem('leaderboard')) || []; }

    updateLeaderboardDisplay() {
        const lb = this.getLeaderboard();
        const c = document.getElementById('leaderboard');
        if (lb.length === 0) { c.innerHTML = '<div class="text-center py-4 text-muted">暂无记录</div>'; return; }
        c.innerHTML = lb.map((r,i) => '<div class="leaderboard-item"><div class="d-flex align-items-center"><span class="rank-badge">'+(i+1)+'</span><div class="ms-3"><div class="fw-bold">'+r.score+'分</div><small class="text-muted">'+r.date+'</small></div></div></div>').join('');
    }

    clearLeaderboard() {
        if (confirm('确定要清空排行榜吗？')) {
            localStorage.removeItem('leaderboard');
            this.updateLeaderboardDisplay();
            this.petMessage('重新开始！');
        }
    }

    /**
     * 渲染境界对照表（每行显示 3 个）
     */
    renderTileLegend() {
        const container = document.getElementById('tile-legend');
        let html = '';
        
        for (let i = 0; i < TILE_NAMES.length; i++) {
            // 每 3 个换一行
            if (i % 3 === 0 && i !== 0) {
                html += '<div class="w-100 my-1"></div>';
            }
            html += `<div class="col-4 legend-item mb-2">
                <div class="legend-tile tile-${i} text-center p-1 rounded small">${TILE_NAMES[i]}</div>
            </div>`;
        }
        
        container.innerHTML = html;
    }

    petMessage(msg) {
        const b = document.querySelector('.pet-bubble');
        document.getElementById('pet-message').textContent = msg;
        b.classList.remove('d-none');
        setTimeout(()=>b.classList.add('d-none'), 3000);
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
            switch(e.key) {
                case 'ArrowUp': case 'w': case 'W': this.move('up'); break;
                case 'ArrowDown': case 's': case 'S': this.move('down'); break;
                case 'ArrowLeft': case 'a': case 'A': this.move('left'); break;
                case 'ArrowRight': case 'd': case 'D': this.move('right'); break;
            }
        });
    }

    /**
     * 绑定按钮事件
     */
    bindButtonEvents() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            if (confirm('确定要开始新游戏吗？')) {
                this.startNewGame();
            }
        });
        
        document.getElementById('auto-play-btn').addEventListener('click', () => {
            this.toggleAutoPlay();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('clear-leaderboard').addEventListener('click', () => {
            this.clearLeaderboard();
        });
        
        document.getElementById('bgm-btn').addEventListener('click', () => {
            this.toggleBGM();
        });
        
        document.querySelector('.pet-sprite').addEventListener('click', () => {
            const messages = [
                '加油！', '你可以的！', '继续努力！', '修行不易！',
                '坚持就是胜利！', '冲鸭！', '离真仙更近了！', '再接再厉！'
            ];
            const msg = messages[Math.floor(Math.random() * messages.length)];
            this.petMessage(msg);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new Game2048(); });
