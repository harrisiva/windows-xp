import { useEffect, useRef, useState } from "react";

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

export { PinballGame, TetrisGame };
