const { useEffect, useRef, useState } = React;

function PinballGame({ isOpen }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState("Press Space to launch");
  const gameRef = useRef(null);

  function resetBall(state) {
    state.ball = {
      x: state.table.w - 38,
      y: state.table.h - 72,
      vx: 0,
      vy: 0,
      r: 8,
      launched: false,
    };
  }

  function resetGame() {
    const next = {
      table: { w: 620, h: 420 },
      ball: null,
      stars: Array.from({ length: 24 }, () => ({
        x: Math.random() * 520 + 24,
        y: Math.random() * 240 + 24,
        r: Math.random() * 1.4 + 0.4,
      })),
      bumpers: [
        { x: 168, y: 110, r: 22, points: 100, cool: 0 },
        { x: 286, y: 152, r: 24, points: 150, cool: 0 },
        { x: 414, y: 110, r: 22, points: 100, cool: 0 },
      ],
      targets: [
        { x: 108, y: 188, w: 18, h: 30, points: 250, hit: 0 },
        { x: 132, y: 208, w: 18, h: 30, points: 250, hit: 0 },
        { x: 156, y: 228, w: 18, h: 30, points: 250, hit: 0 },
      ],
      leftPaddle: { x: 154, y: 362, w: 108, h: 14 },
      rightPaddle: { x: 346, y: 362, w: 108, h: 14 },
      leftSling: { x: 116, y: 316, w: 52, h: 44 },
      rightSling: { x: 454, y: 316, w: 52, h: 44 },
    };
    resetBall(next);
    gameRef.current = next;
    setScore(0);
    setLives(3);
    setStatus("Press Space to launch");
  }

  function launchBall() {
    const state = gameRef.current;
    if (!state || state.ball.launched) {
      return;
    }
    state.ball.launched = true;
    state.ball.vx = -5.2 - Math.random() * 1.4;
    state.ball.vy = -12.8;
    setStatus("Use \u2190 and \u2192 to control flippers");
  }

  useEffect(() => {
    if (!isOpen) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    resetGame();

    function onKeyDown(event) {
      if (event.key === "ArrowLeft") {
        keysRef.current.left = true;
      }
      if (event.key === "ArrowRight") {
        keysRef.current.right = true;
      }
      if (event.code === "Space") {
        event.preventDefault();
        launchBall();
      }
      if (event.key.toLowerCase() === "r") {
        resetGame();
      }
    }

    function onKeyUp(event) {
      if (event.key === "ArrowLeft") {
        keysRef.current.left = false;
      }
      if (event.key === "ArrowRight") {
        keysRef.current.right = false;
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return undefined;
    }

    function reflect(velocityX, velocityY, normalX, normalY) {
      const dot = velocityX * normalX + velocityY * normalY;
      return {
        x: velocityX - 2 * dot * normalX,
        y: velocityY - 2 * dot * normalY,
      };
    }

    function collidePaddle(ball, paddleX, paddleY, width, isLeft) {
      const paddleTop = paddleY;
      const paddleBottom = paddleY + 14;
      if (
        ball.y + ball.r >= paddleTop &&
        ball.y - ball.r <= paddleBottom &&
        ball.x >= paddleX &&
        ball.x <= paddleX + width &&
        ball.vy > 0
      ) {
        ball.y = paddleTop - ball.r - 0.5;
        const hitPos = (ball.x - (paddleX + width / 2)) / (width / 2);
        const push = isLeft ? -0.9 : 0.9;
        ball.vx = ball.vx * 0.52 + hitPos * 5.2 + push;
        ball.vy = -Math.abs(ball.vy) * 0.94 - 1.5;
        setScore((prev) => prev + 25);
      }
    }

    function animate() {
      const state = gameRef.current;
      if (!state) {
        return;
      }

      const { table, ball, stars, bumpers, leftPaddle, rightPaddle, leftSling, rightSling, targets } = state;
      const activeLeftY = keysRef.current.left ? 348 : 362;
      const activeRightY = keysRef.current.right ? 348 : 362;

      if (ball.launched) {
        ball.vy += 0.2;
      }

      ball.vx *= 0.999;
      ball.vy *= 0.999;
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.r <= 14) {
        ball.x = 14 + ball.r;
        ball.vx = Math.abs(ball.vx) * 0.96;
      }
      if (ball.x + ball.r >= table.w - 14) {
        ball.x = table.w - 14 - ball.r;
        ball.vx = -Math.abs(ball.vx) * 0.96;
      }
      if (ball.y - ball.r <= 14) {
        ball.y = 14 + ball.r;
        ball.vy = Math.abs(ball.vy) * 0.97;
      }

      bumpers.forEach((bumper) => {
        if (bumper.cool > 0) {
          bumper.cool -= 1;
        }
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const distance = Math.hypot(dx, dy);
        const overlap = ball.r + bumper.r - distance;
        if (overlap > 0) {
          const nx = dx / (distance || 1);
          const ny = dy / (distance || 1);
          ball.x += nx * overlap;
          ball.y += ny * overlap;
          const reflected = reflect(ball.vx, ball.vy, nx, ny);
          ball.vx = reflected.x * 1.08;
          ball.vy = reflected.y * 1.08;
          if (bumper.cool === 0) {
            setScore((prev) => prev + bumper.points);
            bumper.cool = 8;
          }
        }
      });

      targets.forEach((target) => {
        if (target.hit > 0) {
          target.hit -= 1;
        }
        if (
          ball.x + ball.r > target.x &&
          ball.x - ball.r < target.x + target.w &&
          ball.y + ball.r > target.y &&
          ball.y - ball.r < target.y + target.h
        ) {
          ball.vx *= -0.94;
          ball.vy *= 0.92;
          if (target.hit === 0) {
            target.hit = 12;
            setScore((prev) => prev + target.points);
          }
        }
      });

      function slingBounce(sling, dir) {
        if (
          ball.x + ball.r > sling.x &&
          ball.x - ball.r < sling.x + sling.w &&
          ball.y + ball.r > sling.y &&
          ball.y - ball.r < sling.y + sling.h &&
          ball.vy > -1
        ) {
          ball.vx += dir * 1.6;
          ball.vy = -Math.abs(ball.vy) - 1.8;
          setScore((prev) => prev + 40);
        }
      }

      slingBounce(leftSling, -1);
      slingBounce(rightSling, 1);
      collidePaddle(ball, leftPaddle.x, activeLeftY, leftPaddle.w, true);
      collidePaddle(ball, rightPaddle.x, activeRightY, rightPaddle.w, false);

      if (ball.y - ball.r > table.h + 30) {
        setLives((prev) => {
          const nextLives = prev - 1;
          if (nextLives <= 0) {
            setStatus("Game over. Press R to restart");
            resetGame();
            return 3;
          }
          setStatus("Ball lost. Press Space to relaunch");
          resetBall(state);
          return nextLives;
        });
      }

      ctx.clearRect(0, 0, table.w, table.h);
      const frame = ctx.createLinearGradient(0, 0, 0, table.h);
      frame.addColorStop(0, "#0a2f72");
      frame.addColorStop(1, "#031430");
      ctx.fillStyle = frame;
      ctx.fillRect(0, 0, table.w, table.h);

      const playfield = ctx.createLinearGradient(0, 0, table.w, table.h);
      playfield.addColorStop(0, "#123771");
      playfield.addColorStop(0.58, "#234ea1");
      playfield.addColorStop(1, "#16386f");
      ctx.fillStyle = playfield;
      ctx.fillRect(14, 14, table.w - 28, table.h - 28);

      ctx.strokeStyle = "rgba(170, 220, 255, 0.35)";
      ctx.lineWidth = 1;
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.strokeStyle = "#6cb8ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 36);
      ctx.quadraticCurveTo(180, 96, 260, 76);
      ctx.quadraticCurveTo(340, 56, 446, 120);
      ctx.stroke();

      const lane = ctx.createLinearGradient(table.w - 78, 20, table.w - 20, table.h - 20);
      lane.addColorStop(0, "#41a9ff");
      lane.addColorStop(1, "#134b97");
      ctx.fillStyle = lane;
      ctx.fillRect(table.w - 74, 20, 54, table.h - 40);

      targets.forEach((target) => {
        ctx.fillStyle = target.hit ? "#fff59b" : "#bde3ff";
        ctx.fillRect(target.x, target.y, target.w, target.h);
        ctx.strokeStyle = "#3d6ea4";
        ctx.strokeRect(target.x, target.y, target.w, target.h);
      });

      function drawSling(sling, isLeft) {
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(sling.x, sling.y + sling.h);
          ctx.lineTo(sling.x + sling.w, sling.y + sling.h);
          ctx.lineTo(sling.x + sling.w, sling.y);
        } else {
          ctx.moveTo(sling.x, sling.y);
          ctx.lineTo(sling.x, sling.y + sling.h);
          ctx.lineTo(sling.x + sling.w, sling.y + sling.h);
        }
        ctx.closePath();
        const slingGrad = ctx.createLinearGradient(sling.x, sling.y, sling.x + sling.w, sling.y + sling.h);
        slingGrad.addColorStop(0, "#ffce83");
        slingGrad.addColorStop(1, "#d95429");
        ctx.fillStyle = slingGrad;
        ctx.fill();
        ctx.strokeStyle = "#7c2717";
        ctx.stroke();
      }

      drawSling(leftSling, true);
      drawSling(rightSling, false);

      bumpers.forEach((bumper) => {
        const glow = ctx.createRadialGradient(
          bumper.x,
          bumper.y,
          2,
          bumper.x,
          bumper.y,
          bumper.r + (bumper.cool ? 4 : 0)
        );
        glow.addColorStop(0, "#fff9c8");
        glow.addColorStop(0.5, "#ffad4a");
        glow.addColorStop(1, "#8d2b0a");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#4a1e11";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      ctx.fillStyle = "#e8f6ff";
      ctx.strokeStyle = "#355f8f";
      ctx.lineWidth = 2;
      ctx.fillRect(leftPaddle.x, activeLeftY, leftPaddle.w, leftPaddle.h);
      ctx.strokeRect(leftPaddle.x, activeLeftY, leftPaddle.w, leftPaddle.h);
      ctx.fillRect(rightPaddle.x, activeRightY, rightPaddle.w, rightPaddle.h);
      ctx.strokeRect(rightPaddle.x, activeRightY, rightPaddle.w, rightPaddle.h);

      const ballGrad = ctx.createRadialGradient(
        ball.x - 3,
        ball.y - 4,
        1,
        ball.x,
        ball.y,
        ball.r
      );
      ballGrad.addColorStop(0, "#ffffff");
      ballGrad.addColorStop(0.55, "#dde8f8");
      ballGrad.addColorStop(1, "#8798b3");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isOpen]);

  return (
    <div className="pinball-game">
      <div className="pinball-toolbar">
        <span>Score: {String(score).padStart(7, "0")}</span>
        <span>Lives: {lives}</span>
        <button type="button" className="pinball-launch-btn" onClick={launchBall}>
          Launch
        </button>
      </div>
      <canvas ref={canvasRef} className="pinball-canvas" width={620} height={420} />
      <div className="pinball-status">{status}</div>
    </div>
  );
}

function TetrisGame({ isOpen }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState("Arrow keys to move. Up to rotate.");

  const PIECES = [
    { shape: [[1, 1, 1, 1]], color: "#45d8ff" }, // I
    { shape: [[1, 0, 0], [1, 1, 1]], color: "#3f58ff" }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: "#ff9933" }, // L
    { shape: [[1, 1], [1, 1]], color: "#ffe34f" }, // O
    { shape: [[0, 1, 1], [1, 1, 0]], color: "#61e66b" }, // S
    { shape: [[0, 1, 0], [1, 1, 1]], color: "#c766ff" }, // T
    { shape: [[1, 1, 0], [0, 1, 1]], color: "#ff5b66" }, // Z
  ];

  function emptyBoard() {
    return Array.from({ length: 20 }, () => Array(10).fill(null));
  }

  function cloneMatrix(m) {
    return m.map((row) => row.slice());
  }

  function randomPiece() {
    const pick = PIECES[Math.floor(Math.random() * PIECES.length)];
    return { shape: cloneMatrix(pick.shape), color: pick.color };
  }

  function rotateMatrix(matrix) {
    return matrix[0].map((_, x) => matrix.map((row) => row[x]).reverse());
  }

  function collides(board, piece, x, y) {
    for (let py = 0; py < piece.shape.length; py += 1) {
      for (let px = 0; px < piece.shape[py].length; px += 1) {
        if (!piece.shape[py][px]) {
          continue;
        }
        const nx = x + px;
        const ny = y + py;
        if (nx < 0 || nx >= 10 || ny >= 20) {
          return true;
        }
        if (ny >= 0 && board[ny][nx]) {
          return true;
        }
      }
    }
    return false;
  }

  function mergePiece(board, piece, x, y) {
    for (let py = 0; py < piece.shape.length; py += 1) {
      for (let px = 0; px < piece.shape[py].length; px += 1) {
        if (!piece.shape[py][px]) {
          continue;
        }
        const ny = y + py;
        const nx = x + px;
        if (ny >= 0 && ny < 20 && nx >= 0 && nx < 10) {
          board[ny][nx] = piece.color;
        }
      }
    }
  }

  function clearLines(board) {
    let cleared = 0;
    for (let y = board.length - 1; y >= 0; y -= 1) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(10).fill(null));
        cleared += 1;
        y += 1;
      }
    }
    return cleared;
  }

  function spawnPiece(state) {
    state.piece = state.next;
    state.next = randomPiece();
    state.pieceX = Math.floor((10 - state.piece.shape[0].length) / 2);
    state.pieceY = -1;
    if (collides(state.board, state.piece, state.pieceX, state.pieceY + 1)) {
      state.gameOver = true;
      setStatus("Game over. Press R to restart.");
    }
  }

  function resetGame() {
    stateRef.current = {
      board: emptyBoard(),
      piece: null,
      next: randomPiece(),
      pieceX: 0,
      pieceY: 0,
      lastTime: performance.now(),
      dropAccumulator: 0,
      dropInterval: 900,
      lines: 0,
      level: 1,
      gameOver: false,
    };
    spawnPiece(stateRef.current);
    setScore(0);
    setLines(0);
    setLevel(1);
    setStatus("Arrow keys to move. Up to rotate.");
  }

  function hardDrop(state) {
    while (!collides(state.board, state.piece, state.pieceX, state.pieceY + 1)) {
      state.pieceY += 1;
    }
  }

  function lockAndAdvance(state) {
    mergePiece(state.board, state.piece, state.pieceX, state.pieceY);
    const cleared = clearLines(state.board);
    if (cleared > 0) {
      state.lines += cleared;
      state.level = Math.floor(state.lines / 10) + 1;
      state.dropInterval = Math.max(120, 900 - (state.level - 1) * 75);
      setLines(state.lines);
      setLevel(state.level);
      setScore((prevScore) => prevScore + [0, 100, 300, 500, 800][cleared] * state.level);
      setStatus(cleared >= 4 ? "TETRIS!" : `${cleared} line cleared`);
    }
    spawnPiece(state);
  }

  useEffect(() => {
    if (!isOpen) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    resetGame();

    function onKeyDown(event) {
      const state = stateRef.current;
      if (!state || state.gameOver) {
        if (event.key.toLowerCase() === "r") {
          resetGame();
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        if (!collides(state.board, state.piece, state.pieceX - 1, state.pieceY)) {
          state.pieceX -= 1;
        }
      } else if (event.key === "ArrowRight") {
        if (!collides(state.board, state.piece, state.pieceX + 1, state.pieceY)) {
          state.pieceX += 1;
        }
      } else if (event.key === "ArrowDown") {
        if (!collides(state.board, state.piece, state.pieceX, state.pieceY + 1)) {
          state.pieceY += 1;
          setScore((prev) => prev + 1);
        }
      } else if (event.key === "ArrowUp") {
        const rotated = rotateMatrix(state.piece.shape);
        const candidate = { ...state.piece, shape: rotated };
        if (!collides(state.board, candidate, state.pieceX, state.pieceY)) {
          state.piece = candidate;
        }
      } else if (event.code === "Space") {
        event.preventDefault();
        hardDrop(state);
        lockAndAdvance(state);
      } else if (event.key.toLowerCase() === "r") {
        resetGame();
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    function drawBlock(x, y, color, cell) {
      ctx.fillStyle = color;
      ctx.fillRect(x * cell, y * cell, cell, cell);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.strokeRect(x * cell, y * cell, cell, cell);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.moveTo(x * cell + 1, y * cell + 1);
      ctx.lineTo((x + 1) * cell - 1, y * cell + 1);
      ctx.lineTo((x + 1) * cell - 1, (y + 1) * cell - 1);
      ctx.stroke();
    }

    function animate(time) {
      const state = stateRef.current;
      if (!state) {
        return;
      }

      const delta = time - state.lastTime;
      state.lastTime = time;
      if (!state.gameOver) {
        state.dropAccumulator += delta;
        if (state.dropAccumulator >= state.dropInterval) {
          state.dropAccumulator = 0;
          if (!collides(state.board, state.piece, state.pieceX, state.pieceY + 1)) {
            state.pieceY += 1;
          } else {
            lockAndAdvance(state);
          }
        }
      }

      const cell = 20;
      ctx.clearRect(0, 0, 300, 420);
      const bg = ctx.createLinearGradient(0, 0, 0, 420);
      bg.addColorStop(0, "#121a34");
      bg.addColorStop(1, "#0a1022");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 300, 420);

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      for (let gx = 0; gx <= 10; gx += 1) {
        ctx.beginPath();
        ctx.moveTo(gx * cell, 0);
        ctx.lineTo(gx * cell, 400);
        ctx.stroke();
      }
      for (let gy = 0; gy <= 20; gy += 1) {
        ctx.beginPath();
        ctx.moveTo(0, gy * cell);
        ctx.lineTo(200, gy * cell);
        ctx.stroke();
      }

      state.board.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color) {
            drawBlock(x, y, color, cell);
          }
        });
      });

      if (state.piece) {
        state.piece.shape.forEach((row, py) => {
          row.forEach((value, px) => {
            if (value && state.pieceY + py >= 0) {
              drawBlock(state.pieceX + px, state.pieceY + py, state.piece.color, cell);
            }
          });
        });
      }

      ctx.fillStyle = "#1a2848";
      ctx.fillRect(206, 10, 84, 390);
      ctx.strokeStyle = "#3c5788";
      ctx.strokeRect(206, 10, 84, 390);
      ctx.fillStyle = "#d9e8ff";
      ctx.font = "12px Tahoma";
      ctx.fillText("NEXT", 230, 28);
      ctx.fillText("SCORE", 220, 160);
      ctx.fillText(String(score), 220, 178);
      ctx.fillText("LINES", 220, 224);
      ctx.fillText(String(lines), 220, 242);
      ctx.fillText("LEVEL", 220, 288);
      ctx.fillText(String(level), 220, 306);

      if (state.next) {
        const nx = 224;
        const ny = 52;
        const nCell = 14;
        state.next.shape.forEach((row, py) => {
          row.forEach((value, px) => {
            if (value) {
              ctx.fillStyle = state.next.color;
              ctx.fillRect(nx + px * nCell, ny + py * nCell, nCell, nCell);
              ctx.strokeStyle = "rgba(0,0,0,0.35)";
              ctx.strokeRect(nx + px * nCell, ny + py * nCell, nCell, nCell);
            }
          });
        });
      }

      if (state.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, 300, 420);
        ctx.fillStyle = "#ffcfcf";
        ctx.font = "bold 20px Tahoma";
        ctx.fillText("GAME OVER", 78, 196);
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="tetris-game">
      <div className="tetris-toolbar">
        <span>Score: {String(score).padStart(6, "0")}</span>
        <span>Lines: {lines}</span>
        <span>Level: {level}</span>
      </div>
      <canvas ref={canvasRef} className="tetris-canvas" width={300} height={420} />
      <div className="tetris-status">{status}</div>
    </div>
  );
}

