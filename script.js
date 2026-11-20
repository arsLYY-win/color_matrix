
// ========================================
// 1. 自定义设置
// ========================================

const ROW_COUNT = 31;
const COLUMN_COUNT = 15;

// 在这里填入你自己的横向 Label
// 保持15个元素即可

const COLUMN_LABELS = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15"
];

// 20种颜色
// name：颜色本身的名称
// hex：颜色的十六进制数值

const COLORS = [
    { name: "红色", hex: "#EF4444" },
    { name: "深红", hex: "#DC2626" },
    { name: "橙色", hex: "#F97316" },
    { name: "琥珀", hex: "#FBBF24" },
    { name: "黄色", hex: "#FDE047" },
    { name: "黄绿", hex: "#A3E635" },
    { name: "绿色", hex: "#22C55E" },
    { name: "深绿", hex: "#15803D" },
    { name: "青绿", hex: "#14B8A6" },
    { name: "青色", hex: "#22D3EE" },
    { name: "天蓝", hex: "#0EA5E9" },
    { name: "蓝色", hex: "#2563EB" },
    { name: "靛蓝", hex: "#3730A3" },
    { name: "紫色", hex: "#8B5CF6" },
    { name: "浅紫", hex: "#C084FC" },
    { name: "玫红", hex: "#EC4899" },
    { name: "粉色", hex: "#F9A8D4" },
    { name: "棕色", hex: "#92400E" },
    { name: "灰色", hex: "#9CA3AF" },
    { name: "黑色", hex: "#171717" }
];

// 颜色的初始标签
// 也可以在这里提前设置好

const DEFAULT_COLOR_LABELS = [
    "", // 红色
    "", // 深红
    "", // 橙色
    "", // 琥珀
    "", // 黄色
    "", // 黄绿
    "", // 绿色
    "", // 深绿
    "", // 青绿
    "", // 青色
    "", // 天蓝
    "", // 蓝色
    "", // 靛蓝
    "", // 紫色
    "", // 浅紫
    "", // 玫红
    "", // 粉色
    "", // 棕色
    "", // 灰色
    ""  // 黑色
];

// ========================================
// 2. 获取 DOM 元素
// ========================================

const matrix = document.getElementById("matrix");
const palette = document.getElementById("palette");

const colorLabelInput =
    document.getElementById("colorLabel");

const currentColor =
    document.getElementById("currentColor");

const currentColorName =
    document.getElementById("currentColorName");

const STORAGE_KEY = "color-label-matrix-v1";

// ========================================
// 3. 初始化数据
// ========================================

// -1 表示空白格子
// 0 - 19 表示对应的颜色编号

function createInitialData() {
    return {
        cells: Array.from(
            { length: ROW_COUNT },
            () => Array(COLUMN_COUNT).fill(-1)
        ),

        colorLabels: [...DEFAULT_COLOR_LABELS]
    };
}

let data = loadData();

let selectedColor = 0;

// paint：填色
// erase：擦除
// browse：浏览

let mode = "browse";

let isDrawing = false;
let activePointer = null;

let startCell = null;
let startPosition = null;
let lastPosition = null;
let hasMoved = false;
let lastTap = null;

// ========================================
// 4. 数据保存与读取
// ========================================

function validateData(value) {

    return value &&
        Array.isArray(value.cells) &&
        value.cells.length === ROW_COUNT &&

        value.cells.every(row =>
            Array.isArray(row) &&
            row.length === COLUMN_COUNT &&
            row.every(cell =>
                Number.isInteger(cell) &&
                cell >= -1 &&
                cell < COLORS.length
            )
        ) &&

        Array.isArray(value.colorLabels) &&
        value.colorLabels.length === COLORS.length &&
        value.colorLabels.every(
            label => typeof label === "string"
        );
}

function loadData() {

    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (validateData(parsed)) {
                return parsed;
            }
        }

    } catch (error) {
        console.error("读取数据失败", error);
    }

    return createInitialData();
}

function saveData(showAlert = false) {

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

        const time = new Date().toLocaleTimeString();

        document.getElementById("saveStatus")
            .textContent = "已保存 " + time;

        if (showAlert) {
            alert("保存成功");
        }

    } catch (error) {

        document.getElementById("saveStatus")
            .textContent = "保存失败，请导出备份";

        if (showAlert) {
            alert("保存失败");
        }
    }
}

