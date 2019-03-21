var data = [
    [-1, 2, 55, 41, 32, 41],
    [39, 4, 7, 14, 15, 17],
    [30, 7, 19, 6, 18, 11],
    [59, 12, 17, 18, 12, 12],
    [27, 2, 12, 13, 18, 2],
    [16, 16, 1, 10, 5, 1]
];

Object.prototype.isEmpty = function () {
    for (var key in this) {
        if (this.hasOwnProperty(key))
            return false;
    }
    return true;
}

var container = document.getElementById('example');
var hot = structToHtmlTable(data);
container.innerHTML = hot;

function getData(row, column) {
    var v = document.getElementById("_" + row + "_" + column).value;
    return parseInt(v);
}

function solve() {
    var colSums = [];
    var rowSums = [];
    var colCount = 5;
    var rowCount = 5;
    var numbers = [];
    for (var i = 0; i < colCount; i++) {
        colSums.push(getData(0, i + 1));
    }
    for (var i = 0; i < rowCount; i++) {
        rowSums.push(getData(i + 1, 0));
    }
    for (var i = 1; i <= colCount; i++) {
        var n = [];
        for (var j = 1; j <= rowCount; j++) {
            n.push(new puzzleNumber(getData(i, j), numberStatus.Unknown));
        }
        numbers.push(n);
    }
    var result = document.getElementById("result");
    var p = new puzzle(rowSums, colSums, numbers);
    var process = solvePuzzle(p);
    var isSolved = isPuzzleSolved(p);
    result.innerHTML = process + "<br> is puzzle solved: " + isSolved;
}

function solvePuzzle(p) {
    var process = [toHtmlTable(p)];
    var pCopy = deepCopy(p);
    var isSolved = isPuzzleSolved(pCopy);
    if (isSolved) {
        return;
    }
    var step = 0;

    // var colCombs = [];
    // var rowCombs = [];
    // var colCombSums = [];
    // var rowCombSums = [];
    // for (var i = 0; i < p.colSums.length; i++) {
    //     colCombs.push(getCombinations(p.col(i, true), 1));
    // }
    // for (var i = 0; i < p.rowSums.length; i++) {
    //     rowCombs.push(getCombinations(p.row(i, true), 1));
    // }
    // for (var i = 0; i < rowCombs.length; i++) {
    //     var rs = [];
    //     for (var j = 0; j < rowCombs[i].length; j++) {
    //         rs.push(sum(rowCombs[i][j]));
    //     }
    //     rowCombSums.push(rs);
    // }
    // for (var i = 0; i < colCombs.length; i++) {
    //     var cs = [];
    //     for (var j = 0; j < colCombs[i].length; j++) {
    //         cs.push(sum(colCombs[i][j]));
    //     }
    //     colCombSums.push(cs);
    // }
    //console.log(rowCombs, colCombs);
    //console.log(rowCombSums, colCombSums);

    while (!isSolved && step < 15) {
        step++;
        var changedCells = selectOnlyNumberEqualSum(p, pCopy);
        if (!changedCells.isEmpty()) {
            process.push(writeNote("select number which is equal to sum."));
            validate(p);
            process.push(toInProgressHtmlTable(p, pCopy, changedCells));
            continue;
        }

        changedCells = unselectNumberGreaterThanSum(p, pCopy)
        if (!changedCells.isEmpty()) {
            process.push(writeNote("unselect numbers which are greater than sum."));
            validate(p);
            process.push(toInProgressHtmlTable(p, pCopy, changedCells));
        }

        changedCells = selectOnlyOddIfSumIsOdd(p, pCopy);
        if (!changedCells.isEmpty()) {
            process.push(writeNote("odd + even = odd."));
            validate(p);
            process.push(toInProgressHtmlTable(p, pCopy, changedCells));
            continue;
        }

        changedCells = selectNumbersEqualSum(p, pCopy);
        if (!changedCells.isEmpty()) {
            process.push(writeNote("select rows which is solved."));
            validate(p);
            process.push(toInProgressHtmlTable(p, pCopy, changedCells));
            continue;
        }
        isSolved = true;
    }
    return process.join("<br>");
}

function writeNote(message) {
    return "<div class='note'>" + message + "</div>";
}