const DEFAULT_ICONS = [
  { id: "computer", label: "My Computer", type: "computer" },
  { id: "recycle", label: "Recycle Bin", type: "recycle-shortcut" },
  { id: "cmd", label: "Command Prompt", type: "cmd-shortcut" },
  { id: "readme", label: "readme.txt", type: "text-file" },
  { id: "gemini", label: "Gemini API Key", type: "gemini-shortcut" },
  { id: "pinball", label: "3D Pinball", type: "pinball-app" },
  { id: "tetris", label: "Tetris", type: "tetris-app" },
];

const DOG_MESSAGES = [
  "Hi! Need help finding anything on your desktop?",
  "Tip: Double-click desktop icons to open them.",
  "You can drag windows by the blue title bar.",
  "This setup looks very Windows XP. Nice work.",
];

function calculateResponsivePinballSize(viewportWidth, viewportHeight, taskbarHeight) {
  const margin = 24;
  const minWindowWidth = 420;
  const minWindowHeight = 320;
  const maxWindowWidth = Math.max(320, viewportWidth - margin);
  const maxWindowHeight = Math.max(300, viewportHeight - taskbarHeight - margin);
  const clampedMinWidth = Math.min(minWindowWidth, maxWindowWidth);
  const clampedMinHeight = Math.min(minWindowHeight, maxWindowHeight);

  const canvasAspectWidth = 620;
  const canvasAspectHeight = 420;
  const horizontalChrome = 16; // pinball-game horizontal padding
  const verticalChrome = 100; // title bar + toolbar/status + paddings

  const maxCanvasWidthFromHeight = Math.max(
    200,
    Math.floor(((maxWindowHeight - verticalChrome) * canvasAspectWidth) / canvasAspectHeight)
  );
  const idealWindowWidth = Math.floor(viewportWidth * 0.56);
  const fittedWindowWidth = Math.min(maxWindowWidth, maxCanvasWidthFromHeight + horizontalChrome, idealWindowWidth);

  const windowWidth = Math.min(maxWindowWidth, Math.max(clampedMinWidth, fittedWindowWidth));
  const canvasWidth = Math.max(200, windowWidth - horizontalChrome);
  const canvasHeight = Math.floor((canvasWidth * canvasAspectHeight) / canvasAspectWidth);
  const windowHeight = Math.min(
    maxWindowHeight,
    Math.max(clampedMinHeight, canvasHeight + verticalChrome)
  );

  return { width: windowWidth, height: windowHeight };
}

