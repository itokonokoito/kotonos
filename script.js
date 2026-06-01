let answer = "アナグラム";
let blocks = [];
let selectedIndices = [];
let selectedIndex = null;
let hints = [];
let hintLevel = 0;
let isCompleted = false;
let moveCount = 0;

const tileSizeSlider = document.getElementById("tileSizeSlider");
const hint1Input = document.getElementById("hint1Input");
const hint2Input = document.getElementById("hint2Input");
const hint3Input = document.getElementById("hint3Input");
const hintButton = document.getElementById("hintButton");
const hintText = document.getElementById("hintText");
const letters = document.getElementById("letters");
const checkButton = document.getElementById("checkButton");
const homeButton = document.getElementById("homeButton");
const sortButton = document.getElementById("sortButton");
const result = document.getElementById("result");
const difficultySelect = document.getElementById("difficultySelect");
const puzzleInfo = document.getElementById("puzzleInfo");

const copyButton = document.getElementById("copyButton");
const answerInput = document.getElementById("answerInput");
const startButton = document.getElementById("startButton");
const splitButton = document.getElementById("splitButton");
const lockButton = document.getElementById("lockButton");
const manualMergeButton = document.getElementById("manualMergeButton");
const shareButton = document.getElementById("shareButton");
const shareUrl = document.getElementById("shareUrl");


function splitText(text) {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
        return [...new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(text)]
            .map((item) => item.segment);
    }

    return Array.from(text);
}