function validate(p) {
    var rowSums = p.rowSums;
    var colSums = p.colSums;
    var numbers = p.numbers;
    var cs = [];
    for (var r = 0; r < numbers.length; r++) {
        cs.push(0);
    }
    for (var r = 0; r < numbers.length; r++) {
        var row = numbers[r];
        var rowSum = 0;
        for (var c = 0; c < row.length; c++) {
            rowSum += getSelectedNumber(row[c]);
            cs[c] += getSelectedNumber(row[c]);
        }
        if (rowSums[r] == rowSum) {
            p.rowSolved(r);
        }
    }
    for (var c = 0; c < colSums.length; c++) {
        if (cs[c] == colSums[c]) {
            p.colSolved(c);
        }
    }
}

function selectOnlyOddIfSumIsOdd(p, pCopy) {
    var rowSums = pCopy.rowSums;
    var colSums = pCopy.colSums;
    var numbers = p.numbers;
    var changedCells = {};
    for (var r = 0; r < rowSums.length; r++) {
        if (isOdd(rowSums[r])) {
            var oddCount = 0;
            var index = -1;
            for (var c = 0; c < colSums.length; c++) {
                var num = numbers[r][c];
                if (num.status == numberStatus.Unknown &&
                    isOdd(num.number)) {
                    oddCount++;
                    index = c;
                }
            }
            if (oddCount == 1) {
                numbers[r][index].select();
                pCopy.select(r, index);
                addChangedCells(changedCells, r, index);
            }
        }
    }
    return changedCells;
}

function isOdd(n) {
    return n & 1;
}

function isEven(n) {
    return !isOdd(n);
}

function selectOnlyNumberEqualSum(p, pCopy) {
    var rowSums = pCopy.rowSums;
    var colSums = pCopy.colSums;
    var numbers = p.numbers;
    var cs = [];
    var changedCells = {};
    for (var r = 0; r < rowSums.length; r++) {
        cs.push(0);
    }
    for (var r = 0; r < rowSums.length; r++) {
        var row = numbers[r];
        for (var c = 0; c < row.length; c++) {
            var num = row[c];
            if (num.status == numberStatus.Unknown) {
                if (rowSums[r] == num.number) {
                    num.select();
                    pCopy.select(r, c);
                    addChangedCells(changedCells, r, c);
                    for (var d = 0; d < row.length; d++) {
                        if (row[d].status == numberStatus.Unknown) {
                            row[d].unselect();
                            pCopy.unselect(d, c);
                            addChangedCells(changedCells, d, c);
                        }
                    }
                }
                if (colSums[c] == num.number) {
                    num.select();
                    pCopy.select(r, c);
                    addChangedCells(changedCells, r, c);
                    for (var d = 0; d < rowSums.length; d++) {
                        if (numbers[d][c].status == numberStatus.Unknown) {
                            numbers[d][c].unselect();
                            pCopy.unselect(d, c);
                            addChangedCells(changedCells, d, c);
                        }
                    }
                }
            }
        }
    }
    return changedCells;
}

function selectNumbersEqualSum(p, pCopy) {
    var rowSums = pCopy.rowSums;
    var colSums = pCopy.colSums;
    var numbers = p.numbers;
    var cs = [];
    var changedCells = {};
    for (var r = 0; r < numbers.length; r++) {
        cs.push(0);
    }
    for (var r = 0; r < numbers.length; r++) {
        var row = numbers[r];
        var rowSum = 0;
        for (var c = 0; c < row.length; c++) {
            rowSum += getNumber(row[c]);
            cs[c] += getNumber(row[c]);
        }
        if (rowSums[r] == rowSum) {
            for (var c = 0; c < row.length; c++) {
                if (row[c].status == numberStatus.Unknown) {
                    row[c].select();
                    pCopy.select(r, c);
                    addChangedCells(changedCells, r, c);
                }
            }
        }
    }
    for (var c = 0; c < numbers[0].length; c++) {
        if (cs[c] == colSums[c]) {
            for (var r = 0; r < numbers.length; r++) {
                if (numbers[r][c].status == numberStatus.Unknown) {
                    numbers[r][c].select();
                    pCopy.select(r, c);
                    addChangedCells(changedCells, r, c);
                }
            }
        }
    }
    return changedCells;
}

function deepCopyArray(a) {
    var newArray = [];
    for (var i = 0; i < a.length; i++) {
        newArray.push(a[i]);
    }
    return newArray;
}

