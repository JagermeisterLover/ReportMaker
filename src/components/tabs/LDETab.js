// LDETab.js - Lens Data Editor tab with Excel-like spreadsheet

import { calculateRefractiveIndexWithCatalog } from '../../utils/glassCalculator.js';

export const LDETab = ({ selectedSystem, setSelectedSystem, saveCurrentSystem, colorScheme }) => {
  const c = colorScheme;
  const ldeData = selectedSystem.ldeData || [];
  const [selectedCell, setSelectedCell] = React.useState(null);
  const [editingCell, setEditingCell] = React.useState(null);
  const [selectedRows, setSelectedRows] = React.useState(new Set());
  const [selectedCells, setSelectedCells] = React.useState(new Set());
  const [contextMenu, setContextMenu] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState(null);
  const [isRowDragging, setIsRowDragging] = React.useState(false);
  const [rowDragStart, setRowDragStart] = React.useState(null);
  const inputRefs = React.useRef({});

  const columns = ['stop', 'radius', 'thickness', 'material', 'catalog', 'n', 'semiDiameter', 'diameter'];

  const getCellKey = (row, col) => `${row}-${col}`;

  const handleCellChange = (rowIndex, field, value) => {
    const newLdeData = [...ldeData];
    newLdeData[rowIndex] = {
      ...newLdeData[rowIndex],
      [field]: field === 'radius' || field === 'thickness' || field === 'semiDiameter' || field === 'diameter'
        ? (value === '' || value === 'Infinity' ? Infinity : parseFloat(value) || 0)
        : value
    };

    // If material field is changed, automatically calculate refractive index
    if (field === 'material' && value) {
      const wavelength = selectedSystem.wavelength || 550; // Default to 550nm if not set
      const result = calculateRefractiveIndexWithCatalog(value, wavelength);
      if (result !== null) {
        newLdeData[rowIndex].n = result.n.toFixed(6);
        newLdeData[rowIndex].catalog = result.catalog;
        console.log(`Calculated n=${result.n.toFixed(6)} for ${value} at ${wavelength}nm from ${result.catalog} catalog`);
      } else {
        // Clear n and catalog if glass not found
        newLdeData[rowIndex].n = '';
        newLdeData[rowIndex].catalog = '';
        console.warn(`Glass "${value}" not found in catalogs`);
      }
    }

    setSelectedSystem({ ...selectedSystem, ldeData: newLdeData });
    saveCurrentSystem();
  };

  const handleStopChange = (rowIndex) => {
    const newLdeData = [...ldeData];
    // Uncheck all other stops
    newLdeData.forEach((row, i) => {
      row.isStop = i === rowIndex;
    });
    setSelectedSystem({ ...selectedSystem, ldeData: newLdeData });
    saveCurrentSystem();
  };

  const insertRow = (index, before = false) => {
    const newLdeData = [...ldeData];
    const insertIndex = before ? index : index + 1;
    newLdeData.splice(insertIndex, 0, {
      surface: insertIndex,
      radius: Infinity,
      thickness: 0,
      material: '',
      catalog: '',
      n: '',
      semiDiameter: 10,
      diameter: 20,
      isStop: false
    });
    newLdeData.forEach((row, i) => { row.surface = i; });
    setSelectedSystem({ ...selectedSystem, ldeData: newLdeData });
    saveCurrentSystem();
    setContextMenu(null);
  };

  const deleteRow = (index) => {
    if (ldeData.length <= 1) return;
    const newLdeData = ldeData.filter((_, i) => i !== index);
    newLdeData.forEach((row, i) => { row.surface = i; });
    setSelectedSystem({ ...selectedSystem, ldeData: newLdeData });
    saveCurrentSystem();
    setContextMenu(null);
    setSelectedRows(new Set());
  };

  const deleteSelectedRows = () => {
    if (selectedRows.size === 0 || ldeData.length <= selectedRows.size) return;
    const newLdeData = ldeData.filter((_, i) => !selectedRows.has(i));
    newLdeData.forEach((row, i) => { row.surface = i; });
    setSelectedSystem({ ...selectedSystem, ldeData: newLdeData });
    saveCurrentSystem();
    setSelectedRows(new Set());
  };

  const handleKeyDown = (e, rowIndex) => {
    if (e.key === 'Insert') {
      e.preventDefault();
      insertRow(rowIndex, false);
    } else if (e.key === 'Delete' && e.ctrlKey) {
      e.preventDefault();
      if (selectedRows.size > 0) {
        deleteSelectedRows();
      } else if (ldeData.length > 1) {
        deleteRow(rowIndex);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setEditingCell(null);
    }
  };

  const handleContextMenu = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowIndex
    });
  };

  const handleCopy = (e) => {
    if (e.ctrlKey && e.key === 'c') {
      if (selectedRows.size > 0) {
        const rows = Array.from(selectedRows).sort((a, b) => a - b);
        const text = rows.map(i => {
          const row = ldeData[i];
          return [row.radius, row.thickness, row.material, row.catalog, row.n, row.semiDiameter, row.diameter].join('\t');
        }).join('\n');
        navigator.clipboard.writeText(text);
      } else if (selectedCells.size > 0) {
        const cellsArray = Array.from(selectedCells).map(key => {
          const [row, col] = key.split('-');
          return { row: parseInt(row), col };
        });
        cellsArray.sort((a, b) => a.row - b.row);
        const text = cellsArray.map(cell => {
          const row = ldeData[cell.row];
          const value = row[cell.col];
          return value === Infinity ? 'Infinity' : (value ?? '');
        }).join('\n');
        navigator.clipboard.writeText(text);
      } else if (selectedCell) {
        const row = ldeData[selectedCell.row];
        const value = row[selectedCell.col];
        navigator.clipboard.writeText(String(value === Infinity ? 'Infinity' : (value ?? '')));
      }
    }
  };

  const handleRowClick = (e, rowIndex) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const newSelection = new Set(selectedRows);
      if (newSelection.has(rowIndex)) {
        newSelection.delete(rowIndex);
      } else {
        newSelection.add(rowIndex);
      }
      setSelectedRows(newSelection);
    } else if (e.shiftKey && selectedRows.size > 0) {
      const lastSelected = Math.max(...Array.from(selectedRows));
      const start = Math.min(lastSelected, rowIndex);
      const end = Math.max(lastSelected, rowIndex);
      const newSelection = new Set();
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
      setSelectedRows(newSelection);
    } else {
      setSelectedRows(new Set([rowIndex]));
    }
    setSelectedCell(null);
    setSelectedCells(new Set());
    setEditingCell(null);
  };

  const handleRowMouseDown = (e, rowIndex) => {
    if (e.ctrlKey || e.shiftKey) return;
    setIsRowDragging(true);
    setRowDragStart(rowIndex);
    handleRowClick(e, rowIndex);
  };

  const handleRowMouseEnter = (rowIndex) => {
    if (!isRowDragging || rowDragStart === null) return;

    const start = Math.min(rowDragStart, rowIndex);
    const end = Math.max(rowDragStart, rowIndex);
    const newSelection = new Set();
    for (let i = start; i <= end; i++) {
      newSelection.add(i);
    }
    setSelectedRows(newSelection);
    setSelectedCell(null);
    setSelectedCells(new Set());
  };

  const handleCellClick = (e, rowIndex, colName) => {
    if (colName === 'catalog' || colName === 'n' || colName === 'stop') return; // Read-only columns

    e.stopPropagation();
    const cellKey = getCellKey(rowIndex, colName);

    if (e.shiftKey && selectedCell) {
      // Range selection
      const startRow = selectedCell.row;
      const endRow = rowIndex;
      const startCol = columns.indexOf(selectedCell.col);
      const endCol = columns.indexOf(colName);

      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);

      const newSelection = new Set();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (columns[c] !== 'catalog' && columns[c] !== 'n' && columns[c] !== 'stop') {
            newSelection.add(getCellKey(r, columns[c]));
          }
        }
      }
      setSelectedCells(newSelection);
      setSelectedRows(new Set());
      setEditingCell(null);
    } else if (e.ctrlKey) {
      // Multi-select
      const newSelection = new Set(selectedCells);
      if (newSelection.has(cellKey)) {
        newSelection.delete(cellKey);
      } else {
        newSelection.add(cellKey);
      }
      setSelectedCells(newSelection);
      setSelectedCell({ row: rowIndex, col: colName });
      setSelectedRows(new Set());
      setEditingCell(null);
    } else {
      // Single select
      setSelectedCell({ row: rowIndex, col: colName });
      setSelectedCells(new Set([cellKey]));
      setSelectedRows(new Set());
      setEditingCell(null);
    }
  };

  const handleCellDoubleClick = (rowIndex, colName) => {
    if (colName === 'catalog' || colName === 'n' || colName === 'stop') return;
    setEditingCell({ row: rowIndex, col: colName });
    setTimeout(() => {
      const input = inputRefs.current[getCellKey(rowIndex, colName)];
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const handleCellMouseDown = (e, rowIndex, colName) => {
    if (colName === 'catalog' || colName === 'n' || colName === 'stop' || e.shiftKey || e.ctrlKey) return;
    setIsDragging(true);
    setDragStart({ row: rowIndex, col: colName });
    handleCellClick(e, rowIndex, colName);
  };

  const handleCellMouseEnter = (e, rowIndex, colName) => {
    if (!isDragging || !dragStart || colName === 'catalog' || colName === 'n' || colName === 'stop') return;

    const startRow = dragStart.row;
    const endRow = rowIndex;
    const startCol = columns.indexOf(dragStart.col);
    const endCol = columns.indexOf(colName);

    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    const newSelection = new Set();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (columns[c] !== 'catalog' && columns[c] !== 'n' && columns[c] !== 'stop') {
          newSelection.add(getCellKey(r, columns[c]));
        }
      }
    }
    setSelectedCells(newSelection);
    setSelectedCell({ row: rowIndex, col: colName });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setIsRowDragging(false);
    setRowDragStart(null);
  };

  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const isRowSelected = (rowIndex) => selectedRows.has(rowIndex);
  const isCellSelected = (rowIndex, colName) => selectedCells.has(getCellKey(rowIndex, colName));
  const isCellEditing = (rowIndex, colName) => editingCell?.row === rowIndex && editingCell?.col === colName;

  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (selectedRows.size > 0 || selectedCell || selectedCells.size > 0) {
        handleCopy(e);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedRows, selectedCell, selectedCells, ldeData]);

  const getCellValue = (row, field) => {
    const value = row[field];
    if (value === null || value === undefined) return '';
    if (value === Infinity) return 'Infinity';
    return value;
  };

  return React.createElement('div',
    {
      style: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' },
      onClick: () => setContextMenu(null)
    },
    React.createElement('div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
      React.createElement('h2',
        { style: { color: c.text, margin: 0 } },
        'Lens Data Editor (LDE)'
      ),
      React.createElement('div',
        { style: { display: 'flex', gap: '8px' } },
        selectedRows.size > 0 && React.createElement('button',
          {
            onClick: deleteSelectedRows,
            disabled: ldeData.length <= selectedRows.size,
            style: {
              padding: '8px 16px',
              backgroundColor: ldeData.length <= selectedRows.size ? c.border : '#e81123',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: ldeData.length <= selectedRows.size ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              opacity: ldeData.length <= selectedRows.size ? 0.5 : 1
            }
          },
          `Delete ${selectedRows.size} Row${selectedRows.size > 1 ? 's' : ''}`
        ),
        React.createElement('button',
          {
            onClick: () => insertRow(ldeData.length - 1, false),
            style: {
              padding: '8px 16px',
              backgroundColor: c.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }
          },
          '+ Add Surface'
        )
      )
    ),
    React.createElement('div',
      {
        style: {
          flex: 1,
          overflow: 'auto',
          backgroundColor: c.panel,
          borderRadius: '8px',
          padding: '10px'
        }
      },
      React.createElement('table',
        {
          style: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            border: `1px solid ${c.border}`,
            userSelect: 'none'
          }
        },
        React.createElement('thead', null,
          React.createElement('tr',
            { style: { backgroundColor: c.bg } },
            ['#', 'STOP', 'Radius', 'Thickness', 'Material', 'Catalog', 'n', 'Semi-Diameter', 'Diameter'].map(header =>
              React.createElement('th',
                {
                  key: header,
                  style: {
                    padding: '8px',
                    textAlign: header === 'STOP' ? 'center' : 'left',
                    color: c.textDim,
                    fontWeight: '600',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: c.bg,
                    border: `1px solid ${c.border}`,
                    borderTop: 'none',
                    userSelect: 'none',
                    width: header === 'STOP' ? '60px' : 'auto'
                  }
                },
                header
              )
            )
          )
        ),
        React.createElement('tbody', null,
          ldeData.map((row, index) =>
            React.createElement('tr',
              {
                key: index,
                onContextMenu: (e) => handleContextMenu(e, index),
                style: {
                  backgroundColor: isRowSelected(index)
                    ? c.accent + '30'
                    : 'transparent'
                }
              },
              React.createElement('td',
                {
                  onClick: (e) => handleRowClick(e, index),
                  onMouseDown: (e) => handleRowMouseDown(e, index),
                  onMouseEnter: () => handleRowMouseEnter(index),
                  style: {
                    padding: '8px',
                    color: c.textDim,
                    backgroundColor: isRowSelected(index) ? c.accent + '40' : c.bg,
                    textAlign: 'center',
                    border: `1px solid ${c.border}`,
                    cursor: 'pointer',
                    fontWeight: isRowSelected(index) ? '600' : '400',
                    userSelect: 'none'
                  }
                },
                row.surface
              ),
              columns.map((colName) => {
                if (colName === 'stop') {
                  return React.createElement('td',
                    {
                      key: colName,
                      style: {
                        padding: '8px',
                        border: `1px solid ${c.border}`,
                        backgroundColor: c.bg + '80',
                        textAlign: 'center',
                        userSelect: 'none'
                      }
                    },
                    React.createElement('input',
                      {
                        type: 'checkbox',
                        checked: row.isStop || false,
                        onChange: () => handleStopChange(index),
                        style: {
                          cursor: 'pointer',
                          width: '16px',
                          height: '16px'
                        }
                      }
                    )
                  );
                }
                if (colName === 'catalog' || colName === 'n') {
                  return React.createElement('td',
                    {
                      key: colName,
                      style: {
                        padding: '8px',
                        border: `1px solid ${c.border}`,
                        backgroundColor: c.bg + '80',
                        color: c.textDim,
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        userSelect: 'none'
                      }
                    },
                    getCellValue(row, colName)
                  );
                }

                const isEditing = isCellEditing(index, colName);
                const isSelected = isCellSelected(index, colName);

                return React.createElement('td',
                  {
                    key: colName,
                    onClick: (e) => handleCellClick(e, index, colName),
                    onDoubleClick: () => handleCellDoubleClick(index, colName),
                    onMouseDown: (e) => handleCellMouseDown(e, index, colName),
                    onMouseEnter: (e) => handleCellMouseEnter(e, index, colName),
                    style: {
                      padding: '0',
                      border: `1px solid ${c.border}`,
                      backgroundColor: isSelected ? c.accent + '20' : 'transparent',
                      outline: isSelected ? `2px solid ${c.accent}` : 'none',
                      cursor: isEditing ? 'text' : 'cell'
                    }
                  },
                  React.createElement('input',
                    {
                      ref: (el) => inputRefs.current[getCellKey(index, colName)] = el,
                      type: colName === 'semiDiameter' || colName === 'diameter' ? 'number' : 'text',
                      value: getCellValue(row, colName),
                      onChange: (e) => handleCellChange(index, colName, e.target.value),
                      onKeyDown: (e) => handleKeyDown(e, index),
                      onBlur: () => setEditingCell(null),
                      readOnly: !isEditing,
                      step: colName === 'semiDiameter' || colName === 'diameter' ? '0.1' : undefined,
                      style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        color: c.text,
                        border: 'none',
                        outline: 'none',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        cursor: isEditing ? 'text' : 'cell',
                        pointerEvents: isEditing ? 'auto' : 'none',
                        MozAppearance: 'textfield'
                      }
                    }
                  )
                );
              })
            )
          )
        )
      )
    ),
    contextMenu && React.createElement('div',
      {
        style: {
          position: 'fixed',
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`,
          backgroundColor: c.panel,
          border: `1px solid ${c.border}`,
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          minWidth: '180px',
          padding: '4px',
          zIndex: 10000
        },
        onClick: (e) => e.stopPropagation()
      },
      [
        { label: 'Insert Here', action: () => insertRow(contextMenu.rowIndex, true) },
        { label: 'Insert After', action: () => insertRow(contextMenu.rowIndex, false) },
        {
          label: selectedRows.size > 1 ? `Delete ${selectedRows.size} Rows` : 'Delete Row',
          action: () => selectedRows.size > 0 ? deleteSelectedRows() : deleteRow(contextMenu.rowIndex),
          disabled: selectedRows.size > 0 ? ldeData.length <= selectedRows.size : ldeData.length <= 1
        }
      ].map((item, idx) =>
        React.createElement('div',
          {
            key: idx,
            onClick: item.disabled ? null : item.action,
            style: {
              padding: '8px 12px',
              color: item.disabled ? c.textDim : c.text,
              fontSize: '13px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              opacity: item.disabled ? 0.5 : 1,
              transition: 'background-color 0.15s'
            },
            onMouseEnter: (e) => {
              if (!item.disabled) {
                e.target.style.backgroundColor = c.hover;
              }
            },
            onMouseLeave: (e) => {
              e.target.style.backgroundColor = 'transparent';
            }
          },
          item.label
        )
      )
    ),
    React.createElement('style', null, `
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    `)
  );
};
