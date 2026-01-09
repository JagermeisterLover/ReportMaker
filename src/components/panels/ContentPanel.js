// ContentPanel.js - Center panel with tabs and content

import { OpticalSystemTab } from '../tabs/OpticalSystemTab.js';
import { LDETab } from '../tabs/LDETab.js';
import { LensesTab } from '../tabs/LensesTab.js';
import { AutocollimationTab } from '../tabs/AutocollimationTab.js';

export const ContentPanel = ({
  selectedSystem,
  setSelectedSystem,
  activeTab,
  onTabChange,
  activeLensTab,
  onLensTabChange,
  saveCurrentSystem,
  colorScheme
}) => {
  const c = colorScheme;

  // Main tabs
  const mainTabs = ['Optical System', 'LDE', 'Lenses', 'Autocollimation Points'];

  // Generate lens tabs dynamically from lenses array
  const lensTabs = selectedSystem?.lenses?.map((lens, index) => `Lens ${index + 1}`) || [];

  // Render main tabs
  const renderMainTabs = () => {
    return React.createElement('div',
      {
        style: {
          display: 'flex',
          borderBottom: `1px solid ${c.border}`,
          backgroundColor: c.panel,
          gap: '2px',
          padding: '8px 8px 0 8px'
        }
      },
      mainTabs.map(tab =>
        React.createElement('div',
          {
            key: tab,
            onClick: () => onTabChange(tab),
            style: {
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: activeTab === tab ? c.bg : 'transparent',
              borderTopLeftRadius: '4px',
              borderTopRightRadius: '4px',
              borderBottom: activeTab === tab ? 'none' : `1px solid ${c.border}`,
              fontSize: '13px',
              fontWeight: activeTab === tab ? '600' : '400',
              color: activeTab === tab ? c.text : c.textDim,
              transition: 'all 0.2s'
            },
            onMouseEnter: (e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.backgroundColor = c.hover;
              }
            },
            onMouseLeave: (e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
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
    if (!selectedSystem) {
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
          'No optical system selected'
        ),
        React.createElement('div',
          { style: { fontSize: '14px' } },
          'Select or create a system from the left panel'
        )
      );
    }

    switch (activeTab) {
      case 'Optical System':
        return React.createElement(OpticalSystemTab, {
          selectedSystem,
          setSelectedSystem,
          saveCurrentSystem,
          colorScheme: c
        });
      case 'LDE':
        return React.createElement(LDETab, {
          selectedSystem,
          setSelectedSystem,
          saveCurrentSystem,
          colorScheme: c
        });
      case 'Lenses':
        return React.createElement(LensesTab, {
          selectedSystem,
          activeLensTab,
          colorScheme: c
        });
      case 'Autocollimation Points':
        return React.createElement(AutocollimationTab, {
          colorScheme: c
        });
      default:
        return null;
    }
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