function deepCopy(p) {
    var newRowSums = deepCopyArray(p.rowSums);
    var newColSums = deepCopyArray(p.colSums);
    var numbers = p.numbers;
    var newNumbers = [];
    for (var r = 0; r < numbers.length; r++) {
        var row = numbers[r];
        var newRow = [];
        for (var c = 0; c < row.length; c++) {
            var num = row[c];
            newRow.push(new puzzleNumber(num.number, num.status));
        }
        newNumbers.push(newRow);
    }
    return new puzzle(newRowSums, newColSums, newNumbers)
}

function unselectNumberGreaterThanSum(p, pCopy) {
    var rowSums = pCopy.rowSums;
    var colSums = pCopy.colSums;
    var numbers = p.numbers;
    var changedCells = {};
    for (var r = 0; r < numbers.length; r++) {
        var row = numbers[r];
        for (var c = 0; c < row.length; c++) {
            var num = row[c].number;
            if (row[c].status == numberStatus.Unknown) {
                if (rowSums[r] < num ||
                    colSums[c] < num) {
                    row[c].unselect();
                    pCopy.unselect(r, c);
                    addChangedCells(changedCells, r, c);
                }
            }
        }
    }
    return changedCells;
}

function addChangedCells(c, row, column) {
    if (!c.hasOwnProperty(row)) {
        c[row] = {};
    }
    c[row][column] = true;
}

function isPuzzleSolved(p) {
    var rowSums = p.rowSums;
    var colSums = p.colSums;
    var numbers = p.numbers;
    var cs = [];
    for (var r = 0; r < rowSums.length; r++) {
        cs.push(0);
    }
    for (var r = 0; r < rowSums.length; r++) {
        var row = numbers[r];
        var rowSum = 0;
        for (var c = 0; c < colSums.length; c++) {
            rowSum += getNumber(row[c]);
            cs[c] += getNumber(row[c]);
        }
        if (rowSums[r] != rowSum) {
            return false;
        }
    }
    for (var c = 0; c < colSums.length; c++) {
        if (cs[c] != colSums[c]) {
            return false;
        }
    }
    return true;
}

function getSelectedNumber(n) {
    if (n.status == numberStatus.Selected) {
        return n.number;
    }
    return 0;
}

function getNumber(n) {
    if (n.status != numberStatus.Unselected) {
        return n.number;
    }
    return 0;
}

function print(p) {
    var colSums = p.colSums;
    var firstRow = "   " + toAlignedNumbers(colSums).join(" ");
    var rows = [];
    var rowSums = p.rowSums;
    var numbers = p.numbers;
    for (var r = 0; r < numbers.length; r++) {
        var row = toAlignedNumber(rowSums[r]) + " ";
        row += toAlignedNumbers(numbers[r]).join(" ");
        rows.push(row);
    }
    return firstRow + "<br>" + rows.join("<br>");
}

function structToHtmlTable(d) {
    var rows = [];
    for (var r = 0; r < d.length; r++) {
        var row = d[r];
        var tr = "<tr>";
        for (var c = 0; c < row.length; c++) {
            var value = row[c];
            if (value < 0) {
                tr += "<td></td>"
            } else {
                tr += "<td><input class='table-number' id='_" + r + "_" + c + "' maxlength='2' value='" + value + "'></td>";
            }
        }
        tr += "</tr>";

        rows.push(tr);
    }
    return "<table class='input-table'>" + rows.join("") + "</table>";
}

function toHtmlTable(p) {
    var colSums = p.colSums;
    var firstRow = "<tr><td></td><td class='sum'>" + colSums.join("</td><td class='sum'>") + "</td><tr>";
    var rows = [];
    var rowSums = p.rowSums;
    var numbers = p.numbers;
    for (var r = 0; r < numbers.length; r++) {
        var row = "<tr><td class='sum'>" + rowSums[r] + "</td>";
        row += toHtmlNumbers(numbers[r], p.colStatus, p.rowStatus[r], null).join("") + "</tr>";
        rows.push(row);
    }
    return "<table class='puzzle-table'>" + firstRow + rows.join("") + "</table>";
}

