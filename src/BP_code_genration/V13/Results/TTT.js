//Temp= 0

// 1. The game is played on a grid of 3x3 cells. Each cell has its coordinates and a value 

function cell(id, x, y, value) {
    return ctx.Entity(id, 'cell', {x: x, y: y, value: value});
}

ctx.populateContext([
    cell('cell1', 0, 0, ''),
    cell('cell2', 0, 1, ''),
    cell('cell3', 0, 2, ''),
    cell('cell4', 1, 0, ''),
    cell('cell5', 1, 1, ''),
    cell('cell6', 1, 2, ''),
    cell('cell7', 2, 0, ''),
    cell('cell8', 2, 1, ''),
    cell('cell9', 2, 2, '')
]);

// 2.1 The game is played by two players, X and O
function player(id, type) {
    return ctx.Entity(id, 'player', {type: type});
}

ctx.populateContext([
    player('player1', 'X'),
    player('player2', 'O')
]);

// The players play by marking the cells
// A starts and they play in turns
function markCellEvent(cellId, playerType) {
    return Event("markCell", {cellId: cellId, playerType: playerType});
}

ctx.registerEffect('markCell', function (data) {
    let cell = ctx.getEntityById(data.cellId);
    if (cell.value === '') {
        cell.value = data.playerType;
    }
});

ctx.bthread('Players play in turns starting with X', [], function () {
    while (true) {
        sync({waitFor: [markCellEvent(any, 'X')], block: [markCellEvent(any, 'O')]});
        sync({waitFor: [markCellEvent(any, 'O')], block: [markCellEvent(any, 'X')]});
    }
});

// 3. Each cell can be marked only once.
ctx.bthread('Each cell can be marked only once', 'Cell', function (cell) {
    while (true) {
        sync({waitFor: anyEventNameWithData("markCell", {cellId: cell.id})});
        sync({block: anyEventNameWithData("markCell", {cellId: cell.id})});
    }
});


// 4. The first player to mark 3 cells in a row wins.
function winEvent(playerType) {
    return Event("win", {playerType: playerType});
}

ctx.bthread('Check for a win condition', '3CellsInARow', function (threeCells) {
    while (true) {
        sync({waitFor: [
            anyEventNameWithData("markCell", {cellId: threeCells.cells[0]}),
            anyEventNameWithData("markCell", {cellId: threeCells.cells[1]}),
            anyEventNameWithData("markCell", {cellId: threeCells.cells[2]})
        ]});

        let cell1 = ctx.getEntityById(threeCells.cells[0]);
        let cell2 = ctx.getEntityById(threeCells.cells[1]);
        let cell3 = ctx.getEntityById(threeCells.cells[2]);

        if (cell1.value === cell2.value && cell2.value === cell3.value && cell1.value !== '') {
            sync({request: [winEvent(cell1.value)]});
        }
    }
});


//! With Considering tie

// 4. The first player to mark 3 cells in a row wins. If all cell were marked, and no playerr won, its a tie 
function winEvent(playerType) {
    return Event("win", {playerType: playerType});
}

function tieEvent() {
    return Event("tie");
}

ctx.bthread('Check for a win or tie', '3CellsInARow', function (row) {
    while (true) {
        sync({waitFor: anyEventNameWithData("markCell", {})});
        let cells = row.cells.map(cellId => ctx.getEntityById(cellId));
        if (cells.every(cell => cell.value === 'X')) {
            sync({request: [winEvent('X')]});
        } else if (cells.every(cell => cell.value === 'O')) {
            sync({request: [winEvent('O')]});
        } else if (ctx.query('Cell').every(cell => cell.value !== '')) {
            sync({request: [tieEvent()]});
        }
    }
});


//! Thats a pretty good implematation as it is not aware of priority. it has some flows as it waits for marks in any cell and not only it row but it does work(except many will request the event of tie(all bthreads))