// ========================================
// 5. 自动选择黑色或白色文字
// ========================================

function getTextColor(hex) {

    const channels = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ].map(value => {

        const v = value / 255;

        return v <= 0.04045
            ? v / 12.92
            : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    const luminance =
        0.2126 * channels[0] +
        0.7152 * channels[1] +
        0.0722 * channels[2];

    return luminance > 0.179
        ? "#111111"
        : "#FFFFFF";
}

// ========================================
// 6. 生成颜色选择面板
// ========================================

function renderPalette() {

    palette.innerHTML = "";

    COLORS.forEach((color, index) => {

        const button = document.createElement("button");

        button.className = "color-option";

        if (mode === "paint" && selectedColor === index) {
            button.classList.add("selected");
        }

        const preview = document.createElement("div");

        preview.className = "color-preview";
        preview.style.backgroundColor = color.hex;
        preview.style.color = getTextColor(color.hex);

        preview.textContent =
            data.colorLabels[index] ||
            String(index + 1).padStart(2, "0");

        const name = document.createElement("div");

        name.className = "color-name";
        name.textContent = color.name;

        button.appendChild(preview);
        button.appendChild(name);

        button.addEventListener("click", () => {
            selectColor(index);
        });

        palette.appendChild(button);
    });
}

// ========================================
// 7. 选择颜色与操作模式
// ========================================

function selectColor(index) {

    selectedColor = index;
    setMode("paint");

    updateColorEditor();
}

function setMode(newMode) {

    mode = newMode;
    lastTap = null;

    document.body.classList.toggle(
        "browse-mode",
        mode === "browse"
    );

    document.getElementById("eraserBtn")
        .classList.toggle("active", mode === "erase");

    document.getElementById("browseBtn")
        .classList.toggle("active", mode === "browse");

    renderPalette();
    updateColorEditor();
}

// ========================================
// 8. 设置颜色对应的 Label
// ========================================

function updateColorEditor() {

    if (mode !== "paint") {

        currentColor.style.backgroundColor = "white";

        currentColorName.textContent =
            mode === "erase" ? "橡皮擦" : "不填图";

        colorLabelInput.value = "";
        colorLabelInput.disabled = true;

        document.getElementById("saveLabelBtn")
            .disabled = true;

        return;
    }

    currentColor.style.backgroundColor =
        COLORS[selectedColor].hex;

    currentColorName.textContent =
        COLORS[selectedColor].name;

    colorLabelInput.disabled = false;

    document.getElementById("saveLabelBtn")
        .disabled = false;

    colorLabelInput.value =
        data.colorLabels[selectedColor];
}

function setColorLabel() {

    if (mode !== "paint") {
        return;
    }

    const label = colorLabelInput.value.trim();

    // 修改这一个颜色的全局标签
    data.colorLabels[selectedColor] = label;

    // 更新所有使用该颜色的格子
    matrix.querySelectorAll(".cell").forEach(cell => {

        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.column);

        if (data.cells[r][c] === selectedColor) {
            updateCellAppearance(cell);
        }
    });

    renderPalette();
    saveData();
}

// ========================================
// 9. 生成15*30矩阵
// ========================================


