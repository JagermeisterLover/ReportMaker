// FilesPanel.js - Left sidebar for file/folder management

export const FilesPanel = ({
  items = [],
  selectedItem,
  onSelectItem,
  onRenameItem,
  onDeleteItem,
  onCreateItem,
  folders = [],
  expandedFolders = new Set(),
  onToggleFolder,
  onShowContextMenu,
  colorScheme
}) => {
  const c = colorScheme;

  // Render folder tree
  const renderFolderTree = (parentId = null, level = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId);
    const folderItems = items.filter(item => item.folderId === parentId);

    const elements = [];

    // Render folders
    childFolders.forEach(folder => {
      const isExpanded = expandedFolders.has(folder.id);
      const hasChildren = folders.some(f => f.parentId === folder.id) ||
                         items.some(item => item.folderId === folder.id);

      elements.push(
        React.createElement('div',
          { key: `folder-${folder.id}` },
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
              onClick: () => onToggleFolder(folder.id),
              onContextMenu: (e) => {
                e.preventDefault();
                e.stopPropagation();
                onShowContextMenu(e, 'folder', folder);
              }
            },
            hasChildren && React.createElement('span',
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
          isExpanded && hasChildren && renderFolderTree(folder.id, level + 1)
        )
      );
    });

    // Render items
    folderItems.forEach(item => {
      elements.push(
        React.createElement('div',
          {
            key: `item-${item.id}`,
            style: {
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px',
              paddingLeft: `${8 + level * 16 + (folders.some(f => f.parentId === parentId) ? 16 : 0)}px`,
              cursor: 'pointer',
              backgroundColor: selectedItem?.id === item.id ? c.hover : 'transparent',
              borderRadius: '4px',
              marginBottom: '2px',
              borderLeft: selectedItem?.id === item.id ? `2px solid ${c.accent}` : 'none'
            },
            onClick: () => onSelectItem(item),
            onContextMenu: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onShowContextMenu(e, 'item', item);
            }
          },
          React.createElement('span',
            { style: { marginRight: '6px', fontSize: '14px' } },
            '📄'
          ),
          React.createElement('span',
            { style: { color: c.text, fontSize: '13px' } },
            item.name
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
    // Header with "Add" button
    React.createElement('div',
      {
        style: {
          padding: '10px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          gap: '8px'
        }
      },
      React.createElement('button',
        {
          onClick: onCreateItem,
          style: {
            flex: 1,
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
        '+ New Item'
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
      items.length === 0
        ? React.createElement('div',
            {
              style: {
                padding: '20px',
                textAlign: 'center',
                color: c.textDim,
                fontSize: '13px'
              }
            },
            'No items yet',
            React.createElement('br'),
            React.createElement('br'),
            'Click "New Item" to get started'
          )
        : renderFolderTree()
    )
  );
};