function encodeAnswer(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function decodeAnswer(encodedText) {
    return decodeURIComponent(escape(atob(encodedText)));
}

function createBlocksFromAnswer(text) {
    return splitText(text).map((char) => {
        return { text: char };
    });
}

function shuffleArray(array) {
    const original = array.map((block) => block.text).join("");
    const allSame = array.every((block) => block.text === array[0].text);

    if (allSame) {
        return array;
    }

    let shuffled = [];

    do {
        shuffled = array
            .map((value) => ({ value: value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map((item) => item.value);
    } while (
        shuffled.map((block) => block.text).join("") === original &&
        array.length > 1
    );

    return shuffled;
}

function renderBlocks() {
    letters.innerHTML = "";

    blocks.forEach((block, index) => {
        createDropZone(index);

        const tile = document.createElement("div");

        tile.className = "tile";
        tile.textContent = block.text;
        tile.draggable = true;

        if (splitText(block.text).length >= 2) {
            tile.classList.add("merged");
        }

        if (block.type === "manual") {
            tile.classList.add("manual");
        }

        if (block.type === "correct") {
            tile.classList.add("correct");
        }

        if (block.justCorrect) {
            tile.classList.add("just-correct");

            setTimeout(() => {
                block.justCorrect = false;
                renderBlocks();
            }, 800);
        }

        if (block.type === "complete") {
           tile.classList.add("complete");
        }

        if (selectedIndices.includes(index)) {
            tile.classList.add("selected");
        }
        if (block.locked) {
           tile.classList.add("locked");
        }

        tile.addEventListener("click", () => {
            handleTileClick(index);
        });

        tile.addEventListener("dragstart", () => {
            selectedIndex = index;
        });

        tile.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        tile.addEventListener("drop", (event) => {
            event.preventDefault();

            if (selectedIndex === null) {
                return;
            }

            const rect = tile.getBoundingClientRect();
            const dropX = event.clientX - rect.left;
            const isRightSide = dropX > rect.width / 2;

            let insertIndex = index;

            if (isRightSide) {
                insertIndex = index + 1;
            }

            const movingBlock = blocks.splice(selectedIndex, 1)[0];

            let targetIndex = insertIndex;

            if (selectedIndex < insertIndex) {
                targetIndex--;
            }

            blocks.splice(targetIndex, 0, movingBlock);
            moveCount++;

            selectedIndex = null;
            selectedIndices = [];

            renderBlocks();
            applyAutoMergeIfNeeded();
        });

        letters.appendChild(tile);
    });

    createDropZone(blocks.length);

    updatePuzzleInfo();
}


function createDropZone(insertIndex) {
    const zone = document.createElement("div");

    zone.className = "drop-zone";

    if (selectedIndices.length === 1) {
    zone.classList.add("movable");
    }

    zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        zone.classList.add("active");
    });

    zone.addEventListener("dragleave", () => {
        zone.classList.remove("active");
    });

    zone.addEventListener("drop", (event) => {
        event.preventDefault();

        if (selectedIndex === null) {
            return;
        }

        const movingBlock = blocks.splice(selectedIndex, 1)[0];

        let targetIndex = insertIndex;

        if (selectedIndex < insertIndex) {
            targetIndex--;
        }

        blocks.splice(targetIndex, 0, movingBlock);
        moveCount++;

        selectedIndex = null;
        renderBlocks();
    });
    zone.addEventListener("click", () => {

    if (selectedIndices.length !== 1) {
        return;
    }

    const movingIndex = selectedIndices[0];
    const movingBlock = blocks.splice(movingIndex, 1)[0];

    let targetIndex = insertIndex;

    if (movingIndex < insertIndex) {
        targetIndex--;
    }

        blocks.splice(targetIndex, 0, movingBlock);

        selectedIndices = [];
        selectedIndex = null;

        renderBlocks();
        applyAutoMergeIfNeeded();
    });

    letters.appendChild(zone);
}

function handleTileClick(index) {
    if (selectedIndices.includes(index)) {
        selectedIndices = selectedIndices.filter((i) => i !== index);
    } else {
        if (selectedIndices.length >= 2) {
            selectedIndices = [];
        }

        selectedIndices.push(index);
    }

    selectedIndex = selectedIndices[0] ?? null;

    renderBlocks();
}

function getCurrentText() {
    return blocks.map((block) => block.text).join("");
}

function getProgressPercent() {
    const totalCount = splitText(answer).length;

    if (totalCount === 0) {
        return 0;
    }

    let correctCount = 0;

    blocks.forEach((block) => {
        if (
            block.type === "correct" ||
            block.type === "complete"
        ) {
            correctCount += splitText(block.text).length;
        }
    });

    return Math.floor((correctCount / totalCount) * 100);
}

function updateTileSize() {
    const size = tileSizeSlider.value;

    document.documentElement.style.setProperty("--tile-size", `${size}px`);
    document.documentElement.style.setProperty("--tile-font-size", `${Math.floor(size * 0.45)}px`);
}

function getBlockType(block) {
    const text = block.text;

    if (/^\p{Script=Hiragana}+$/u.test(text)) {
        return "hiragana";
    }

    if (/^\p{Script=Katakana}+$/u.test(text)) {
        return "katakana";
    }

    if (/^\p{Script=Han}+$/u.test(text)) {
        return "kanji";
    }

    if (/^[a-zA-Z0-9]+$/.test(text)) {
        return "alnum";
    }

    if (/\p{Emoji}/u.test(text)) {
        return "emoji";
    }

    return "other";
}

function sortBlocksByType() {

    const typeOrder = {
        hiragana: 1,
        katakana: 2,
        kanji: 3,
        alnum: 4,
        emoji: 5,
        other: 6
    };

    blocks.sort((a, b) => {
        return (
            typeOrder[getBlockType(a)]
            -
            typeOrder[getBlockType(b)]
        );
    });

    selectedIndex = null;
    selectedIndices = [];

    moveCount++;

    renderBlocks();

    result.textContent =
        "種類ごとに整理したよ";
}

function updatePuzzleInfo() {
    const modeNames = {
        easy: "つむぎ：自動で結合",
        normal: "ふつう：判定で結合",
        hard: "つぐむ：結合なし"
    };

    const charCount = splitText(answer).length;
    const blockCount = blocks.length;
    const modeName = modeNames[difficultySelect.value];
    const progress = getProgressPercent();

    puzzleInfo.textContent =
    `難易度：${modeName} / 文字数：${charCount}文字 / ブロック数：${blockCount} / 完成率：${progress}% / 手数：${moveCount}`;
}


function applyAutoMergeIfNeeded() {
    if (difficultySelect.value === "easy") {
        blocks = mergeBlocksByText();
        renderBlocks();
    }
}

function canSolveWithBlocks(testBlocks, answerText) {
    const answerChars = splitText(answerText);
    const answerArrayText = answerChars.join("");

    const counts = new Map();

    testBlocks.forEach((block) => {
        counts.set(block.text, (counts.get(block.text) || 0) + 1);
    });

    function makeKey(position) {
        const rest = [...counts.entries()]
            .filter(([, count]) => count > 0)
            .sort()
            .map(([text, count]) => `${text}:${count}`)
            .join("|");

        return `${position}/${rest}`;
    }

    const failedMemo = new Set();

    function search(position) {
        if (position === answerArrayText.length) {
            return [...counts.values()].every((count) => count === 0);
        }

        const key = makeKey(position);

        if (failedMemo.has(key)) {
            return false;
        }

        for (const [text, count] of counts.entries()) {
            if (count <= 0) continue;

            if (answerArrayText.startsWith(text, position)) {
                counts.set(text, count - 1);

                if (search(position + text.length)) {
                    counts.set(text, count);
                    return true;
                }

                counts.set(text, count);
            }
        }

        failedMemo.add(key);
        return false;
    }

    return search(0);
}

function mergeBlocksByText() {
    const newBlocks = [];

    let i = 0;

    while (i < blocks.length) {
        let bestText = blocks[i].text;
        let bestEnd = i;

        let text = blocks[i].text;

        for (let j = i + 1; j < blocks.length; j++) {
            text += blocks[j].text;

            if (!answer.includes(text)) {
                break;
            }

            const candidateBlocks = [
                ...newBlocks,
                { text: text },
                ...blocks.slice(j + 1)
            ];

            if (canSolveWithBlocks(candidateBlocks, answer)) {
                bestText = text;
                bestEnd = j;
            }
        }

        const finalCandidateBlocks = [
            ...newBlocks,
            { text: bestText },
            ...blocks.slice(bestEnd + 1)
        ];

        const isCorrectChunk =
            splitText(bestText).length >= 2 &&
            answer.includes(bestText) &&
            canSolveWithBlocks(finalCandidateBlocks, answer);

        const wasMerged = bestEnd !== i;

        newBlocks.push({
            text: bestText,
            type: isCorrectChunk ? "correct" : blocks[i].type,
            locked: wasMerged ? false : blocks[i].locked,
            justCorrect: isCorrectChunk && wasMerged
        });

        i = bestEnd + 1;
    }

    return newBlocks;
}

startButton.addEventListener("click", () => {
    const inputText = answerInput.value
        .trim()
        .replace(/\s+/g, "");

    if (inputText === "") {
        result.textContent = "お題を入力してね";
        return;
    }

    const chars = splitText(inputText);

    if (chars.length < 2) {
        result.textContent = "2文字以上のお題を入力してね";
        return;
    }

    answer = inputText;
    blocks = shuffleArray(createBlocksFromAnswer(answer));

    isCompleted = false;
    moveCount = 0;
    selectedIndex = null;
    selectedIndices = [];
    result.textContent = "問題開始！";

    updatePuzzleInfo();
    renderBlocks();
});

checkButton.addEventListener("click", () => {

    if (isCompleted) {
    result.textContent = "完成済みだよ";
    return;
}

    const beforeText = getCurrentText();

    if (difficultySelect.value !== "hard") {
        blocks = mergeBlocksByText();
        renderBlocks();
    }

    const afterText = getCurrentText();

    if (afterText === answer) {
        
        isCompleted = true;

        blocks = [{
          text: answer,
          type: "complete"
        }];
        renderBlocks();
        result.textContent = `完成！ ${answer}`;
        return;
    }

    if (difficultySelect.value === "hard") {
        result.textContent = `まだ違う！ 今の並び：${beforeText}`;
    } else {
        result.textContent = `まだ違う！ 今の並び：${beforeText}`;
    }
});

manualMergeButton.addEventListener("click", () => {

    if (isCompleted) {
    result.textContent = "完成済みだよ";
    return;
    }

    if (selectedIndices.length !== 2) {
        result.textContent = "つむぐブロックを2つ選んでね";
        return;
    }

    const sorted = [...selectedIndices].sort((a, b) => a - b);
    const leftIndex = sorted[0];
    const rightIndex = sorted[1];

    if (rightIndex !== leftIndex + 1) {
        result.textContent = "隣り合ったブロックだけつむげるよ";
        return;
    }

    const leftBlock = blocks[leftIndex];
    const rightBlock = blocks[rightIndex];

    const mergedBlock = {
        text: leftBlock.text + rightBlock.text,
        type: "manual"
    };

    blocks.splice(leftIndex, 2, mergedBlock);

    selectedIndices = [];
    selectedIndex = null;

    result.textContent = "手動でつむいだよ";

    renderBlocks();
});

splitButton.addEventListener("click", () => {

    if (isCompleted) {
    result.textContent = "完成済みだよ";
    return;
}

    if (selectedIndex === null) {
        result.textContent = "ほどくブロックを選んでね";
        return;
    }

    const block = blocks[selectedIndex];
    const chars = splitText(block.text);

    if (block.locked) {
        result.textContent = "ロック中のブロックはほどけないよ";
        return;
    }

    if (chars.length <= 1) {
        result.textContent = "1文字はほどけないよ";
        return;
    }

    const newBlocks = chars.map((char) => {
        return {
            text: char
        };
    });

    blocks.splice(selectedIndex, 1, ...newBlocks);

    selectedIndex = null;

    result.textContent = "ほどいたよ";

    selectedIndices = [];
    selectedIndex = null;

    renderBlocks();
});
shareButton.addEventListener("click", () => {

    const inputText = answerInput.value
        .trim()
        .replace(/\s+/g, "");

    if (inputText === "") {
        result.textContent = "共有するお題を入力してね";
        return;
    }

    const encodedAnswer = encodeAnswer(inputText);
    const hintList = [
          hint1Input.value.trim(),
    hint2Input.value.trim(),
          hint3Input.value.trim()
];

const encodedHint = encodeAnswer(JSON.stringify(hintList));

    const difficulty = difficultySelect.value;

    const url =
        `${location.origin}${location.pathname}` +
        `?q=${encodeURIComponent(encodedAnswer)}` +
        `&mode=${difficulty}` +
        `&h=${encodeURIComponent(encodedHint)}`;

    shareUrl.value = url;

    result.textContent = "共有URLを作ったよ";
});

copyButton.addEventListener("click", async () => {
    if (shareUrl.value === "") {
        result.textContent = "先に共有URLを作ってね";
        return;
    }

    try {
        await navigator.clipboard.writeText(shareUrl.value);
        result.textContent = "共有URLをコピーしたよ";
    } catch (error) {
        result.textContent = "コピーに失敗したよ。手動でコピーしてね";
    }
});

lockButton.addEventListener("click", () => {

    if (isCompleted) {
    result.textContent = "完成済みだよ";
    return;
}

    if (selectedIndices.length !== 1) {
        result.textContent = "ロックするブロックを1つ選んでね";
        return;
    }

    const index = selectedIndices[0];
    const block = blocks[index];

    if (block.type !== "correct") {
        result.textContent = "ロックできるのは青い正解ブロックだけだよ";
        return;
    }

    block.locked = !block.locked;

    selectedIndices = [];
    selectedIndex = null;

    result.textContent = block.locked ? "ロックしたよ" : "ロックを解除したよ";

    renderBlocks();
});

tileSizeSlider.addEventListener("input", () => {
    updateTileSize();
});

hintButton.addEventListener("click", () => {
    const availableHints = hints.filter((hint) => hint !== "");

    if (availableHints.length === 0) {
        hintText.textContent = "ヒントは設定されてないよ";
        return;
    }

    if (hintLevel < availableHints.length) {
        hintLevel++;
    }


    hintText.innerHTML = availableHints
        .slice(0, hintLevel)
        .map((hint, index) => `ヒント${index + 1}：${hint}`)
        .join("<br>");
});

homeButton.addEventListener("click", () => {
    window.location.href = "./";
});

sortButton.addEventListener("click", () => {

    console.log("整理ボタン押された");
    console.log(blocks.map((block) => block.text));

    if (isCompleted) {
        result.textContent =
            "完成済みだよ";
        return;
    }

    sortBlocksByType();
});

const params = new URLSearchParams(location.search);
const q = params.get("q");

const h = params.get("h");
const mode = params.get("mode");

if (mode) {
    difficultySelect.value = mode;
}

if (q) {

    if (h) {
    try {
        hints = JSON.parse(decodeAnswer(h));
        hintLevel = 0;
    } catch (error) {
        hint = "";
    }
}

    try {
        answer = decodeAnswer(q);

        answerInput.value = "";
        answerInput.placeholder = "共有問題を読み込み済み";

        document.getElementById("setup").style.display = "none";
        hint1Input.style.display = "none";
        hint2Input.style.display = "none";
        hint3Input.style.display = "none";
        shareButton.style.display = "none";
        shareUrl.style.display = "none";
        copyButton.style.display = "none";

        result.textContent = "共有問題を読み込んだよ";
    } catch (error) {
        result.textContent = "URLの読み込みに失敗したよ";
    }
}


blocks = shuffleArray(createBlocksFromAnswer(answer));
updateTileSize();
renderBlocks();
