// ContentPanel.js - Center panel with tabs and content

export const ContentPanel = ({
  selectedItem,
  activeTab,
  onTabChange,
  activeLensTab,
  onLensTabChange,
  colorScheme
}) => {
  const c = colorScheme;

  // Main tabs
  const mainTabs = ['Optical System', 'Summary', 'Lenses', 'Autocollimation Points'];

  // Generate lens tabs (placeholder - will be dynamic based on actual lenses)
  const lensTabs = selectedItem?.lenses || ['Lens 1', 'Lens 2', 'Lens 3'];

  // Render main tabs
  const renderMainTabs = () => {
    return React.createElement('div',
      {
        style: {
          display: 'flex',
          borderBottom: `1px solid ${c.border}`,
          backgroundColor: c.panel
        }
      },
      mainTabs.map(tab =>
        React.createElement('div',
          {
            key: tab,
            onClick: () => onTabChange(tab),
            style: {
              padding: '12px 20px',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? `2px solid ${c.accent}` : 'none',
              color: activeTab === tab ? c.text : c.textDim,
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              fontSize: '14px',
              transition: 'all 0.2s'
            },
            onMouseEnter: (e) => {
              if (activeTab !== tab) {
                e.target.style.backgroundColor = c.hover;
              }
            },
            onMouseLeave: (e) => {
              e.target.style.backgroundColor = 'transparent';
            }
          },
          tab
        )
      )
    );
  };

  // Render lens sub-tabs (only shown when Lenses tab is active)
  const renderLensTabs = () => {
    if (activeTab !== 'Lenses') return null;

    return React.createElement('div',
      {
        style: {
          display: 'flex',
          gap: '4px',
          padding: '8px',
          backgroundColor: c.bg,
          borderBottom: `1px solid ${c.border}`,
          overflowX: 'auto'
        }
      },
      lensTabs.map(lensTab =>
        React.createElement('div',
          {
            key: lensTab,
            onClick: () => onLensTabChange(lensTab),
            style: {
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: activeLensTab === lensTab ? c.accent : c.panel,
              color: activeLensTab === lensTab ? '#fff' : c.text,
              borderRadius: '4px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            },
            onMouseEnter: (e) => {
              if (activeLensTab !== lensTab) {
                e.target.style.backgroundColor = c.hover;
              }
            },
            onMouseLeave: (e) => {
              if (activeLensTab !== lensTab) {
                e.target.style.backgroundColor = c.panel;
              }
            }
          },
          lensTab
        )
      )
    );
  };

  // Render tab content
  const renderTabContent = () => {
    if (!selectedItem) {
      return React.createElement('div',
        {
          style: {
            padding: '40px',
            textAlign: 'center',
            color: c.textDim
          }
        },
        React.createElement('div',
          { style: { fontSize: '18px', marginBottom: '10px' } },
          'No item selected'
        ),
        React.createElement('div',
          { style: { fontSize: '14px' } },
          'Select or create an item from the left panel'
        )
      );
    }

    switch (activeTab) {
      case 'Optical System':
        return renderOpticalSystemTab();
      case 'Summary':
        return renderSummaryTab();
      case 'Lenses':
        return renderLensesTab();
      case 'Autocollimation Points':
        return renderAutocollimationTab();
      default:
        return null;
    }
  };

  // Optical System tab content (placeholder)
  const renderOpticalSystemTab = () => {
    return React.createElement('div',
      { style: { padding: '20px' } },
      React.createElement('h2',
        { style: { color: c.text, marginBottom: '20px' } },
        'Optical System'
      ),
      React.createElement('div',
        {
          style: {
            padding: '40px',
            backgroundColor: c.panel,
            borderRadius: '8px',
            textAlign: 'center',
            color: c.textDim
          }
        },
        'Optical system configuration will be displayed here'
      )
    );
  };

  // Summary tab content (placeholder)
  const renderSummaryTab = () => {
    return React.createElement('div',
      { style: { padding: '20px' } },
      React.createElement('h2',
        { style: { color: c.text, marginBottom: '20px' } },
        'Summary'
      ),
      React.createElement('div',
        {
          style: {
            padding: '40px',
            backgroundColor: c.panel,
            borderRadius: '8px',
            textAlign: 'center',
            color: c.textDim
          }
        },
        'Summary information will be displayed here'
      )
    );
  };

  // Lenses tab content (placeholder)
  const renderLensesTab = () => {
    return React.createElement('div',
      { style: { padding: '20px' } },
      React.createElement('h2',
        { style: { color: c.text, marginBottom: '20px' } },
        activeLensTab || 'Lens 1'
      ),
      React.createElement('div',
        {
          style: {
            padding: '40px',
            backgroundColor: c.panel,
            borderRadius: '8px',
            textAlign: 'center',
            color: c.textDim
          }
        },
        `Lens details for ${activeLensTab || 'Lens 1'} will be displayed here`
      )
    );
  };

  // Autocollimation Points tab content (placeholder)
  const renderAutocollimationTab = () => {
    return React.createElement('div',
      { style: { padding: '20px' } },
      React.createElement('h2',
        { style: { color: c.text, marginBottom: '20px' } },
        'Autocollimation Points'
      ),
      React.createElement('div',
        {
          style: {
            padding: '40px',
            backgroundColor: c.panel,
            borderRadius: '8px',
            textAlign: 'center',
            color: c.textDim
          }
        },
        'Autocollimation points data will be displayed here'
      )
    );
  };

  // Main render
  return React.createElement('div',
    {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    },
    renderMainTabs(),
    renderLensTabs(),
    React.createElement('div',
      {
        style: {
          flex: 1,
          overflow: 'auto',
          backgroundColor: c.bg
        }
      },
      renderTabContent()
    )
  );
};
