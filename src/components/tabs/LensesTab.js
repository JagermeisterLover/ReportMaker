// LensesTab.js - Lenses tab content with LDE table for individual lenses

export const LensesTab = ({ selectedSystem, activeLensTab, colorScheme }) => {
  const c = colorScheme;

  // Get the active lens index (e.g., "Lens 1" -> 0)
  const lensIndex = activeLensTab ? parseInt(activeLensTab.replace('Lens ', '')) - 1 : 0;
  const lensData = selectedSystem?.lenses?.[lensIndex];

  if (!lensData || !lensData.ldeData) {
    return React.createElement('div',
      { style: { padding: '20px' } },
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
        'No lens data available'
      )
    );
  }

  // Render LDE table header
  const renderTableHeader = () => {
    return React.createElement('thead', null,
      React.createElement('tr', null,
        ['Surface', 'Radius', 'Thickness', 'Material', 'Catalog', 'n', 'Semi-Diameter', 'Diameter'].map(header =>
          React.createElement('th',
            {
              key: header,
              style: {
                padding: '8px',
                backgroundColor: c.panel,
                color: c.text,
                borderBottom: `2px solid ${c.border}`,
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '600',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }
            },
            header
          )
        )
      )
    );
  };

  // Render LDE table rows
  const renderTableRows = () => {
    return React.createElement('tbody', null,
      lensData.ldeData.map((surface, index) =>
        React.createElement('tr',
          {
            key: index,
            style: {
              backgroundColor: index % 2 === 0 ? c.bg : c.panel
            }
          },
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.surface
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.radius === Infinity ? 'Infinity' : surface.radius
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.thickness === Infinity ? 'Infinity' : surface.thickness
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.material || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.catalog || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.n || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.semiDiameter || ''
          ),
          React.createElement('td',
            { style: { padding: '8px', color: c.text, fontSize: '13px' } },
            surface.diameter || ''
          )
        )
      )
    );
  };

  return React.createElement('div',
    { style: { padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' } },
    React.createElement('h2',
      { style: { color: c.text, marginBottom: '10px' } },
      activeLensTab || 'Lens 1'
    ),
    React.createElement('div',
      { style: { color: c.textDim, fontSize: '13px', marginBottom: '20px' } },
      `Lens Number: ${lensData.lensNumber}, Wavelength: ${lensData.wavelength}nm`
    ),
    React.createElement('div',
      {
        style: {
          flex: 1,
          overflow: 'auto',
          backgroundColor: c.panel,
          borderRadius: '8px',
          border: `1px solid ${c.border}`
        }
      },
      React.createElement('table',
        {
          style: {
            width: '100%',
            borderCollapse: 'collapse'
          }
        },
        renderTableHeader(),
        renderTableRows()
      )
    )
  );
};