function App() {
  const GEMINI_KEY_GLOBAL = "__geminiApiKeySession";
  const TASKBAR_HEIGHT = 40;
  const ICON_WIDTH = 92;
  const ICON_HEIGHT = 96;
  const ICON_GAP = 14;
  const DESKTOP_PADDING = 12;
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [siteInfo, setSiteInfo] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [pinballOpen, setPinballOpen] = useState(false);
  const [tetrisOpen, setTetrisOpen] = useState(false);
  const [windowStack, setWindowStack] = useState([
    "properties",
    "explorer",
    "notepad",
    "gemini",
    "pinball",
    "tetris",
  ]);
  const [dogBubbleOpen, setDogBubbleOpen] = useState(false);
  const [dogMessageIndex, setDogMessageIndex] = useState(0);
  const [dogCustomMessage, setDogCustomMessage] = useState("");
  const [readmeContent, setReadmeContent] = useState(
    "Welcome to this Windows XP desktop web app.\n\nYou can edit this file. Changes stay until you refresh the page."
  );
  const [readmeFontSize, setReadmeFontSize] = useState(13);
  const [explorerPos, setExplorerPos] = useState({ x: 160, y: 78 });
  const [explorerSize, setExplorerSize] = useState({ width: 640, height: 430 });
  const [notepadPos, setNotepadPos] = useState({ x: 220, y: 110 });
  const [notepadSize, setNotepadSize] = useState({ width: 620, height: 440 });
  const [geminiPos, setGeminiPos] = useState({ x: 280, y: 138 });
  const [pinballPos, setPinballPos] = useState({ x: 200, y: 86 });
  const [pinballSize, setPinballSize] = useState(() => {
    const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
    return calculateResponsivePinballSize(viewportWidth, viewportHeight, TASKBAR_HEIGHT);
  });
  const [tetrisPos, setTetrisPos] = useState({ x: 260, y: 96 });
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window[GEMINI_KEY_GLOBAL] || "";
  });
  const [geminiDraft, setGeminiDraft] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window[GEMINI_KEY_GLOBAL] || "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowPos, setWindowPos] = useState({ x: 120, y: 120 });
  const [icons, setIcons] = useState(() => DEFAULT_ICONS.map((icon, index) => ({ ...icon, x: 28, y: 36 + index * 110 })));
  const dragState = useRef({ target: null, id: null, offsetX: 0, offsetY: 0 });
  const desktopRef = useRef(null);
  const windowRef = useRef(null);
  const explorerRef = useRef(null);
  const notepadRef = useRef(null);
  const geminiRef = useRef(null);
  const pinballRef = useRef(null);
  const tetrisRef = useRef(null);

  function getResponsivePinballSize() {
    return calculateResponsivePinballSize(window.innerWidth, window.innerHeight, TASKBAR_HEIGHT);
  }

  function clampPinballPositionToViewport(x, y, width, height) {
    const margin = 12;
    const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - height - margin);
    return {
      x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - width - margin)),
      y: Math.min(Math.max(margin, y), maxY),
    };
  }

  function bringWindowToFront(windowId) {
    setWindowStack((prev) => [...prev.filter((id) => id !== windowId), windowId]);
  }

  function getWindowZ(windowId) {
    return 30 + windowStack.indexOf(windowId);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window[GEMINI_KEY_GLOBAL] = geminiApiKey;
    }
  }, [geminiApiKey]);

  useEffect(() => {
    function closeMenu() {
      setMenu((prev) => ({ ...prev, visible: false, targetId: null }));
      setStartMenuOpen(false);
    }

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  function onStartButtonClick(event) {
    event.stopPropagation();
    setStartMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    function arrangeIcons(iconItems) {
      const desktop = desktopRef.current;
      if (!desktop) {
        return iconItems;
      }

      const availableHeight = Math.max(
        ICON_HEIGHT,
        desktop.clientHeight - TASKBAR_HEIGHT - DESKTOP_PADDING * 2
      );
      const rows = Math.max(1, Math.floor((availableHeight + ICON_GAP) / (ICON_HEIGHT + ICON_GAP)));

      return iconItems.map((icon, index) => {
        const column = Math.floor(index / rows);
        const row = index % rows;
        return {
          ...icon,
          x: DESKTOP_PADDING + column * (ICON_WIDTH + ICON_GAP),
          y: DESKTOP_PADDING + row * (ICON_HEIGHT + ICON_GAP),
        };
      });
    }

    setIcons((prev) => arrangeIcons(prev));

    function clampToViewport(x, y) {
      const popup = windowRef.current;
      if (!popup) {
        return { x, y };
      }

      const maxX = Math.max(12, window.innerWidth - popup.offsetWidth - 12);
      const maxY = Math.max(12, window.innerHeight - popup.offsetHeight - 12);
      return {
        x: Math.min(Math.max(12, x), maxX),
        y: Math.min(Math.max(12, y), maxY),
      };
    }

    function clampExplorerToViewport(x, y, width, height) {
      const margin = 12;
      const explorerWidth = width || explorerRef.current?.offsetWidth || 640;
      const explorerHeight = height || explorerRef.current?.offsetHeight || 430;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - explorerHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - explorerWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampExplorerSizeToViewport(width, height, x, y) {
      const margin = 12;
      const minWidth = 420;
      const minHeight = 280;
      const explorerRect = explorerRef.current?.getBoundingClientRect();
      const left = x ?? explorerRect?.left ?? 160;
      const top = y ?? explorerRect?.top ?? 78;
      const maxWidth = Math.max(minWidth, window.innerWidth - left - margin);
      const maxHeight = Math.max(minHeight, window.innerHeight - TASKBAR_HEIGHT - top - margin);
      return {
        width: Math.min(Math.max(minWidth, width), maxWidth),
        height: Math.min(Math.max(minHeight, height), maxHeight),
      };
    }

    function clampNotepadToViewport(x, y, width, height) {
      const margin = 12;
      const notepadWidth = width || notepadRef.current?.offsetWidth || 620;
      const notepadHeight = height || notepadRef.current?.offsetHeight || 440;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - notepadHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - notepadWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampNotepadSizeToViewport(width, height, x, y) {
      const margin = 12;
      const minWidth = 420;
      const minHeight = 260;
      const notepadRect = notepadRef.current?.getBoundingClientRect();
      const left = x ?? notepadRect?.left ?? 220;
      const top = y ?? notepadRect?.top ?? 110;
      const maxWidth = Math.max(minWidth, window.innerWidth - left - margin);
      const maxHeight = Math.max(minHeight, window.innerHeight - TASKBAR_HEIGHT - top - margin);
      return {
        width: Math.min(Math.max(minWidth, width), maxWidth),
        height: Math.min(Math.max(minHeight, height), maxHeight),
      };
    }

    function clampGeminiToViewport(x, y, width, height) {
      const margin = 12;
      const geminiWidth = width || geminiRef.current?.offsetWidth || 540;
      const geminiHeight = height || geminiRef.current?.offsetHeight || 240;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - geminiHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - geminiWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampPinballToViewport(x, y, width, height) {
      const margin = 12;
      const pinballWidth = width || pinballRef.current?.offsetWidth || 610;
      const pinballHeight = height || pinballRef.current?.offsetHeight || 500;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - pinballHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - pinballWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampTetrisToViewport(x, y, width, height) {
      const margin = 12;
      const tWidth = width || tetrisRef.current?.offsetWidth || 360;
      const tHeight = height || tetrisRef.current?.offsetHeight || 520;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - tHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - tWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampIconToDesktop(x, y) {
      const desktop = desktopRef.current;
      if (!desktop) {
        return { x, y };
      }

      const min = DESKTOP_PADDING;
      const maxX = Math.max(min, desktop.clientWidth - ICON_WIDTH - min);
      const maxY = Math.max(min, desktop.clientHeight - TASKBAR_HEIGHT - ICON_HEIGHT - min);
      return {
        x: Math.min(Math.max(min, x), maxX),
        y: Math.min(Math.max(min, y), maxY),
      };
    }

    function onPointerMove(event) {
      if (!dragState.current.target) {
        return;
      }

      if (dragState.current.target === "window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setWindowPos(clampToViewport(nextX, nextY));
      }

      if (dragState.current.target === "explorer-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setExplorerPos(clampExplorerToViewport(nextX, nextY));
      }

      if (dragState.current.target === "notepad-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setNotepadPos(clampNotepadToViewport(nextX, nextY));
      }

      if (dragState.current.target === "pinball-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setPinballPos(clampPinballToViewport(nextX, nextY));
      }

      if (dragState.current.target === "gemini-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setGeminiPos(clampGeminiToViewport(nextX, nextY));
      }

      if (dragState.current.target === "tetris-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setTetrisPos(clampTetrisToViewport(nextX, nextY));
      }

      if (dragState.current.target === "explorer-resize") {
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setExplorerSize(clampExplorerSizeToViewport(nextWidth, nextHeight));
      }

      if (dragState.current.target === "notepad-resize") {
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setNotepadSize(clampNotepadSizeToViewport(nextWidth, nextHeight));
      }

      if (dragState.current.target === "icon") {
        const desktopRect = desktopRef.current?.getBoundingClientRect();
        if (!desktopRect || !dragState.current.id) {
          return;
        }

        const pointerX = event.clientX - desktopRect.left;
        const pointerY = event.clientY - desktopRect.top;
        const nextX = pointerX - dragState.current.offsetX;
        const nextY = pointerY - dragState.current.offsetY;
        const clamped = clampIconToDesktop(nextX, nextY);
        setIcons((prev) =>
          prev.map((icon) =>
            icon.id === dragState.current.id ? { ...icon, x: clamped.x, y: clamped.y } : icon
          )
        );
      }
    }

    function onPointerUp() {
      dragState.current.target = null;
      dragState.current.id = null;
      document.body.classList.remove("is-dragging");
    }

    function onResize() {
      setWindowPos((prev) => clampToViewport(prev.x, prev.y));
      setExplorerSize((prev) => clampExplorerSizeToViewport(prev.width, prev.height));
      setExplorerPos((prev) => clampExplorerToViewport(prev.x, prev.y));
      setNotepadSize((prev) => clampNotepadSizeToViewport(prev.width, prev.height));
      setNotepadPos((prev) => clampNotepadToViewport(prev.x, prev.y));
      setGeminiPos((prev) => clampGeminiToViewport(prev.x, prev.y));
      const nextPinballSize = getResponsivePinballSize();
      setPinballSize(nextPinballSize);
      setPinballPos((prev) =>
        clampPinballToViewport(prev.x, prev.y, nextPinballSize.width, nextPinballSize.height)
      );
      setTetrisPos((prev) => clampTetrisToViewport(prev.x, prev.y));
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function onIconRightClick(event, iconId) {
    event.preventDefault();
    setMenu({ visible: true, x: event.clientX, y: event.clientY, targetId: iconId });
  }

  async function onPropertiesClick() {
    setMenu((prev) => ({ ...prev, visible: false }));
    setError("");
    setIsLoading(true);
    bringWindowToFront("properties");

    try {
      const response = await fetch("/api/site-info");
      if (!response.ok) {
        throw new Error("Could not load properties.");
      }
      const data = await response.json();
      setSiteInfo(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function closeProperties() {
    setSiteInfo(null);
    setError("");
  }

  function openExplorer() {
    bringWindowToFront("explorer");
    setExplorerOpen(true);
  }

  function closeExplorer() {
    setExplorerOpen(false);
  }

  function openReadme() {
    bringWindowToFront("notepad");
    setNotepadOpen(true);
  }

  function closeReadme() {
    setNotepadOpen(false);
  }

  function openGeminiKey() {
    bringWindowToFront("gemini");
    setGeminiDraft(geminiApiKey);
    setDogCustomMessage("");
    setGeminiOpen(true);
  }

  function closeGeminiKey() {
    setGeminiOpen(false);
  }

  function saveGeminiKey() {
    const trimmed = geminiDraft.trim();
    if (!trimmed) {
      setDogCustomMessage("Woof! I need a Gemini API key before I can save it.");
      setDogBubbleOpen(true);
      return;
    }
    setDogCustomMessage("");
    setGeminiApiKey(trimmed);
    setGeminiOpen(false);
  }

  function openPinball() {
    const nextPinballSize = getResponsivePinballSize();
    const centeredX = Math.floor((window.innerWidth - nextPinballSize.width) / 2);
    const centeredY = Math.max(12, Math.floor((window.innerHeight - TASKBAR_HEIGHT - nextPinballSize.height) / 2));
    const nextPinballPos = clampPinballPositionToViewport(
      centeredX,
      centeredY,
      nextPinballSize.width,
      nextPinballSize.height
    );
    setPinballSize(nextPinballSize);
    setPinballPos(nextPinballPos);
    bringWindowToFront("pinball");
    setPinballOpen(true);
    setStartMenuOpen(false);
  }

  function closePinball() {
    setPinballOpen(false);
  }

  function openTetris() {
    bringWindowToFront("tetris");
    setTetrisOpen(true);
    setStartMenuOpen(false);
  }

  function closeTetris() {
    setTetrisOpen(false);
  }

  function onDogClick() {
    setDogCustomMessage("");
    setDogBubbleOpen((prevOpen) => {
      if (prevOpen) {
        setDogMessageIndex((prev) => (prev + 1) % DOG_MESSAGES.length);
      }
      return !prevOpen;
    });
  }

  function changeReadmeFontSize(delta) {
    setReadmeFontSize((prev) => Math.min(28, Math.max(10, prev + delta)));
  }

  function onDeleteIconClick() {
    if (!menu.targetId) {
      return;
    }

    setIcons((prev) => prev.filter((icon) => icon.id !== menu.targetId));
    setMenu({ visible: false, x: 0, y: 0, targetId: null });
  }

  function onWindowHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (!windowRef.current) {
      return;
    }

    const rect = windowRef.current.getBoundingClientRect();
    dragState.current = {
      target: "window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onExplorerHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = explorerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "explorer-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onExplorerResizePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      target: "explorer-resize",
      id: null,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: explorerSize.width,
      startHeight: explorerSize.height,
    };
    document.body.classList.add("is-dragging");
  }

  function onNotepadResizePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      target: "notepad-resize",
      id: null,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: notepadSize.width,
      startHeight: notepadSize.height,
    };
    document.body.classList.add("is-dragging");
  }

  function onNotepadHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = notepadRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "notepad-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onPinballHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = pinballRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "pinball-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onGeminiHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = geminiRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "gemini-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onTetrisHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = tetrisRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "tetris-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onIconPointerDown(event, iconId) {
    if (event.button !== 0) {
      return;
    }

    const desktopRect = desktopRef.current?.getBoundingClientRect();
    if (!desktopRect) {
      return;
    }

    const icon = icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }

    const pointerX = event.clientX - desktopRect.left;
    const pointerY = event.clientY - desktopRect.top;
    dragState.current = {
      target: "icon",
      id: iconId,
      offsetX: pointerX - icon.x,
      offsetY: pointerY - icon.y,
    };
    document.body.classList.add("is-dragging");
  }

  function renderIconGraphic(type) {
    if (type === "computer") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="8" y="10" width="48" height="31" rx="4" fill="#bfd9ff" stroke="#2d5f9f" strokeWidth="2" />
          <rect x="12" y="14" width="40" height="21" fill="#65a9f0" />
          <rect x="26" y="41" width="12" height="7" fill="#bec6d1" stroke="#6e7482" strokeWidth="1.5" />
          <rect x="18" y="48" width="28" height="6" rx="2" fill="#d6dde8" stroke="#79808d" strokeWidth="1.5" />
        </svg>
      );
    }

    if (type === "recycle-shortcut") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M22 16h20l3 6H19l3-6z" fill="#d3def0" stroke="#5f6c84" strokeWidth="1.5" />
          <rect x="18" y="22" width="28" height="30" rx="4" fill="#eaf0fb" stroke="#67748e" strokeWidth="2" />
          <path d="M24 27h4v19h-4zM30 27h4v19h-4zM36 27h4v19h-4z" fill="#a9b9d8" />
        </svg>
      );
    }

    if (type === "cmd-shortcut") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="8" y="14" width="48" height="34" rx="4" fill="#0f1a2b" stroke="#4d647f" strokeWidth="2" />
          <path d="M17 30l6-5-6-5" fill="none" stroke="#d8e9ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 34h14" stroke="#d8e9ff" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="22" y="48" width="20" height="6" rx="2" fill="#c6d6ea" stroke="#7185a0" strokeWidth="1.5" />
        </svg>
      );
    }

    if (type === "gemini-shortcut") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="geminiBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4dcff" />
              <stop offset="100%" stopColor="#baa1ee" />
            </linearGradient>
          </defs>
          <path d="M32 8l8 14 14 8-14 8-8 14-8-14-14-8 14-8z" fill="url(#geminiBg)" stroke="#6d5aa4" strokeWidth="2" />
          <circle cx="32" cy="30" r="5" fill="#ffffff" opacity="0.9" />
        </svg>
      );
    }

    if (type === "pinball-app") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="pinballBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5db2ff" />
              <stop offset="100%" stopColor="#184f96" />
            </linearGradient>
          </defs>
          <rect x="10" y="8" width="44" height="48" rx="8" fill="url(#pinballBg)" stroke="#2e4f7a" strokeWidth="2" />
          <circle cx="32" cy="23" r="8" fill="#ffd97e" stroke="#9b5f16" strokeWidth="2" />
          <rect x="16" y="39" width="14" height="5" rx="2" fill="#e8f5ff" />
          <rect x="34" y="39" width="14" height="5" rx="2" fill="#e8f5ff" />
        </svg>
      );
    }

    if (type === "tetris-app") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="10" y="10" width="44" height="44" rx="6" fill="#0f1f3a" stroke="#4a6ca2" strokeWidth="2" />
          <rect x="16" y="18" width="10" height="10" fill="#45d8ff" />
          <rect x="26" y="18" width="10" height="10" fill="#45d8ff" />
          <rect x="36" y="18" width="10" height="10" fill="#45d8ff" />
          <rect x="26" y="30" width="10" height="10" fill="#ff5b66" />
          <rect x="36" y="30" width="10" height="10" fill="#ff5b66" />
          <rect x="16" y="40" width="10" height="10" fill="#ffe34f" />
          <rect x="26" y="40" width="10" height="10" fill="#ffe34f" />
        </svg>
      );
    }

    if (type === "text-file") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M16 7h30l9 9v41H16z" fill="#ffffff" stroke="#738ba8" strokeWidth="2" />
          <path d="M46 7v9h9" fill="#e0ecfb" />
          <rect x="20" y="13" width="22" height="6" rx="1.5" fill="#4f87cd" />
          <path d="M22 27h26M22 33h26M22 39h21" stroke="#3b6fa9" strokeWidth="2" />
          <rect x="18" y="46" width="35" height="2" fill="#d7e4f5" />
        </svg>
      );
    }

    return (
      <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="8" width="48" height="48" rx="6" fill="#d5e6ff" stroke="#3b6aa8" strokeWidth="2" />
        <path d="M18 30h28" stroke="#5b7fae" strokeWidth="2" />
      </svg>
    );
  }

  const openTaskbarItems = [
    (isLoading || error || siteInfo) && { id: "properties", label: "My Computer Properties", kind: "properties" },
    explorerOpen && { id: "explorer", label: "My Computer", kind: "explorer" },
    notepadOpen && { id: "notepad", label: "readme.txt - Notepad", kind: "notepad" },
    geminiOpen && { id: "gemini", label: "Gemini API Key", kind: "gemini" },
    pinballOpen && { id: "pinball", label: "3D Pinball", kind: "pinball" },
    tetrisOpen && { id: "tetris", label: "Tetris", kind: "tetris" },
  ].filter(Boolean);

  function onTaskbarWindowClick(windowId) {
    bringWindowToFront(windowId);
    setStartMenuOpen(false);
  }

  return (
    <main ref={desktopRef} className="desktop">
      {icons.map((icon) => (
        <div
          key={icon.id}
          className={`icon ${icon.type.endsWith("shortcut") ? "icon--shortcut" : ""}`}
          style={{ left: icon.x, top: icon.y }}
          onPointerDown={(event) => onIconPointerDown(event, icon.id)}
          onDoubleClick={
            icon.id === "computer"
              ? openExplorer
                : icon.id === "readme"
                ? openReadme
                : icon.id === "gemini"
                  ? openGeminiKey
                : icon.id === "pinball"
                  ? openPinball
                  : icon.id === "tetris"
                    ? openTetris
                  : undefined
          }
          onContextMenu={
            icon.id === "computer" || icon.id === "recycle" || icon.id === "cmd"
              ? (event) => onIconRightClick(event, icon.id)
              : undefined
          }
          aria-label={`${icon.label} icon`}
        >
          <div className="icon-image" title={icon.label}>
            {renderIconGraphic(icon.type)}
          </div>
          <div className="icon-label">{icon.label}</div>
        </div>
      ))}

      <section className="xp-dog" aria-label="Desktop assistant">
        <button type="button" className="xp-dog-btn" onClick={onDogClick} aria-label="Toggle assistant bubble">
          <div className="xp-dog-sprite" aria-hidden="true">
            <span className="xp-dog-ear xp-dog-ear--left" />
            <span className="xp-dog-ear xp-dog-ear--right" />
            <span className="xp-dog-head">
              <span className="xp-dog-eye xp-dog-eye--left" />
              <span className="xp-dog-eye xp-dog-eye--right" />
              <span className="xp-dog-nose" />
            </span>
            <span className="xp-dog-body" />
            <span className="xp-dog-tail" />
            <span className="xp-dog-paw xp-dog-paw--left" />
            <span className="xp-dog-paw xp-dog-paw--right" />
          </div>
        </button>
        {dogBubbleOpen && (
          <div className="xp-dog-bubble" role="status" aria-live="polite">
            {dogCustomMessage || DOG_MESSAGES[dogMessageIndex]}
          </div>
        )}
      </section>

      {menu.visible && (
        <div className="context-menu" style={{ left: menu.x, top: menu.y }}>
          {menu.targetId === "computer" && (
            <button className="context-item" onClick={onPropertiesClick}>
              Properties
            </button>
          )}
          {(menu.targetId === "recycle" || menu.targetId === "cmd") && (
            <button className="context-item" onClick={onDeleteIconClick}>
              Delete
            </button>
          )}
        </div>
      )}

      {(isLoading || error || siteInfo) && (
        <section
          ref={windowRef}
          className="properties-window"
          style={{ left: windowPos.x, top: windowPos.y, zIndex: getWindowZ("properties") }}
          onPointerDown={() => bringWindowToFront("properties")}
          role="dialog"
          aria-label="Properties window"
        >
          <div className="window-header" onPointerDown={onWindowHeaderPointerDown}>
            <span className="window-title">My Computer Properties</span>
            <button className="close-btn" onClick={closeProperties} aria-label="Close">
              ×
            </button>
          </div>
          <div className="window-body">
            {isLoading && <p>Loading properties...</p>}
            {error && <p>{error}</p>}
            {siteInfo && (
              <>
                <div className="row">
                  <span className="label">Owner:</span>
                  <span>{siteInfo.owner}</span>
                </div>
                <div className="row">
                  <span className="label">Storage:</span>
                  <span>{siteInfo.storage}</span>
                </div>
                <div className="row">
                  <span className="label">Additional cool information:</span>
                  <ul className="list">
                    {siteInfo.coolInfo.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="row">
                  <span className="label">Status:</span>
                  <span>{siteInfo.uptimeHint}</span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {explorerOpen && (
        <section
          ref={explorerRef}
          className="explorer-window"
          style={{
            left: explorerPos.x,
            top: explorerPos.y,
            width: explorerSize.width,
            height: explorerSize.height,
            zIndex: getWindowZ("explorer"),
          }}
          onPointerDown={() => bringWindowToFront("explorer")}
          role="dialog"
          aria-label="File Explorer"
        >
          <div className="window-header" onPointerDown={onExplorerHeaderPointerDown}>
            <span className="window-title">My Computer</span>
            <button className="close-btn" onClick={closeExplorer} aria-label="Close Explorer">
              ×
            </button>
          </div>
          <div className="explorer-toolbar">
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                🔍
              </span>
              <span>Search</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                ⭐
              </span>
              <span>Favorites</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                🕘
              </span>
              <span>History</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                🌐
              </span>
              <span>Channels</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                ⛶
              </span>
              <span>Fullscreen</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                ✉️
              </span>
              <span>Mail</span>
            </button>
          </div>
          <div className="explorer-body">
            <aside className="explorer-sidebar">
              <div className="sidebar-title">Tasks</div>
              <div className="sidebar-item">System Tasks</div>
              <div className="sidebar-item">Other Places</div>
              <div className="sidebar-item">Details</div>
            </aside>
            <div className="explorer-content">
              <div className="explorer-path">C:\</div>
              <div className="explorer-empty">This folder is empty.</div>
            </div>
          </div>
          <div
            className="explorer-resize-handle"
            onPointerDown={onExplorerResizePointerDown}
            aria-hidden="true"
          />
        </section>
      )}

      {notepadOpen && (
        <section
          ref={notepadRef}
          className="notepad-window"
          style={{
            left: notepadPos.x,
            top: notepadPos.y,
            width: notepadSize.width,
            height: notepadSize.height,
            zIndex: getWindowZ("notepad"),
          }}
          onPointerDown={() => bringWindowToFront("notepad")}
          role="dialog"
          aria-label="Notepad"
        >
          <div className="window-header" onPointerDown={onNotepadHeaderPointerDown}>
            <span className="window-title">readme.txt - Notepad</span>
            <button className="close-btn" onClick={closeReadme} aria-label="Close Notepad">
              ×
            </button>
          </div>
          <div className="notepad-toolbar">
            <button className="toolbar-btn" type="button">File</button>
            <button className="toolbar-btn" type="button">Edit</button>
            <button className="toolbar-btn" type="button">Format</button>
            <button className="toolbar-btn" type="button">View</button>
            <button className="toolbar-btn" type="button">Help</button>
            <span className="toolbar-spacer" />
            <button className="toolbar-btn" type="button" onClick={() => changeReadmeFontSize(-1)}>A-</button>
            <button className="toolbar-btn" type="button" onClick={() => changeReadmeFontSize(1)}>A+</button>
          </div>
          <div className="notepad-body">
            <textarea
              className="notepad-editor"
              value={readmeContent}
              onChange={(event) => setReadmeContent(event.target.value)}
              style={{ fontSize: `${readmeFontSize}px` }}
              spellCheck={false}
            />
          </div>
          <div
            className="notepad-resize-handle"
            onPointerDown={onNotepadResizePointerDown}
            aria-hidden="true"
          />
        </section>
      )}

      {geminiOpen && (
        <section
          ref={geminiRef}
          className="gemini-window"
          style={{ left: geminiPos.x, top: geminiPos.y, zIndex: getWindowZ("gemini") }}
          onPointerDown={() => bringWindowToFront("gemini")}
          role="dialog"
          aria-label="Gemini API Key"
        >
          <div className="window-header" onPointerDown={onGeminiHeaderPointerDown}>
            <span className="window-title">Gemini API Key</span>
            <button className="close-btn" onClick={closeGeminiKey} aria-label="Close Gemini API Key">
              ×
            </button>
          </div>
          <div className="window-body">
            <div className="row">
              <span className="label">API Key:</span>
            </div>
            <input
              className="gemini-input"
              type="text"
              value={geminiDraft}
              onChange={(event) => setGeminiDraft(event.target.value)}
              placeholder="Paste your Gemini API key"
            />
            <div className="gemini-actions">
              <button className="toolbar-btn" type="button" onClick={saveGeminiKey}>
                Save Key
              </button>
              <button className="toolbar-btn" type="button" onClick={closeGeminiKey}>
                Close
              </button>
            </div>
            <div className="gemini-status">
              Current session key: {geminiApiKey || "(none)"}
            </div>
          </div>
        </section>
      )}

      {pinballOpen && (
        <section
          ref={pinballRef}
          className="pinball-window"
          style={{
            left: pinballPos.x,
            top: pinballPos.y,
            width: pinballSize.width,
            height: pinballSize.height,
            zIndex: getWindowZ("pinball"),
          }}
          onPointerDown={() => bringWindowToFront("pinball")}
          role="dialog"
          aria-label="3D Pinball"
        >
          <div className="window-header" onPointerDown={onPinballHeaderPointerDown}>
            <span className="window-title">3D Pinball for Windows - Space Cadet</span>
            <div className="window-actions">
              <button className="close-btn" onClick={closePinball} aria-label="Close Pinball">
                ×
              </button>
            </div>
          </div>
          <PinballGame isOpen={pinballOpen} />
        </section>
      )}

      {tetrisOpen && (
        <section
          ref={tetrisRef}
          className="tetris-window"
          style={{ left: tetrisPos.x, top: tetrisPos.y, zIndex: getWindowZ("tetris") }}
          onPointerDown={() => bringWindowToFront("tetris")}
          role="dialog"
          aria-label="Tetris"
        >
          <div className="window-header" onPointerDown={onTetrisHeaderPointerDown}>
            <span className="window-title">Tetris</span>
            <button className="close-btn" onClick={closeTetris} aria-label="Close Tetris">
              ×
            </button>
          </div>
          <TetrisGame isOpen={tetrisOpen} />
        </section>
      )}

      {startMenuOpen && (
        <section className="start-menu" role="dialog" aria-label="Start menu" onClick={(event) => event.stopPropagation()}>
          <div className="start-menu-top">
            <div className="start-avatar" />
            <div className="start-user">harri</div>
          </div>
          <div className="start-menu-body">
            <div className="start-left">
              <button className="start-item" type="button">
                Internet
              </button>
              <button className="start-item" type="button">
                E-mail
              </button>
              <hr className="start-divider" />
              <button className="start-item" type="button">
                My Documents
              </button>
              <button className="start-item" type="button">
                My Pictures
              </button>
              <button className="start-item" type="button">
                My Music
              </button>
              <button className="start-item" type="button">
                My Recent Documents
              </button>
              <button className="start-item" type="button" onClick={openPinball}>
                3D Pinball
              </button>
              <button className="start-item" type="button" onClick={openTetris}>
                Tetris
              </button>
            </div>
            <div className="start-right">
              <button className="start-link" type="button">
                My Computer
              </button>
              <button className="start-link" type="button">
                Control Panel
              </button>
              <button className="start-link" type="button">
                Printers and Faxes
              </button>
              <button className="start-link" type="button">
                Help and Support
              </button>
              <button className="start-link" type="button">
                Search
              </button>
              <button className="start-link" type="button">
                Run...
              </button>
            </div>
          </div>
          <div className="start-menu-bottom">
            <button className="start-power" type="button">
              Turn Off Computer
            </button>
          </div>
        </section>
      )}

      <footer className="taskbar" aria-hidden="true">
        <button className="start-button" type="button" onClick={onStartButtonClick}>
          <span className="start-orb">
            <span className="orb-red" />
            <span className="orb-green" />
            <span className="orb-blue" />
            <span className="orb-yellow" />
          </span>
          <span className="start-text">start</span>
        </button>
        <div className="taskbar-segment">
          <div className="taskbar-windows">
            {openTaskbarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="taskbar-window-btn"
                onClick={() => onTaskbarWindowClick(item.kind)}
                title={item.label}
              >
                <span className={`taskbar-window-dot taskbar-window-dot--${item.kind}`} aria-hidden="true" />
                <span className="taskbar-window-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="taskbar-tray">
          <button className="tray-button" type="button">
            EN
          </button>
          <button className="tray-button tray-button-time" type="button">
            {new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date())}
          </button>
        </div>
      </footer>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
