// FilesPanel.js - Left sidebar for optical systems management

export const FilesPanel = ({
  systems = [],
  selectedSystem,
  onSelectSystem,
  onRenameSystem,
  onDeleteSystem,
  onCreateSystem,
  folders = [],
  expandedFolders = new Set(),
  onToggleFolder,
  onShowContextMenu,
  colorScheme,
  onImportZemax
}) => {
  const c = colorScheme;

  // Render folder tree
  const renderFolderTree = (parentPath = '', level = 0) => {
    // Get folders at this level
    const childFolders = folders.filter(f => f.parentPath === parentPath);
    // Get systems at this level
    const folderSystems = systems.filter(s => (s.folderPath || '') === parentPath);

    const elements = [];

    // Render folders
    childFolders.forEach(folder => {
      const isExpanded = expandedFolders.has(folder.path);
      const hasChildren = folders.some(f => f.parentPath === folder.path) ||
                         systems.some(s => s.folderPath === folder.path);

      elements.push(
        React.createElement('div',
          { key: `folder-${folder.path}` },
          React.createElement('div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                padding: '6px 8px',
                paddingLeft: `${8 + level * 16}px`,
                cursor: 'pointer',
                backgroundColor: c.panel,
                borderRadius: '4px',
                marginBottom: '2px'
              },
              onClick: () => onToggleFolder(folder.path),
              onContextMenu: (e) => {
                e.preventDefault();
                e.stopPropagation();
                onShowContextMenu(e, 'folder', folder);
              }
            },
            React.createElement('span',
              { style: { marginRight: '4px', color: c.textDim, fontSize: '10px' } },
              isExpanded ? '▼' : '▶'
            ),
            React.createElement('span',
              { style: { marginRight: '6px', fontSize: '14px' } },
              '📁'
            ),
            React.createElement('span',
              { style: { color: c.text, fontSize: '13px' } },
              folder.name
            )
          ),
          isExpanded && hasChildren && renderFolderTree(folder.path, level + 1)
        )
      );
    });

    // Render systems
    folderSystems.forEach(system => {
      elements.push(
        React.createElement('div',
          {
            key: `system-${system.name}-${system.folderPath || ''}`,
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              paddingLeft: `${8 + level * 16 + (childFolders.length > 0 ? 16 : 0)}px`,
              backgroundColor: selectedSystem?.name === system.name && selectedSystem?.folderPath === system.folderPath ? c.hover : 'transparent',
              borderRadius: '4px',
              marginBottom: '2px',
              borderLeft: selectedSystem?.name === system.name && selectedSystem?.folderPath === system.folderPath ? `2px solid ${c.accent}` : 'none'
            },
            onContextMenu: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onShowContextMenu(e, 'system', system);
            }
          },
          React.createElement('span',
            {
              style: {
                color: c.text,
                fontSize: '13px',
                flex: 1,
                cursor: 'pointer'
              },
              onClick: () => onSelectSystem(system)
            },
            system.name
          ),
          React.createElement('button',
            {
              onClick: (e) => {
                e.stopPropagation();
                onDeleteSystem(system);
              },
              style: {
                padding: '2px 6px',
                backgroundColor: 'transparent',
                color: c.textDim,
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '16px',
                opacity: 0.6,
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.target.style.opacity = '1';
                e.target.style.color = '#e81123';
              },
              onMouseLeave: (e) => {
                e.target.style.opacity = '0.6';
                e.target.style.color = c.textDim;
              }
            },
            '×'
          )
        )
      );
    });

    return elements.length > 0 ? elements : null;
  };

  return React.createElement('div',
    {
      style: {
        width: '250px',
        height: '100%',
        backgroundColor: c.panel,
        borderRight: `1px solid ${c.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    },
    // Header with buttons
    React.createElement('div',
      {
        style: {
          padding: '10px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }
      },
      React.createElement('button',
        {
          onClick: onCreateSystem,
          style: {
            width: '100%',
            padding: '8px',
            backgroundColor: c.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          },
          onMouseEnter: (e) => e.target.style.opacity = '0.9',
          onMouseLeave: (e) => e.target.style.opacity = '1'
        },
        '+ New System'
      ),
      React.createElement('button',
        {
          onClick: onImportZemax,
          style: {
            width: '100%',
            padding: '8px',
            backgroundColor: c.panel,
            color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          },
          onMouseEnter: (e) => e.target.style.backgroundColor = c.hover,
          onMouseLeave: (e) => e.target.style.backgroundColor = c.panel
        },
        'Import from Zemax'
      )
    ),
    // Scrollable folder tree
    React.createElement('div',
      {
        style: {
          flex: 1,
          overflow: 'auto',
          padding: '10px'
        }
      },
      systems.length === 0
        ? React.createElement('div',
            {
              style: {
                padding: '20px',
                textAlign: 'center',
                color: c.textDim,
                fontSize: '13px'
              }
            },
            'No optical systems yet',
            React.createElement('br'),
            React.createElement('br'),
            'Click "New System" to get started'
          )
        : renderFolderTree()
    )
  );
};