function renderMatrix() {

    matrix.innerHTML = "";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // 左上角
    const corner = document.createElement("th");
    corner.className = "corner";
    corner.textContent = "#";

    headerRow.appendChild(corner);

    // 横向：00 - 30
    for (let r = 0; r < ROW_COUNT; r++) {

        const th = document.createElement("th");

        th.className = "column-header";
        th.textContent = String(r).padStart(2, "0");

        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    matrix.appendChild(thead);

    const tbody = document.createElement("tbody");

    // 纵向：15个自定义名称
    for (let c = 0; c < COLUMN_COUNT; c++) {

        const tr = document.createElement("tr");

        const rowHeader = document.createElement("th");

        rowHeader.className = "row-header";
        rowHeader.textContent = COLUMN_LABELS[c];
        rowHeader.title = COLUMN_LABELS[c];

        tr.appendChild(rowHeader);

        // 横向31个格子
        for (let r = 0; r < ROW_COUNT; r++) {

            const td = document.createElement("td");

            td.className = "cell";

            td.dataset.row = r;
            td.dataset.column = c;

            updateCellAppearance(td);

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    matrix.appendChild(tbody);

    updateInfo();
}

// ========================================
// 10. 更新格子的外观
// ========================================

function updateCellAppearance(cell) {

    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.column);

    const colorIndex = data.cells[r][c];

    // 空白格子
    if (colorIndex === -1) {

        cell.style.backgroundColor = "#FFFFFF";
        cell.style.color = "#222222";
        cell.textContent = "";
        cell.title = "";

        return;
    }

    // 有颜色的格子
    const color = COLORS[colorIndex];

    const label = data.colorLabels[colorIndex];

    cell.style.backgroundColor = color.hex;
    cell.style.color = getTextColor(color.hex);

    cell.textContent = label;

    cell.title = label
        ? `${color.name}: ${label}`
        : color.name;
}

// ========================================
// 11. 填充或擦除单个格子
// ========================================

function paintCell(cell, forcedColor = null) {

    if (!cell || !cell.classList.contains("cell")) {
        return;
    }

    if (mode === "browse") {
        return;
    }

    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.column);

    let colorIndex;

    if (forcedColor !== null) {
        colorIndex = forcedColor;

    } else if (mode === "erase") {
        colorIndex = -1;

    } else {
        colorIndex = selectedColor;
    }

    // 原本就是该颜色，不重复更新
    if (data.cells[r][c] === colorIndex) {
        return;
    }

    data.cells[r][c] = colorIndex;

    updateCellAppearance(cell);
    updateInfo();
    saveData();
}

// ========================================
// 12. 获取指定屏幕坐标下的格子
// ========================================

function getCellAt(x, y) {

    const element = document.elementFromPoint(x, y);

    return element?.closest(".cell") || null;
}

// ========================================
// 13. 鼠标按下或手指触碰
// ========================================

matrix.addEventListener("pointerdown", event => {

    if (mode === "browse" || isDrawing) {
        return;
    }

    if (
        event.pointerType === "mouse" &&
        event.button !== 0
    ) {
        return;
    }

    const cell = event.target.closest(".cell");

    if (!cell) {
        return;
    }

    event.preventDefault();

    isDrawing = true;
    activePointer = event.pointerId;

    startCell = cell;
    hasMoved = false;

    startPosition = {
        x: event.clientX,
        y: event.clientY
    };

    lastPosition = { ...startPosition };

    matrix.setPointerCapture(event.pointerId);

    paintCell(cell);
});

// ========================================
// 14. 连续滑动填色
// ========================================

matrix.addEventListener("pointermove", event => {

    if (
        !isDrawing ||
        event.pointerId !== activePointer
    ) {
        return;
    }

    event.preventDefault();

    const x = event.clientX;
    const y = event.clientY;

    if (
        Math.hypot(
            x - startPosition.x,
            y - startPosition.y
        ) > 5
    ) {
        hasMoved = true;
    }

    // 在前后两个坐标之间插值
    // 防止滑动过快而漏掉格子

    const dx = x - lastPosition.x;
    const dy = y - lastPosition.y;

    const distance = Math.hypot(dx, dy);

    const steps = Math.max(
        1,
        Math.ceil(distance / 4)
    );

    for (let i = 1; i <= steps; i++) {

        const px =
            lastPosition.x + dx * i / steps;

        const py =
            lastPosition.y + dy * i / steps;

        paintCell(getCellAt(px, py));
    }

    lastPosition = { x, y };
});

// ========================================
// 15. 松开鼠标与双击擦除
// ========================================

function stopDrawing(event, cancelled = false) {

    if (event.pointerId !== activePointer) {
        return;
    }

    if (
        !cancelled &&
        !hasMoved &&
        startCell &&
        mode === "paint"
    ) {

        const now = Date.now();

        const key =
            startCell.dataset.row + ":" +
            startCell.dataset.column;

        if (
            lastTap &&
            lastTap.key === key &&
            now - lastTap.time < 350
        ) {

            // 双击同一个格子，将其清空
            paintCell(startCell, -1);

            lastTap = null;

        } else {

            lastTap = {
                key: key,
                time: now
            };
        }

    } else {
        lastTap = null;
    }

    isDrawing = false;
    activePointer = null;
    startCell = null;
    startPosition = null;
    lastPosition = null;

    if (matrix.hasPointerCapture(event.pointerId)) {
        matrix.releasePointerCapture(event.pointerId);
    }
}

matrix.addEventListener("pointerup", event => {
    stopDrawing(event);
});

matrix.addEventListener("pointercancel", event => {
    stopDrawing(event, true);
});

matrix.addEventListener("lostpointercapture", event => {
    stopDrawing(event, true);
});

// 防止长按弹出菜单
matrix.addEventListener("contextmenu", event => {

    if (event.target.closest(".cell")) {
        event.preventDefault();
    }
});

// ========================================
// 16. 统计填充数量
// ========================================

function updateInfo() {

    const filled = data.cells
        .flat()
        .filter(value => value !== -1)
        .length;

    document.getElementById("gridInfo")
        .textContent =
        `${COLUMN_COUNT} 行 × ${ROW_COUNT} 列` +
        ` | 已填充 ${filled} / ${ROW_COUNT * COLUMN_COUNT}`;
}

// ========================================
// 17. 导出 JSON 备份
// ========================================

function exportData() {

    const backup = {
        ...data,
        columnLabels: [...COLUMN_LABELS],
        exportedAt: new Date().toISOString()
    };

    const json = JSON.stringify(backup, null, 2);

    const blob = new Blob(
        [json],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
        "matrix-backup-" + Date.now() + ".json";

    document.body.appendChild(link);

    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ========================================
// 18. 导入 JSON 备份
// ========================================

document.getElementById("importFile")
    .addEventListener("change", async event => {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        try {

            const text = await file.text();
            const imported = JSON.parse(text);

            if (!validateData(imported)) {
                throw new Error("无效的备份文件");
            }

            if (
                Array.isArray(imported.columnLabels) &&
                JSON.stringify(imported.columnLabels) !==
                JSON.stringify(COLUMN_LABELS)
            ) {
                alert(
                    "备份的列名称与当前代码不一致，" +
                    "记录仍按原来的列位置导入。"
                );
            }

            if (!confirm("导入将覆盖当前记录，确定继续？")) {
                return;
            }

            data = {
                cells: imported.cells,
                colorLabels: imported.colorLabels
            };

            renderMatrix();
            renderPalette();
            updateColorEditor();

            saveData();

        } catch (error) {

            alert("导入失败：" + error.message);

        } finally {

            event.target.value = "";
        }
    });

// ========================================
// 19. 清空表格
// ========================================

function clearMatrix() {

    if (!confirm("确定清空所有格子？颜色标签将保留。")) {
        return;
    }

    data.cells = Array.from(
        { length: ROW_COUNT },
        () => Array(COLUMN_COUNT).fill(-1)
    );

    renderMatrix();
    saveData();
}

// ========================================
// 20. 绑定按钮事件
// ========================================

document.getElementById("saveLabelBtn")
    .addEventListener("click", setColorLabel);

colorLabelInput.addEventListener("keydown", event => {

    if (event.key === "Enter" && !event.isComposing) {
        setColorLabel();
    }
});

document.getElementById("eraserBtn")
    .addEventListener("click", () => {
        setMode("erase");
    });

document.getElementById("browseBtn")
    .addEventListener("click", () => {
        setMode("browse");
    });

document.getElementById("saveBtn")
    .addEventListener("click", () => {
        saveData(true);
    });

document.getElementById("exportBtn")
    .addEventListener("click", exportData);

document.getElementById("importBtn")
    .addEventListener("click", () => {
        document.getElementById("importFile").click();
    });

document.getElementById("clearBtn")
    .addEventListener("click", clearMatrix);

// ========================================
// 21. 键盘快捷键
// ========================================

document.addEventListener("keydown", event => {

    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable
    ) {
        return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    switch (event.key.toLowerCase()) {

        case "e":
            setMode("erase");
            break;

        case "v":
            setMode("browse");
            break;

        case "d":
            setMode("paint");
            break;
    }
});

// ========================================
// 22. 启动程序
// ========================================

renderMatrix();
setMode("browse");