function toInProgressHtmlTable(p, pCopy, changedCells) {
    var colSums = p.colSums;
    var firstRow = "<tr><td></td>";
    var colStatus = p.colStatus;
    for (var c = 0; c < colSums.length; c++) {
        firstRow += "<td class='sum'>" + colSums[c] + "(" + pCopy.colSums[c] + ")</td>";
    }
    firstRow += "<tr>";
    var rows = [];
    var rowSums = p.rowSums;
    var numbers = p.numbers;
    for (var r = 0; r < numbers.length; r++) {
        var row = "<tr><td class='sum'>" + rowSums[r] + "(" + pCopy.rowSums[r] + ")</td>";
        row += toHtmlNumbers(numbers[r], colStatus, p.rowStatus[r], changedCells.hasOwnProperty(r) ? changedCells[r] : {}).join("") + "</tr>";
        rows.push(row);
    }
    return "<table class='puzzle-table'>" + firstRow + rows.join("") + "</table>";
}

function toHtmlNumbers(n, colStatus, rowIsSolved, changedCells) {
    var str = [];
    for (var i = 0; i < n.length; i++) {
        var num = n[i];
        var isChanged = changedCells != null ? changedCells.hasOwnProperty(i) : false;
        str.push(toHtmlNumber(num, colStatus[i], rowIsSolved, isChanged));
    }
    return str;
}

function toHtmlNumber(n, isSolved, rowIsSolved, isChanged) {
    var solved = isSolved || rowIsSolved ? "solved" : "";
    var changed = isChanged ? " changed" : "";
    return "<td class='" + solved + "'><div class='" + n.status + changed + "'>" + n.number.toString() + "</div></td>";
}

function toAlignedNumbers(n) {
    var str = [];
    for (var i = 0; i < n.length; i++) {
        str.push(toAlignedNumber(n[i]));
    }
    return str;
}

function toAlignedNumber(n) {
    if (n < 10) {
        return " " + n.toString();
    }
    return n.toString();
}

function getCombinations(input, min) {
    var results = [],
        result, mask, i, total = Math.pow(2, input.length);
    for (mask = min; mask < total; mask++) {
        result = [];
        i = input.length - 1;
        do {
            if ((mask & (1 << i)) !== 0) {
                result.push(input[i]);
            }
        } while (i--);

        if (result.length >= min) {
            results.push(result);
        }
    }
    return results;
}

function sum(arr) {
    if (!Array.isArray(arr)) return;
    let t = 0;
    for (let i = 0, l = arr.length; i < l; i++) {
        t += arr[i].number;
    }
    return t;
}

class puzzleNumber {
    constructor(number, status) {
        this.number = number;
        this.status = status;
    }
    select() {
        this.status = numberStatus.Selected;
    }
    unselect() {
        this.status = numberStatus.Unselected;
    }
}

class puzzle {
    constructor(rowSums, colSums, numbers) {
        this.rowSums = rowSums;
        this.colSums = colSums;
        this.numbers = numbers;
        this.rowStatus = [];
        this.colStatus = [];
        for (var i = 0; i < rowSums.length; i++) {
            this.rowStatus.push(false);
        }
        for (var i = 0; i < colSums.length; i++) {
            this.colStatus.push(false);
        }
    }
    select(row, col) {
        var n = this.numbers[row][col];
        n.select();
        var num = n.number;
        this.rowSums[row] -= num;
        this.colSums[col] -= num;
    }
    unselect(row, col) {
        this.numbers[row][col].unselect();
    }
    row(r, excludeUnselected = false) {
        var result = [];
        for (var i = 0; i < this.colSums.length; i++) {
            if (excludeUnselected &&
                this.numbers[r][i].status != numberStatus.Unselected) {
                result.push(this.numbers[r][i]);
            }
        }
        return result;
    }
    col(c, excludeUnselected = false) {
        var result = [];
        for (var i = 0; i < this.rowSums.length; i++) {
            if (excludeUnselected &&
                this.numbers[i][c].status != numberStatus.Unselected) {
                result.push(this.numbers[i][c]);
            }
        }
        return result;
    }
    rowSolved(r) {
        this.rowStatus[r] = true;
    }
    colSolved(c) {
        this.colStatus[c] = true;
    }
    isRowSolved(r) {
        return this.rowStatus[r];
    }
    isColSolved(c) {
        return this.colStatus[c];
    }
}

const numberStatus = {
    Unknown: 'unknown',
    Selected: 'selected',
    Unselected: 'unselected'
}