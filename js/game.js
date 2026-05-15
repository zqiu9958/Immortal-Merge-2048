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

const CONFIG = { gridSize: 5, startTiles: 2, autoPlaySpeed: 100, maxLeaderboardSize: 10 };

class Game2048 {
    constructor() {
        this.grid = []; this.score = 0; this.bestScore = 0;
        this.gameOver = false; this.autoPlaying = false;
        this.autoPlayTimer = null; this.paused = false;
        this.init();
    }

    init() {
        this.loadBestScore(); this.bindKeyboardEvents();
        this.bindButtonEvents(); this.renderTileLegend();
        this.updateLeaderboardDisplay(); this.startNewGame();
    }

    startNewGame() {
        this.grid = Array(CONFIG.gridSize).fill(null).map(() => Array(CONFIG.gridSize).fill(0));
        this.score = 0; this.gameOver = false; this.paused = false;
        this.stopAutoPlay(); this.hideGameOver();
        this.addRandomTile(); this.addRandomTile();
        this.updateScoreDisplay(); this.renderGrid();
        this.petMessage('开始修行吧！');
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < CONFIG.gridSize; r++)
            for (let c = 0; c < CONFIG.gridSize; c++)
                if (this.grid[r][c] === 0) emptyCells.push({row:r, col:c});
        if (emptyCells.length === 0) return false;
        const idx = Math.floor(Math.random() * emptyCells.length);
        const {row, col} = emptyCells[idx];
        const rand = Math.random();
        this.grid[row][col] = rand < 0.7 ? 0 : (rand < 0.95 ? 1 : 2);
        return true;
    }

    renderGrid() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        const gap = 8, size = 80;
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            board.appendChild(cell);
        }
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const v = this.grid[r][c];
                if (v > 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile tile-' + v + ' tile-new';
                    tile.textContent = TILE_NAMES[v];
                    tile.style.left = (gap + c*(size+gap)) + 'px';
                    tile.style.top = (gap + r*(size+gap)) + 'px';
                    board.appendChild(tile);
                }
            }
        }
    }

    move(dir) {
        if (this.gameOver || this.paused) return false;
        let moved = false;
        if (dir === 'left') moved = this.moveLeft();
        else if (dir === 'right') moved = this.moveRight();
        else if (dir === 'up') moved = this.moveUp();
        else if (dir === 'down') moved = this.moveDown();
        if (moved) {
            this.addRandomTile();
            this.updateScoreDisplay();
            this.renderGrid();
            if (this.isGameOver()) {
                this.gameOver = true;
                this.showGameOver();
                this.saveScore();
                this.petMessage('修行结束了...');
            } else if (this.autoPlaying) {
                this.autoPlayTimer = setTimeout(() => this.autoMove(), CONFIG.autoPlaySpeed);
            }
        }
        return moved;
    }

    moveLeft() {
        let moved = false;
        for (let r = 0; r < 5; r++) {
            let t = this.grid[r].filter(v => v !== 0);
            for (let i = 0; i < t.length-1; i++) {
                if (t[i] === t[i+1]) { t[i]++; t.splice(i+1,1); moved = true; }
            }
            while (t.length < 5) t.push(0);
            if (t.join(',') !== this.grid[r].join(',')) moved = true;
            this.grid[r] = t;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let r = 0; r < 5; r++) {
            let t = this.grid[r].filter(v => v !== 0);
            for (let i = t.length-1; i > 0; i--) {
                if (t[i] === t[i-1]) { t[i]++; t.splice(i-1,1); moved = true; }
            }
            while (t.length < 5) t.unshift(0);
            if (t.join(',') !== this.grid[r].join(',')) moved = true;
            this.grid[r] = t;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let c = 0; c < 5; c++) {
            let t = [];
            for (let r = 0; r < 5; r++) if (this.grid[r][c] !== 0) t.push(this.grid[r][c]);
            for (let i = 0; i < t.length-1; i++) {
                if (t[i] === t[i+1]) { t[i]++; t.splice(i+1,1); moved = true; }
            }
            while (t.length < 5) t.push(0);
            for (let r = 0; r < 5; r++) {
                if (this.grid[r][c] !== t[r]) moved = true;
                this.grid[r][c] = t[r];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let c = 0; c < 5; c++) {
            let t = [];
            for (let r = 0; r < 5; r++) if (this.grid[r][c] !== 0) t.push(this.grid[r][c]);
            for (let i = t.length-1; i > 0; i--) {
                if (t[i] === t[i-1]) { t[i]++; t.splice(i-1,1); moved = true; }
            }
            while (t.length < 5) t.unshift(0);
            for (let r = 0; r < 5; r++) {
                if (this.grid[r][c] !== t[r]) moved = true;
                this.grid[r][c] = t[r];
            }
        }
        return moved;
    }

    isGameOver() {
        for (let r = 0; r < 5; r++)
            for (let c = 0; c < 5; c++)
                if (this.grid[r][c] === 0) return false;
        for (let r = 0; r < 5; r++)
            for (let c = 0; c < 5; c++) {
                const cur = this.grid[r][c];
                if (c < 4 && this.grid[r][c+1] === cur) return false;
                if (r < 4 && this.grid[r+1][c] === cur) return false;
            }
        return true;
    }

    autoMove() {
        if (!this.autoPlaying || this.gameOver || this.paused) return;
        const dirs = ['left','right','up','down'];
        let best = 'left', bestS = -1;
        for (const d of dirs) {
            const s = this.evalMove(d);
            if (s > bestS) { bestS = s; best = d; }
        }
        this.move(best);
    }

    evalMove(dir) {
        const orig = JSON.parse(JSON.stringify(this.grid));
        let s = 0;
        if (dir==='left') s=this.simLeft();
        else if (dir==='right') s=this.simRight();
        else if (dir==='up') s=this.simUp();
        else if (dir==='down') s=this.simDown();
        this.grid = orig;
        return s;
    }

    simLeft() { let s=0; for(let r=0;r<5;r++){let t=this.grid[r].filter(v=>v!==0);for(let i=0;i<t.length-1;i++){if(t[i]===t[i+1]){s+=t[i]*10;t[i]++;t.splice(i+1,1);}}for(let i=0;i<t.length;i++)s+=t[i]*(5-i);}return s; }
    simRight() { let s=0; for(let r=0;r<5;r++){let t=this.grid[r].filter(v=>v!==0);for(let i=t.length-1;i>0;i--){if(t[i]===t[i-1]){s+=t[i]*10;t[i]++;t.splice(i-1,1);}}for(let i=0;i<t.length;i++)s+=t[i]*(i+1);}return s; }
    simUp() { let s=0; for(let c=0;c<5;c++){let t=[];for(let r=0;r<5;r++)if(this.grid[r][c]!==0)t.push(this.grid[r][c]);for(let i=0;i<t.length-1;i++){if(t[i]===t[i+1]){s+=t[i]*10;t[i]++;t.splice(i+1,1);}}for(let i=0;i<t.length;i++)s+=t[i]*(5-i);}return s; }
    simDown() { let s=0; for(let c=0;c<5;c++){let t=[];for(let r=0;r<5;r++)if(this.grid[r][c]!==0)t.push(this.grid[r][c]);for(let i=t.length-1;i>0;i--){if(t[i]===t[i-1]){s+=t[i]*10;t[i]++;t.splice(i-1,1);}}for(let i=0;i<t.length;i++)s+=t[i]*(i+1);}return s; }

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

    stopAutoPlay() {
        if (this.autoPlaying) {
            this.autoPlaying = false;
            clearTimeout(this.autoPlayTimer);
            document.getElementById('auto-play-btn').innerHTML = '<i class="bi bi-robot"></i> 自动运行';
            document.getElementById('auto-play-btn').classList.remove('active');
            document.body.classList.remove('auto-playing');
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

    renderTileLegend() {
        const c = document.getElementById('tile-legend');
        let h = '';
        for (let i = 0; i < 25; i++) {
            if (i % 3 === 0 && i !== 0) h += '<div class="w-100 my-1"></div>';
            h += '<div class="col-4 legend-item mb-2"><div class="legend-tile tile-'+i+' text-center p-1 rounded small">'+TILE_NAMES[i]+'</div></div>';
        }
        c.innerHTML = h;
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

    bindButtonEvents() {
        document.getElementById('new-game-btn').addEventListener('click', ()=>{ if(confirm('确定要开始新游戏吗？')) this.startNewGame(); });
        document.getElementById('auto-play-btn').addEventListener('click', ()=>this.toggleAutoPlay());
        document.getElementById('pause-btn').addEventListener('click', ()=>this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', ()=>this.startNewGame());
        document.getElementById('clear-leaderboard').addEventListener('click', ()=>this.clearLeaderboard());
        document.querySelector('.pet-sprite').addEventListener('click', ()=>{
            const m=['加油！','你可以的！','继续努力！','修行不易！','坚持就是胜利！','冲鸭！','离真仙更近了！','再接再厉！'];
            this.petMessage(m[Math.floor(Math.random()*m.length)]);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new Game2048(); });
